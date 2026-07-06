import React from 'react';

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = 'Confirm', // Default text fallback
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700' // Default style fallback
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop blur overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onCancel}
      />
      
      {/* Modal Surface Window */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative z-10 m-4 transform transition-all scale-100 animate-scaleUp">
        
        {/* Header Block Icon + Text */}
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title || 'Confirm Action'}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Operational Control Action Strips */}
        <div className="flex justify-end items-center space-x-2 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}