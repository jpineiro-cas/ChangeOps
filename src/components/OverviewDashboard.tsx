import React, { useMemo } from 'react';
import { ChangeTicket, DashboardView } from '../types/change';
import { MetricCards } from './MetricCards';
import { ConflictAlertBanner } from './ConflictAlertBanner';
import { detectConflicts, analyzeOverdue, parseDate, getRelativeTimeString } from '../utils/dateUtils';
import {
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  PowerOff,
  CheckCircle,
} from 'lucide-react';

interface OverviewDashboardProps {
  tickets: ChangeTicket[];
  referenceDate: Date;
  onSelectView: (view: DashboardView) => void;
  onSelectTicket: (ticket: ChangeTicket) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  tickets,
  referenceDate,
  onSelectView,
  onSelectTicket,
}) => {
  const conflicts = useMemo(() => detectConflicts(tickets), [tickets]);

  // Overdue items
  const overdueItems = useMemo(() => {
    return tickets
      .map((t) => analyzeOverdue(t, referenceDate))
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .slice(0, 4); // top 4 urgent
  }, [tickets, referenceDate]);

  // Next up (next 48h)
  const now = referenceDate.getTime();
  const next48h = now + 48 * 60 * 60 * 1000;

  const nextUpcoming = useMemo(() => {
    return tickets
      .filter((t) => {
        if (t.status === 'Closed' || t.status === 'Cancelled' || t.status === 'Rejected') return false;
        const start = parseDate(t.startTime);
        if (!start) return false;
        return start.getTime() >= now && start.getTime() <= next48h;
      })
      .sort((a, b) => {
        const da = parseDate(a.startTime)?.getTime() || 0;
        const db = parseDate(b.startTime)?.getTime() || 0;
        return da - db;
      })
      .slice(0, 5);
  }, [tickets, now, next48h]);

  // Classification Breakdown
  const classificationCounts = useMemo(() => {
    const counts = { Standard: 0, Normal: 0, Major: 0, Emergency: 0 };
    tickets.forEach((t) => {
      if (t.status !== 'Closed' && t.status !== 'Cancelled') {
        if (counts[t.classification] !== undefined) {
          counts[t.classification]++;
        }
      }
    });
    return counts;
  }, [tickets]);

  // Admin Group Breakdown
  const adminGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      if (t.status !== 'Closed' && t.status !== 'Cancelled') {
        counts[t.adminGroup] = (counts[t.adminGroup] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <MetricCards
        tickets={tickets}
        referenceDate={referenceDate}
        onSelectView={onSelectView}
      />

      {/* Collision Alerts */}
      <ConflictAlertBanner
        conflicts={conflicts}
        onSelectTicket={onSelectTicket}
      />

      {/* 2-Column Split: Overdue Triage & Imminent Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Overdue & Action Needed */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Action Required / Overdue Tickets
              </h3>
            </div>
            <button
              onClick={() => onSelectView('overdue')}
              className="text-xs text-rose-700 hover:text-rose-900 font-medium inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {overdueItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
              <p className="font-medium text-slate-700">No overdue changes</p>
              <p>All active work is progressing according to schedule windows.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueItems.map(({ ticket, message, severity }) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-xs space-y-1.5 ${
                    severity === 'critical'
                      ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                      : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">
                      {ticket.ticketNumber}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Status: {ticket.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {ticket.title}
                  </h4>

                  <p className="text-[11px] text-rose-800">
                    {message}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                    <span>Process Manager: <strong className="text-slate-700 font-medium">{ticket.processManager}</strong></span>
                    <span>Team: {ticket.adminGroup}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Coming Up in Next 48 Hours */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Imminent Changes (Next 48 Hours)
              </h3>
            </div>
            <button
              onClick={() => onSelectView('upcoming')}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium inline-flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {nextUpcoming.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="font-medium text-slate-700">No changes in next 48 hours</p>
              <p>Check the full Change Calendar for upcoming maintenance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nextUpcoming.map((ticket) => {
                const rel = getRelativeTimeString(ticket.startTime, referenceDate);
                const hasDowntime = ticket.expectedDowntime.toLowerCase().includes('y');

                return (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {ticket.ticketNumber}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          ticket.classification === 'Emergency' ? 'bg-rose-100 text-rose-800' :
                          ticket.classification === 'Major' ? 'bg-purple-100 text-purple-800' :
                          ticket.classification === 'Standard' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.classification}
                        </span>
                      </div>
                      <span className="font-mono text-blue-700 font-semibold text-xs">
                        {rel.text}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-slate-900 line-clamp-1">
                      {ticket.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div>
                        <span>Lead: </span>
                        <span className="font-medium text-slate-800">{ticket.processManager}</span>
                      </div>
                      {hasDowntime ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                          <PowerOff className="w-3 h-3" />
                          <span>Downtime: {ticket.expectedDowntime}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">No downtime</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Distribution Analytics: Classification & Admin Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Changes by Classification */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Active Changes by Risk Classification
          </h4>

          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Standard</span>
              <span className="text-xl font-bold font-mono text-emerald-900 tabular-nums">
                {classificationCounts.Standard}
              </span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Pre-authorized</span>
            </div>
            <div className="p-2.5 rounded bg-blue-50 border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Normal</span>
              <span className="text-xl font-bold font-mono text-blue-900 tabular-nums">
                {classificationCounts.Normal}
              </span>
              <span className="text-[10px] text-blue-700 block mt-0.5">CAB approved</span>
            </div>
            <div className="p-2.5 rounded bg-purple-50 border border-purple-100">
              <span className="text-[10px] uppercase font-bold text-purple-800 block">Major</span>
              <span className="text-xl font-bold font-mono text-purple-900 tabular-nums">
                {classificationCounts.Major}
              </span>
              <span className="text-[10px] text-purple-700 block mt-0.5">High impact</span>
            </div>
            <div className="p-2.5 rounded bg-rose-50 border border-rose-100">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Emergency</span>
              <span className="text-xl font-bold font-mono text-rose-900 tabular-nums">
                {classificationCounts.Emergency}
              </span>
              <span className="text-[10px] text-rose-700 block mt-0.5">Expedited</span>
            </div>
          </div>
        </div>

        {/* Changes by Admin Group */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            Active Volume by Admin Group
          </h4>

          <div className="space-y-2 text-xs">
            {adminGroupCounts.map(([group, count]) => (
              <div key={group} className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">{group}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 sm:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-700 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (count / tickets.length) * 200)}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
