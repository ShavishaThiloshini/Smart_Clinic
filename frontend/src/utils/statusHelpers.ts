import { APPOINTMENT_STATUS, REVIEW_STATUS } from './constants';

// Appointment status helpers
export function isAppointmentPending(status: string): boolean {
  return status === APPOINTMENT_STATUS.PENDING;
}

export function isAppointmentConfirmed(status: string): boolean {
  return status === APPOINTMENT_STATUS.CONFIRMED;
}

export function isAppointmentCompleted(status: string): boolean {
  return status === APPOINTMENT_STATUS.COMPLETED;
}

export function isAppointmentCancelled(status: string): boolean {
  return status === APPOINTMENT_STATUS.CANCELLED;
}

export function isAppointmentNoShow(status: string): boolean {
  return status === APPOINTMENT_STATUS['NO_SHOW'];
}

export function isAppointmentActive(status: string): boolean {
  return [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(status as any);
}

export function isAppointmentFinal(status: string): boolean {
  return [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS['NO_SHOW']].includes(status as any);
}

export function canCancelAppointment(status: string): boolean {
  return isAppointmentActive(status);
}

export function canRescheduleAppointment(status: string): boolean {
  return isAppointmentActive(status);
}

export function canCompleteAppointment(status: string): boolean {
  return isAppointmentConfirmed(status);
}

export function canReviewAppointment(status: string): boolean {
  return isAppointmentCompleted(status);
}

// Get status display text
export function getAppointmentStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    [APPOINTMENT_STATUS.PENDING]: 'Pending',
    [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmed',
    [APPOINTMENT_STATUS.COMPLETED]: 'Completed',
    [APPOINTMENT_STATUS.CANCELLED]: 'Cancelled',
    [APPOINTMENT_STATUS['NO_SHOW']]: 'No-show',
  };
  return statusTexts[status] || 'Unknown';
}

// Get status color class
export function getAppointmentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    [APPOINTMENT_STATUS.PENDING]: 'warning',
    [APPOINTMENT_STATUS.CONFIRMED]: 'success',
    [APPOINTMENT_STATUS.COMPLETED]: 'success',
    [APPOINTMENT_STATUS.CANCELLED]: 'error',
    [APPOINTMENT_STATUS['NO_SHOW']]: 'error',
  };
  return colorMap[status] || 'default';
}

// Review status helpers
export function isReviewPending(status: string): boolean {
  return status === REVIEW_STATUS.PENDING;
}

export function isReviewApproved(status: string): boolean {
  return status === REVIEW_STATUS.APPROVED;
}

export function isReviewRejected(status: string): boolean {
  return status === REVIEW_STATUS.REJECTED;
}

export function getReviewStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    [REVIEW_STATUS.PENDING]: 'Pending',
    [REVIEW_STATUS.APPROVED]: 'Approved',
    [REVIEW_STATUS.REJECTED]: 'Rejected',
  };
  return statusTexts[status] || 'Unknown';
}

// Generic status helpers
export function getStatusBadgeClass(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  return `status-${normalizedStatus}`;
}

export function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    'pending': '⏳',
    'confirmed': '✅',
    'completed': '✓',
    'cancelled': '❌',
    'no-show': '⚠️',
    'approved': '✅',
    'rejected': '❌',
  };
  return iconMap[status.toLowerCase()] || '•';
}