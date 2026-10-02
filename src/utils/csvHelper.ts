import Papa from 'papaparse';
import { ChangeClassification, ChangeStatus, ChangeTicket } from '../types/change';

export const STANDARD_COLUMNS = [
  'Ticket#',
  'Status',
  'Users assigned to active action items',
  'Title',
  'Requested start time and date for work',
  'Requested end time and date for work',
  'Expected Downtime?',
  'Classification',
  'Process manager',
  'Description',
  'Admin group',
  'Category',
  'Sub-Category',
  'Third Level Category',
  'Request user',
  'Request time',
  'Submit user',
] as const;

// Fuzzy aliases for common exports
const FIELD_ALIASES: Record<keyof Omit<ChangeTicket, 'id' | 'updatedAt'>, string[]> = {
  ticketNumber: ['ticket#', 'ticket', 'ticket number', 'number', 'change#', 'change id', 'sys_id', 'key'],
  status: ['status', 'state', 'approval status', 'change status'],
  actionItemAssignees: [
    'users assigned to active action items',
    'assigned to active action items',
    'action item assignees',
    'assignees',
    'assigned to',
    'assigned users',
  ],
  title: ['title', 'short description', 'summary', 'name', 'change title', 'subject'],
  startTime: [
    'requested start time and date for work',
    'requested start time',
    'planned start',
    'start date',
    'start time',
    'start_date',
    'scheduled start',
  ],
  endTime: [
    'requested end time and date for work',
    'requested end time',
    'planned end',
    'end date',
    'end time',
    'end_date',
    'scheduled end',
  ],
  expectedDowntime: [
    'expected downtime?',
    'expected downtime',
    'downtime?',
    'downtime',
    'service disruption',
    'outage expected',
  ],
  classification: ['classification', 'change type', 'type', 'risk classification', 'urgency', 'priority'],
  processManager: [
    'process manager',
    'change manager',
    'implementer',
    'assigned engineer',
    'change owner',
    'owner',
    'lead',
  ],
  description: ['description', 'details', 'justification', 'notes', 'scope of work'],
  adminGroup: [
    'admin group',
    'assignment group',
    'support group',
    'team',
    'group',
    'department',
  ],
  category: ['category', 'service', 'system', 'primary category'],
  subCategory: ['sub-category', 'subcategory', 'sub category', 'component'],
  thirdLevelCategory: [
    'third level category',
    'third level',
    'sub-sub-category',
    'level 3 category',
    'sub item',
  ],
  requestUser: ['request user', 'requested by', 'requestor', 'caller', 'submitter'],
  requestTime: ['request time', 'created', 'created at', 'submission date', 'submitted at'],
  submitUser: ['submit user', 'submitted by', 'opened by', 'creator'],
};

// Normalize string for fuzzy match
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map((h) => ({ original: h, norm: normalizeKey(h) }));

  for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
    const matched = normalizedHeaders.find((h) =>
      aliases.some((alias) => normalizeKey(alias) === h.norm || h.norm.includes(normalizeKey(alias)))
    );
    if (matched) {
      mapping[fieldKey] = matched.original;
    }
  }

  return mapping;
}

export function parseCSVFile(
  content: string,
  userMapping?: Record<string, string>
): {
  tickets: ChangeTicket[];
  errors: string[];
  headers: string[];
} {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = result.meta.fields || [];
  const errors: string[] = [];

  if (headers.length === 0) {
    return { tickets: [], errors: ['No valid headers found in the file.'], headers: [] };
  }

  const mapping = { ...autoMapColumns(headers), ...userMapping };
  if (!mapping.ticketNumber && headers[0]) mapping.ticketNumber = headers[0];
  if (!mapping.status && headers[1]) mapping.status = headers[1];

  const tickets: ChangeTicket[] = result.data.map((row, index) => {
    const getValue = (key: keyof typeof FIELD_ALIASES, fallback: string = ''): string => {
      const headerName = mapping[key];
      if (headerName && row[headerName] !== undefined) {
        return String(row[headerName]).trim();
      }
      // Try direct match with standard header name
      for (const std of STANDARD_COLUMNS) {
        if (normalizeKey(std) === normalizeKey(key) && row[std] !== undefined) {
          return String(row[std]).trim();
        }
      }
      return fallback;
    };

    const status = getValue('status', 'Requested') as ChangeStatus;

    // Normalize Classification
    let rawClass = getValue('classification', 'Normal');
    let classification: ChangeClassification = 'Normal';
    const normClass = rawClass.toLowerCase();
    if (normClass.includes('emerg')) classification = 'Emergency';
    else if (normClass.includes('maj')) classification = 'Major';
    else if (normClass.includes('stand')) classification = 'Standard';

    // Normalize Expected Downtime
    let rawDowntime = getValue('expectedDowntime', 'No');
    let downtime = rawDowntime;
    if (rawDowntime.toLowerCase() === 'true' || rawDowntime.toLowerCase() === '1' || rawDowntime.toLowerCase().startsWith('y')) {
      downtime = 'Yes';
    } else if (rawDowntime.toLowerCase() === 'false' || rawDowntime.toLowerCase() === '0' || rawDowntime.toLowerCase().startsWith('n')) {
      downtime = 'No';
    }

    const ticketNumber = getValue('ticketNumber', `CHG-${1000 + index}`);

    return {
      id: `ticket-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      ticketNumber,
      status,
      actionItemAssignees: getValue('actionItemAssignees', 'Unassigned'),
      title: getValue('title', 'Untitled Change Request'),
      startTime: getValue('startTime', ''),
      endTime: getValue('endTime', ''),
      expectedDowntime: downtime,
      classification,
      processManager: getValue('processManager', 'Unassigned Manager'),
      description: getValue('description', 'No description provided.'),
      adminGroup: getValue('adminGroup', 'General IT'),
      category: getValue('category', 'Infrastructure'),
      subCategory: getValue('subCategory', 'General'),
      thirdLevelCategory: getValue('thirdLevelCategory', 'Standard Update'),
      requestUser: getValue('requestUser', 'System User'),
      requestTime: getValue('requestTime', new Date().toISOString()),
      submitUser: getValue('submitUser', 'System User'),
    };
  });

  return { tickets, errors, headers };
}

// Generate sample template CSV string
export function generateSampleCsv(): string {
  const rows = [
    [
      'CHG0049201',
      'Scheduled',
      'Marcus Vance, Elena Rostova',
      'Core Edge Router BGP Firmware Upgrade (DC-West)',
      '2026-09-29 02:00:00',
      '2026-09-29 05:00:00',
      'Yes (15 min failover)',
      'Major',
      'Elena Rostova',
      'Upgrade Arista EOS to 4.31.2F across primary spine router to remediate CVE-2026-3829.',
      'Network Engineering',
      'Network',
      'Routing & Switching',
      'Firmware Update',
      'Sarah Jenkins',
      '2026-09-22 14:15:00',
      'Elena Rostova',
    ],
    [
      'CHG0049202',
      'In Progress',
      'Devon Brooks',
      'PostgreSQL Production Read-Replica Pool Expansion',
      '2026-09-28 05:30:00',
      '2026-09-28 08:30:00',
      'No',
      'Standard',
      'Devon Brooks',
      'Attach two additional read-replicas to pg-cluster-us-central to accommodate Q4 customer analytics spike.',
      'Database Engineering',
      'Database',
      'PostgreSQL',
      'Scale-Out Replica',
      'Devon Brooks',
      '2026-09-27 11:20:00',
      'Devon Brooks',
    ],
    [
      'CHG0049203',
      'Requested',
      'Clara Oswald',
      'Corporate Okta SAML IdP Certificate Annual Rollover',
      '2026-09-28 23:00:00',
      '2026-09-29 01:00:00',
      'No',
      'Normal',
      'Clara Oswald',
      'Rotate expiring signing certificate on Okta IdP across all connected enterprise apps.',
      'Identity & Access',
      'Security',
      'Identity Management',
      'Certificate Rotation',
      'Clara Oswald',
      '2026-09-28 04:00:00',
      'Clara Oswald',
    ],
  ];

  const csvRows = [STANDARD_COLUMNS.join(',')];
  for (const row of rows) {
    csvRows.push(row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','));
  }

  return csvRows.join('\n');
}

// Export tickets to CSV
export function exportTicketsToCSV(tickets: ChangeTicket[]): string {
  const rows = tickets.map((t) => [
    t.ticketNumber,
    t.status,
    t.actionItemAssignees,
    t.title,
    t.startTime,
    t.endTime,
    t.expectedDowntime,
    t.classification,
    t.processManager,
    t.description,
    t.adminGroup,
    t.category,
    t.subCategory,
    t.thirdLevelCategory,
    t.requestUser,
    t.requestTime,
    t.submitUser,
  ]);

  const csvContent = [
    STANDARD_COLUMNS.join(','),
    ...rows.map((row) => row.map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
