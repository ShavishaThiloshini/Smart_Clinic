import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { useReviews } from '../../hooks/useReviews';
import { ReviewCard } from '../../components/review/ReviewCard';
import { ReviewForm } from '../../components/review/ReviewForm';
import { useAppointments } from '../../hooks/useAppointments';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Reviews', icon: '★', path: '/patient/reviews' }
];

export function ReviewPage() {
  const navigate = useNavigate();
  const { reviews, loading: reviewsLoading, fetchMyReviews, addReview } = useReviews();
  const { history: appointments, loading: apptsLoading, fetchAppointmentHistory } = useAppointments();
  
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: number; doctorName: string; date: string } | null>(null);

  const patientName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
    fetchAppointmentHistory();
  }, [fetchMyReviews, fetchAppointmentHistory]);

  const completedAppointments = useMemo(() => {
    return appointments.filter((a: any) => a.status === 'completed');
  }, [appointments]);

  const reviewedAppointmentIds = useMemo(() => {
    return new Set(reviews.map(r => r.appointmentId));
  }, [reviews]);

  const unreviewedAppointments = completedAppointments.filter((a: any) => !reviewedAppointmentIds.has(a.appointmentId));

  function logout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedAppointment) return;
    await addReview({
      appointmentId: selectedAppointment.id,
      rating,
      comment
    });
    setSelectedAppointment(null);
  };

  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav) => (
            <button 
              className={`patient-nav-link ${nav.path === '/patient/reviews' ? 'active' : ''}`} 
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

        <div className="patient-page review-page">
          <section className="patient-welcome review-hero">
            <div>
              <p className="patient-eyebrow">FEEDBACK</p>
              <h1>Your feedback matters</h1>
              <p>Tell us about your completed visits and help other patients choose with confidence.</p>
            </div>
            <button type="button" className="find-doctor-button" onClick={() => navigate('/patient/appointments')}>View appointments</button>
          </section>

          <section className="review-stat-grid" aria-label="Review summary">
            <article className="review-stat-card"><span className="review-stat-icon blue">★</span><div><strong>{reviews.length}</strong><p>Reviews shared</p></div></article>
            <article className="review-stat-card"><span className="review-stat-icon teal">✓</span><div><strong>{completedAppointments.length}</strong><p>Completed visits</p></div></article>
            <article className="review-stat-card"><span className="review-stat-icon gold">✦</span><div><strong>{unreviewedAppointments.length}</strong><p>Waiting for feedback</p></div></article>
          </section>

          <div className="review-columns">
            <section className="review-section review-section-primary">
              <div className="review-section-heading"><div><p className="section-kicker">YOUR TO-DO LIST</p><h2>Visits waiting for feedback</h2></div><span className="review-count">{unreviewedAppointments.length}</span></div>
              {apptsLoading ? (
                <div className="review-loading">Loading completed visits...</div>
              ) : unreviewedAppointments.length === 0 ? (
                <div className="review-empty">
                  <span className="review-empty-icon">✓</span>
                  <h3>All caught up</h3>
                  <p>There are no completed visits waiting for a review.</p>
                </div>
              ) : (
                <div className="review-task-list">
                  {unreviewedAppointments.map((appt: any) => (
                    <article className="review-task" key={appt.appointmentId}>
                      <div className="review-task-avatar">{(appt.doctorName || 'D').split(' ').filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div className="review-task-main">
                        <h3>Dr. {appt.doctorName}</h3>
                        <p>{new Date(`${appt.appointmentDate}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button type="button" className="review-action" onClick={() => setSelectedAppointment({ id: appt.appointmentId, doctorName: appt.doctorName, date: appt.appointmentDate })}>Leave review <span>→</span></button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="review-section">
              <div className="review-section-heading"><div><p className="section-kicker">YOUR VOICE</p><h2>Past reviews</h2></div><span className="review-count">{reviews.length}</span></div>
              {reviewsLoading ? (
                <div className="review-loading">Loading your reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="review-empty">
                  <span className="review-empty-icon">★</span>
                  <h3>Your review history is empty</h3>
                  <p>After a completed visit, your feedback will appear here.</p>
                </div>
              ) : (
                <div className="review-history-list">
                  {reviews.map(review => (
                    <ReviewCard key={review.reviewId} review={review} />
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </section>

      {selectedAppointment && (
        <ReviewForm
          appointmentId={selectedAppointment.id}
          doctorName={selectedAppointment.doctorName}
          date={selectedAppointment.date}
          onSubmit={handleReviewSubmit}
          onCancel={() => setSelectedAppointment(null)}
        />
      )}
    </main>
  );
}
