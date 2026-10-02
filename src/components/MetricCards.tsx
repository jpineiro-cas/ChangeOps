import React from 'react';
import { ChangeTicket, DashboardView } from '../types/change';
import { analyzeOverdue, isChangeInProgress, isHighImpactChange, parseDate } from '../utils/dateUtils';
import {
  AlertCircle,
  Calendar,
  Clock,
  Activity,
  PowerOff,
  CheckCircle2,
} from 'lucide-react';

interface MetricCardsProps {
  tickets: ChangeTicket[];
  referenceDate: Date;
  onSelectView: (view: DashboardView) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  tickets,
  referenceDate,
  onSelectView,
}) => {
  const now = referenceDate.getTime();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  // Compute metrics
  const overdueList = tickets
    .map((t) => analyzeOverdue(t, referenceDate))
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const inProgressList = tickets.filter((t) => isChangeInProgress(t, referenceDate));

  const upcoming7Days = tickets.filter((t) => {
    if (t.status === 'Closed' || t.status === 'Cancelled' || t.status === 'Rejected') return false;
    const start = parseDate(t.startTime);
    if (!start) return false;
    const time = start.getTime();
    return time >= now && time <= sevenDaysFromNow;
  });

  const downtimeChanges = tickets.filter((t) => {
    if (t.status === 'Closed' || t.status === 'Cancelled' || t.status === 'Rejected') return false;
    return t.expectedDowntime.toLowerCase().includes('y');
  });

  const emergencyChanges = tickets.filter(isHighImpactChange);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Overdue & Needs Action */}
      <button
        onClick={() => onSelectView('overdue')}
        className={`text-left p-4 rounded-lg border transition-all ${
          overdueList.length > 0
            ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">Needs Action / Overdue</span>
          <AlertCircle className={`w-4 h-4 ${overdueList.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold font-mono tabular-nums ${overdueList.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {overdueList.length}
          </span>
          <span className="text-xs text-slate-500">
            {overdueList.filter((o) => o.severity === 'critical').length} critical
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Window expired or unapproved
        </p>
      </button>

      {/* 2. In Progress Right Now */}
      <button
        onClick={() => onSelectView('inProgress')}
        className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">In Progress / Change Window</span>
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {inProgressList.length}
          </span>
          <span className="text-xs text-emerald-600 font-medium">Active changes</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          In implementation or within the scheduled window
        </p>
      </button>

      {/* 3. Upcoming (Next 7 Days) */}
      <button
        onClick={() => onSelectView('upcoming')}
        className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">Coming Up (7d)</span>
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {upcoming7Days.length}
          </span>
          <span className="text-xs text-slate-500">scheduled</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Authorized & scheduled changes
        </p>
      </button>

      {/* 4. Expected Downtime */}
      <button
        onClick={() => onSelectView('calendar')}
        className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">Downtime Windows</span>
          <PowerOff className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono tabular-nums text-amber-700">
            {downtimeChanges.length}
          </span>
          <span className="text-xs text-slate-500">outage risks</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Maintenance with service impact
        </p>
      </button>

      {/* 5. Major & Emergency */}
      <button
        onClick={() => onSelectView('highImpact')}
        className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all col-span-2 md:col-span-1"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">Major / Emergency</span>
          <Clock className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {emergencyChanges.length}
          </span>
          <span className="text-xs text-purple-600 font-medium">high impact</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Require strict IT approval
        </p>
      </button>
    </div>
  );
};
