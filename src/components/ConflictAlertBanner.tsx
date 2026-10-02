import React, { useState } from 'react';
import { ConflictNotice, ChangeTicket } from '../types/change';
import { formatDateTime } from '../utils/dateUtils';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';

interface ConflictAlertBannerProps {
  conflicts: ConflictNotice[];
  onSelectTicket: (ticket: ChangeTicket) => void;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({
  conflicts,
  onSelectTicket,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (conflicts.length === 0) return null;

  return (
    <div className="border border-amber-200 bg-amber-50/70 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              {conflicts.length} Potential Change Window Collision{conflicts.length > 1 ? 's' : ''} Detected
            </h4>
            <p className="text-xs text-amber-700">
              Overlapping scheduled windows where both changes have expected downtime.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950 px-2 py-1 rounded bg-amber-100 hover:bg-amber-200/80 transition-colors"
        >
          <span>{isExpanded ? 'Hide Details' : 'View Collisions'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2">
          {conflicts.map((c, idx) => (
            <div
              key={idx}
              className="bg-white/90 border border-amber-200/80 rounded p-2.5 text-xs text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium text-amber-900">
                    Overlap: {formatDateTime(c.overlapStart)}
                  </span>
                  {c.hasDowntime && (
                    <span className="text-[11px] text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded font-medium">
                      Concurrent Downtime Window
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                  <span>
                    <strong>{c.ticketA.ticketNumber}</strong>: {c.ticketA.title} (Lead: {c.ticketA.processManager})
                  </span>
                  <span>vs</span>
                  <span>
                    <strong>{c.ticketB.ticketNumber}</strong>: {c.ticketB.title} (Lead: {c.ticketB.processManager})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectTicket(c.ticketA)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Review {c.ticketA.ticketNumber}
                </button>
                <button
                  onClick={() => onSelectTicket(c.ticketB)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                >
                  Review {c.ticketB.ticketNumber}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
