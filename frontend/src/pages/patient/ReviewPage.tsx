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
    return appointments.filter(a => a.status === 'completed');
  }, [appointments]);

  const reviewedAppointmentIds = useMemo(() => {
    return new Set(reviews.map(r => r.appointmentId));
  }, [reviews]);

  const unreviewedAppointments = completedAppointments.filter(a => !reviewedAppointmentIds.has(a.appointmentId));

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

        <div className="patient-page">
          <section className="patient-welcome">
            <div>
              <p className="patient-eyebrow">FEEDBACK</p>
              <h1>Reviews & Ratings</h1>
              <p>Share your experience to help us improve.</p>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
            
            {/* Needs Review Section */}
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#333' }}>Pending Reviews</h2>
              {apptsLoading ? (
                <p>Loading appointments...</p>
              ) : unreviewedAppointments.length === 0 ? (
                <div style={{ backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: '#666', margin: 0 }}>No pending reviews. Thank you for your feedback!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {unreviewedAppointments.map(appt => (
                    <div key={appt.appointmentId} style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>Dr. {appt.doctorName}</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{appt.appointmentDate}</p>
                      </div>
                      <button 
                        type="button"
                        style={{ backgroundColor: '#0066cc', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => setSelectedAppointment({ id: appt.appointmentId, doctorName: appt.doctorName, date: appt.appointmentDate })}
                      >
                        Leave Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past Reviews Section */}
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#333' }}>Your Past Reviews</h2>
              {reviewsLoading ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <div style={{ backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: '#666', margin: 0 }}>You haven't left any reviews yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
