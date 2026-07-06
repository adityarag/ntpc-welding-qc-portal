import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import api from '../../api/axiosConfig';

export default function UsersTab() {
  const { showToast, refreshTrigger } = useApp();
  const [users, setUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [roleSelection, setRoleSelection] = useState("1"); // default Supervisor

  useEffect(() => {
    fetchUsers();
    fetchSupervisors();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await api.get('/supervisors');
      setSupervisors(res.data.filter(s => s.status === 'Active'));
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Username', accessor: 'username', render: (val) => <span className="font-bold">{val}</span> },
    { 
      header: 'Role Level', 
      accessor: 'role', 
      render: (val) => (
        <span className={`px-2 py-1 text-xs font-bold rounded ${val === 3 ? 'bg-purple-100 text-purple-700' : val === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
          {val === 3 ? 'Admin / FAQ Head' : val === 2 ? 'Verifier / FAQ Eng' : 'Supervisor'}
        </span>
      )
    },
    { header: 'Date Created', accessor: 'createdAt', render: (val) => new Date(val).toLocaleDateString() },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => row.role !== 3 ? (
        <button 
          onClick={async () => {
            if (window.confirm(`Are you sure you want to permanently delete user ${row.username}?`)) {
              try {
                await api.delete(`/users/${id}`);
                showToast('User deleted successfully', 'success');
              } catch (err) {
                showToast(err.response?.data?.message || err.message, 'error');
              }
            }
          }}
          className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors bg-red-50 px-2 py-1 rounded"
        >
          Delete
        </button>
      ) : null
    }
  ];

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Pass supervisor_profile_id ONLY if role is 1 (Supervisor)
    const payload = {
      username: data.username,
      password: data.password,
      role: parseInt(data.role, 10),
      supervisor_profile_id: parseInt(data.role, 10) === 1 ? data.supervisor_profile_id : null
    };

    try {
      await api.post('/users', payload);
      showToast('User created successfully.', 'success');
      setIsAdding(false);
      setRoleSelection("1");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System User Management</h1>
          <p className="text-sm text-slate-500">Centralized control for Admins to manage Supervisors and Verifiers.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            + Create Account
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4 max-w-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800">New User Account</h3>
            <button onClick={() => { setIsAdding(false); setRoleSelection("1"); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">← Back</button>
          </div>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold capitalize text-slate-500">Username *</label>
              <input type="text" name="username" required className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold capitalize text-slate-500">Temporary Password *</label>
              <input type="password" name="password" required className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold capitalize text-slate-500">Role Mapping *</label>
              <select 
                name="role" 
                value={roleSelection}
                onChange={(e) => setRoleSelection(e.target.value)}
                required 
                className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="1">Auth Level 1: Supervisor</option>
                <option value="2">Auth Level 2: FAQ Engineer / Verifier</option>
                <option value="3">Auth Level 3: Admin / FAQ Head</option>
              </select>
            </div>
            
            {/* Conditional Supervisor Linkage Field */}
            {roleSelection === "1" && (
              <div className="flex flex-col space-y-1 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <label className="text-xs font-bold text-blue-800 uppercase tracking-wide">Link to Supervisor Master Profile *</label>
                <p className="text-[10px] text-blue-600 pb-1">This ties operational activity directly to their official plant registry ID.</p>
                <select name="supervisor_profile_id" required className="border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Select Master Supervisor --</option>
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>{s.supervisor_name} ({s.supervisor_id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Create User</button>
            </div>
          </form>
        </div>
      ) : (
        <DataTable columns={columns} data={users} loading={isLoading} />
      )}
    </div>
  );
}
