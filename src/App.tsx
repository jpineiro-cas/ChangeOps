import React, { useState, useEffect } from 'react';
import { ChangeTicket, DashboardView } from './types/change';
import { SAMPLE_CHANGE_TICKETS } from './data/sampleChanges';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ChangeCalendar } from './components/ChangeCalendar';
import { UpcomingChangesView } from './components/UpcomingChangesView';
import { OverdueChangesView } from './components/OverdueChangesView';
import { ChangeTableView } from './components/ChangeTableView';
import { ChangeDetailModal } from './components/ChangeDetailModal';
import { ImportModal } from './components/ImportModal';
import { SourceOfTruthBanner } from './components/SourceOfTruthBanner';
import { analyzeOverdue, parseDate } from './utils/dateUtils';
import { exportTicketsToCSV, downloadFile } from './utils/csvHelper';
import { RotateCcw, Download } from 'lucide-react';

const STORAGE_KEY = 'changeops_tickets_v1';
const LAST_SYNC_KEY = 'changeops_last_sync_v1';

export default function App() {
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setReferenceDate(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Tickets state with localStorage persistence
  const [tickets, setTickets] = useState<ChangeTicket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tickets from local storage', e);
    }
    return SAMPLE_CHANGE_TICKETS;
  });

  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem(LAST_SYNC_KEY) || 'Sep 28, 2026 06:24 AM (Initial Export)';
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to persist tickets', e);
    }
  }, [tickets]);

  // Current view state
  const [currentView, setCurrentView] = useState<DashboardView>('overview');

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<ChangeTicket | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Overdue count
  const overdueCount = tickets
    .map((t) => analyzeOverdue(t, referenceDate))
    .filter((a): a is NonNullable<typeof a> => a !== null).length;

  // Upcoming count (non-terminal changes starting at or after the current time)
  const now = referenceDate.getTime();
  const upcomingCount = tickets.filter((t) => {
    if (t.status === 'Closed' || t.status === 'Cancelled' || t.status === 'Rejected') return false;
    const start = parseDate(t.startTime);
    if (!start) return false;
    return start.getTime() >= now;
  }).length;

  const handleImportTickets = (
    imported: ChangeTicket[],
    mode: 'replace' | 'append'
  ) => {
    if (mode === 'replace') {
      setTickets(imported);
    } else {
      // deduplicate by ticketNumber if appending
      setTickets((prev) => {
        const existingNumbers = new Set(prev.map((t) => t.ticketNumber.toLowerCase()));
        const newItems = imported.filter((t) => !existingNumbers.has(t.ticketNumber.toLowerCase()));
        return [...newItems, ...prev];
      });
    }
    const nowStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastSyncTime(nowStr);
    localStorage.setItem(LAST_SYNC_KEY, nowStr);
  };

  const handleResetSampleData = () => {
    if (confirm('Reset dashboard to default ITIL sample data? This will restore sample changes.')) {
      setTickets(SAMPLE_CHANGE_TICKETS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleExportAll = () => {
    const csv = exportTicketsToCSV(tickets);
    downloadFile(csv, `all-changes-export-${referenceDate.toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top 3-Zone Header Contract */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        overdueCount={overdueCount}
        upcomingCount={upcomingCount}
        onOpenImport={() => setIsImportModalOpen(true)}
        onResetSampleData={handleResetSampleData}
        onExportData={handleExportAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Source of Truth Banner */}
        <SourceOfTruthBanner
          lastImportTime={lastSyncTime}
          onOpenImport={() => setIsImportModalOpen(true)}
          ticketCount={tickets.length}
        />

        {/* System Status Bar */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 bg-white/70 border border-slate-200/70 px-3.5 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Operational Reference:</span>
            <span className="font-mono text-slate-900">
              {referenceDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              {referenceDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <span className="hidden sm:inline font-mono text-emerald-700 font-medium">
              Ticketing System Mirror
            </span>
            <span>{tickets.length} total change requests loaded</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSampleData}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
              title="Reload initial ITIL sample change data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample Data</span>
            </button>

            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
              title="Download CSV export of all tickets"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* View Routing */}
        {currentView === 'overview' && (
          <OverviewDashboard
            tickets={tickets}
            referenceDate={referenceDate}
            onSelectView={setCurrentView}
            onSelectTicket={setSelectedTicket}
          />
        )}

        {currentView === 'calendar' && (
          <ChangeCalendar
            tickets={tickets}
            referenceDate={referenceDate}
            onSelectTicket={setSelectedTicket}
          />
        )}

        {currentView === 'upcoming' && (
          <UpcomingChangesView
            tickets={tickets}
            referenceDate={referenceDate}
            onSelectTicket={setSelectedTicket}
          />
        )}

        {currentView === 'overdue' && (
          <OverdueChangesView
            tickets={tickets}
            referenceDate={referenceDate}
            onSelectTicket={setSelectedTicket}
          />
        )}

        {currentView === 'table' && (
          <ChangeTableView
            tickets={tickets}
            onSelectTicket={setSelectedTicket}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ChangeOps</span>
            <span>·</span>
            <span>ITIL Change Advisory Board & Release Management (Read-Only Mirror)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Fields mapped: Ticket#, Status, Active action item assignees, Title, Requested work start/end, Downtime?, Classification, Process manager (implementer), Description, Admin group, Categories, Request & Submit users.
          </div>
        </div>
      </footer>

      {/* Ticket Details Drawer / Modal */}
      <ChangeDetailModal
        ticket={selectedTicket}
        referenceDate={referenceDate}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportTickets={handleImportTickets}
      />
    </div>
  );
}
