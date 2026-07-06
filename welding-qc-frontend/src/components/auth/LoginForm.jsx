import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../api/axiosConfig';

export default function LoginForm() {
  const { handleLoginSuccess } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123'); // Default for quick testing
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and Password are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, ...userData } = response.data;
      handleLoginSuccess(userData, accessToken);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-center text-blue-950 mb-6 font-mono tracking-tight">QA PORTAL</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Username</label>
            <input 
              type="text" required value={username} onChange={e => {setUsername(e.target.value); setErrorMsg('');}}
              className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-2 transition-colors"
              placeholder="e.g., admin, verifier, supervisor"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={e => {setPassword(e.target.value); setErrorMsg('');}}
              className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-2 transition-colors"
            />
          </div>
          
          {errorMsg && (
            <div className="text-red-600 text-sm font-medium pt-1 animate-pulse">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors mt-4 flex justify-center items-center ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Authenticate Access'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}