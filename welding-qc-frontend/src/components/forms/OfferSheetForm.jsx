import React, { useState } from 'react';

export default function OfferSheetForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    joint_id: '',
    area_system: '',
    coil_no: '',
    tube_no: '',
    material_spec: '',
    weld_size: '',
    welder_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Appends the client-side system date stamp right before dropping down into the API stream
    onSubmit({ 
      ...formData, 
      date: new Date().toISOString().split('T')[0] 
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Explicit form data metadata to generate clean UI labels dynamically
  const formFields = [
    { id: 'joint_id', label: 'Joint ID', placeholder: 'E.g., J101', required: true },
    { id: 'area_system', label: 'Area System', placeholder: 'E.g., A1', required: true },
    { id: 'coil_no', label: 'Coil Number', placeholder: 'E.g., C04', required: false },
    { id: 'tube_no', label: 'Tube Number', placeholder: 'E.g., T12', required: false },
    { id: 'material_spec', label: 'Material Spec', placeholder: 'E.g., A335 P22', required: true },
    { id: 'weld_size', label: 'Weld Size', placeholder: 'E.g., 2.0"', required: true },
    { id: 'welder_id', label: 'Assigned Welder ID', placeholder: 'E.g., W-02', required: true },
  ];

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6">
      {/* Structural Subform Header Element */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Register Structural Joint parameters</h3>
          <p className="text-xs text-slate-500">Ensure dimensional measurements are logged accurately.</p>
        </div>
        <button 
          type="button"
          onClick={onCancel} 
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded transition-all flex items-center space-x-1"
        >
          <span>← Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dynamic Multi-column Layout Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {formFields.map((field) => (
            <div key={field.id} className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                required={field.required}
                value={formData[field.id]} 
                placeholder={field.placeholder}
                onChange={e => handleInputChange(field.id, e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white shadow-inner/sm transition-all"
              />
            </div>
          ))}
        </div>

        {/* Action Controls Panel Layout */}
        <div className="flex justify-end items-center space-x-2 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Commit Record
          </button>
        </div>
      </form>
    </div>
  );
}