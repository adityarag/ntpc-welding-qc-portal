import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../api/axiosConfig';

export default function RtSubmissionsTab() {
  const { showToast, refreshTrigger } = useApp();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [refreshTrigger]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/rt/submissions');
      setSubmissions(response.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (batchId) => {
    try {
      showToast(`Generating PDF for ${batchId}...`, 'info');
      const response = await api.get(`/rt/submissions/${batchId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${batchId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download PDF.', 'error');
    }
  };

  // Group submissions by supervisor_name
  const groupedSubmissions = submissions.reduce((groups, item) => {
    const supervisor = item.supervisor_name || 'UNKNOWN SUPERVISOR';
    if (!groups[supervisor]) {
      groups[supervisor] = [];
    }
    groups[supervisor].push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">RT Submissions Registry</h1>
        <p className="text-sm text-slate-500">View and download supervisor radiography report batches.</p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
          Loading submission batches...
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-semibold text-slate-500">No RT submission batches found.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedSubmissions).map((supervisorName) => (
            <div key={supervisorName} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Supervisor Header Banner */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-sm">
                    {supervisorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Supervisor: {supervisorName}
                    </h2>
                    <p className="text-xs text-slate-400">Active submission registry</p>
                  </div>
                </div>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                  {groupedSubmissions[supervisorName].length} Batches
                </span>
              </div>

              {/* Batches Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold tracking-wide text-xs uppercase">
                      <th className="px-6 py-3">Batch ID</th>
                      <th className="px-6 py-3">Offer Sheet ID</th>
                      <th className="px-6 py-3">Submission Date & Time</th>
                      <th className="px-6 py-3">Total Welds</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {groupedSubmissions[supervisorName].map((batch) => (
                      <tr key={batch.submission_batch_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-mono font-bold text-blue-900">
                          {batch.submission_batch_id}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 font-semibold">
                          {batch.offer_sheet_id}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                          {new Date(batch.submitted_at).toLocaleDateString()} {new Date(batch.submitted_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 font-bold">
                          {batch.weld_count} Welds
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            batch.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            batch.status === 'IN PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDownloadPdf(batch.submission_batch_id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors inline-flex items-center space-x-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
