import React, { useState, useMemo } from 'react';
import { ChangeTicket, OverdueAnalysis, OverdueReason } from '../types/change';
import { analyzeOverdue, formatDateTime } from '../utils/dateUtils';
import {
  AlertTriangle,
  Clock,
  User,
  CheckCircle,
  Info,
  Filter,
  Lock,
} from 'lucide-react';

interface OverdueChangesViewProps {
  tickets: ChangeTicket[];
  referenceDate: Date;
  onSelectTicket: (ticket: ChangeTicket) => void;
}

export const OverdueChangesView: React.FC<OverdueChangesViewProps> = ({
  tickets,
  referenceDate,
  onSelectTicket,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  // Analyze all tickets
  const analyses = useMemo(() => {
    const list: OverdueAnalysis[] = [];
    tickets.forEach((t) => {
      const res = analyzeOverdue(t, referenceDate);
      if (res) list.push(res);
    });

    // Sort: critical first, then largest hoursDelta
    return list.sort((a, b) => {
      const order = { critical: 3, warning: 2, info: 1 };
      if (order[a.severity] !== order[b.severity]) {
        return order[b.severity] - order[a.severity];
      }
      return b.hoursDelta - a.hoursDelta;
    });
  }, [tickets, referenceDate]);

  // Filtered list
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (reasonFilter !== 'all' && item.reason !== reasonFilter) return false;
      return true;
    });
  }, [analyses, severityFilter, reasonFilter]);

  const criticalCount = analyses.filter((a) => a.severity === 'critical').length;
  const warningCount = analyses.filter((a) => a.severity === 'warning').length;
  const infoCount = analyses.filter((a) => a.severity === 'info').length;

  const getReasonLabel = (reason: OverdueReason) => {
    switch (reason) {
      case 'past_end_time':
        return 'Execution Window Expired';
      case 'past_start_time':
        return 'Start Time Passed (Stalled)';
      case 'unapproved_imminent':
        return 'Imminent Start Unapproved';
      case 'pending_verification_stale':
        return 'Stale PIR / Unclosed';
      default:
        return 'Needs Update';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                Overdue & Changes Needing Action
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies tickets that exceeded their change window, missed execution start, remain unapproved with imminent start times, or require post-implementation review in the ticketing system.
            </p>
          </div>

          {/* Quick Summary Pill count */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-semibold">
              {criticalCount} Critical
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold">
              {warningCount} Warning
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-semibold">
              {infoCount} Pending Review
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filter by:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="all">All Severities ({analyses.length})</option>
            <option value="critical">Critical ({criticalCount})</option>
            <option value="warning">Warning ({warningCount})</option>
            <option value="info">Info / PIR ({infoCount})</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="all">All Issue Types</option>
            <option value="past_end_time">Execution Window Expired</option>
            <option value="past_start_time">Start Time Passed</option>
            <option value="unapproved_imminent">Imminent Unapproved</option>
            <option value="pending_verification_stale">Stale Verification / PIR</option>
          </select>
        </div>
      </div>

      {/* Triage List */}
      {filteredAnalyses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">
            No overdue changes detected
          </h3>
          <p className="text-xs text-slate-500">
            All active change requests are within their planned schedule windows and approval SLAs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map(({ ticket, reason, severity, message }) => {
            const isCritical = severity === 'critical';
            const isWarning = severity === 'warning';

            return (
              <div
                key={ticket.id}
                className={`bg-white border rounded-lg p-4 transition-all hover:shadow-xs space-y-3 ${
                  isCritical
                    ? 'border-rose-300 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-blue-200 bg-blue-50/20'
                }`}
              >
                {/* Header: Ticket#, Status, Diagnosis, Reason Tag */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getReasonLabel(reason)}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Current Status: {ticket.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-500">
                    Window: {formatDateTime(ticket.startTime)} → {formatDateTime(ticket.endTime)}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4
                    onClick={() => onSelectTicket(ticket)}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                  >
                    {ticket.title}
                  </h4>
                </div>

                {/* Specific Diagnosis Message */}
                <div
                  className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                    isCritical
                      ? 'bg-rose-100/70 text-rose-950 font-medium'
                      : isWarning
                      ? 'bg-amber-100/70 text-amber-950 font-medium'
                      : 'bg-blue-100/70 text-blue-950'
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </div>

                {/* Key Roles & Action Items */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-4 flex-wrap text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Process Manager (Implementer):{' '}
                        <strong className="text-slate-900 font-semibold">
                          {ticket.processManager}
                        </strong>
                      </span>
                    </div>

                    <div>
                      Team: <span className="font-mono text-slate-700">{ticket.adminGroup}</span>
                    </div>

                    {ticket.actionItemAssignees && ticket.actionItemAssignees !== 'Unassigned' && (
                      <div>
                        Action Assignees:{' '}
                        <span className="text-slate-700">{ticket.actionItemAssignees}</span>
                      </div>
                    )}
                  </div>

                  {/* Inspection Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                      Source of truth:
                    </span>

                    <button
                      onClick={() => onSelectTicket(ticket)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      Inspect Ticket
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
