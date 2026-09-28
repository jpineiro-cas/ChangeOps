import { ChangeTicket, OverdueAnalysis, ConflictNotice } from '../types/change';

// Parse flexible date strings from CSV exports
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Try standard Date parse first
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Handle formats like "YYYY-MM-DD HH:mm:ss" or "YYYY/MM/DD HH:mm"
  const isoLike = trimmed.replace(/\//g, '-');
  const dIso = new Date(isoLike);
  if (!isNaN(dIso.getTime())) return dIso;

  // Handle US format: MM/DD/YYYY HH:mm:ss or MM/DD/YYYY hh:mm AM/PM
  const usMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?$/i);
  if (usMatch) {
    const month = parseInt(usMatch[1], 10) - 1;
    const day = parseInt(usMatch[2], 10);
    const year = parseInt(usMatch[3], 10);
    let hours = usMatch[4] ? parseInt(usMatch[4], 10) : 0;
    const minutes = usMatch[5] ? parseInt(usMatch[5], 10) : 0;
    const seconds = usMatch[6] ? parseInt(usMatch[6], 10) : 0;
    const ampm = usMatch[7]?.toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

// Format date into human-readable string
export function formatDateTime(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr || 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

// Format short date (e.g., Sep 28)
export function formatShortDate(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d) return dateStr || '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

// Format time only (e.g., 04:30 PM)
export function formatTimeOnly(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

// Calculate relative time description (e.g. "Starts in 2 hours", "Overdue by 14 hours")
export function getRelativeTimeString(dateStr: string | null | undefined, referenceDate: Date = new Date()): {
  text: string;
  isPast: boolean;
  deltaHours: number;
} {
  const d = parseDate(dateStr);
  if (!d) return { text: 'Date unknown', isPast: false, deltaHours: 0 };

  const diffMs = d.getTime() - referenceDate.getTime();
  const isPast = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const deltaHours = Math.round(absMs / (1000 * 60 * 60));
  const deltaDays = Math.floor(deltaHours / 24);

  if (deltaHours === 0) {
    const mins = Math.max(1, Math.round(absMs / (1000 * 60)));
    return {
      text: isPast ? `${mins}m ago` : `in ${mins}m`,
      isPast,
      deltaHours: 0,
    };
  }

  if (deltaHours < 24) {
    return {
      text: isPast ? `${deltaHours}h ago` : `in ${deltaHours}h`,
      isPast,
      deltaHours,
    };
  }

  if (deltaDays === 1) {
    return {
      text: isPast ? 'Yesterday' : 'Tomorrow',
      isPast,
      deltaHours,
    };
  }

  return {
    text: isPast ? `${deltaDays}d ago` : `in ${deltaDays}d`,
    isPast,
    deltaHours,
  };
}

// Determine if a ticket is overdue or needs urgent updates
export function analyzeOverdue(ticket: ChangeTicket, referenceDate: Date = new Date()): OverdueAnalysis | null {
  const status = ticket.status;
  // Closed or Cancelled tickets are never overdue
  if (status === 'Closed' || status === 'Cancelled' || status === 'Rejected') {
    return null;
  }

  const start = parseDate(ticket.startTime);
  const end = parseDate(ticket.endTime);
  const now = referenceDate.getTime();

  // 1. Past scheduled end time, but ticket is still active or in progress
  if (end && end.getTime() < now) {
    if (status === 'In Progress') {
      const hoursOver = Math.round((now - end.getTime()) / (1000 * 60 * 60));
      return {
        ticket,
        reason: 'past_end_time',
        severity: 'critical',
        message: `Change window closed ${hoursOver}h ago but status is still "In Progress". Work has exceeded scheduled window.`,
        hoursDelta: hoursOver,
      };
    }

    if (status === 'Scheduled' || status === 'Approved' || status === 'Requested' || status === 'In Review') {
      const hoursOver = Math.round((now - end.getTime()) / (1000 * 60 * 60));
      return {
        ticket,
        reason: 'past_end_time',
        severity: 'critical',
        message: `Change window expired ${hoursOver}h ago without execution. Ticket requires rescheduling or closure.`,
        hoursDelta: hoursOver,
      };
    }
  }

  // 2. Scheduled or Requested/In Review, but start time has passed
  if (start && start.getTime() < now) {
    if (status === 'Scheduled' || status === 'Approved') {
      const hoursLate = Math.round((now - start.getTime()) / (1000 * 60 * 60));
      return {
        ticket,
        reason: 'past_start_time',
        severity: 'warning',
        message: `Execution start was scheduled ${hoursLate}h ago, but status was not progressed to "In Progress".`,
        hoursDelta: hoursLate,
      };
    }
    if (status === 'Requested' || status === 'In Review') {
      const hoursLate = Math.round((now - start.getTime()) / (1000 * 60 * 60));
      return {
        ticket,
        reason: 'past_start_time',
        severity: 'critical',
        message: `Requested work start time passed ${hoursLate}h ago without CAB approval.`,
        hoursDelta: hoursLate,
      };
    }
  }

  // 3. Imminent start (< 24 hours) but not approved yet
  if (start && start.getTime() >= now && (status === 'Requested' || status === 'In Review')) {
    const hoursUntil = Math.round((start.getTime() - now) / (1000 * 60 * 60));
    if (hoursUntil <= 24) {
      return {
        ticket,
        reason: 'unapproved_imminent',
        severity: 'warning',
        message: `Change is scheduled to start in ${hoursUntil}h but is still pending approval in "${status}".`,
        hoursDelta: hoursUntil,
      };
    }
  }

  // 4. Implemented or Pending Verification for > 48 hours without closure
  if (status === 'Implemented' || status === 'Pending Verification') {
    if (end && now - end.getTime() > 48 * 60 * 60 * 1000) {
      const daysWaiting = Math.round((now - end.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ticket,
        reason: 'pending_verification_stale',
        severity: 'info',
        message: `Work finished ${daysWaiting} days ago. Needs Post-Implementation Review (PIR) and closure.`,
        hoursDelta: daysWaiting * 24,
      };
    }
  }

  return null;
}

// Detect schedule overlaps / conflicts between tickets
export function detectConflicts(tickets: ChangeTicket[]): ConflictNotice[] {
  const activeTickets = tickets.filter(
    (t) => t.status !== 'Closed' && t.status !== 'Cancelled' && t.status !== 'Rejected'
  );
  const conflicts: ConflictNotice[] = [];

  for (let i = 0; i < activeTickets.length; i++) {
    const a = activeTickets[i];
    const aStart = parseDate(a.startTime);
    const aEnd = parseDate(a.endTime);
    if (!aStart || !aEnd) continue;

    for (let j = i + 1; j < activeTickets.length; j++) {
      const b = activeTickets[j];
      const bStart = parseDate(b.startTime);
      const bEnd = parseDate(b.endTime);
      if (!bStart || !bEnd) continue;

      // Overlap condition: startA < endB && endA > startB
      if (aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime()) {
        const adminGroupConflict =
          a.adminGroup.trim().toLowerCase() === b.adminGroup.trim().toLowerCase();
        const categoryConflict =
          a.category.trim().toLowerCase() === b.category.trim().toLowerCase();

        const hasDowntime =
          a.expectedDowntime.toLowerCase().includes('y') ||
          b.expectedDowntime.toLowerCase().includes('y');

        // Flag if same group, category, or both have downtime
        if (adminGroupConflict || categoryConflict || hasDowntime) {
          const overlapStart = new Date(Math.max(aStart.getTime(), bStart.getTime())).toISOString();
          const overlapEnd = new Date(Math.min(aEnd.getTime(), bEnd.getTime())).toISOString();

          conflicts.push({
            ticketA: a,
            ticketB: b,
            overlapStart,
            overlapEnd,
            adminGroupConflict,
            categoryConflict,
            hasDowntime,
          });
        }
      }
    }
  }

  return conflicts;
}
