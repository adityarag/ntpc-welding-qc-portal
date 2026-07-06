import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import ConfirmationModal from '../common/ConfirmationModel';
import api from '../../api/axiosConfig';
import DateFilter from '../common/DateFilter';
import { downloadSecureFile } from '../../utils/downloadFile';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function NdtTab({ type }) {
  const { user, showToast, refreshTrigger } = useApp();
  const canEditFields = user?.role === 2 || user?.role === 3;
  const isVerifierOrAdmin = user?.role === 2 || user?.role === 3;

  const [ndtRecords, setNdtRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetIndex: null });
  const [incrementModal, setIncrementModal] = useState({ isOpen: false, targetIndex: null });

  const fetchNdtRecords = async (from = fromDate, to = toDate) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/ndt/${type}`, {
        params: { from, to }
      });
      setNdtRecords(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (from, to) => {
    fetchNdtRecords(from, to);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    fetchNdtRecords('', '');
  };

  useEffect(() => {
    fetchNdtRecords();
  }, [type, refreshTrigger]);

  const handleTextChange = (index, field, value) => {
    const updated = [...ndtRecords];
    updated[index][field] = value;
    setNdtRecords(updated);
  };

  const saveFieldChange = async (id, field, value) => {
    try {
      await api.put(`/ndt/${id}`, { [field]: value });
    } catch (err) {
      showToast(err.message, 'error');
      fetchNdtRecords();
    }
  };

  const handleDateAssignment = (index, field, newDate) => {
    const updated = [...ndtRecords];
    updated[index][field] = newDate;
    setNdtRecords(updated);
    
    api.put(`/ndt/${ndtRecords[index].id}`, { [field]: newDate })
      .catch(err => {
        showToast(err.message, 'error');
        fetchNdtRecords();
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

    const updatedRecords = [...ndtRecords];
    updatedRecords[index].isUploading = true;
    setNdtRecords(updatedRecords);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post(`/upload?module=${type.toLowerCase()}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data.filePath;
      
      await api.put(`/ndt/${ndtRecords[index].id}`, { report_file: filePath });

      const completedRecords = [...ndtRecords];
      completedRecords[index].report_file = filePath;
      completedRecords[index].isUploading = false;
      setNdtRecords(completedRecords);
      showToast('File uploaded successfully!', 'success');
      fetchNdtRecords();
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
      fetchNdtRecords();
    }
  };

  const confirmNewAttemptIncrement = async () => {
    if (incrementModal.targetIndex !== null) {
      try {
        const recordId = ndtRecords[incrementModal.targetIndex].id;
        await api.post(`/ndt/${recordId}/increment`);
        showToast('Attempt incremented successfully', 'success');
        fetchNdtRecords();
      } catch (err) {
        showToast(err.response?.data?.message || err.message, 'error');
      }
    }
    setIncrementModal({ isOpen: false, targetIndex: null });
  };

  const confirmFileDeletion = async () => {
    if (deleteModal.targetIndex !== null) {
      try {
        const recordId = ndtRecords[deleteModal.targetIndex].id;
        await api.put(`/ndt/${recordId}`, { report_file: null });
        
        const updated = [...ndtRecords];
        updated[deleteModal.targetIndex].report_file = null;
        setNdtRecords(updated);
        showToast('File deleted successfully', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
    setDeleteModal({ isOpen: false, targetIndex: null });
  };

  // Filter records to get the latest attempt per joint
  const latestAttemptsMap = new Map();
  ndtRecords.forEach(record => {
    const existing = latestAttemptsMap.get(record.unique_code);
    if (!existing || record.inspection_turn > existing.inspection_turn) {
      latestAttemptsMap.set(record.unique_code, record);
    }
  });

  const displayRecords = Array.from(latestAttemptsMap.values()).filter(row => 
    row.joint_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    row.unique_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.welder_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{type} Diagnostics Center</h1>
          <p className="text-sm text-slate-500">
            {canEditFields ? `✓ Operational Clearance Granted. Field editing and verification metrics active.` : `🔒 Read-only parameters active for standard viewports.`}
          </p>
        </div>
        <div className="bg-blue-600 text-white font-mono px-3 py-1 rounded text-xs font-bold tracking-wider">
          SECTION::{type}
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

      {/* Search Filter Row */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search structural Joint ID or Welder ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
          <div className="absolute left-3 top-2.5 text-slate-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold tracking-wide text-xs uppercase">
              <th className="px-6 py-4">Unique Code</th>
              <th className="px-6 py-4">Joint ID</th>
              <th className="px-6 py-4">Area System</th>
              <th className="px-6 py-4">Coil No</th>
              <th className="px-6 py-4">Tube No</th>
              <th className="px-6 py-4">Welder ID</th>
              <th className="px-6 py-4">Inspection Date</th>
              <th className="px-6 py-4">Inspection Attempt</th>
              <th className="px-6 py-4">Evaluation Status</th>
              <th className="px-6 py-4">Defect Classification</th>
              <th className="px-6 py-4">Remark Number</th>
              <th className="px-6 py-4">Report Date</th>
              <th className="px-6 py-4">Report PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr><td colSpan="13" className="text-center py-8 text-slate-400">Loading records...</td></tr>
            ) : displayRecords.length === 0 ? (
              <tr><td colSpan="13" className="text-center py-8 text-slate-400">No matching records found in system partition.</td></tr>
            ) : (
              displayRecords.map((row, _idx) => {
                const index = ndtRecords.findIndex(r => r.id === row.id);
                
                let rowColorClass = 'bg-white hover:bg-slate-50';
                if (row.result === 'Pass') rowColorClass = 'bg-green-50/50 hover:bg-green-50';
                if (row.result === 'Fail') rowColorClass = 'bg-red-50/40 hover:bg-red-50/70';
                
                return (
                  <tr key={row.id} className={`${rowColorClass} transition-colors`}>
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{row.unique_code}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs font-bold">{row.joint_id}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.area_system}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.coil_no}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.tube_no}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs">{row.welder_id}</td>
                  
                    {/* Inspection Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.date || ''}
                        disabled={!canEditFields}
                        onChange={(e) => handleDateAssignment(index, 'date', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          !canEditFields ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Attempt Counter & Increment button */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          row.inspection_turn >= 3 ? 'bg-red-50 text-red-700 border-red-200' :
                          row.inspection_turn === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {row.inspection_turn === 1 ? '1st Attempt' : `Attempt #${row.inspection_turn}`}
                        </span>

                        {canEditFields && row.result === 'Fail' && row.inspection_turn < 3 && (
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

                    {/* Evaluation Status */}
                    <td className="px-6 py-4">
                      <select
                        disabled={!canEditFields} value={row.result || 'Pending'}
                        onChange={(e) => {
                          handleTextChange(index, 'result', e.target.value);
                          saveFieldChange(row.id, 'result', e.target.value);
                        }}
                        className={`border text-xs font-semibold rounded-lg p-1.5 outline-none transition-all ${
                          row.result === 'Pass' ? 'bg-green-50 text-green-700 border-green-200' :
                          row.result === 'Fail' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        } ${!canEditFields ? 'appearance-none pointer-events-none' : 'cursor-pointer'}`}
                      >
                        <option value="Pending">Pending Evaluation</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </td>

                    {/* Defect Classification */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.defect_type || ''} placeholder={canEditFields ? "E.g., Porosity, Crack" : "None"}
                        disabled={!canEditFields} 
                        onChange={(e) => handleTextChange(index, 'defect_type', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.id, 'defect_type', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          !canEditFields ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Remark Number */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.remark_number || ''} placeholder={canEditFields ? "E.g., RMK-101" : "None"}
                        disabled={!canEditFields} 
                        onChange={(e) => handleTextChange(index, 'remark_number', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.id, 'remark_number', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs font-mono w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          !canEditFields ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Report Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.report_date || ''}
                        disabled={!canEditFields}
                        onChange={(e) => handleDateAssignment(index, 'report_date', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          !canEditFields ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Report PDF */}
                    <td className="px-6 py-4">
                      {row.report_file ? (
                        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 max-w-max">
                          <button onClick={() => downloadSecureFile(row.report_file)} className="text-xs font-semibold text-emerald-700 hover:underline">
                            📄 View PDF
                          </button>
                          {canEditFields && (
                            <button 
                              type="button"
                              onClick={() => setDeleteModal({ isOpen: true, targetIndex: index })}
                              className="text-slate-400 hover:text-red-600 font-bold px-1 text-sm rounded transition-colors"
                              title="Delete report"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ) : row.isUploading ? (
                        <div className="flex items-center space-x-2 text-xs font-medium text-blue-600">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        canEditFields ? (
                          <label className="cursor-pointer bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all inline-block">
                            <span>Upload PDF</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(index, e)} />
                          </label>
                        ) : (
                          <span className="text-slate-400 text-xs">No file</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={incrementModal.isOpen}
        title="Log Next Inspection Attempt Cycle?"
        message={`Confirming this action will advance the attempt metric registry counter to #${(ndtRecords[incrementModal.targetIndex || 0]?.inspection_turn || 0) + 1} for Joint ID: ${ndtRecords[incrementModal.targetIndex || 0]?.joint_id}. This resets the current compliance results to prepare for the subsequent test cycle inputs.`}
        onConfirm={confirmNewAttemptIncrement}
        onCancel={() => setIncrementModal({ isOpen: false, targetIndex: null })}
        confirmText="Increase"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="Delete Quality Assurance Artifact?"
        message={`This will permanently unlink and remove this ${type} verification documentation file from Joint ID: ${ndtRecords[deleteModal.targetIndex || 0]?.joint_id}. This action cannot be undone.`}
        onConfirm={confirmFileDeletion}
        onCancel={() => setDeleteModal({ isOpen: false, targetIndex: null })}
        confirmText="Delete Permanently"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
      
    </div>
  );
}