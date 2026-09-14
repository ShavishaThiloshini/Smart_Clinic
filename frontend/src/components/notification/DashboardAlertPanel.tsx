import type { Notification } from '../../types/notification.types';
import { NotificationItem } from './NotificationItem';

type Props = {
  notifications: Notification[];
  onMarkAsRead: (notificationId: number) => void;
  onViewAll: () => void;
};

export function DashboardAlertPanel({ notifications, onMarkAsRead, onViewAll }: Props) {
  const unread = notifications
    .filter((notification) => !notification.isRead && notification.type.startsWith('appointment_'))
    .slice(0, 3);

  return (
    <section className="dashboard-alert-panel" aria-label="Appointment alerts">
      <div className="dashboard-alert-heading">
        <div>
          <p className="section-kicker">LIVE ALERTS</p>
          <h2>Appointment updates</h2>
        </div>
        <button type="button" onClick={onViewAll}>View all</button>
      </div>
      {unread.length === 0 ? (
        <p className="dashboard-alert-empty">No new appointment alerts.</p>
      ) : (
        <div className="dashboard-alert-list">
          {unread.map((notification) => (
            <NotificationItem
              key={notification.notificationId}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      )}
    </section>
  );
}
