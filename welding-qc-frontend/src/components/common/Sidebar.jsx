import React from 'react';
import { useApp } from '../../context/AppContext';
import companyLogo from '../../assets/NTPC_logo.png';

export default function Sidebar() {
  const { activeTab, setActiveTab, user } = useApp();
  
  // Define menu items based on roles
  let menuItems = ['Offer Sheet', 'Welds', 'PWHT', 'RT', 'PAUT', 'MPI'];
  
  // Admin sees everything
  if (user?.role === 3) {
    menuItems = [...menuItems, 'Welders', 'Supervisors', 'Users', 'Reports', 'Area Systems', 'RT Submissions'];
  } else if (user?.role === 1) {
    menuItems = [...menuItems, 'Area Systems'];
  } else if (user?.role === 2) {
    // Verifier might need reports? Assuming verifier doesn't see Users/Supervisors.
    menuItems = [...menuItems, 'Reports', 'RT Submissions'];
  }

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm">
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <img 
            src={companyLogo} 
            alt="Company Logo" 
            className="h-9 w-auto object-contain max-w-[180px]" 
          />
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map(item => {
            const isActive = activeTab === item;
            return (
              <button
                key={item} onClick={() => setActiveTab(item)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-3' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item}
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="text-xs text-slate-400 font-mono">Status: Connected ({user?.username})</div>
      </div>
    </div>
  );
}