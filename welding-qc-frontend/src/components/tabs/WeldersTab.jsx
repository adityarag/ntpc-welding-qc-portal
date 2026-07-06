import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import WelderForm from '../forms/WelderForm';
import api from '../../api/axiosConfig';

export default function WeldersTab() {
  const { user, showToast, refreshTrigger } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingWelder, setEditingWelder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [welders, setWelders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWelders();
  }, [refreshTrigger]);

  const fetchWelders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/welders');
      setWelders(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Table columns schema definition layout
  const columns = [
    { 
      header: 'Welder ID', 
      accessor: 'welder_id', 
      render: (val) => <span className="font-mono font-bold text-blue-900">{val}</span> 
    },
    { 
      header: 'Full Name', 
      accessor: 'welder_name', 
      render: (val) => <span className="font-semibold text-slate-800">{val}</span> 
    },
    { 
      header: 'Qualifications', 
      accessor: 'qualification', 
      render: (val) => <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-medium px-2 py-1 rounded">{val || 'N/A'}</span> 
    },
    { header: 'Employer', accessor: 'employer' },
    { header: 'Contact', accessor: 'contact_number', render: (val) => <span className="font-mono text-slate-500">{val}</span> },
    { 
      header: 'Notes / Logs', 
      accessor: 'notes', 
      render: (val) => <p className="max-w-xs truncate text-xs text-slate-400 italic" title={val}>{val || 'No extra notes.'}</p> 
    },
    ...(user?.role === 3 ? [{
      header: 'Actions',
      accessor: 'actions',
      render: (_, row) => (
        <button 
          onClick={() => { setEditingWelder(row); setIsAdding(true); }}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded"
        >
          Edit
        </button>
      )
    }] : [])
  ];

  const handleAddNewWelder = async (welderData) => {
    try {
      if (editingWelder) {
        await api.put(`/welders/${editingWelder.id}`, welderData);
        showToast('Welder profile updated successfully!', 'success');
      } else {
        await api.post('/welders', welderData);
        showToast('Welder profile created successfully!', 'success');
      }
      setIsAdding(false);
      setEditingWelder(null);
      // Let websocket re-fetch trigger happen automatically
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  // Client-side text-filtering matches inputs dynamically against Welder ID or Full Name strings
  const filteredWelders = welders.filter(w => 
    w.welder_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.welder_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welder Resource Registry</h1>
          <p className="text-sm text-slate-500">
            {user.role === 3 
              ? "✓ Admin permissions active. You can manage personnel profiles." 
              : "🔒 Read-only view. Profile modifications are restricted to Administrators."}
          </p>
        </div>
        {user.role === 3 && !isAdding && (
          <button 
            onClick={() => { setEditingWelder(null); setIsAdding(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            + Register Welder
          </button>
        )}
      </div>

      {isAdding ? (
        <WelderForm onSubmit={handleAddNewWelder} onCancel={() => { setIsAdding(false); setEditingWelder(null); }} initialData={editingWelder} />
      ) : (
        <div className="space-y-4">
          {/* Filtering Node Area layout */}
          <div className="flex items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Unified Clean Data Grid Panel Display */}
          <DataTable columns={columns} data={filteredWelders} loading={isLoading} />
        </div>
      )}
    </div>
  );
}