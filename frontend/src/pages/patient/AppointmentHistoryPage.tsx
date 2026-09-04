import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { cancelAppointment, getAppointments, getDoctorAvailability, rescheduleAppointment } from '../../services/appointment.service';
import type { Appointment, AvailabilitySlot } from '../../types/appointment.types';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Notifications', icon: '◌', path: '/patient/notifications' },
];

type ViewFilter = 'all' | 'upcoming' | 'past';

type ActionState = { type: 'cancel' | 'reschedule'; appointment: Appointment } | null;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function queueStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: 'Your booking is waiting for clinic confirmation.',
    confirmed: 'Your visit is confirmed. Please arrive before your scheduled time.',
    completed: 'This visit has been completed.',
    cancelled: 'This appointment has been cancelled.',
    'no-show': 'This appointment was marked as no-show.',
  };
  return messages[status.toLowerCase()] || 'Appointment status updated.';
}

function toMinutes(time: string): number { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; }
function fromMinutes(total: number): string { return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  for (let current = toMinutes(start); current + duration <= toMinutes(end); current += duration) slots.push(fromMinutes(current));
  return slots;
}

export function AppointmentHistoryPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<ViewFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<ActionState>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const patientName = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user') || '{}').name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function openReschedule(appointment: Appointment) {
    setActionError(''); setActionSuccess(''); setSelectedDate(appointment.appointmentDate); setSelectedTime(appointment.startTime);
    setAction({ type: 'reschedule', appointment });
    try { setAvailability(await getDoctorAvailability(appointment.doctorId)); }
    catch (requestError) { setActionError((requestError as Error).message); }
  }

  async function submitAction() {
    if (!action || actionLoading) return;
    setActionLoading(true); setActionError('');
    try {
      const updated = action.type === 'cancel'
        ? await cancelAppointment(action.appointment.appointmentId)
        : await rescheduleAppointment(action.appointment.appointmentId, selectedDate, selectedTime);
      setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
      setActionSuccess(action.type === 'cancel' ? 'Appointment cancelled successfully.' : 'Appointment rescheduled successfully.');
      setAction(null);
    } catch (requestError) { setActionError((requestError as Error).message); }
    finally { setActionLoading(false); }
  }

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

  const activeQueueAppointments = appointments.filter((appointment) => (
    appointment.appointmentDate >= today
    && ['pending', 'confirmed'].includes(appointment.status.toLowerCase())
  ));

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

          <section className="queue-status-panel" aria-labelledby="queue-status-title">
            <div className="queue-status-heading">
              <div><p className="patient-eyebrow">QUEUE MANAGEMENT</p><h2 id="queue-status-title">Queue &amp; appointment status</h2></div>
              <span className="queue-status-live"><i /> Current status</span>
            </div>
            {activeQueueAppointments.length === 0 ? (
              <p className="queue-status-empty">You have no pending or confirmed appointments in the queue.</p>
            ) : (
              <div className="queue-status-list">
                {activeQueueAppointments.map((appointment) => {
                  const date = formatDate(appointment.appointmentDate);
                  return (
                    <article className="queue-status-item" key={appointment.appointmentId}>
                      <div className="queue-number"><span>QUEUE</span><strong>{appointment.queueNumber ? `#${appointment.queueNumber}` : '—'}</strong></div>
                      <div className="queue-status-main"><h3>Dr. {appointment.doctorName}</h3><p>{date.full} · {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p><span>{queueStatusMessage(appointment.status)}</span></div>
                      <span className={statusClass(appointment.status)}>{appointment.status}</span>
                    </article>
                  );
                })}
              </div>
            )}
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
                        {(appointment.status.toLowerCase() === 'pending' || appointment.status.toLowerCase() === 'confirmed') && appointment.appointmentDate >= today && (
                          <div className="history-actions">
                            <button type="button" className="history-action secondary" onClick={() => openReschedule(appointment)}>Reschedule</button>
                            <button type="button" className="history-action danger" onClick={() => { setActionError(''); setActionSuccess(''); setAction({ type: 'cancel', appointment }); }}>Cancel appointment</button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            {actionSuccess && <div className="history-feedback success" role="status">{actionSuccess}</div>}
          </section>
        </div>
      </section>
      {action && (
        <div className="appointment-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !actionLoading && setAction(null)}>
          <section className="appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-action-title">
            <h2 id="appointment-action-title">{action.type === 'cancel' ? 'Cancel appointment?' : 'Reschedule appointment'}</h2>
            <p className="appointment-modal-summary">Dr. {action.appointment.doctorName}<br />{formatDate(action.appointment.appointmentDate).full} at {formatTime(action.appointment.startTime)}</p>
            {action.type === 'cancel' ? <p>This appointment will be marked as cancelled and will no longer be available for your visit.</p> : (
              <div className="reschedule-fields">
                <label>Date<input type="date" min={today} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setSelectedTime(''); }} /></label>
                <label>Available time<select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}><option value="">Select a time</option>{[...new Set(availability.filter((slot) => slot.dayOfWeek === DAY_NAMES[new Date(`${selectedDate}T00:00:00`).getDay()]).flatMap((slot) => generateSlots(slot.startTime, slot.endTime, slot.slotDuration)))].sort().map((time) => <option key={time} value={time}>{formatTime(time)}</option>)}</select></label>
              </div>
            )}
            {actionError && <p className="appointment-modal-error" role="alert">{actionError}</p>}
            <div className="appointment-modal-actions"><button type="button" className="history-action secondary" disabled={actionLoading} onClick={() => setAction(null)}>Keep appointment</button><button type="button" className={`history-action ${action.type === 'cancel' ? 'danger' : 'primary'}`} disabled={actionLoading || (action.type === 'reschedule' && (!selectedDate || !selectedTime))} onClick={submitAction}>{actionLoading ? 'Processing...' : action.type === 'cancel' ? 'Yes, cancel' : 'Confirm reschedule'}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
