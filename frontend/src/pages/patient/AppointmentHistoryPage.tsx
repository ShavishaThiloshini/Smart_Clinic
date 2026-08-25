import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' },
];

type Appointment = {
  appointmentId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  queueNumber: number;
  status: string;
  reason: string | null;
  doctorName: string;
  clinicName: string | null;
};

type ViewFilter = 'all' | 'upcoming' | 'past';

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours < 12 ? 'AM' : 'PM';
  const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatDate(date: string): { day: string; month: string; full: string } {
  const parsed = new Date(`${date}T00:00:00`);
  return {
    day: String(parsed.getDate()),
    month: parsed.toLocaleDateString('en-US', { month: 'short' }),
    full: parsed.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

function statusClass(status: string): string {
  return `history-status history-status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

export function AppointmentHistoryPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const patientName = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user') || '{}').name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sc_token') || '';
    fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load appointments.');
        setAppointments(data.appointments || []);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const filteredAppointments = appointments.filter((appointment) => {
    const isUpcoming = appointment.appointmentDate >= today && appointment.status.toLowerCase() !== 'cancelled';
    const matchesView = filter === 'all' || (filter === 'upcoming' ? isUpcoming : !isUpcoming);
    const matchesStatus = statusFilter === 'all' || appointment.status.toLowerCase() === statusFilter;
    return matchesView && matchesStatus;
  });

  const counts = useMemo(() => ({
    all: appointments.length,
    upcoming: appointments.filter((appointment) => appointment.appointmentDate >= today && appointment.status.toLowerCase() !== 'cancelled').length,
    past: appointments.filter((appointment) => appointment.appointmentDate < today || appointment.status.toLowerCase() === 'cancelled').length,
  }), [appointments, today]);

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
          {navigation.map((nav, index) => (
            <button
              className={`patient-nav-link ${index === 2 ? 'active' : ''}`}
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
          <div className="patient-avatar" aria-hidden="true" onClick={() => navigate('/patient/profile')} title="View Profile">
            {patientName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="patient-page">
          <section className="patient-welcome history-welcome">
            <div>
              <p className="patient-eyebrow">APPOINTMENT HISTORY</p>
              <h1>Your appointments</h1>
              <p>Keep track of upcoming visits and your care history.</p>
            </div>
            <button className="find-doctor-button" type="button" onClick={() => navigate('/patient/search')}>⌕ Book a visit</button>
          </section>

          <section className="history-summary" aria-label="Appointment summary">
            <div><span className="history-summary-icon blue">▣</span><div><strong>{counts.all}</strong><span>Total appointments</span></div></div>
            <div><span className="history-summary-icon green">◷</span><div><strong>{counts.upcoming}</strong><span>Upcoming visits</span></div></div>
            <div><span className="history-summary-icon gray">✓</span><div><strong>{counts.past}</strong><span>Past visits</span></div></div>
          </section>

          <section className="history-section" aria-label="Appointments">
            <div className="history-toolbar">
              <div className="history-tabs" role="tablist" aria-label="Appointment period">
                {(['all', 'upcoming', 'past'] as ViewFilter[]).map((option) => (
                  <button key={option} type="button" role="tab" aria-selected={filter === option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>
                    {option.charAt(0).toUpperCase() + option.slice(1)} <span>{counts[option]}</span>
                  </button>
                ))}
              </div>
              <label className="history-status-filter">
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {loading && <div className="history-loading" aria-busy="true"><div /><div /><div /></div>}
            {error && !loading && <div className="alert-error" role="alert">{error}</div>}
            {!loading && !error && filteredAppointments.length === 0 && (
              <div className="history-empty">
                <span className="history-empty-icon">▣</span>
                <h2>{appointments.length === 0 ? 'No appointments yet' : 'No matching appointments'}</h2>
                <p>{appointments.length === 0 ? 'Book your first visit with one of our doctors.' : 'Try another period or status filter.'}</p>
                {appointments.length === 0 && <button type="button" className="primary-action" onClick={() => navigate('/patient/search')}>Find a doctor</button>}
              </div>
            )}
            {!loading && !error && filteredAppointments.length > 0 && (
              <div className="history-list">
                {filteredAppointments.map((appointment) => {
                  const date = formatDate(appointment.appointmentDate);
                  const initials = appointment.doctorName.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <article className="history-appointment" key={appointment.appointmentId}>
                      <div className="history-date"><strong>{date.day}</strong><span>{date.month}</span></div>
                      <div className="history-doctor-avatar">{initials}</div>
                      <div className="history-appointment-main">
                        <div className="history-appointment-heading"><div><h2>Dr. {appointment.doctorName}</h2><p>{appointment.clinicName || 'Smart Clinic'}</p></div><span className={statusClass(appointment.status)}>{appointment.status}</span></div>
                        <div className="history-meta"><span>📅 {date.full}</span><span>⏰ {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span><span>Queue #{appointment.queueNumber}</span></div>
                        {appointment.reason && <p className="history-reason">Reason: {appointment.reason}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
