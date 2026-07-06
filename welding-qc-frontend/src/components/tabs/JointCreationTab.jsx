import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../api/axiosConfig';

export default function JointCreationTab({ offerSheetId, onBack }) {
  const { showToast, user } = useApp();
  const [joints, setJoints] = useState([]);
  const [offerSheet, setOfferSheet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    joint_id: '',
    area_system: '',
    coil_no: '',
    tube_no: '',
    material_spec: '',
    weld_size: '',
    welder_id: '',
    pwht_required: false
  });
  const [welders, setWelders] = useState([]);
  const [areaSystems, setAreaSystems] = useState([]);

  useEffect(() => {
    fetchJoints();
    fetchOfferSheetDetails();
    api.get('/welders').then(res => setWelders(res.data)).catch(console.error);
    api.get('/area-systems').then(res => setAreaSystems(res.data)).catch(console.error);
  }, [offerSheetId]);

  const fetchJoints = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/joints/${offerSheetId}`);
      setJoints(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfferSheetDetails = async () => {
    try {
      const res = await api.get(`/offer-sheets/${offerSheetId}`);
      setOfferSheet(res.data);
    } catch (err) {
      console.error('Error fetching offer sheet details:', err);
    }
  };

  const handleInputChange = (field, value) => {
    if (['area_system', 'coil_no', 'tube_no', 'joint_id'].includes(field)) {
      if (/[^a-zA-Z0-9-]/.test(value)) {
        showToast('Special characters are not allowed.', 'error');
        return;
      }
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleUpdateStatus = async (uniqueCode, status) => {
    try {
      await api.put(`/joints/${uniqueCode}`, { status });
      showToast(`Joint marked as ${status}.`, 'success');
      fetchJoints();
      fetchOfferSheetDetails();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateJoint = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, offer_sheet_id: offerSheetId };
      await api.post('/joints', payload);
      showToast('Joint created successfully!', 'success');
      setFormData({
        joint_id: '',
        area_system: formData.area_system,
        coil_no: formData.coil_no,
        tube_no: formData.tube_no,
        material_spec: formData.material_spec,
        weld_size: formData.weld_size,
        welder_id: '',
        pwht_required: false
      });
      fetchJoints();
      fetchOfferSheetDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, 'error');
    }
  };

  const targetJoints = offerSheet?.target_joints || 0;
  const createdJoints = joints.length;
  const remainingJoints = Math.max(0, targetJoints - createdJoints);
  const isLimitReached = remainingJoints <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Joints for Offer Sheet: <span className="text-blue-600">{offerSheetId}</span></h1>
          <p className="text-sm text-slate-500">Create physical joints and map them to welders.</p>
        </div>
        <button onClick={onBack} className="text-sm font-medium text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded-lg">← Back to Dashboard</button>
      </div>

      {/* Allocation Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Joints Assigned</span>
          <span className="text-3xl font-black text-slate-800 mt-1">{targetJoints}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Created Joints</span>
          <span className="text-3xl font-black text-blue-600 mt-1">{createdJoints}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Joints Quota</span>
          <span className={`text-3xl font-black mt-1 ${isLimitReached ? 'text-red-600' : 'text-emerald-600'}`}>
            {remainingJoints}
          </span>
        </div>
      </div>

      {user.role === 1 && (
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-slate-800">Add New Joint</h3>
            {isLimitReached && (
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                ⚠️ Allocation Limit Reached
              </span>
            )}
          </div>

          {isLimitReached && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-semibold">
              Joint creation limit reached. Assigned target for this offer sheet is {targetJoints} joints.
            </div>
          )}

          <form onSubmit={handleCreateJoint} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Area System *</label>
              <select required disabled={isLimitReached} value={formData.area_system} onChange={e => handleInputChange('area_system', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">-- Select --</option>
                {areaSystems.map(a => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Coil No *</label>
              <input type="text" required disabled={isLimitReached} value={formData.coil_no} onChange={e => handleInputChange('coil_no', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tube No *</label>
              <input type="text" required disabled={isLimitReached} value={formData.tube_no} onChange={e => handleInputChange('tube_no', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Joint ID *</label>
              <input type="text" required disabled={isLimitReached} value={formData.joint_id} onChange={e => handleInputChange('joint_id', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Material Spec</label>
              <input type="text" disabled={isLimitReached} value={formData.material_spec} onChange={e => handleInputChange('material_spec', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Weld Size</label>
              <input type="text" disabled={isLimitReached} value={formData.weld_size} onChange={e => handleInputChange('weld_size', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">Welder *</label>
              <select required disabled={isLimitReached} value={formData.welder_id} onChange={e => handleInputChange('welder_id', e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">-- Select --</option>
                {welders.map(w => (
                  <option key={w.welder_id} value={w.welder_id}>{w.welder_name} ({w.welder_id})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500">PWHT Required? *</label>
              <select required disabled={isLimitReached} value={formData.pwht_required} onChange={e => handleInputChange('pwht_required', e.target.value === 'true')} className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isLimitReached} 
                className={`font-medium text-sm px-6 py-2 rounded-lg transition-colors ${
                  isLimitReached 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Add Joint
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of existing joints */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Unique Code</th>
              <th className="px-4 py-3">Area System</th>
              <th className="px-4 py-3">Coil No</th>
              <th className="px-4 py-3">Tube No</th>
              <th className="px-4 py-3">Joint ID</th>
              <th className="px-4 py-3">Welder</th>
              <th className="px-4 py-3">PWHT</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan="8" className="text-center py-6 text-slate-500">Loading...</td></tr>
            ) : joints.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-6 text-slate-500">No joints created yet.</td></tr>
            ) : (
              joints.map(j => (
                <tr key={j.unique_code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-900">{j.unique_code}</td>
                  <td className="px-4 py-3">{j.area_system}</td>
                  <td className="px-4 py-3">{j.coil_no}</td>
                  <td className="px-4 py-3">{j.tube_no}</td>
                  <td className="px-4 py-3 font-bold">{j.joint_id}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{j.welder_id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${j.pwht_required ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {j.pwht_required ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        j.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 
                        j.status === 'Rejected' ? 'bg-red-50 text-red-700' : 
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {j.status}
                      </span>
                      {j.status === 'Pending' && user.role > 1 && (
                        <>
                          <button onClick={() => handleUpdateStatus(j.unique_code, 'Approved')} className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-1 rounded font-medium transition-colors">Approve</button>
                          <button onClick={() => handleUpdateStatus(j.unique_code, 'Rejected')} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded font-medium transition-colors">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
