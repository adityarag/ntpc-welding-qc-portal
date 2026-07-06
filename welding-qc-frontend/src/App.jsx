import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginForm from './components/auth/LoginForm';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import OfferSheetTab from './components/tabs/OfferSheetTab';
import WeldsTab from './components/tabs/WeldsTab';
import NdtTab from './components/tabs/NdtTab';
import WeldersTab from './components/tabs/WeldersTab';
import PwhtTab from './components/tabs/PwhtTab.jsx';
import SupervisorsTab from './components/tabs/SupervisorsTab.jsx';
import UsersTab from './components/tabs/UsersTab.jsx';
import ReportsTab from './components/tabs/ReportsTab.jsx';
import RtTab from './components/tabs/RtTab.jsx';
import AreaSystemsTab from './components/tabs/AreaSystemsTab.jsx';
import RtSubmissionsTab from './components/tabs/RtSubmissionsTab.jsx';
import Toast from './components/common/Toast';

const MainLayout = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {activeTab === 'Offer Sheet' && <OfferSheetTab />}
          {activeTab === 'Welds' && <WeldsTab />}
          {activeTab === 'PWHT' && <PwhtTab />} 
          {activeTab === 'RT' && <RtTab />}
          {['PAUT', 'MPI'].includes(activeTab) && <NdtTab type={activeTab} />}
          {activeTab === 'Welders' && <WeldersTab />}
          {activeTab === 'Supervisors' && <SupervisorsTab />}
          {activeTab === 'Reports' && <ReportsTab />}
          {activeTab === 'Users' && <UsersTab />}
          {activeTab === 'Area Systems' && <AreaSystemsTab />}
          {activeTab === 'RT Submissions' && <RtSubmissionsTab />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const AppContent = () => {
  const { user } = useApp();
  return (
    <>
      <Toast />
      {user ? <MainLayout /> : <LoginForm />}
    </>
  );
};