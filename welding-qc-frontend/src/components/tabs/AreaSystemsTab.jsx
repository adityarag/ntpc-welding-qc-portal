import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import SearchBar from '../common/SearchBar';
import DataTable from '../common/DataTable';
import ConfirmationModal from '../common/ConfirmationModel';
import api from '../../api/axiosConfig';

export default function AreaSystemsTab() {
  const { user, showToast, refreshTrigger } = useApp();
  const [areaSystems, setAreaSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchAreaSystems();
  }, [refreshTrigger]);

  const fetchAreaSystems = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/area-systems');
      setAreaSystems(response.data);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAreaSystem = async (e) => {
    e.preventDefault();
    if (!newAreaName || newAreaName.trim() === '') {
      showToast('Area System name cannot be empty.', 'error');
      return;
    }

    const normalized = newAreaName.trim();
    const alphanumericRegex = /^[a-zA-Z0-9-]+$/;
    if (!alphanumericRegex.test(normalized)) {
      showToast('Special characters are not allowed. Use A-Z, 0-9, and hyphens only.', 'error');
      return;
    }

    try {
      await api.post('/area-systems', { name: normalized });
      showToast('Area System created successfully!', 'success');
      setNewAreaName('');
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleDeleteAreaSystem = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/area-systems/${encodeURIComponent(deleteTarget)}`);
      showToast('Area System deleted successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const hasAccess = user?.role === 1 || user?.role === 3;

  const columns = [
    {
      header: 'Area System Code / Name',
      accessor: 'name',
      render: (val) => <span className="font-mono font-bold text-blue-900">{val}</span>
    },
    {
      header: 'Date Created',
      accessor: 'createdAt',
      render: (val) => <span className="text-slate-500 font-mono text-xs">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span>
    },
    ...(hasAccess ? [{
      header: 'Actions',
      accessor: 'actions',
      render: (_, row) => (
        <button
          onClick={() => setDeleteTarget(row.name)}
          className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors bg-red-50/55 px-2 py-1 rounded border border-red-100"
        >
          Delete
        </button>
      )
    }] : [])
  ];

  const filteredAreas = areaSystems.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Area Systems Master</h1>
          <p className="text-sm text-slate-500">
            {hasAccess
              ? "✓ Control privileges active. Centralized Area Systems control panel."
              : "🔒 Read-only view. Modifications are restricted to Administrators and Supervisors."}
          </p>
        </div>
      </div>

      {hasAccess && (
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Add Predefined Area System</h2>
          <form onSubmit={handleAddAreaSystem} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 max-w-xl">
            <div className="flex-1 w-full">
              <label htmlFor="areaName" className="sr-only">Area System Name / Code</label>
              <input
                id="areaName"
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="e.g. Boiler-Zone-1, A1, A2"
                className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Add Area System
            </button>
          </form>
          <p className="text-xs text-slate-400">
            * Area systems are used in joint creation. Alphanumeric characters and hyphens only.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <DataTable columns={columns} data={filteredAreas} loading={isLoading} />
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Delete Area System"
        message={`Are you sure you want to delete the Area System "${deleteTarget}"? Joints referencing this Area System will still exist, but supervisors won't be able to select it for new joints.`}
        onConfirm={handleDeleteAreaSystem}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </div>
  );
}
