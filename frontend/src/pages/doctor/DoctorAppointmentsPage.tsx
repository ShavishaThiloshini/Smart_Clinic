import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { getAppointments, updateAppointmentStatus } from '../../services/appointment.service';
import type { Appointment } from '../../types/appointment.types';
import { DoctorSidebar } from '../../components/doctor/DoctorSidebar';
import { DashboardAlertPanel } from '../../components/notification/DashboardAlertPanel';
import { useNotifications } from '../../hooks/useNotifications';

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return value.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 || 12;
  return `${formattedHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function DoctorAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState<number | null>(null);
  const { notifications, fetchNotifications, markAsRead } = useNotifications();

  const initials = useMemo(() => {
    const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
    return (savedUser.name || 'DR').split(' ').filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
  }, []);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await getAppointments();
        setAppointments(data.filter((appointment) => appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'no-show'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load appointments.');
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
    fetchNotifications();
    const refresh = window.setInterval(() => {
      loadAppointments();
      fetchNotifications();
    }, 10000);
    return () => window.clearInterval(refresh);
  }, [fetchNotifications]);

  async function updateStatus(appointmentId: number, status: 'accepted' | 'completed') {
    setWorking(appointmentId);
    setError('');
    try {
      const updated = await updateAppointmentStatus(appointmentId, status);
      setAppointments((current) => current.map((appointment) => appointment.appointmentId === appointmentId ? updated : appointment));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this appointment.');
    } finally {
      setWorking(null);
    }
  }

  function signOut() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  const activeAppointments = appointments.filter((appointment) => ['pending', 'accepted'].includes(appointment.status.toLowerCase()));

  return (
    <main className="doctor-profile-shell">
      <DoctorSidebar onSignOut={signOut} />

      <section className="doctor-profile-content">
        <header className="doctor-profile-header">
          <span>Appointments</span>
          <div className="doctor-avatar">{initials}</div>
        </header>

        <div className="doctor-profile-page">
          <p className="doctor-profile-kicker">CLINIC SCHEDULE</p>
          <h1>Appointments</h1>
          <p className="doctor-profile-intro">Review new patient bookings and accept those ready for consultation.</p>

          <DashboardAlertPanel
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onViewAll={() => navigate('/doctor/appointments')}
          />

          {error && <div className="doctor-notice error">{error}</div>}

          {loading ? (
            <p className="doctor-loading">Loading appointments...</p>
          ) : activeAppointments.length === 0 ? (
            <div className="history-empty">
              <span className="history-empty-icon">▣</span>
              <h2>No pending appointments</h2>
              <p>When a patient books a visit, it will appear here for your review.</p>
            </div>
          ) : (
            <div className="history-list">
              {activeAppointments.map((appointment) => {
                const isPending = appointment.status.toLowerCase() === 'pending';
                return (
                <article className="history-appointment" key={appointment.appointmentId}>
                  <div className="history-date">
                    <strong>{new Date(`${appointment.appointmentDate}T00:00:00`).getDate()}</strong>
                    <span>{new Date(`${appointment.appointmentDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="history-doctor-avatar">{(appointment.patientName || 'P').split(' ').filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                  <div className="history-appointment-main">
                    <div className="history-appointment-heading">
                      <div>
                        <h2>{appointment.patientName || 'Patient'}</h2>
                        <p>{appointment.clinicName || 'Smart Clinic'}</p>
                      </div>
                      <span className={`history-status history-status-${isPending ? 'pending' : 'accepted'}`}>{isPending ? 'Pending' : 'Accepted'}</span>
                    </div>
                    <div className="history-meta">
                      <span>📅 {formatDate(appointment.appointmentDate)}</span>
                      <span>⏰ {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                      <span>Queue #{appointment.queueNumber || '—'}</span>
                    </div>
                    {appointment.reason && <p className="history-reason">Reason: {appointment.reason}</p>}
                    <div className="history-actions">
                      <button
                        type="button"
                        className="history-action primary"
                        onClick={() => updateStatus(appointment.appointmentId, isPending ? 'accepted' : 'completed')}
                        disabled={working === appointment.appointmentId}
                      >
                        {working === appointment.appointmentId ? 'Updating...' : isPending ? 'Accept appointment' : 'Mark completed'}
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
