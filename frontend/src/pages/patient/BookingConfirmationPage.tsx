import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Notifications', icon: '◌', path: '/patient/notifications' },
];

type Appointment = {
  appointmentId: number;
  doctorId: number;
  patientId: number;
  clinicId: number | null;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  queueNumber: number;
  status: string;
  reason: string | null;
  patientName: string;
  doctorName: string;
  clinicName: string | null;
  createdAt: string;
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'status-pending' },
    confirmed: { label: 'Confirmed', cls: 'status-confirmed' },
    completed: { label: 'Completed', cls: 'status-completed' },
    cancelled: { label: 'Cancelled', cls: 'status-cancelled' },
    'no-show': { label: 'No-show', cls: 'status-noshow' },
  };
  const entry = map[status.toLowerCase()] || { label: status, cls: 'status-pending' };
  return <span className={`conf-status-badge ${entry.cls}`} role="status">{entry.label}</span>;
}

export function BookingConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = (location.state as { appointment?: Appointment })?.appointment;

  const patientName = (() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user') || '{}').name || 'Patient';
    } catch {
      return 'Patient';
    }
  })();

  function logout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  /* Redirect if no appointment data (e.g., direct navigation) */
  useEffect(() => {
    if (!appointment) {
      navigate('/patient/dashboard', { replace: true });
    }
  }, [appointment, navigate]);

  if (!appointment) return null;

  const initials = appointment.doctorName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav) => (
            <button
              className="patient-nav-link"
              key={nav.label}
              type="button"
              onClick={() => nav.path !== '#' && navigate(nav.path)}
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
          <button className="notification-button" type="button" aria-label="Notifications">♧<span /></button>
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
          <div className="conf-shell" role="main" aria-label="Booking confirmation">

            {/* Success banner */}
            <div className="conf-success-banner" role="alert" aria-live="polite">
              <div className="conf-check-circle" aria-hidden="true">✓</div>
              <div>
                <p className="patient-eyebrow">APPOINTMENT BOOKED</p>
                <h1>You're all set, {patientName.split(' ')[0]}!</h1>
                <p className="conf-sub">Your appointment has been submitted successfully. You will receive a confirmation once it is reviewed.</p>
              </div>
            </div>

            {/* Appointment card */}
            <article className="conf-card" aria-label="Appointment details">
              <div className="conf-card-header">
                <div className="conf-doc-avatar">{initials}</div>
                <div className="conf-doc-info">
                  <p className="conf-card-kicker">YOUR DOCTOR</p>
                  <h2>Dr. {appointment.doctorName}</h2>
                  {appointment.clinicName && <p className="conf-clinic">{appointment.clinicName}</p>}
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              <div className="conf-details-grid">
                <div className="conf-detail-item">
                  <span className="conf-detail-icon" aria-hidden="true">📅</span>
                  <div>
                    <p className="conf-detail-label">Date</p>
                    <p className="conf-detail-value">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                </div>
                <div className="conf-detail-item">
                  <span className="conf-detail-icon" aria-hidden="true">⏰</span>
                  <div>
                    <p className="conf-detail-label">Time</p>
                    <p className="conf-detail-value">
                      {formatTime12h(appointment.startTime)} – {formatTime12h(appointment.endTime)}
                    </p>
                  </div>
                </div>
                <div className="conf-detail-item">
                  <span className="conf-detail-icon" aria-hidden="true">🔢</span>
                  <div>
                    <p className="conf-detail-label">Queue number</p>
                    <p className="conf-detail-value conf-queue">#{appointment.queueNumber}</p>
                  </div>
                </div>
                <div className="conf-detail-item">
                  <span className="conf-detail-icon" aria-hidden="true">🆔</span>
                  <div>
                    <p className="conf-detail-label">Appointment ID</p>
                    <p className="conf-detail-value">#{appointment.appointmentId}</p>
                  </div>
                </div>
              </div>

              {appointment.reason && (
                <div className="conf-reason">
                  <p className="conf-detail-label">Reason for visit</p>
                  <p className="conf-reason-text">{appointment.reason}</p>
                </div>
              )}
            </article>

            {/* Info note */}
            <div className="conf-info-note" role="note">
              <span className="conf-note-icon" aria-hidden="true">ℹ</span>
              <p>Your appointment is currently <strong>pending</strong>. The doctor or clinic staff will confirm it. Make sure to arrive on time and bring any relevant medical records.</p>
            </div>

            {/* Actions */}
            <div className="conf-actions">
              <button
                type="button"
                className="conf-action-secondary"
                onClick={() => navigate('/patient/search')}
              >
                Find another doctor
              </button>
              <button
                type="button"
                className="conf-action-primary"
                id="conf-back-dashboard"
                onClick={() => navigate('/patient/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
