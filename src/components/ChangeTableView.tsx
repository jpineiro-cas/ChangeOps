import React, { useState, useMemo } from 'react';
import { ChangeTicket } from '../types/change';
import { formatShortDate, formatTimeOnly } from '../utils/dateUtils';
import {
  Search,
  Filter,
  Download,
  PowerOff,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { exportTicketsToCSV, downloadFile } from '../utils/csvHelper';

interface ChangeTableViewProps {
  tickets: ChangeTicket[];
  onSelectTicket: (ticket: ChangeTicket) => void;
}

type SortField =
  | 'ticketNumber'
  | 'title'
  | 'startTime'
  | 'status'
  | 'classification'
  | 'processManager'
  | 'adminGroup';

export const ChangeTableView: React.FC<ChangeTableViewProps> = ({
  tickets,
  onSelectTicket,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedDowntime, setSelectedDowntime] = useState<string>('all');

  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract filter options
  const adminGroups = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.adminGroup) set.add(t.adminGroup);
    });
    return Array.from(set).sort();
  }, [tickets]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.status) set.add(t.status);
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matches =
            t.ticketNumber.toLowerCase().includes(q) ||
            t.title.toLowerCase().includes(q) ||
            t.processManager.toLowerCase().includes(q) ||
            t.adminGroup.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.subCategory.toLowerCase().includes(q) ||
            t.thirdLevelCategory.toLowerCase().includes(q) ||
            t.actionItemAssignees.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Status
        if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

        // Classification
        if (selectedClassification !== 'all' && t.classification !== selectedClassification) return false;

        // Group
        if (selectedGroup !== 'all' && t.adminGroup !== selectedGroup) return false;

        // Downtime
        if (selectedDowntime === 'yes' && !t.expectedDowntime.toLowerCase().includes('y')) return false;
        if (selectedDowntime === 'no' && t.expectedDowntime.toLowerCase().includes('y')) return false;

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        const comparison = String(valA).localeCompare(String(valB));
        return sortAsc ? comparison : -comparison;
      });
  }, [
    tickets,
    search,
    selectedStatus,
    selectedClassification,
    selectedGroup,
    selectedDowntime,
    sortField,
    sortAsc,
  ]);

  const handleExportFiltered = () => {
    const csv = exportTicketsToCSV(filteredTickets);
    downloadFile(csv, `change-tickets-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket#, title, process manager, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFiltered}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV ({filteredTickets.length})</span>
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
          >
            <option value="all">All Classifications</option>
            <option value="Standard">Standard</option>
            <option value="Normal">Normal</option>
            <option value="Major">Major</option>
            <option value="Emergency">Emergency</option>
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
          >
            <option value="all">All Admin Groups</option>
            {adminGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={selectedDowntime}
            onChange={(e) => setSelectedDowntime(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
          >
            <option value="all">All Downtime Types</option>
            <option value="yes">With Expected Downtime</option>
            <option value="no">Zero Downtime</option>
          </select>

          {(search || selectedStatus !== 'all' || selectedClassification !== 'all' || selectedGroup !== 'all' || selectedDowntime !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('all');
                setSelectedClassification('all');
                setSelectedGroup('all');
                setSelectedDowntime('all');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 ml-2 font-medium"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs font-mono text-slate-500 tabular-nums">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold select-none">
                <th
                  onClick={() => handleSort('ticketNumber')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors font-mono whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Ticket#</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('classification')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Classification</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors min-w-[220px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Title</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('processManager')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Process Manager</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('adminGroup')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Admin Group</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('startTime')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Requested Start Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  <span>Downtime?</span>
                </th>
                <th className="py-2.5 px-3 text-right">
                  <span>Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No tickets match current search & filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const hasDowntime = t.expectedDowntime.toLowerCase().includes('y');

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Ticket# */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap group-hover:text-blue-600">
                        {t.ticketNumber}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-700">
                          {t.status}
                        </span>
                      </td>

                      {/* Classification */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                            t.classification === 'Emergency'
                              ? 'bg-rose-100 text-rose-800'
                              : t.classification === 'Major'
                              ? 'bg-purple-100 text-purple-800'
                              : t.classification === 'Standard'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.classification}
                        </span>
                      </td>

                      {/* Title & Category breadcrumb */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {t.category} / {t.subCategory}
                        </div>
                      </td>

                      {/* Process Manager (person making the change) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {t.processManager}
                        </div>
                        {t.actionItemAssignees && t.actionItemAssignees !== 'Unassigned' && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {t.actionItemAssignees}
                          </div>
                        )}
                      </td>

                      {/* Admin Group */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {t.adminGroup}
                      </td>

                      {/* Requested Start */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                        <div>{formatShortDate(t.startTime)} {formatTimeOnly(t.startTime)}</div>
                        <div className="text-[10px] text-slate-400">end: {formatTimeOnly(t.endTime)}</div>
                      </td>

                      {/* Expected Downtime */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {hasDowntime ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            <PowerOff className="w-3 h-3 text-amber-600" />
                            <span>{t.expectedDowntime}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
