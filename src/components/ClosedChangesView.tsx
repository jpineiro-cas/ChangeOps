import React from 'react';
import { ChangeTicket } from '../types/change';
import { ChangeTableView } from './ChangeTableView';
import { Archive, PowerOff, ShieldCheck, Upload } from 'lucide-react';

interface ClosedChangesViewProps {
  tickets: ChangeTicket[];
  onSelectTicket: (ticket: ChangeTicket) => void;
  onImportClosedTickets: () => void;
}

export const ClosedChangesView: React.FC<ClosedChangesViewProps> = ({
  tickets,
  onSelectTicket,
  onImportClosedTickets,
}) => {
  const highImpactCount = tickets.filter(
    (ticket) => ticket.classification === 'Major' || ticket.classification === 'Emergency'
  ).length;
  const downtimeCount = tickets.filter((ticket) =>
    ticket.expectedDowntime.toLowerCase().includes('y')
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Change History</h2>
        <p className="text-xs text-slate-500 mt-1">
          Search completed and rejected changes without mixing them into active-work summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Archive className="w-4 h-4 text-slate-500" />
            <span>Historical tickets</span>
          </div>
          <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {tickets.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Major / Emergency</span>
          </div>
          <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {highImpactCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <PowerOff className="w-4 h-4 text-amber-600" />
            <span>Expected downtime</span>
          </div>
          <div className="mt-1 text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {downtimeCount}
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-dashed border-slate-300 text-center">
          <Archive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No completed or rejected tickets loaded</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Import your completed or rejected ticket export and choose “Append to current” to preserve active changes.
          </p>
          <button
            onClick={onImportClosedTickets}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded"
          >
            <Upload className="w-3.5 h-3.5" />
            Import historical tickets
          </button>
        </div>
      ) : (
        <ChangeTableView tickets={tickets} onSelectTicket={onSelectTicket} />
      )}
    </div>
  );
};
