import React, { useState, useMemo } from 'react';
import { ChangeTicket } from '../types/change';
import { parseDate, formatTimeOnly, formatShortDate } from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PowerOff,
  Clock,
  Layers,
  User,
  Filter,
} from 'lucide-react';

interface ChangeCalendarProps {
  tickets: ChangeTicket[];
  referenceDate: Date;
  onSelectTicket: (ticket: ChangeTicket) => void;
}

type CalendarSubView = 'month' | 'week' | 'timeline';

export const ChangeCalendar: React.FC<ChangeCalendarProps> = ({
  tickets,
  referenceDate,
  onSelectTicket,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(referenceDate);
  const [viewMode, setViewMode] = useState<CalendarSubView>('month');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedDayTickets, setSelectedDayTickets] = useState<{
    dateStr: string;
    tickets: ChangeTicket[];
  } | null>(null);

  // Available Admin Groups for quick filter
  const adminGroups = useMemo(() => {
    const groups = new Set<string>();
    tickets.forEach((t) => {
      if (t.adminGroup) groups.add(t.adminGroup);
    });
    return Array.from(groups).sort();
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (groupFilter === 'all') return tickets;
    return tickets.filter((t) => t.adminGroup === groupFilter);
  }, [tickets, groupFilter]);

  // Month navigation
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    setCurrentDate(new Date(referenceDate));
  };

  // Month grid generation
  const monthYearStr = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
      dayTickets: ChangeTicket[];
    }> = [];

    // Preceding month filler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        dayTickets: [],
      });
    }

    const refDateKey = referenceDate.toISOString().split('T')[0];

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateKey === refDateKey;

      // Find tickets active or starting on this day
      const dayTickets = filteredTickets.filter((t) => {
        const start = parseDate(t.startTime);
        if (!start) return false;
        const ticketDateKey = start.toISOString().split('T')[0];
        return ticketDateKey === dateKey;
      });

      days.push({
        date: d,
        isCurrentMonth: true,
        isToday,
        dateKey,
        dayTickets,
      });
    }

    // Trailing month filler to make complete 35 or 42 grid
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        dayTickets: [],
      });
    }

    return days;
  }, [currentDate, filteredTickets, referenceDate]);

  // Color helper for ticket badge
  const getClassificationBorder = (classification: string) => {
    switch (classification) {
      case 'Emergency':
        return 'border-l-rose-500 bg-rose-50/70 text-rose-950 hover:bg-rose-100/70';
      case 'Major':
        return 'border-l-purple-500 bg-purple-50/70 text-purple-950 hover:bg-purple-100/70';
      case 'Normal':
        return 'border-l-blue-500 bg-blue-50/70 text-blue-950 hover:bg-blue-100/70';
      case 'Standard':
        return 'border-l-emerald-500 bg-emerald-50/70 text-emerald-950 hover:bg-emerald-100/70';
      default:
        return 'border-l-slate-400 bg-slate-50 text-slate-800 hover:bg-slate-100';
    }
  };

  // Week days calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day; // start with Sunday
    const weekStart = new Date(curr.setDate(diff));

    const days = [];
    const refKey = referenceDate.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const isToday = dateKey === refKey;

      const dayTickets = filteredTickets.filter((t) => {
        const start = parseDate(t.startTime);
        if (!start) return false;
        return start.toISOString().split('T')[0] === dateKey;
      });

      days.push({
        date: d,
        dateKey,
        isToday,
        dayTickets,
      });
    }
    return days;
  }, [currentDate, filteredTickets, referenceDate]);

  return (
    <div className="space-y-4">
      {/* Calendar Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            {monthYearStr}
          </h3>

          <button
            onClick={jumpToToday}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            Today
          </button>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Group Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:border-slate-400"
            >
              <option value="all">All Admin Groups</option>
              {adminGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Segmented Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Classification Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 px-1 flex-wrap">
        <span className="font-medium text-slate-700">Classification:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Emergency</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Major</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Normal</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Standard</span>
        </span>
        <span className="inline-flex items-center gap-1.5 ml-auto text-amber-700">
          <PowerOff className="w-3.5 h-3.5 inline" />
          <span>Expected Downtime Window</span>
        </span>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-600 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 auto-rows-fr">
            {calendarDays.map((dayObj, i) => (
              <div
                key={i}
                className={`min-h-[110px] p-1.5 transition-colors flex flex-col ${
                  !dayObj.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400'
                    : dayObj.isToday
                    ? 'bg-blue-50/30'
                    : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Date Header inside cell */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                      dayObj.isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayObj.date.getDate()}
                  </span>
                  {dayObj.dayTickets.length > 2 && (
                    <button
                      onClick={() =>
                        setSelectedDayTickets({
                          dateStr: dayObj.dateKey,
                          tickets: dayObj.dayTickets,
                        })
                      }
                      className="text-[10px] font-mono text-slate-500 hover:text-slate-900"
                    >
                      +{dayObj.dayTickets.length - 2} more
                    </button>
                  )}
                </div>

                {/* Ticket items */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayObj.dayTickets.slice(0, 2).map((ticket) => {
                    const hasDowntime = ticket.expectedDowntime
                      .toLowerCase()
                      .includes('y');
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => onSelectTicket(ticket)}
                        className={`w-full text-left p-1 border-l-2 text-[11px] rounded-r transition-all truncate block ${getClassificationBorder(
                          ticket.classification
                        )}`}
                        title={`${ticket.ticketNumber} - ${ticket.title} (Process Manager: ${ticket.processManager})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-semibold truncate">
                            {ticket.ticketNumber}
                          </span>
                          {hasDowntime && (
                            <span title="Downtime Expected">
                              <PowerOff className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[10px] text-slate-600">
                          {formatTimeOnly(ticket.startTime)} · {ticket.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center divide-x divide-slate-200">
            {weekDays.map((w, idx) => (
              <div
                key={idx}
                className={`py-3 px-2 ${
                  w.isToday ? 'bg-blue-50/70 border-b-2 border-blue-600' : ''
                }`}
              >
                <div className="text-xs font-semibold text-slate-500">
                  {w.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-sm font-mono font-bold mt-0.5 ${
                    w.isToday ? 'text-blue-600' : 'text-slate-900'
                  }`}
                >
                  {w.date.getDate()}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {w.dayTickets.length} changes
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px]">
            {weekDays.map((w, idx) => (
              <div key={idx} className="p-2 space-y-2 bg-white">
                {w.dayTickets.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-300">
                    No changes
                  </div>
                ) : (
                  w.dayTickets.map((t) => {
                    const hasDowntime = t.expectedDowntime
                      .toLowerCase()
                      .includes('y');
                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTicket(t)}
                        className={`p-2 rounded border-l-2 text-xs cursor-pointer shadow-2xs hover:shadow-xs transition-all ${getClassificationBorder(
                          t.classification
                        )}`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold">
                            {t.ticketNumber}
                          </span>
                          <span className="font-mono text-slate-500">
                            {formatTimeOnly(t.startTime)}
                          </span>
                        </div>
                        <h5 className="font-medium text-slate-900 text-xs line-clamp-2">
                          {t.title}
                        </h5>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate max-w-[80px]">
                            {t.processManager}
                          </span>
                          {hasDowntime && (
                            <span className="text-amber-700 font-medium">
                              Downtime
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE / GANTT VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4 shadow-xs">
          <div className="text-xs text-slate-500">
            Timeline schedule view showing scheduled change execution windows
            grouped by Admin Group.
          </div>

          <div className="space-y-4">
            {adminGroups.map((group) => {
              const groupTickets = filteredTickets.filter(
                (t) =>
                  t.adminGroup === group &&
                  t.status !== 'Closed' &&
                  t.status !== 'Cancelled'
              );
              if (groupTickets.length === 0) return null;

              return (
                <div
                  key={group}
                  className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/30"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase font-mono">
                      {group}
                    </h4>
                    <span className="text-xs font-mono text-slate-500">
                      {groupTickets.length} scheduled
                    </span>
                  </div>

                  <div className="space-y-2">
                    {groupTickets.map((t) => {
                      const hasDowntime = t.expectedDowntime
                        .toLowerCase()
                        .includes('y');
                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTicket(t)}
                          className="bg-white border border-slate-200 p-2.5 rounded hover:border-slate-300 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono font-bold text-slate-900">
                                {t.ticketNumber}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  t.classification === 'Emergency'
                                    ? 'bg-rose-100 text-rose-800'
                                    : t.classification === 'Major'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {t.classification}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600 font-mono text-[11px]">
                                {t.status}
                              </span>
                            </div>
                            <h5 className="text-xs font-medium text-slate-900">
                              {t.title}
                            </h5>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 shrink-0">
                            <div className="text-right">
                              <div className="text-slate-800">
                                {formatShortDate(t.startTime)}{' '}
                                {formatTimeOnly(t.startTime)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                to {formatTimeOnly(t.endTime)}
                              </div>
                            </div>
                            <div className="border-l pl-3 text-right">
                              <div className="text-slate-700 text-[11px]">
                                Lead: {t.processManager}
                              </div>
                              {hasDowntime && (
                                <div className="text-amber-600 text-[10px] font-semibold">
                                  Downtime: {t.expectedDowntime}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Focus Day Modal / Drawer when clicking '+X more' */}
      {selectedDayTickets && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Changes for {selectedDayTickets.dateStr}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayTickets.tickets.length} total changes scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDayTickets(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {selectedDayTickets.tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedDayTickets(null);
                    onSelectTicket(t);
                  }}
                  className={`p-3 rounded border-l-3 cursor-pointer hover:bg-slate-50 transition-colors ${getClassificationBorder(
                    t.classification
                  )}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold">
                      {t.ticketNumber}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatTimeOnly(t.startTime)} -{' '}
                      {formatTimeOnly(t.endTime)}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-slate-900">
                    {t.title}
                  </h4>
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Process Manager: {t.processManager}</span>
                    <span>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right pt-2 border-t">
              <button
                onClick={() => setSelectedDayTickets(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
