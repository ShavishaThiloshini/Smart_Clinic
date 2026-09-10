import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppointments } from '../../hooks/useAppointments';
import { apiRequest } from '../../services/api';
import type { Appointment } from '../../types/appointment.types';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Reviews', icon: '★', path: '/patient/reviews' },
  { label: 'Notifications', icon: '◌', path: '/patient/notifications' }
];

export function PatientDashboard() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { history: appointments, loading: appointmentsLoading, fetchAppointmentHistory } = useAppointments();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  const patientName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        await fetchAppointmentHistory();
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setDashboardLoading(false);
      }
    }
    loadDashboardData();
  }, [fetchAppointmentHistory]);

  const upcomingAppointment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return appointments.find((apt: Appointment) => 
      apt.appointmentDate >= today && 
      ['pending', 'confirmed'].includes(apt.status.toLowerCase())
    ) || null;
  }, [appointments]);

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
              className={`patient-nav-link ${index === 0 ? 'active' : ''}`} 
              key={nav.label} 
              type="button"
              onClick={() => navigate(nav.path)}
            >
              <span aria-hidden="true">{nav.icon}</span>{nav.label}
              {nav.label === 'Notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#e53e3e', color: 'white', borderRadius: '50%', padding: '0.125rem 0.375rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button className="patient-logout" type="button" onClick={logout}>↪ Sign out</button>
      </aside>

      <section className="patient-content">
        <header className="patient-header">
          <button className="mobile-menu" type="button" aria-label="Open navigation">☰</button>
          <div className="patient-header-spacer" />
          <button className="notification-button" type="button" aria-label="Notifications" onClick={() => navigate('/patient/notifications')}>
            ♧{unreadCount > 0 && <span />}
          </button>
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
          <section className="patient-welcome">
            <div>
              <p className="patient-eyebrow">PATIENT DASHBOARD</p>
              <h1>Good morning, {patientName.split(' ')[0]}.</h1>
              <p>Here is a clear view of your care and upcoming visits.</p>
            </div>
            <button className="find-doctor-button" type="button" onClick={() => navigate('/patient/search')}>⌕ Find a doctor</button>
          </section>

          <section className="dashboard-grid">
            {dashboardLoading ? (
              <article className="upcoming-card">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #0066cc', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
                  <p>Loading your appointments...</p>
                </div>
              </article>
            ) : upcomingAppointment ? (
              <article className="upcoming-card">
                <div className="card-heading">
                  <div><p className="section-kicker">NEXT APPOINTMENT</p><h2>Upcoming visit</h2></div>
                  <span className={`status-${upcomingAppointment.status.toLowerCase()}`}>{upcomingAppointment.status}</span>
                </div>
                <div className="appointment-summary">
                  <div className="doctor-initials">
                    {upcomingAppointment.doctorName.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3>Dr. {upcomingAppointment.doctorName}</h3>
                    <p>{upcomingAppointment.clinicName || 'Smart Clinic'}</p>
                  </div>
                </div>
                <div className="appointment-details">
                  <span>◷ <strong>{new Date(upcomingAppointment.appointmentDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></span>
                  <span>◴ <strong>{upcomingAppointment.startTime} – {upcomingAppointment.endTime}</strong></span>
                  {upcomingAppointment.queueNumber && <span>⌖ <strong>Queue #{upcomingAppointment.queueNumber}</strong></span>}
                </div>
                <div className="appointment-actions">
                  <button type="button" className="secondary-action" onClick={() => navigate('/patient/appointments')}>Reschedule</button>
                  <button type="button" className="primary-action" onClick={() => navigate('/patient/appointments')}>View appointment</button>
                </div>
              </article>
            ) : (
              <article className="upcoming-card">
                <div className="card-heading">
                  <div><p className="section-kicker">NEXT APPOINTMENT</p><h2>No upcoming appointments</h2></div>
                </div>
                <div className="appointment-summary">
                  <p>You don't have any scheduled appointments. Book a visit with one of our doctors.</p>
                </div>
                <div className="appointment-actions">
                  <button type="button" className="primary-action" onClick={() => navigate('/patient/search')}>Find a doctor</button>
                </div>
              </article>
            )}

            <article className="care-tip-card">
              <span className="care-tip-icon">✦</span>
              <p className="section-kicker">CARE REMINDER</p>
              <h2>Prepare for your visit</h2>
              <p>Bring any recent reports and a list of medicines you are taking.</p>
              <button type="button" onClick={() => navigate('/patient/medical-records')}>Learn more →</button>
            </article>
          </section>

          <section className="quick-access"><div className="section-title"><div><p className="section-kicker">QUICK ACCESS</p><h2>Manage your care</h2></div></div><div className="quick-grid">
            <button type="button" className="quick-card" onClick={() => navigate('/patient/appointments')}><span className="quick-icon blue">▣</span><strong>My appointments</strong><small>View upcoming and past visits</small><i>→</i></button>
            <button type="button" className="quick-card" onClick={() => navigate('/patient/medical-records')}><span className="quick-icon teal">▤</span><strong>Medical records</strong><small>Review your consultation history</small><i>→</i></button>
            <button type="button" className="quick-card" onClick={() => navigate('/patient/prescriptions')}><span className="quick-icon purple">▱</span><strong>Prescriptions</strong><small>See your prescribed medicines</small><i>→</i></button>
          </div></section>

          <section className="activity-section"><div className="section-title"><div><p className="section-kicker">RECENT ACTIVITY</p><h2>Updates for you</h2></div><button type="button" onClick={() => navigate('/patient/notifications')}>View all</button></div><div className="activity-list">
            {upcomingAppointment ? (
              <div className="activity-item">
                <span className="activity-dot blue" />
                <div>
                  <strong>Your appointment is {upcomingAppointment.status.toLowerCase()}</strong>
                  <p>Dr. {upcomingAppointment.doctorName} · {new Date(upcomingAppointment.appointmentDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at {upcomingAppointment.startTime}</p>
                </div>
                <time>Today</time>
              </div>
            ) : (
              <div className="activity-item">
                <span className="activity-dot teal" />
                <div>
                  <strong>Welcome to Smart Clinic</strong>
                  <p>Your patient account is ready to use.</p>
                </div>
                <time>Today</time>
              </div>
            )}
          </div></section>
        </div>
      </section>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
