import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast.isVisible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000); // Auto hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [toast.isVisible, hideToast]);

  if (!toast.isVisible) return null;

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600'
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center shadow-lg rounded-lg overflow-hidden animate-fade-in-down transition-all transform duration-300 min-w-[300px] max-w-md">
      <div className={`${bgColors[toast.type]} w-2 h-full absolute left-0`}></div>
      <div className="bg-white border border-slate-200 p-4 pl-6 flex-1 flex justify-between items-start">
        <div className="mr-4">
          <p className={`font-semibold text-sm ${
            toast.type === 'error' ? 'text-red-700' :
            toast.type === 'success' ? 'text-green-700' :
            toast.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
          }`}>
            {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
          </p>
          <p className="text-slate-600 text-sm mt-1">{toast.message}</p>
        </div>
        <button 
          onClick={hideToast}
          className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
