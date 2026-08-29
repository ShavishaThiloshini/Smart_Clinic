import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' },
];

type DoctorProfile = {
  doctorId: number;
  name: string;
  specialization: string | null;
  clinic: string | null;
  qualifications: string | null;
  experience: number | null;
  consultationFee: number | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
};

type AvailabilitySlot = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  status: boolean;
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="doc-pub-stars" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ color: star <= Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

export function DoctorPublicProfilePage() {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!doctorId) { setError('Invalid doctor.'); setLoading(false); return; }
    const token = localStorage.getItem('sc_token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);
    Promise.all([
      fetch(`/api/doctors/${doctorId}`, { headers }).then((r) => r.json()),
      fetch(`/api/doctors/${doctorId}/availability`, { headers }).then((r) => r.json()),
    ])
      .then(([doctorData, availData]) => {
        if (!doctorData.success) { setError(doctorData.message || 'Doctor not found.'); return; }
        setDoctor(doctorData.doctor);
        if (availData.success) {
          setAvailability((availData.availability || []).filter((s: AvailabilitySlot) => s.status));
        }
      })
      .catch(() => setError('Unable to load doctor profile.'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  const activeDays = [...new Set(availability.map((s) => s.dayOfWeek))].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  const initials = doctor
    ? doctor.name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav, index) => (
            <button
              className={`patient-nav-link ${index === 1 ? 'active' : ''}`}
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
          {/* Breadcrumb */}
          <nav className="doc-pub-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigate('/patient/search')}>← Back to search</button>
          </nav>

          {loading && (
            <div className="doc-pub-skeleton">
              <div className="doc-pub-skel-header" />
              <div className="doc-pub-skel-body" />
              <div className="doc-pub-skel-body" />
            </div>
          )}

          {error && !loading && (
            <div className="alert-error" style={{ marginTop: '20px' }}>{error}</div>
          )}

          {doctor && !loading && (
            <div className="doc-pub-layout">
              {/* Left: Profile Card */}
              <article className="doc-pub-card" aria-label="Doctor profile">
                {/* Hero header */}
                <div className="doc-pub-hero">
                  <div className="doc-pub-orb" aria-hidden="true" />
                  <div className="doc-pub-avatar">{initials}</div>
                  <div className="doc-pub-hero-info">
                    <p className="doc-pub-kicker">DOCTOR PROFILE</p>
                    <h1>Dr. {doctor.name}</h1>
                    {doctor.specialization && (
                      <span className="doc-pub-specialty">{doctor.specialization}</span>
                    )}
                    <div className="doc-pub-rating-row">
                      <StarRating rating={Number(doctor.rating)} />
                      <span className="doc-pub-rating-num">{Number(doctor.rating).toFixed(1)}</span>
                      <span className="doc-pub-review-count">({doctor.reviewCount} {doctor.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="doc-pub-stats">
                  <div className="doc-pub-stat">
                    <span className="doc-pub-stat-icon">🏥</span>
                    <div>
                      <p className="doc-pub-stat-label">Clinic</p>
                      <p className="doc-pub-stat-value">{doctor.clinic || 'Not listed'}</p>
                    </div>
                  </div>
                  <div className="doc-pub-stat">
                    <span className="doc-pub-stat-icon">⏱</span>
                    <div>
                      <p className="doc-pub-stat-label">Experience</p>
                      <p className="doc-pub-stat-value">{doctor.experience != null ? `${doctor.experience} years` : 'Not listed'}</p>
                    </div>
                  </div>
                  <div className="doc-pub-stat">
                    <span className="doc-pub-stat-icon">💰</span>
                    <div>
                      <p className="doc-pub-stat-label">Consultation</p>
                      <p className="doc-pub-stat-value">{doctor.consultationFee != null ? `Rs. ${Number(doctor.consultationFee).toLocaleString()}` : 'Not listed'}</p>
                    </div>
                  </div>
                </div>

                {/* Qualifications */}
                {doctor.qualifications && (
                  <section className="doc-pub-section" aria-label="Qualifications">
                    <h2>Qualifications</h2>
                    <p>{doctor.qualifications}</p>
                  </section>
                )}

                {/* Bio */}
                {doctor.bio && (
                  <section className="doc-pub-section" aria-label="About the doctor">
                    <h2>About</h2>
                    <p className="doc-pub-bio">{doctor.bio}</p>
                  </section>
                )}
              </article>

              {/* Right: Availability + Book */}
              <aside className="doc-pub-sidebar-panel" aria-label="Availability and booking">
                <div className="doc-pub-book-card">
                  <p className="doc-pub-kicker">BOOK AN APPOINTMENT</p>
                  <h2>Schedule your visit</h2>
                  <p className="doc-pub-book-sub">Select a convenient time slot with Dr. {doctor.name}.</p>
                  <button
                    id="book-appointment-btn"
                    className="doc-pub-book-btn"
                    type="button"
                    onClick={() => navigate(`/patient/book/${doctor.doctorId}`)}
                  >
                    Book Appointment →
                  </button>
                </div>

                <div className="doc-pub-avail-card">
                  <p className="doc-pub-kicker">AVAILABILITY</p>
                  <h2>Available days</h2>
                  {activeDays.length > 0 ? (
                    <ul className="doc-pub-avail-list" aria-label="Available days">
                      {activeDays.map((day) => {
                        const slots = availability.filter((s) => s.dayOfWeek === day);
                        return (
                          <li key={day} className="doc-pub-avail-item">
                            <span className="doc-pub-avail-dot" aria-hidden="true" />
                            <div>
                              <strong>{day}</strong>
                              {slots.map((s) => (
                                <span key={s.id} className="doc-pub-avail-time">
                                  {s.startTime} – {s.endTime}
                                </span>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="doc-pub-no-avail">No availability set yet.</p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
