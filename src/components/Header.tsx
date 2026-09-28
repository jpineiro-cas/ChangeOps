import React from 'react';
import { DashboardView } from '../types/change';
import {
  Upload,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  overdueCount: number;
  upcomingCount: number;
  onOpenImport: () => void;
  onResetSampleData: () => void;
  onExportData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  overdueCount,
  upcomingCount,
  onOpenImport,
  onResetSampleData,
  onExportData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark & Read-only badge */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              ChangeOps
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Read-Only Mirror</span>
            </span>
            <span className="hidden lg:inline-block text-xs text-slate-400">
              CAB Observability
            </span>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onViewChange('overview')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === 'overview'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onViewChange('calendar')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === 'calendar'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => onViewChange('upcoming')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'upcoming'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Upcoming</span>
              {upcomingCount > 0 && (
                <span className="text-xs font-mono text-slate-600 tabular-nums">
                  ({upcomingCount})
                </span>
              )}
            </button>
            <button
              onClick={() => onViewChange('overdue')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentView === 'overdue'
                  ? 'text-rose-700 border-b-2 border-rose-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Overdue & Needs Action</span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center text-xs font-mono text-rose-600 font-semibold tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 mr-0.5 inline" />
                  {overdueCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === 'table'
                  ? 'text-slate-950 border-b-2 border-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Changes
            </button>
          </nav>

          {/* Sync / Import Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              title="Import fresh tickets export from your ticketing system"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Sync / Import Data</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-2">
          {(['overview', 'calendar', 'upcoming', 'overdue', 'table'] as DashboardView[]).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded ${
                currentView === view
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {view === 'overview' && 'Overview'}
              {view === 'calendar' && 'Calendar'}
              {view === 'upcoming' && `Upcoming (${upcomingCount})`}
              {view === 'overdue' && `Overdue (${overdueCount})`}
              {view === 'table' && 'All Changes'}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
