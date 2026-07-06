import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import api from '../../api/axiosConfig';
import DateFilter from '../common/DateFilter';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PwhtTab() {
  const { user, showToast, refreshTrigger } = useApp();
  
  const isSupervisor = user?.role === 1;
  const isVerifierOrAdmin = user?.role === 2 || user?.role === 3;
  const canEditFields = isSupervisor;

  const [weldRecords, setWeldRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPwhtRecords = async (from = fromDate, to = toDate) => {
    setIsLoading(true);
    try {
      const response = await api.get('/welds', {
        params: { from, to, dateType: 'pwht_date' }
      });
      setWeldRecords(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (from, to) => {
    fetchPwhtRecords(from, to);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    fetchPwhtRecords('', '');
  };

  useEffect(() => {
    fetchPwhtRecords();
  }, [refreshTrigger]);

  const handleTextChange = (index, field, value) => {
    const updated = [...weldRecords];
    updated[index][field] = value;
    setWeldRecords(updated);
  };

  const saveFieldChange = async (unique_code, field, value) => {
    try {
      await api.put(`/welds/${unique_code}`, { [field]: value });
    } catch (err) {
      showToast(err.message, 'error');
      fetchPwhtRecords();
    }
  };

  const handleDateAssignment = (index, field, newDate) => {
    const updated = [...weldRecords];
    updated[index][field] = newDate;
    setWeldRecords(updated);
    
    api.put(`/welds/${weldRecords[index].unique_code}`, { [field]: newDate })
      .catch(err => {
        showToast(err.message, 'error');
        fetchPwhtRecords();
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

    const updatedRecords = [...weldRecords];
    updatedRecords[index].isUploading = true;
    setWeldRecords(updatedRecords);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post(`/upload?module=pwht`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data.filePath;
      
      await api.put(`/welds/${weldRecords[index].unique_code}`, { report_file: filePath });

      const completedRecords = [...weldRecords];
      completedRecords[index].report_file = filePath;
      completedRecords[index].isUploading = false;
      setWeldRecords(completedRecords);
      showToast('File uploaded successfully!', 'success');
      fetchPwhtRecords();
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
      fetchPwhtRecords();
    }
  };

  const handleVerify = async (unique_code, status) => {
    try {
      await api.put(`/welds/${unique_code}/verify`, { status });
      showToast(`PWHT Record ${status}!`, 'success');
      fetchPwhtRecords();
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  };

  // Filter records
  const filteredRecords = weldRecords.filter(row => 
    row.joint_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    row.unique_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.welder_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Post-Weld Heat Treatment (PWHT) Registry</h1>
          <p className="text-sm text-slate-500">
            {isSupervisor ? `✓ Operational Clearance Granted. Field editing metrics active.` : 
             isVerifierOrAdmin ? `✓ Verification Clearance Active. Review and approve QA artifacts.` :
             `🔒 Read-only view active.`}
          </p>
        </div>
        <div className="bg-amber-600 text-white font-mono px-3 py-1 rounded text-xs font-bold tracking-wider">
          TRACKING::PWHT
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
              <th className="px-6 py-4">1st RT Date</th>
              <th className="px-6 py-4">2nd RT Date</th>
              <th className="px-6 py-4">3rd RT Date</th>
              <th className="px-6 py-4">Hardness</th>
              <th className="px-6 py-4">PWHT Chart Number</th>
              <th className="px-6 py-4">PWHT Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Remarks</th>
              <th className="px-6 py-4">Remark Number</th>
              <th className="px-6 py-4">Report Date</th>
              <th className="px-6 py-4">Report PDF</th>
              {isVerifierOrAdmin && <th className="px-6 py-4">Verification</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr><td colSpan="18" className="text-center py-8 text-slate-400">Loading records...</td></tr>
            ) : filteredRecords.length === 0 ? (
              <tr><td colSpan="18" className="text-center py-8 text-slate-400">No matching records found.</td></tr>
            ) : (
              filteredRecords.map((row, index) => {
                let rowColorClass = 'bg-white hover:bg-slate-50';
                if (row.pwht_status === 'Completed') rowColorClass = 'bg-green-50/50 hover:bg-green-50';
                if (row.pwht_status === 'Rejected') rowColorClass = 'bg-red-50/40 hover:bg-red-50/70';
                
                const isFinalState = row.pwht_status === 'Completed' || row.pwht_status === 'Rejected';
                const disableSupervisorEdits = !canEditFields || isFinalState;

                return (
                  <tr key={row.unique_code} className={`${rowColorClass} transition-colors`}>
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{row.unique_code}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs font-bold">{row.joint_id}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.area_system}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.coil_no}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{row.tube_no}</td>
                    <td className="px-6 py-4 font-mono text-slate-600 text-xs">{row.welder_id}</td>
                    
                    {/* 1st RT Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.rt_date_1 || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, 'rt_date_1', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* 2nd RT Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.rt_date_2 || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, 'rt_date_2', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* 3rd RT Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.rt_date_3 || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, 'rt_date_3', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Hardness */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.hardness || ''} placeholder={disableSupervisorEdits ? "None" : "E.g., 185 HB"}
                        disabled={disableSupervisorEdits} 
                        onChange={(e) => handleTextChange(index, 'hardness', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.unique_code, 'hardness', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* PWHT Chart Number */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.pwht_chart_number || ''} placeholder={disableSupervisorEdits ? "None" : "E.g., CH-001"}
                        disabled={disableSupervisorEdits} 
                        onChange={(e) => handleTextChange(index, 'pwht_chart_number', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.unique_code, 'pwht_chart_number', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* PWHT Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.pwht_date || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, 'pwht_date', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${
                        row.pwht_status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        row.pwht_status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        row.pwht_status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {row.pwht_status || 'Pending'}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.pwht_remarks || ''} placeholder={disableSupervisorEdits ? "None" : "Remarks..."}
                        disabled={disableSupervisorEdits} 
                        onChange={(e) => handleTextChange(index, 'pwht_remarks', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.unique_code, 'pwht_remarks', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Remark Number */}
                    <td className="px-6 py-4">
                      <input
                        type="text" value={row.remark_number || ''} placeholder={disableSupervisorEdits ? "None" : "RM-001"}
                        disabled={disableSupervisorEdits} 
                        onChange={(e) => handleTextChange(index, 'remark_number', e.target.value)}
                        onBlur={(e) => saveFieldChange(row.unique_code, 'remark_number', e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-400' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Report Date */}
                    <td className="px-6 py-4">
                      <input 
                        type="date" 
                        value={row.report_date || ''}
                        disabled={disableSupervisorEdits}
                        onChange={(e) => handleDateAssignment(index, 'report_date', e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          disableSupervisorEdits ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </td>

                    {/* Report PDF */}
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
                        canEditFields && !isFinalState ? (
                          <label className="cursor-pointer bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all inline-block">
                            <span>Upload PDF</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(index, e)} />
                          </label>
                        ) : (
                          <span className="text-slate-400 text-xs">No file</span>
                        )
                      )}
                    </td>

                    {/* Verification Action (Verifier/Admin only) */}
                    {isVerifierOrAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {row.pwht_status === 'Completed' || row.pwht_status === 'Rejected' ? (
                            <div className="text-xs flex flex-col">
                              <span className="font-bold text-slate-600">Verified by: {row.verified_by || 'Admin'}</span>
                              {row.verified_at && <span className="text-[10px] text-slate-400">{new Date(row.verified_at).toLocaleDateString()}</span>}
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleVerify(row.unique_code, 'Completed')}
                                disabled={!row.report_file}
                                className="bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-800 font-semibold text-xs px-2.5 py-1.5 rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleVerify(row.unique_code, 'Rejected')}
                                className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs px-2.5 py-1.5 rounded transition-colors"
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
    </div>
  );
}