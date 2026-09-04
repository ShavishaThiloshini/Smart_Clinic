export type NotificationType = 
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_completed'
  | 'appointment_no-show'
  | 'general';

export type Notification = {
  notificationId: number;
  userId: number;
  appointmentId: number | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};
