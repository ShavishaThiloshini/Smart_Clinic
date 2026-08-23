import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '#' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' }
];

export function PatientDashboard() {
  const navigate = useNavigate();
  const patientName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

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
          <section className="patient-welcome">
            <div>
              <p className="patient-eyebrow">PATIENT DASHBOARD</p>
              <h1>Good morning, {patientName.split(' ')[0]}.</h1>
              <p>Here is a clear view of your care and upcoming visits.</p>
            </div>
            <button className="find-doctor-button" type="button" onClick={() => navigate('/patient/search')}>⌕ Find a doctor</button>
          </section>

          <section className="dashboard-grid">
            <article className="upcoming-card">
              <div className="card-heading"><div><p className="section-kicker">NEXT APPOINTMENT</p><h2>Upcoming visit</h2></div><span className="status-confirmed">Confirmed</span></div>
              <div className="appointment-summary">
                <div className="doctor-initials">DS</div>
                <div><h3>Dr. S. Perera</h3><p>General Medicine · Smart Clinic</p></div>
              </div>
              <div className="appointment-details">
                <span>◷ <strong>Wednesday, 20 August</strong></span>
                <span>◴ <strong>10:30 AM – 11:00 AM</strong></span>
                <span>⌖ <strong>Consultation Room 03</strong></span>
              </div>
              <div className="appointment-actions"><button type="button" className="secondary-action">Reschedule</button><button type="button" className="primary-action">View appointment</button></div>
            </article>

            <article className="care-tip-card">
              <span className="care-tip-icon">✦</span>
              <p className="section-kicker">CARE REMINDER</p>
              <h2>Prepare for your visit</h2>
              <p>Bring any recent reports and a list of medicines you are taking.</p>
              <button type="button">Learn more →</button>
            </article>
          </section>

          <section className="quick-access"><div className="section-title"><div><p className="section-kicker">QUICK ACCESS</p><h2>Manage your care</h2></div></div><div className="quick-grid">
            <button type="button" className="quick-card"><span className="quick-icon blue">▣</span><strong>My appointments</strong><small>View upcoming and past visits</small><i>→</i></button>
            <button type="button" className="quick-card"><span className="quick-icon teal">▤</span><strong>Medical records</strong><small>Review your consultation history</small><i>→</i></button>
            <button type="button" className="quick-card"><span className="quick-icon purple">▱</span><strong>Prescriptions</strong><small>See your prescribed medicines</small><i>→</i></button>
          </div></section>

          <section className="activity-section"><div className="section-title"><div><p className="section-kicker">RECENT ACTIVITY</p><h2>Updates for you</h2></div><button type="button">View all</button></div><div className="activity-list">
            <div className="activity-item"><span className="activity-dot blue" /><div><strong>Your appointment is confirmed</strong><p>Dr. S. Perera · Wednesday at 10:30 AM</p></div><time>Today</time></div>
            <div className="activity-item"><span className="activity-dot teal" /><div><strong>Welcome to Smart Clinic</strong><p>Your patient account is ready to use.</p></div><time>Today</time></div>
          </div></section>
        </div>
      </section>
    </main>
  );
}
