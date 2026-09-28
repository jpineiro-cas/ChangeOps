import React, { useState, useRef } from 'react';
import { ChangeTicket } from '../types/change';
import {
  parseCSVFile,
  STANDARD_COLUMNS,
  generateSampleCsv,
  downloadFile,
  autoMapColumns,
} from '../utils/csvHelper';
import {
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  X,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTickets: (tickets: ChangeTicket[], mode: 'replace' | 'append') => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportTickets,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');

  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewTickets, setPreviewTickets] = useState<ChangeTicket[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessContent = (rawText: string, name: string = 'pasted-data.csv') => {
    if (!rawText.trim()) {
      setParseErrors(['No content found to parse.']);
      return;
    }

    const { tickets, errors, headers } = parseCSVFile(rawText);
    setFileName(name);
    setFileContent(rawText);
    setParsedHeaders(headers);
    setPreviewTickets(tickets);
    setParseErrors(errors);

    const mapping = autoMapColumns(headers);
    setColumnMapping(mapping);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewTickets.length === 0) return;
    onImportTickets(previewTickets, importMode);
    onClose();
  };

  const handleDownloadTemplate = () => {
    const csv = generateSampleCsv();
    downloadFile(csv, 'change-management-export-template.csv');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Import Ticketing Export Data
            </h3>
            <p className="text-xs text-slate-500">
              Import CSV, TSV, or Excel exports from ServiceNow, Jira, Remedy, or custom change systems.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Template Download */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File (CSV / TSV)
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Raw Data
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'upload' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-lg p-8 text-center bg-slate-50/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Click to browse or drag and drop your export file here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports CSV, TSV, or comma/tab-separated files (.csv, .tsv)
            </p>
            {fileName && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-mono">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Paste raw CSV or tab-separated text (with headers):
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder={`Ticket#,Status,Users assigned to active action items,Title,Requested start time and date for work,Requested end time and date for work,Expected Downtime?,Classification,Process manager,Description,Admin group,Category,Sub-Category,Third Level Category,Request user,Request time,Submit user\nCHG001,Scheduled,Devon Brooks,Database maintenance,2026-09-29 02:00:00,2026-09-29 04:00:00,No,Standard,Devon Brooks,Scale replica,Database,DB,Postgres,Devon,2026-09-27,Devon`}
              className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-md text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-slate-400"
            />
            <button
              onClick={() => handleProcessContent(pasteText, 'pasted-text.csv')}
              disabled={!pasteText.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
            >
              Parse Pasted Data
            </button>
          </div>
        )}

        {/* Errors if any */}
        {parseErrors.length > 0 && (
          <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Parsing Issue:</span>
              <ul className="list-disc pl-4 mt-1">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Live Preview & Mapping Check */}
        {previewTickets.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Successfully detected {previewTickets.length} change ticket{previewTickets.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Import Mode Radio */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-slate-900"
                  />
                  <span>Replace existing</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-slate-900"
                  />
                  <span>Append to current</span>
                </label>
              </div>
            </div>

            {/* Preview sample rows */}
            <div className="border border-slate-200 rounded overflow-hidden max-h-40 overflow-y-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 border-b font-mono text-slate-600">
                  <tr>
                    <th className="p-1.5">Ticket#</th>
                    <th className="p-1.5">Status</th>
                    <th className="p-1.5">Title</th>
                    <th className="p-1.5">Process Manager</th>
                    <th className="p-1.5">Start Time</th>
                    <th className="p-1.5">Downtime?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewTickets.slice(0, 4).map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-1.5 font-mono font-bold">{t.ticketNumber}</td>
                      <td className="p-1.5 font-mono">{t.status}</td>
                      <td className="p-1.5 truncate max-w-[150px]">{t.title}</td>
                      <td className="p-1.5">{t.processManager}</td>
                      <td className="p-1.5 font-mono">{t.startTime}</td>
                      <td className="p-1.5 font-mono">{t.expectedDowntime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Field match breakdown */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="font-semibold text-slate-700">Available Export Fields Matched: </span>
              <span>
                Ticket#, Status, Users assigned to active action items, Title, Requested start/end time, Expected Downtime?, Classification, Process manager, Description, Admin group, Category hierarchy, Request/Submit users.
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={previewTickets.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-50 transition-colors shadow-xs"
          >
            <span>
              Confirm & Import {previewTickets.length > 0 ? `(${previewTickets.length})` : ''}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
