export type ChangeStatus =
  | 'Requested'
  | 'In Review'
  | 'Approved'
  | 'Scheduled'
  | 'In Progress'
  | 'Implemented'
  | 'Pending Verification'
  | 'Closed'
  | 'Cancelled'
  | 'Rejected'
  | (string & {});

export type ChangeClassification =
  | 'Standard'
  | 'Normal'
  | 'Emergency'
  | 'Major';

export interface ChangeTicket {
  id: string; // Internal unique ID
  ticketNumber: string; // Ticket#
  status: ChangeStatus; // Status
  actionItemAssignees: string; // Users assigned to active action items
  title: string; // Title
  startTime: string; // Requested start time and date for work (ISO or parsed string)
  endTime: string; // Requested end time and date for work
  expectedDowntime: 'Yes' | 'No' | string; // Expected Downtime?
  classification: ChangeClassification; // Classification
  processManager: string; // Process manager (person making the change)
  description: string; // Description
  adminGroup: string; // Admin group
  category: string; // Category
  subCategory: string; // Sub-Category
  thirdLevelCategory: string; // Third Level Category
  requestUser: string; // Request user
  requestTime: string; // Request time
  submitUser: string; // Submit user
  updatedAt?: string; // Optional internal tracking
}

export type OverdueReason =
  | 'past_end_time' // End time passed but not completed/closed
  | 'past_start_time' // Start time passed but still in requested/review/scheduled
  | 'unapproved_imminent' // Starts in <24h but not approved
  | 'pending_verification_stale'; // Implemented >48h ago without closure

export interface OverdueAnalysis {
  ticket: ChangeTicket;
  reason: OverdueReason;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  hoursDelta: number;
}

export interface ConflictNotice {
  ticketA: ChangeTicket;
  ticketB: ChangeTicket;
  overlapStart: string;
  overlapEnd: string;
  hasDowntime: boolean;
}

export type DashboardView =
  | 'overview'
  | 'calendar'
  | 'upcoming'
  | 'overdue'
  | 'inProgress'
  | 'highImpact'
  | 'table';

export interface FilterOptions {
  search: string;
  status: string[];
  classification: string[];
  adminGroup: string[];
  processManager: string[];
  hasDowntime: 'all' | 'yes' | 'no';
  dateRange: 'all' | 'today' | 'upcoming7' | 'upcoming30' | 'past' | 'custom';
  customStart?: string;
  customEnd?: string;
}
