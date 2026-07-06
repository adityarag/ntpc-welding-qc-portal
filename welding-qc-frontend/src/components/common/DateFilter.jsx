import React from 'react';

export default function DateFilter({ fromDate, toDate, setFromDate, setToDate, onSearch, onReset }) {
  const applyQuickFilter = (days) => {
    const to = new Date().toISOString().split('T')[0];
    let from = '';
    if (days === 0) {
      from = to;
    } else {
      const d = new Date();
      d.setDate(d.getDate() - days);
      from = d.toISOString().split('T')[0];
    }
    setFromDate(from);
    setToDate(to);
    onSearch(from, to);
  };

  const applyQuickMonths = (months) => {
    const to = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    const from = d.toISOString().split('T')[0];
    setFromDate(from);
    setToDate(to);
    onSearch(from, to);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 text-slate-700"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 text-slate-700"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSearch(fromDate, toDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Search
          </button>
          <button
            onClick={onReset}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Filters:</span>
        <button
          onClick={() => applyQuickFilter(0)}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
        >
          Today
        </button>
        <button
          onClick={() => applyQuickFilter(7)}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
        >
          Last 7 Days
        </button>
        <button
          onClick={() => applyQuickFilter(30)}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
        >
          Last 30 Days
        </button>
        <button
          onClick={() => applyQuickMonths(3)}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
        >
          Last 3 Months
        </button>
        <button
          onClick={() => applyQuickFilter(365)}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
        >
          Last 1 Year
        </button>
      </div>
    </div>
  );
}
