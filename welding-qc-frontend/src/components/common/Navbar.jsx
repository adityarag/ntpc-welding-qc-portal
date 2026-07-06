import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Navbar() {
  const { user, handleLogout } = useApp();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
      {/* This left section is now empty, pushing all user profile elements cleanly to the right side */}
      <div className="flex items-center space-x-4">
        {/* SYS_NODE_OK block has been successfully removed */}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{user?.username || 'Operator'}</p>
          <p className="text-xs text-blue-600 font-medium">Auth Level {user?.role || 1}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-medium text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    </header>
  );
}