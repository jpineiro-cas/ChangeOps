import React from 'react';
import { Lock, Upload, ShieldCheck } from 'lucide-react';

interface SourceOfTruthBannerProps {
  lastImportTime: string;
  onOpenImport: () => void;
  ticketCount: number;
}

export const SourceOfTruthBanner: React.FC<SourceOfTruthBannerProps> = ({
  lastImportTime,
  onOpenImport,
  ticketCount,
}) => {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-3 sm:px-4 sm:py-3 mb-5 border border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
          <Lock className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              Read-Only Governance Mode
            </span>
            <span className="inline-flex items-center text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.2 rounded">
              <ShieldCheck className="w-3 h-3 mr-1 inline" />
              Ticketing System is Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Direct edits are disabled to prevent state drift. Update tickets in your ticketing system and re-import the latest export.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-xs">
        <div className="text-right hidden md:block text-[11px] text-slate-400 font-mono">
          <span>Last sync: </span>
          <span className="text-slate-200 font-medium">{lastImportTime}</span>
        </div>

        <button
          onClick={onOpenImport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-md transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-700" />
          <span>Sync New Export</span>
        </button>
      </div>
    </div>
  );
};
