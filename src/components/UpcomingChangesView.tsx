import React, { useState, useMemo } from 'react';
import { ChangeTicket } from '../types/change';
import {
  parseDate,
  formatDateTime,
  getRelativeTimeString,
} from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  User,
  PowerOff,
  ChevronRight,
  Layers,
  Lock,
} from 'lucide-react';

interface UpcomingChangesViewProps {
  tickets: ChangeTicket[];
  referenceDate: Date;
  onSelectTicket: (ticket: ChangeTicket) => void;
}

export const UpcomingChangesView: React.FC<UpcomingChangesViewProps> = ({
  tickets,
  referenceDate,
  onSelectTicket,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterDowntimeOnly, setFilterDowntimeOnly] = useState<boolean>(false);

  const now = referenceDate.getTime();

  // Filter only upcoming and active scheduled changes
  const upcomingTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (
          t.status === 'Closed' ||
          t.status === 'Cancelled' ||
          t.status === 'Rejected'
        ) {
          return false;
        }

        const start = parseDate(t.startTime);
        if (!start) return false;

        // Group filter
        if (filterGroup !== 'all' && t.adminGroup !== filterGroup) return false;

        // Downtime filter
        if (
          filterDowntimeOnly &&
          !t.expectedDowntime.toLowerCase().includes('y')
        ) {
          return false;
        }

        // Must start in future or be scheduled for today
        return start.getTime() >= now - 2 * 60 * 60 * 1000;
      })
      .sort((a, b) => {
        const da = parseDate(a.startTime)?.getTime() || 0;
        const db = parseDate(b.startTime)?.getTime() || 0;
        return da - db;
      });
  }, [tickets, now, filterGroup, filterDowntimeOnly]);

  // Group into time buckets
  const timeBuckets = useMemo(() => {
    const today: ChangeTicket[] = [];
    const tomorrow: ChangeTicket[] = [];
    const thisWeek: ChangeTicket[] = [];
    const later: ChangeTicket[] = [];

    const todayDateStr = referenceDate.toISOString().split('T')[0];

    const tomorrowD = new Date(referenceDate);
    tomorrowD.setDate(tomorrowD.getDate() + 1);
    const tomorrowDateStr = tomorrowD.toISOString().split('T')[0];

    const weekLater = now + 7 * 24 * 60 * 60 * 1000;

    upcomingTickets.forEach((t) => {
      const start = parseDate(t.startTime);
      if (!start) return;
      const startStr = start.toISOString().split('T')[0];

      if (startStr === todayDateStr) {
        today.push(t);
      } else if (startStr === tomorrowDateStr) {
        tomorrow.push(t);
      } else if (start.getTime() <= weekLater) {
        thisWeek.push(t);
      } else {
        later.push(t);
      }
    });

    return { today, tomorrow, thisWeek, later };
  }, [upcomingTickets, referenceDate, now]);

  const adminGroups = useMemo(() => {
    const groups = new Set<string>();
    tickets.forEach((t) => {
      if (t.adminGroup) groups.add(t.adminGroup);
    });
    return Array.from(groups).sort();
  }, [tickets]);

  const renderTicketCard = (ticket: ChangeTicket) => {
    const relativeTime = getRelativeTimeString(ticket.startTime, referenceDate);
    const hasDowntime = ticket.expectedDowntime.toLowerCase().includes('y');

    return (
      <div
        key={ticket.id}
        className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-2 flex-1">
          {/* Header row: Ticket#, Classification, Status, Countdown */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-mono font-bold text-slate-900 text-sm">
              {ticket.ticketNumber}
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                ticket.classification === 'Emergency'
                  ? 'bg-rose-100 text-rose-800'
                  : ticket.classification === 'Major'
                  ? 'bg-purple-100 text-purple-800'
                  : ticket.classification === 'Standard'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {ticket.classification}
            </span>
            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {ticket.status}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-blue-700 font-semibold text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 inline" />
              {relativeTime.text}
            </span>
          </div>

          {/* Title */}
          <h4
            onClick={() => onSelectTicket(ticket)}
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
          >
            {ticket.title}
          </h4>

          {/* ITIL Category Breadcrumbs */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{ticket.category}</span>
            <span className="text-slate-300">/</span>
            <span>{ticket.subCategory}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">
              {ticket.thirdLevelCategory}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-mono">
              Team: {ticket.adminGroup}
            </span>
          </div>

          {/* Process Manager & Assignees */}
          <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Process Manager (Implementer):{' '}
                <strong className="text-slate-900 font-medium">
                  {ticket.processManager}
                </strong>
              </span>
            </div>

            {ticket.actionItemAssignees && ticket.actionItemAssignees !== 'Unassigned' && (
              <div className="text-slate-500">
                Action Items:{' '}
                <span className="text-slate-700">
                  {ticket.actionItemAssignees}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Timing, Downtime Alert, & Action Button */}
        <div className="flex md:flex-col items-end justify-between md:justify-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[200px]">
          <div className="text-right space-y-1">
            <div className="text-xs font-mono text-slate-700">
              {formatDateTime(ticket.startTime)}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              to {formatDateTime(ticket.endTime)}
            </div>

            {hasDowntime ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-1">
                <PowerOff className="w-3 h-3" />
                <span>Downtime: {ticket.expectedDowntime}</span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-700 font-medium">
                No Downtime Expected
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTicket(ticket)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
            >
              <span>Inspect Ticket</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            Upcoming Change Requests
          </h2>
          <p className="text-xs text-slate-500">
            Chronological schedule of approved and upcoming maintenance work
            windows.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
          >
            <option value="all">All Admin Groups</option>
            {adminGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={filterDowntimeOnly}
              onChange={(e) => setFilterDowntimeOnly(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Downtime Only</span>
          </label>
        </div>
      </div>

      {/* Sections by Time Horizon */}
      {upcomingTickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">
            No upcoming changes matching filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All changes are either closed or scheduled outside this filter
            window.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Starting Today */}
          {timeBuckets.today.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                    Starting Today
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {timeBuckets.today.length} scheduled
                </span>
              </div>
              <div className="space-y-2">
                {timeBuckets.today.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* Starting Tomorrow */}
          {timeBuckets.tomorrow.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                    Starting Tomorrow
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {timeBuckets.tomorrow.length} scheduled
                </span>
              </div>
              <div className="space-y-2">
                {timeBuckets.tomorrow.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* This Week */}
          {timeBuckets.thisWeek.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                    Coming Up This Week (Next 7 Days)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {timeBuckets.thisWeek.length} scheduled
                </span>
              </div>
              <div className="space-y-2">
                {timeBuckets.thisWeek.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* Later */}
          {timeBuckets.later.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                    Later
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {timeBuckets.later.length} scheduled
                </span>
              </div>
              <div className="space-y-2">
                {timeBuckets.later.map(renderTicketCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
