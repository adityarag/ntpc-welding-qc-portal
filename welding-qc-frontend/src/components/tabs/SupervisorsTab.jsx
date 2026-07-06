import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import DataTable from '../common/DataTable';
import api from '../../api/axiosConfig';

export default function SupervisorsTab() {
  const { user, showToast, refreshTrigger } = useApp();
  const [supervisors, setSupervisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Only Admin can manage supervisors
  const canManage = user?.role === 3; 

  useEffect(() => {
    fetchSupervisors();
  }, [refreshTrigger]);

  const fetchSupervisors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/supervisors');
      setSupervisors(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Supervisor ID', accessor: 'supervisor_id', render: (val) => <span className="font-mono font-bold text-blue-900">{val}</span> },
    { header: 'Name', accessor: 'supervisor_name', render: (val) => <span className="font-bold text-slate-800">{val}</span> },
    { header: 'Employee ID', accessor: 'employee_id' },
    { header: 'Department', accessor: 'department' },
    { header: 'Contact No', accessor: 'contact_number' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (val) => (
        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${val === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {val}
        </span>
      ) 
    }
  ];

  const handleCreateSupervisor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await api.post('/supervisors', data);
      showToast('Supervisor registered successfully.', 'success');
      setIsAdding(false);
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supervisor Master Registry</h1>
          <p className="text-sm text-slate-500">
            {canManage ? 'Admin permissions active. You can manage supervisor profiles.' : 'Read-only view of supervisor directory.'}
          </p>
        </div>
        {canManage && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            + Add Supervisor
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-800">New Supervisor Profile</h3>
            <button onClick={() => setIsAdding(false)} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">← Back</button>
          </div>
          <form onSubmit={handleCreateSupervisor} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">SUPERVISOR ID *</label>
                <input type="text" name="supervisor_id" required placeholder="E.g., SUP-01" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">FULL NAME *</label>
                <input type="text" name="supervisor_name" required placeholder="John Doe" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">EMPLOYEE ID</label>
                <input type="text" name="employee_id" placeholder="EMP-4991" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">DEPARTMENT</label>
                <input type="text" name="department" placeholder="E.g., Boiler Division" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">CONTACT NUMBER</label>
                <input type="text" name="contact_number" placeholder="+91 XXXXX XXXXX" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-slate-500">STATUS</label>
                <select name="status" className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">REMARKS</label>
              <textarea name="remarks" rows="2" placeholder="Add notes..." className="border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-5 py-2 text-sm bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Save Profile</button>
            </div>
          </form>
        </div>
      ) : (
        <DataTable columns={columns} data={supervisors} loading={isLoading} />
      )}
    </div>
  );
}
