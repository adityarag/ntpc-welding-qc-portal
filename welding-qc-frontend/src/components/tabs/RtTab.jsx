import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ConfirmationModal from '../common/ConfirmationModel';
import api from '../../api/axiosConfig';
import DateFilter from '../common/DateFilter';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function RtTab() {
  const { user, showToast, refreshTrigger } = useApp();
  
  // Role Access Rules
  const isSupervisor = user?.role === 1;
  const isVerifierOrAdmin = user?.role === 2 || user?.role === 3;
  const canEditFields = isSupervisor;

  const [rtRecords, setRtRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttempts, setSelectedAttempts] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [incrementModal, setIncrementModal] = useState({ isOpen: false, targetIndex: null });

  const fetchRtRecords = async (from = fromDate, to = toDate) => {
    setIsLoading(true);
    try {
      const response = await api.get('/rt', {
        params: { from, to }
      });
      setRtRecords(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (from, to) => {
    fetchRtRecords(from, to);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    fetchRtRecords('', '');
  };

  useEffect(() => {
    fetchRtRecords();
  }, [refreshTrigger]);

  const handleTextChange = (index, field, value) => {
    const updated = [...rtRecords];
    updated[index][field] = value;
    setRtRecords(updated);
  };

  const saveFieldChange = async (attempt_id, field, value) => {
    try {
      await api.put(`/rt/${attempt_id}`, { [field]: value });
    } catch (err) {
      showToast(err.message, 'error');
      fetchRtRecords();
    }
  };

  const handleDateAssignment = (index, newDate) => {
    const updated = [...rtRecords];
    updated[index].report_date = newDate;
    setRtRecords(updated);
    
    api.put(`/rt/${rtRecords[index].attempt_id}`, { report_date: newDate })
      .catch(err => {
        showToast(err.message, 'error');
        fetchRtRecords();
      });
  };

  const handleFileUpload = async (index, e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are allowed.', 'error');
      e.target.value = '';
      return;
    }

    const updatedRecords = [...rtRecords];
    updatedRecords[index].isUploading = true;
    setRtRecords(updatedRecords);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post(`/upload?module=rt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data.filePath;
      
      await api.put(`/rt/${rtRecords[index].attempt_id}`, { report_file: filePath });

      const completedRecords = [...rtRecords];
      completedRecords[index].report_file = filePath;
      completedRecords[index].isUploading = false;
      setRtRecords(completedRecords);
      showToast('File uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
      fetchRtRecords();
    }
  };

  const confirmNewAttemptIncrement = async () => {
    if (incrementModal.targetIndex !== null) {
      try {
        const uniqueCode = rtRecords[incrementModal.targetIndex].unique_code;
        await api.post(`/rt/${uniqueCode}/increment`);
        showToast('Attempt incremented successfully', 'success');
        fetchRtRecords();
      } catch (err) {
        showToast(err.response?.data?.message || err.message, 'error');
      }
    }
    setIncrementModal({ isOpen: false, targetIndex: null });
  };

  const handleVerify = async (attempt_id, status) => {
    try {
      await api.put(`/rt/${attempt_id}/verify`, { status, remarks: '' });
      showToast(`RT Attempt ${status}!`, 'success');
      fetchRtRecords();
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  const handleSubmitBatch = async () => {
    if (selectedAttempts.length === 0) return;
    
    const selectedRecords = displayRecords.filter(r => selectedAttempts.includes(r.attempt_id));
    
    // Check if all selected items have a report_date and report_file before submitting
    const unready = selectedRecords.filter(r => !r.report_date || !r.report_file);
    if (unready.length > 0) {
      showToast('Please make sure all selected welds have an Offer Date and QA Artifact PDF uploaded before submitting.', 'error');
      return;
    }

    const offerSheetIds = [...new Set(selectedRecords.map(r => r.offer_sheet_id).filter(Boolean))];
    if (offerSheetIds.length > 1) {
      showToast('All selected welds in a batch must belong to the same Offer Sheet.', 'error');
      return;
    }

    const offerSheetId = offerSheetIds[0];
    if (!offerSheetId) {
      showToast('Could not determine Offer Sheet ID for selected welds.', 'error');
      return;
    }

    try {
      await api.post('/rt/submit', {
        attempt_ids: selectedAttempts,
        offer_sheet_id: offerSheetId
      });
      showToast('RT Batch submitted to verifier successfully!', 'success');
      setSelectedAttempts([]);
      fetchRtRecords();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  // Ensure we only show the LATEST attempt per joint in the table to match the UI behavior
  const latestAttemptsMap = new Map();
  rtRecords.forEach(record => {
    const existing = latestAttemptsMap.get(record.unique_code);
    if (!existing || record.attempt_number > existing.attempt_number) {
      latestAttemptsMap.set(record.unique_code, record);
    }
  });
  const displayRecords = Array.from(latestAttemptsMap.values());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RT Diagnostics Center</h1>
          <p className="text-sm text-slate-500">
            {isSupervisor ? `✓ Operational Clearance Granted. Field editing metrics active.` : 
             isVerifierOrAdmin ? `✓ Verification Clearance Active. Review and approve QA artifacts.` :
             `🔒 Read-only view active.`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isSupervisor && (
            <button
              onClick={handleSubmitBatch}
              disabled={selectedAttempts.length === 0}
              className={`font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-sm ${
                selectedAttempts.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>Submit to Verifier ({selectedAttempts.length} Selected)</span>
            </button>
          )}
          <div className="bg-blue-600 text-white font-mono px-3 py-1 rounded text-xs font-bold tracking-wider">
            SECTION::RT
          </div>
        </div>
      </div>

      {/* Date Filter Row for Admin & Verifier */}
      {isVerifierOrAdmin && (
        <DateFilter 
          fromDate={fromDate} 
          toDate={toDate} 
          setFromDate={setFromDate} 
          setToDate={setToDate} 
          onSearch={handleSearch} 
          onReset={handleReset} 
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold tracking-wide text-xs uppercase">
              {isSupervisor && <th className="px-6 py-4 w-10 text-center">Select</th>}
              <th className="px-6 py-4">Unique Code</th>
              <th className="px-6 py-4">Joint ID</th>
              <th className="px-6 py-4">Area System</th>
              <th className="px-6 py-4">Coil No</th>
              <th className="px-6 py-4">Tube No</th>
              <th className="px-6 py-4">Welder ID</th>
              <th className="px-6 py-4">Offer Date</th>
              <th className="px-6 py-4">Attempt Metric</th>
              <th className="px-6 py-4">Evaluation Status</th>
              <th className="px-6 py-4">Defect Classification</th>
              <th className="px-6 py-4">QA Artifact (RT)</th>
              {isVerifierOrAdmin && <th className="px-6 py-4">Verification</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr><td colSpan={isSupervisor ? 13 : 12} className="text-center py-8 text-slate-400">Loading records...</td></tr>
            ) : displayRecords.length === 0 ? (
              <tr><td colSpan={isSupervisor ? 13 : 12} className="text-center py-8 text-slate-400">No matching records found.</td></tr>
            ) : (
              displayRecords.map((row, _index) => {
                // Find original index in full array for reference if needed, but we bind by ID
                const index = rtRecords.findIndex(r => r.attempt_id === row.attempt_id);

                let rowColorClass = 'bg-white hover:bg-slate-50';
                if (row.status === 'Pass / Compliant' || row.status === 'Accepted') rowColorClass = 'bg-green-50/50 hover:bg-green-50';
                if (row.status === 'Fail / Repair Required' || row.status === 'Rejected') rowColorClass = 'bg-red-50/40 hover:bg-red-50/70';
                
                const isFinalState = row.status === 'Accepted' || row.status === 'Rejected';
                const disableSupervisorEdits = !canEditFields || isFinalState || row.is_submitted;

                return (
                  <tr key={row.attempt_id} className={`${rowColorClass} transition-colors`}>
                    {isSupervisor && (
                      <td className="px-6 py-4 text-center">
                        {row.is_submitted ? (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            SUBMITTED
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedAttempts.includes(row.attempt_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAttempts([...selectedAttempts, row.attempt_id]);
                              } else {
                                setSelectedAttempts(selectedAttempts.filter(id => id !== row.attempt_id));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 h-4 w-4 cursor-pointer"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{row.unique_code}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs font-bold">{row.joint_id}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.area_system}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.coil_no}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.tube_no}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs">{row.welder_id}</td>
                    
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.report_date || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          row.attempt_number >= 3 ? 'bg-red-50 text-red-700 border-red-200' :
                          row.attempt_number === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {row.attempt_number === 1 ? '1st Attempt' : `Attempt #${row.attempt_number}`}
                        </span>

                        {canEditFields && (row.status === 'Fail / Repair Required' || row.status === 'Rejected') && row.attempt_number < 3 && !row.is_submitted && (
                          <button
                            type="button"
                            onClick={() => setIncrementModal({ isOpen: true, targetIndex: index })}
                            title="Log new deliberate re-test attempt cycle"
                            className="h-5 w-5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded flex items-center justify-center font-bold text-xs transition-all shadow-sm"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        disabled={disableSupervisorEdits} 
                        value={row.status || 'Pending'}
                        onChange={(e) => {
                          handleTextChange(index, 'status', e.target.value);
                          saveFieldChange(row.attempt_id, 'status', e.target.value);
                        }}
                        className={`border text-xs font-semibold rounded-lg p-1.5 outline-none transition-all ${
                          row.status === 'Accepted' || row.status === 'Pass / Compliant' ? 'bg-green-50 text-green-700 border-green-200' :
                          row.status === 'Rejected' || row.status === 'Fail / Repair Required' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        } ${disableSupervisorEdits ? 'appearance-none pointer-events-none' : 'cursor-pointer'}`}
                      >
                        <option value="Pending">Pending Evaluation</option>
                        <option value="Pass / Compliant">Pass / Compliant</option>
                        <option value="Fail / Repair Required">Fail / Repair Required</option>
                        {isFinalState && <option value={row.status}>{row.status}</option>}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.defect_type || ''} placeholder={disableSupervisorEdits ? "None" : "E.g., Porosity, Slag"}
                        disabled={disableSupervisorEdits} 
                        onChange={(e) => handleTextChange(index, 'defect_type', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.attempt_id, 'defect_type', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    <td className="px-6 py-4">
                      {row.report_file ? (
                        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 max-w-max">
                          <a href={`${BACKEND_URL}${row.report_file}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline">
                            📄 View PDF
                          </a>
                        </div>
                      ) : row.isUploading ? (
                        <div className="flex items-center space-x-2 text-xs font-medium text-blue-600">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        canEditFields && !isFinalState && !row.is_submitted ? (
                          <label className="cursor-pointer bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all inline-block">
                            <span>Upload PDF</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(index, e)} />
                          </label>
                        ) : (
                          <span className="text-slate-400 text-xs">No file</span>
                        )
                      )}
                    </td>

                    {isVerifierOrAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {row.status === 'Accepted' || row.status === 'Rejected' ? (
                              <div className="text-xs flex flex-col">
                                <span className="font-bold text-slate-600">Verified by: {row.verified_by_id || 'Admin'}</span>
                                {row.verified_at && <span className="text-[10px] text-slate-400">{new Date(row.verified_at).toLocaleDateString()}</span>}
                              </div>
                           ) : (
                             <>
                              <button 
                                onClick={() => handleVerify(row.attempt_id, 'Accepted')}
                                disabled={!row.report_file || row.status !== 'Pass / Compliant'}
                                className="bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-800 font-semibold text-xs px-2 py-1 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleVerify(row.attempt_id, 'Rejected')}
                                className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs px-2 py-1 rounded transition-colors"
                              >
                                Reject
                              </button>
                             </>
                           )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={incrementModal.isOpen}
        title="Log Next Inspection Attempt Cycle?"
        message={`Confirming this action will advance the attempt metric registry counter to #${(rtRecords[incrementModal.targetIndex || 0]?.attempt_number || 0) + 1} for Joint ID: ${rtRecords[incrementModal.targetIndex || 0]?.joint_id}. This resets the current compliance results to prepare for the subsequent test cycle inputs.`}
        onConfirm={confirmNewAttemptIncrement}
        onCancel={() => setIncrementModal({ isOpen: false, targetIndex: null })}
        confirmText="Increase"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />
      
    </div>
  );
}
