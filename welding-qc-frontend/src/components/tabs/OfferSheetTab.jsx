import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import api from '../../api/axiosConfig';
import JointCreationTab from './JointCreationTab';
import DateFilter from '../common/DateFilter';
import { downloadSecureFile } from '../../utils/downloadFile';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function OfferSheetManager() {
  const [selectedOfferSheetId, setSelectedOfferSheetId] = useState(null);

  if (selectedOfferSheetId) {
    return <JointCreationTab offerSheetId={selectedOfferSheetId} onBack={() => setSelectedOfferSheetId(null)} />;
  }

  return <OfferSheetTab onSelectOfferSheet={setSelectedOfferSheetId} />;
}

function OfferSheetTab({ onSelectOfferSheet }) {
  const { user, showToast, refreshTrigger } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingMap, setUploadingMap] = useState({});
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchOfferSheets = async (from = fromDate, to = toDate) => {
    setIsLoading(true);
    try {
      const response = await api.get('/offer-sheets', {
        params: { from, to }
      });
      setRecords(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (from, to) => {
    fetchOfferSheets(from, to);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    fetchOfferSheets('', '');
  };

  const handleFileUpload = async (offerSheetId, e) => {
    e.stopPropagation();
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are allowed.', 'error');
      e.target.value = '';
      return;
    }

    setUploadingMap(prev => ({ ...prev, [offerSheetId]: true }));

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await api.post(`/upload?module=offer-sheet`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data.filePath;

      await api.put(`/offer-sheets/${offerSheetId}`, { offer_sheet_file: filePath });
      showToast('Offer Sheet file uploaded successfully!', 'success');
      fetchOfferSheets();
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploadingMap(prev => ({ ...prev, [offerSheetId]: false }));
    }
  };

  useEffect(() => {
    fetchOfferSheets();
  }, [refreshTrigger]);

  const handleAddNewRecord = async (newRow) => {
    try {
      const response = await api.post('/offer-sheets', newRow);
      setRecords(prev => [response.data, ...prev]);
      setIsAdding(false);
      showToast('Work Assignment created successfully!', 'success');
      fetchOfferSheets();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  const filteredRecords = records.filter(row => 
    row.offer_sheet_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.supervisor?.username && row.supervisor.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    { 
      header: 'Offer Sheet ID', 
      accessor: 'offer_sheet_id', 
      render: (val, row) => (
        <button 
          onClick={() => onSelectOfferSheet && onSelectOfferSheet(row.offer_sheet_id)}
          className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
        >
          {val}
        </button>
      ) 
    },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Supervisor', 
      accessor: 'supervisor', 
      render: (val) => <span className="font-semibold text-slate-700">{val?.username || 'Unknown'}</span> 
    },
    { 
      header: 'Target Joints', 
      accessor: 'target_joints',
      render: (val) => <span className="text-slate-600 font-medium">{val}</span>
    },
    { 
      header: 'Created', 
      accessor: 'joints_created',
      render: (val) => <span className="text-blue-600 font-medium">{val}</span>
    },
    { 
      header: 'Completed', 
      accessor: 'joints_completed',
      render: (val) => <span className="text-emerald-600 font-medium">{val}</span>
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (_, row) => {
        const pct = row.target_joints > 0 ? Math.min(100, Math.round((row.joints_created / row.target_joints) * 100)) : 0;
        return (
          <div className="flex items-center space-x-2 w-full max-w-[120px]">
            <div className="w-full bg-slate-200 rounded-full h-2.5 flex-1">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
            <span className="text-xs font-semibold text-slate-500 w-8 text-right">{pct}%</span>
          </div>
        );
      }
    },
    {
      header: 'Document',
      accessor: 'offer_sheet_file',
      render: (val, row) => {
        const isUploading = uploadingMap[row.offer_sheet_id];
        const canUpload = user.role === 1 || user.role === 3;

        if (val) {
          return (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 max-w-max" onClick={e => e.stopPropagation()}>
              <button onClick={() => downloadSecureFile(val)} className="text-xs font-semibold text-emerald-700 hover:underline">
                📄 View PDF
              </button>
            </div>
          );
        }

        if (isUploading) {
          return (
            <div className="flex items-center space-x-2 text-xs font-medium text-blue-600" onClick={e => e.stopPropagation()}>
              <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span>Uploading...</span>
            </div>
          );
        }

        if (canUpload) {
          return (
            <label className="cursor-pointer bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all inline-block" onClick={e => e.stopPropagation()}>
              <span>Upload PDF</span>
              <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(row.offer_sheet_id, e)} />
            </label>
          );
        }

        return <span className="text-slate-400 text-xs" onClick={e => e.stopPropagation()}>No file</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workload Assignments (Offer Sheets)</h1>
          <p className="text-sm text-slate-500">
            {user.role === 3 ? "Create and manage joint quotas for Supervisors." : "Select an Offer Sheet below to begin creating and managing physical joints."}
          </p>
        </div>
        {user.role === 3 && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            + Create Offer Sheet
          </button>
        )}
      </div>

      {isAdding ? (
        <OfferSheetForm onSubmit={handleAddNewRecord} onCancel={() => setIsAdding(false)} />
      ) : (
        <div className="space-y-4">
          {(user?.role === 2 || user?.role === 3) && (
            <DateFilter 
              fromDate={fromDate} 
              toDate={toDate} 
              setFromDate={setFromDate} 
              setToDate={setToDate} 
              onSearch={handleSearch} 
              onReset={handleReset} 
            />
          )}
          <div className="flex items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by Offer Sheet ID or Supervisor..." />
          </div>
          <DataTable 
            columns={columns} 
            data={filteredRecords} 
            loading={isLoading} 
            onRowClick={(row) => onSelectOfferSheet && onSelectOfferSheet(row.offer_sheet_id)}
          />
        </div>
      )}
    </div>
  );
}

function OfferSheetForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({ supervisor_id: '', target_joints: '', date: new Date().toISOString().split('T')[0], offer_sheet_file: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const { showToast } = useApp();

  useEffect(() => {
    // Fetch users with role 1 (Supervisors)
    api.get('/users').then(res => {
      const sups = res.data.filter(u => u.role === 1);
      setSupervisors(sups);
    }).catch(console.error);
  }, []);

  const handleFormFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are allowed.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);
      
      const uploadRes = await api.post(`/upload?module=offer-sheet`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = uploadRes.data.filePath;
      setFormData(prev => ({ ...prev, offer_sheet_file: filePath }));
      showToast('Offer Sheet document uploaded!', 'success');
    } catch (err) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supervisor_id || !formData.target_joints) {
      return showToast('Please fill all required fields.', 'error');
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4 max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-800">Assign New Workload</h3>
        <button onClick={onCancel} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">← Back</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Date *</label>
          <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Assign Supervisor *</label>
          <select required value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50">
            <option value="">-- Select Supervisor --</option>
            {supervisors.map(s => (
              <option key={s.id} value={s.id}>{s.username}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Target Number of Joints *</label>
          <input type="number" min="1" required value={formData.target_joints} onChange={e => setFormData({...formData, target_joints: parseInt(e.target.value) || ''})} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="e.g. 50" />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold uppercase text-slate-500">Offer Sheet Document (Optional PDF)</label>
          {formData.offer_sheet_file ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 max-w-max">
              <span className="text-xs font-semibold text-emerald-700">📄 PDF Attached</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, offer_sheet_file: '' })}
                className="text-xs text-red-500 hover:text-red-700 font-bold ml-2"
              >
                Remove
              </button>
            </div>
          ) : isUploading ? (
            <div className="flex items-center space-x-2 text-xs font-medium text-blue-600">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span>Uploading...</span>
            </div>
          ) : (
            <label className="cursor-pointer bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-2 rounded-lg text-xs font-medium shadow-sm transition-all inline-block max-w-max">
              <span>Choose PDF File</span>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFormFileUpload} />
            </label>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Offer Sheet</button>
        </div>
      </form>
    </div>
  );
}