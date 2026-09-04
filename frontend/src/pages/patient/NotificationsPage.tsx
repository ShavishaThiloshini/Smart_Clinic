import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification.types';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Reviews', icon: '★', path: '/patient/reviews' }
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getIconForType(type: string) {
  switch(type) {
    case 'appointment_created': return '📅';
    case 'appointment_confirmed': return '✅';
    case 'appointment_cancelled': return '❌';
    case 'appointment_rescheduled': return '🔄';
    default: return '✉️';
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  const patientName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function logout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav) => (
            <button 
              className={`patient-nav-link ${nav.path === '/patient/notifications' ? 'active' : ''}`} 
              key={nav.label} 
              type="button"
              onClick={() => navigate(nav.path)}
            >
              <span aria-hidden="true">{nav.icon}</span>{nav.label}
            </button>
          ))}
        </nav>
        <button className="patient-logout" type="button" onClick={logout}>↪ Sign out</button>
      </aside>

      <section className="patient-content">
        <header className="patient-header">
          <button className="mobile-menu" type="button" aria-label="Open navigation">☰</button>
          <div className="patient-header-spacer" />
          <button className="notification-button active" type="button" aria-label="Notifications">♧<span /></button>
          <div 
            className="patient-avatar" 
            aria-hidden="true" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/patient/profile')}
            title="View Profile"
          >
            {patientName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="patient-page">
          <section className="patient-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="patient-eyebrow">UPDATES</p>
              <h1>Notifications</h1>
              <p>Stay updated with your appointments and care.</p>
            </div>
            {notifications.some(n => !n.isRead) && (
              <button 
                type="button" 
                onClick={() => markAllAsRead()}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
              >
                Mark all as read
              </button>
            )}
          </section>

          <section style={{ marginTop: '2rem', maxWidth: '800px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p>Loading notifications...</p>
              </div>
            ) : error ? (
              <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <p>⚠ {error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ backgroundColor: '#f9f9f9', padding: '3rem', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '2.5rem', margin: '0 0 1rem', color: '#ccc' }}>📭</p>
                <p style={{ margin: 0, color: '#666' }}>You have no notifications right now.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.notificationId} 
                    onClick={() => !notification.isRead && markAsRead(notification.notificationId)}
                    style={{ 
                      backgroundColor: notification.isRead ? '#fff' : '#f0f7ff', 
                      border: '1px solid',
                      borderColor: notification.isRead ? '#eaeaea' : '#cce5ff',
                      borderRadius: '8px', 
                      padding: '1.25rem', 
                      display: 'flex', 
                      gap: '1rem',
                      cursor: notification.isRead ? 'default' : 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                      {getIconForType(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, color: '#333', fontWeight: notification.isRead ? 500 : 700 }}>
                          {notification.title}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#555', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div style={{ alignSelf: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0066cc' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
