import React from 'react';

/**
 * @param {Array} columns - Schema defining array: [{ header: 'Joint ID', accessor: 'joint_id', render: (val) => ... }]
 * @param {Array} data - Parsed array of rows from FastAPI
 * @param {boolean} loading - State boolean triggering skeleton animation matrices
 */
export default function DataTable({ columns, data, loading = false, onRowClick }) {
  if (loading) {
    return (
      <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm p-8 space-y-4">
        <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold tracking-wide text-xs uppercase">
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 font-semibold">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No matching records found in system partition.</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`hover:bg-blue-50/40 transition-colors duration-150 odd:bg-white even:bg-slate-50/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIndex) => {
                    // Extract data from standard key accessor or parse through customized markup renders
                    const cellValue = row[col.accessor];
                    return (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap align-middle">
                        {col.render ? col.render(cellValue, row) : cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}