import React, { useState } from 'react';

export default function WelderForm({ onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    welder_id: initialData?.welder_id || '',
    welder_name: initialData?.welder_name || '',
    qualification: initialData?.qualification || '',
    employer: initialData?.employer || '',
    contact_number: initialData?.contact_number || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm space-y-6">
      {/* Header Matrix Block Layout */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{initialData ? 'Edit Welder Profile' : 'Add Welder Profile'}</h3>
          <p className="text-xs text-slate-500">{initialData ? 'Update human capital records in the master database.' : 'Register human capital records to the master database.'}</p>
        </div>
        <button 
          type="button"
          onClick={onCancel} 
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded transition-all"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Welder ID Field */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Welder ID <span className="text-red-500">*</span></label>
            <input 
              type="text" required placeholder="E.g., W-99"
              value={formData.welder_id} onChange={e => handleInputChange('welder_id', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Full Name Field */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name <span className="text-red-500">*</span></label>
            <input 
              type="text" required placeholder="John Doe"
              value={formData.welder_name} onChange={e => handleInputChange('welder_name', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Certifications / Qualification Level */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Qualifications</label>
            <input 
              type="text" placeholder="E.g., ASME Section IX (6G)"
              value={formData.qualification} onChange={e => handleInputChange('qualification', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Employer Subcontractor Label */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employer / Subcontractor</label>
            <input 
              type="text" placeholder="E.g., Apex Piping Ltd"
              value={formData.employer} onChange={e => handleInputChange('employer', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Direct Communication Node Link */}
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Number</label>
            <input 
              type="tel" placeholder="+91 XXXXX XXXXX"
              value={formData.contact_number} onChange={e => handleInputChange('contact_number', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Long-form Notes Field */}
          <div className="flex flex-col space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes / Medical / Performance Logs</label>
            <textarea 
              rows={3} placeholder="Add specific tracking annotations, stamp expiration dates or comments..."
              value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)}
              className="border border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white resize-none transition-all"
            />
          </div>
        </div>

        {/* Dynamic Action Trigger Strip Panel */}
        <div className="flex justify-end items-center space-x-2 pt-4 border-t border-slate-100 mt-4">
          <button 
            type="button" onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}