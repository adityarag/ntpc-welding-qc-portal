import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axiosConfig';
import ntpcLogoB64 from '../../assets/ntpcLogoB64.js';
import DateFilter from '../common/DateFilter';

// ─── Report catalogue ───────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  {
    id: 'core',
    label: '📋 Core Reports',
    color: 'blue',
    reports: [
      {
        id: 'offer-sheets', endpoint: '/reports/offer-sheets',
        name: 'Offer Sheet Master Log',
        desc: 'All offer sheets with supervisor details, target joints, created joints, completion %.',
        icon: '📄', accent: '#2563eb'
      },
      {
        id: 'joints', endpoint: '/reports/joints',
        name: 'Joints Master Log',
        desc: 'Complete registry of all joints with welder, supervisor, area system, and status.',
        icon: '🔩', accent: '#7c3aed'
      },
      {
        id: 'rt-evaluation', endpoint: '/reports/rt-evaluation',
        name: 'RT Evaluation Summary',
        desc: 'All RT attempts with evaluation status, defect classification, verifier and offer date.',
        icon: '🔬', accent: '#dc2626'
      },
      {
        id: 'pwht-progress', endpoint: '/reports/pwht-progress',
        name: 'PWHT Progress Report',
        desc: 'PWHT records with chart number, hardness, status, remark number and verifier.',
        icon: '🔥', accent: '#d97706'
      }
    ]
  },
  {
    id: 'performance',
    label: '📊 Performance',
    color: 'emerald',
    reports: [
      {
        id: 'supervisor-performance', endpoint: '/reports/supervisor-performance',
        name: 'Supervisor Performance',
        desc: 'Offer sheets assigned, joints created, RT pass/fail counts and completion rate per supervisor.',
        icon: '👷', accent: '#059669'
      },
      {
        id: 'welder-performance', endpoint: '/reports/welder-performance',
        name: 'Welder Performance',
        desc: 'Total welds, RT pass/fail, repairs required and success rate per welder.',
        icon: '⚡', accent: '#0891b2'
      },
      {
        id: 'verifier-activity', endpoint: '/reports/verifier-activity',
        name: 'Verifier Activity Report',
        desc: 'RT and PWHT verifications done per verifier for accountability tracking.',
        icon: '✅', accent: '#7c3aed'
      }
    ]
  },
  {
    id: 'lifecycle',
    label: '🔄 Lifecycle & Analysis',
    color: 'orange',
    reports: [
      {
        id: 'joint-lifecycle', endpoint: '/reports/joint-lifecycle',
        name: 'Joint Lifecycle Tracking',
        desc: 'Full journey of every joint: Created → RT1 → RT2 → RT3 → PWHT → PAUT → MPI → Final.',
        icon: '🗺️', accent: '#ea580c'
      },
      {
        id: 'pending-work', endpoint: '/reports/pending-work',
        name: 'Pending Work Report',
        desc: 'All pending RT, PWHT, PAUT and MPI across the system. Identifies bottlenecks.',
        icon: '⏳', accent: '#ca8a04'
      },
      {
        id: 'failure-analysis', endpoint: '/reports/failure-analysis',
        name: 'Failure Analysis Report',
        desc: 'Defect classification frequency analysis — most common defects, failure hotspots.',
        icon: '⚠️', accent: '#dc2626'
      }
    ]
  },
  {
    id: 'overview',
    label: '🌐 Project Overview',
    color: 'purple',
    reports: [
      {
        id: 'area-system', endpoint: '/reports/area-system',
        name: 'Area System Report',
        desc: 'Completion %, RT failures and PWHT pending grouped by area system.',
        icon: '🗂️', accent: '#9333ea'
      },
      {
        id: 'productivity', endpoint: '/reports/productivity',
        name: 'Daily / Weekly Productivity',
        desc: 'Joints created, RT done, PWHT done, PAUT, MPI tracked daily or weekly.',
        icon: '📈', accent: '#2563eb'
      },
      {
        id: 'project-summary', endpoint: '/reports/project-summary',
        name: 'Final Project Summary',
        desc: 'Management-level KPIs: completion rate, RT pass/fail rate, avg completion time.',
        icon: '🏆', accent: '#059669'
      }
    ]
  }
];

// ─── KPI card config ────────────────────────────────────────────────────────
const KPI_CONFIG = [
  { key: 'totalJoints',     label: 'Total Welds',      color: '#2563eb', bg: '#eff6ff', suffix: '' },
  { key: 'rtClearanceRate', label: 'RT Pass Rate',      color: '#059669', bg: '#f0fdf4', suffix: '%' },
  { key: 'totalSupervisors',label: 'Supervisors',       color: '#7c3aed', bg: '#f5f3ff', suffix: '' },
  { key: 'totalWelders',    label: 'Welders',           color: '#0891b2', bg: '#ecfeff', suffix: '' },
  { key: 'pwhtCount',       label: 'PWHT Required',     color: '#d97706', bg: '#fffbeb', suffix: '' },
  { key: 'pwhtPending',     label: 'PWHT Pending',      color: '#64748b', bg: '#f8fafc', suffix: '' },
  { key: 'pwhtInProgress',  label: 'PWHT In Progress',  color: '#2563eb', bg: '#eff6ff', suffix: '' },
  { key: 'pwhtCompleted',   label: 'PWHT Completed',    color: '#059669', bg: '#f0fdf4', suffix: '' },
];

// ─── PDF builder ─────────────────────────────────────────────────────────────
const buildPdf = (reportName, summary, data, extraNote = '') => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const PW = 10; // page padding

  // ── Header gradient band ──
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, W, 28, 'F');

  // NTPC Logo
  try {
    doc.addImage('data:image/png;base64,' + ntpcLogoB64.trim(), 'PNG', PW, 3, 32, 22);
  } catch (_) { /* skip if logo fails */ }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('NTPC Welding QC Portal', 48, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(reportName, 48, 19);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 48, 25);

  // ── Summary section ──
  let y = 36;
  if (summary && Object.keys(summary).length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(PW, y, W - PW * 2, 14, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);

    const entries = Object.entries(summary);
    const cellW = (W - PW * 2) / entries.length;
    entries.forEach(([k, v], i) => {
      const cx = PW + i * cellW + cellW / 2;
      doc.setTextColor(100, 116, 139);
      doc.text(k.replace(/_/g, ' ').toUpperCase(), cx, y + 5, { align: 'center' });
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(String(v), cx, y + 11, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
    });
    y += 20;
  }

  if (extraNote) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text(extraNote, PW, y);
    y += 5;
  }

  // ── Data table ──
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    const rows = data.map(r => headers.map(h => {
      const v = r[h];
      return v === null || v === undefined ? '' : String(v);
    }));

    autoTable(doc, {
      head: [headers.map(h => h.replace(/_/g, ' ').toUpperCase())],
      body: rows,
      startY: y,
      styles: { fontSize: 6.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: {
        fillColor: [17, 24, 39], textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 7
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      rowPageBreak: 'auto',
      margin: { left: PW, right: PW },
      didDrawPage: (data) => {
        // Footer with page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `NTPC Welding QC Portal | ${reportName} | Page ${data.pageNumber} of ${pageCount}`,
          W / 2, doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }
    });
  }

  const filename = `NTPC_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// ─── Excel builder ────────────────────────────────────────────────────────────
const buildExcel = (reportName, summary, data, extraSheets = []) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  if (summary && Object.keys(summary).length > 0) {
    const summaryRows = Object.entries(summary).map(([k, v]) => ({
      Metric: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      Value: v
    }));
    const ws = XLSX.utils.json_to_sheet(summaryRows);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  }

  // Main data sheet
  if (data && data.length > 0) {
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-width
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map(k => ({
      wch: Math.max(k.length + 4, ...data.map(r => String(r[k] || '').length + 2), 10)
    }));
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
  }

  // Any extra sheets (e.g. grouped defect data)
  extraSheets.forEach(({ name, rows }) => {
    if (rows && rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      const keys = Object.keys(rows[0]);
      ws['!cols'] = keys.map(k => ({
        wch: Math.max(k.length + 4, ...rows.map(r => String(r[k] || '').length + 2), 10)
      }));
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
    }
  });

  XLSX.writeFile(wb, `NTPC_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsTab() {
  const { showToast, refreshTrigger, user } = useApp();
  const [kpis, setKpis] = useState({
    totalJoints: 0, totalWelders: 0, totalSupervisors: 0,
    rtClearanceRate: 0, pwhtCount: 0, pwhtPending: 0,
    pwhtInProgress: 0, pwhtCompleted: 0
  });
  const [activeCategory, setActiveCategory] = useState('core');
  const [exportingId, setExportingId] = useState(null);
  const [summaryCache, setSummaryCache] = useState({});
  const [loadingSummary, setLoadingSummary] = useState({});
  const [productivityPeriod, setProductivityPeriod] = useState('daily');
  // Date filter state (available to Admin & Verifier)
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickFilter, setQuickFilter] = useState('');

  // Date filter handlers
  const handleDateSearch = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    // Clear cached summaries so they re-fetch with new date range
    setSummaryCache({});
  };

  const handleDateReset = () => {
    setDateFrom('');
    setDateTo('');
    setSummaryCache({});
  };

  useEffect(() => { fetchKPIs(); }, [refreshTrigger]);

  const fetchKPIs = async () => {
    try {
      const res = await api.get('/dashboard/kpi');
      setKpis(res.data);
    } catch (_) {}
  };

  // Pre-fetch summary for a report when its card mounts
  const fetchSummary = useCallback(async (report) => {
    if (summaryCache[report.id] || loadingSummary[report.id]) return;
    setLoadingSummary(p => ({ ...p, [report.id]: true }));
    try {
      const baseParams = report.id === 'productivity' ? { period: productivityPeriod, days: 30 } : {};
      const dateParams = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : {};
      const params = { ...baseParams, ...dateParams };
      const res = await api.get(report.endpoint, { params });
      setSummaryCache(p => ({ ...p, [report.id]: res.data.summary }));
    } catch (_) {}
    finally { setLoadingSummary(p => ({ ...p, [report.id]: false })); }
  }, [summaryCache, loadingSummary, productivityPeriod, dateFrom, dateTo]);

  const handleExport = async (report, type) => {
    setExportingId(report.id + '-' + type);
    try {
      const baseParams = report.id === 'productivity' ? { period: productivityPeriod, days: 30 } : {};
      const dateParams = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : {};
      const params = { ...baseParams, ...dateParams };
      const res = await api.get(report.endpoint, { params });
      const { summary, data, grouped } = res.data;

      if ((!data || data.length === 0) && !summary) {
        showToast('No data available for this report.', 'error');
        return;
      }

      if (type === 'pdf') {
        buildPdf(report.name, summary, data || []);
      } else {
        const extraSheets = grouped ? [{ name: 'Defect Groups', rows: grouped }] : [];
        buildExcel(report.name, summary, data || [], extraSheets);
      }
      showToast(`${report.name} exported successfully!`, 'success');
    } catch (err) {
      showToast('Export failed. Check server connection.', 'error');
    } finally {
      setExportingId(null);
    }
  };

  const activeCategory$ = REPORT_CATEGORIES.find(c => c.id === activeCategory);

  const fmtKey = k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      {(user?.role === 2 || user?.role === 3) && (
        <DateFilter
          fromDate={dateFrom}
          toDate={dateTo}
          setFromDate={setDateFrom}
          setToDate={setDateTo}
          onSearch={handleDateSearch}
          onReset={handleDateReset}
        />
      )}
      <div className="space-y-6 pb-10">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">📊</span>
            <h1 className="text-2xl font-black tracking-tight">Enterprise Reporting Hub</h1>
          </div>
          <p className="text-slate-300 text-sm ml-12">
            Complete project intelligence — 13 reports covering joints, RT, PWHT, PAUT, MPI, supervisors, welders & lifecycle tracking.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {KPI_CONFIG.map(k => (
            <div
              key={k.key}
              className="rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col transition-transform hover:-translate-y-0.5"
              style={{ background: k.bg }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: k.color, opacity: 0.75 }}>
                {k.label}
              </span>
              <span className="text-2xl font-black mt-1" style={{ color: k.color }}>
                {kpis[k.key]}{k.suffix}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {REPORT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {activeCategory === 'overview' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">Productivity Period:</span>
            {['daily', 'weekly'].map(p => (
              <button
                key={p}
                onClick={() => {
                  setProductivityPeriod(p);
                  setSummaryCache(prev => { const n = { ...prev }; delete n['productivity']; return n; });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  productivityPeriod === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {activeCategory$.reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              summary={summaryCache[report.id]}
              loading={loadingSummary[report.id]}
              exportingId={exportingId}
              onMount={() => fetchSummary(report)}
              onExport={handleExport}
              fmtKey={fmtKey}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, summary, loading, exportingId, onMount, onExport, fmtKey }) {
  useEffect(() => { onMount(); }, [report.id]);

  const isPdfExporting = exportingId === report.id + '-pdf';
  const isXlsExporting = exportingId === report.id + '-excel';
  const anyExporting = !!exportingId;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
      style={{ borderTop: `3px solid ${report.accent}` }}
    >
      {/* Card header */}
      <div className="p-5 flex-1">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{report.icon}</span>
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">{report.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{report.desc}</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          {loading ? (
            <div className="flex gap-2 items-center">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
              <span className="text-xs text-slate-400">Loading stats…</span>
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(summary).slice(0, 4).map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase leading-none truncate">{fmtKey(k)}</div>
                  <div className="text-base font-black text-slate-800 mt-0.5" style={{ color: report.accent }}>{String(v)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Stats unavailable</p>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onExport(report, 'pdf')}
          disabled={anyExporting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-semibold text-xs px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPdfExporting ? (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-red-300 border-t-red-700 animate-spin" />
          ) : '📥'}
          PDF
        </button>
        <button
          onClick={() => onExport(report, 'excel')}
          disabled={anyExporting}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isXlsExporting ? (
            <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-300 border-t-emerald-700 animate-spin" />
          ) : '📊'}
          Excel
        </button>
      </div>
    </div>
  );
}
