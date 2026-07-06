import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../api/axiosConfig';
import DateFilter from '../common/DateFilter';

export default function WeldsTab() {
  const { user, showToast } = useApp();
  const canEdit = user?.role === 1 || user?.role === 2 || user?.role === 3;

  const [weldRecords, setWeldRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchWelds = async (from = fromDate, to = toDate) => {
    setIsLoading(true);
    try {
      const response = await api.get('/welds', {
        params: { from, to, dateType: 'createdAt' }
      });
      setWeldRecords(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (from, to) => {
    fetchWelds(from, to);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    fetchWelds('', '');
  };

  useEffect(() => {
    fetchWelds();
  }, []);

  const handleFieldChange = (index, field, value) => {
    const updated = [...weldRecords];
    updated[index][field] = value;
    setWeldRecords(updated);
  };

  const saveFieldChange = async (joint_id, field, value) => {
    try {
      await api.put(`/welds/${joint_id}`, { [field]: value });
      // showToast('Parameter updated', 'success'); // Optional, might be noisy
    } catch (err) {
      showToast(err.message, 'error');
      // Optionally re-fetch to revert the optimistic UI update
      fetchWelds();
    }
  };

  const submitJoint = async (index, joint_id) => {
    const row = weldRecords[index];
    if (row.pwht_required === null || row.pwht_required === undefined || row.pwht_required === "") {
      showToast('You must explicitly select Yes or No for PWHT requirement before submitting.', 'error');
      return;
    }
    try {
      await api.put(`/welds/${joint_id}`, { is_submitted: true });
      showToast('Joint submitted successfully. Parameters are now locked.', 'success');
      handleFieldChange(index, 'is_submitted', true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Filter out which joints have active PWHT requirements assigned to them
  const pwhtRequiredRecords = weldRecords.filter(row => row.pwht_required);

  return (
    <div className="space-y-8">
      {/* SECTION 1: Core Welding Specifications Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welding Parameter Specifications</h1>
            <p className="text-sm text-slate-500">
              {canEdit ? "✓ Editing permissions granted. Please submit when finished." : "🔒 System Viewport Locked. Modifications restricted."}
            </p>
          </div>
          {isLoading && <span className="text-xs text-blue-600 font-medium animate-pulse">Loading data...</span>}
        </div>
        
        {(user?.role === 2 || user?.role === 3) && (
          <div className="mb-4">
            <DateFilter 
              fromDate={fromDate} 
              toDate={toDate} 
              setFromDate={setFromDate} 
              setToDate={setToDate} 
              onSearch={handleSearch} 
              onReset={handleReset} 
            />
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold tracking-wide text-xs uppercase">
                <th className="px-6 py-4">Joint ID</th>
                <th className="px-6 py-4">Area System (Inherited)</th>
                <th className="px-6 py-4">Electrode Specs</th>
                <th className="px-6 py-4">WPS Number</th>
                <th className="px-6 py-4">PWHT Required?</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {weldRecords.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-6 text-slate-500">No records found.</td></tr>
              ) : weldRecords.map((row, index) => (
                <tr key={row.joint_id} className="hover:bg-blue-50/40 odd:bg-white even:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-900">{row.joint_id}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{row.area_system || 'N/A'} (Locked)</td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" value={row.electrode || ''} disabled={!canEdit || row.is_submitted}
                      onChange={(e) => handleFieldChange(index, 'electrode', e.target.value)}
                      onBlur={(e) => saveFieldChange(row.joint_id, 'electrode', e.target.value)}
                      className={`border rounded-lg px-3 py-1.5 text-xs font-mono w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${(!canEdit || row.is_submitted) ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" value={row.wps_no || ''} disabled={!canEdit || row.is_submitted}
                      onChange={(e) => handleFieldChange(index, 'wps_no', e.target.value)}
                      onBlur={(e) => saveFieldChange(row.joint_id, 'wps_no', e.target.value)}
                      className={`border rounded-lg px-3 py-1.5 text-xs font-mono w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-blue-600 ${(!canEdit || row.is_submitted) ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200'}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      disabled={!canEdit || row.is_submitted}
                      value={row.pwht_required === null || row.pwht_required === undefined ? "" : (row.pwht_required ? "Yes" : "No")}
                      onChange={(e) => {
                        const val = e.target.value === "Yes" ? true : (e.target.value === "No" ? false : null);
                        if (val !== null) {
                          handleFieldChange(index, 'pwht_required', val);
                          saveFieldChange(row.joint_id, 'pwht_required', val);
                        }
                      }}
                      className={`text-xs font-semibold rounded-lg p-1.5 outline-none border transition-all ${
                        row.pwht_required === true 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : row.pwht_required === false
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-white border-slate-300 text-slate-400'
                      } ${(!canEdit || row.is_submitted) ? 'appearance-none pointer-events-none' : 'cursor-pointer focus:ring-1 focus:ring-blue-600'}`}
                    >
                      <option value="" disabled>Select</option>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.is_submitted ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Locked</span>
                    ) : (
                      canEdit ? (
                        <button 
                          onClick={() => submitJoint(index, row.joint_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          Submit
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}