import React from 'react';
import { ChangeTicket } from '../types/change';
import { formatDateTime, analyzeOverdue } from '../utils/dateUtils';
import {
  X,
  User,
  Clock,
  PowerOff,
  AlertTriangle,
  Layers,
  Shield,
  Lock,
  ExternalLink,
  Building,
  Info,
} from 'lucide-react';

interface ChangeDetailModalProps {
  ticket: ChangeTicket | null;
  referenceDate: Date;
  onClose: () => void;
}

export const ChangeDetailModal: React.FC<ChangeDetailModalProps> = ({
  ticket,
  referenceDate,
  onClose,
}) => {
  if (!ticket) return null;

  const overdueAnalysis = analyzeOverdue(ticket, referenceDate);
  const hasDowntime = ticket.expectedDowntime.toLowerCase().includes('y');
  const ticketUrl = `https://childrensaidnyc.sysaidit.com/SREdit.jsp?id=${encodeURIComponent(ticket.ticketNumber)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b pb-4 border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-lg text-slate-900 hover:text-blue-700 hover:underline"
              >
                {ticket.ticketNumber}
              </a>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
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

              {/* Status Badge */}
              <span className="font-mono text-xs font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                Status: {ticket.status}
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Read-Only Mirror</span>
              </span>
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              {ticket.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              title="Open ticket in SysAid"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in SysAid</span>
            </a>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Read-Only Source of Truth Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Ticketing System is Source of Truth: </span>
            <span>
              All modifications, CAB approval votes, status transitions, and schedule adjustments must be performed directly in your ticketing system for ticket <strong className="font-mono font-bold text-slate-900">{ticket.ticketNumber}</strong>. Re-import your export to view updated states.
            </span>
          </div>
        </div>

        {/* Overdue Warning Alert */}
        {overdueAnalysis && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              overdueAnalysis.severity === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Attention Required:</span>
              <p>{overdueAnalysis.message}</p>
            </div>
          </div>
        )}

        {/* Expected Downtime Warning */}
        {hasDowntime && (
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/80 text-xs flex items-start gap-2.5 text-amber-900">
            <PowerOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Expected Downtime Impact: </span>
              <span>{ticket.expectedDowntime}</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Service disruption expected during scheduled work window. Ensure customer notifications and failover standby teams are active.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* The 17 Core Export Fields Structured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Execution & Roles */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Execution & Roles</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Process Manager:</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {ticket.processManager}
                  </span>
                  <span className="text-[11px] text-blue-600 ml-1.5 font-medium">
                    (Person making the change)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Admin Group:</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {ticket.adminGroup}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Users Assigned to Active Action Items:
                  </span>
                  <span className="text-slate-800">
                    {ticket.actionItemAssignees || 'None assigned'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <div>
                    <span>Request User: </span>
                    <strong className="text-slate-700">{ticket.requestUser}</strong>
                  </div>
                  <div>
                    <span>Submit User: </span>
                    <strong className="text-slate-700">{ticket.submitUser}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Work Schedule Window & Downtime */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Work Schedule Window</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Requested Start Time & Date:
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatDateTime(ticket.startTime)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Requested End Time & Date:
                  </span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatDateTime(ticket.endTime)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Expected Downtime?:</span>
                  <span
                    className={`font-semibold font-mono ${
                      hasDowntime ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {ticket.expectedDowntime}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>Initial Request Time: </span>
                  <span className="font-mono text-slate-700">
                    {formatDateTime(ticket.requestTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Hierarchy */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              ITIL Classification & Categorization
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">
                Category: {ticket.category}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">
                Sub-Category: {ticket.subCategory}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded">
                Third Level: {ticket.thirdLevelCategory}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Work Scope & Description
            </span>
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Change Lifecycle Governance Note */}
          <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                To change status or schedule, update <strong className="font-mono text-slate-800">{ticket.ticketNumber}</strong> in your ticketing tool.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                title="Open ticket in SysAid"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open in SysAid</span>
              </a>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
