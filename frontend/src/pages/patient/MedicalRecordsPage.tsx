import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' }
];

type MedicalRecord = {
  recordId: number;
  patientId: number;
  doctorId: number;
  appointmentId: number | null;
  diagnosis: string | null;
  notes: string | null;
  treatment: string | null;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  doctorName: string;
};

const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:3000';

function formatRecordDate(value: string | null | undefined): string {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
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
    let isMounted = true;

    async function loadRecords() {
      try {
        const token = localStorage.getItem('sc_token');

        if (!token) {
          throw new Error('Please log in again to view your records.');
        }

        const profileRes = await fetch(`${API_BASE_URL}/api/patient/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const profileJson = await profileRes.json();

        if (!profileRes.ok || !profileJson?.success || !profileJson?.profile?.patientId) {
          throw new Error(profileJson?.message || 'Unable to load your profile.');
        }

        const patientId = profileJson.profile.patientId;
        const recordsRes = await fetch(`${API_BASE_URL}/api/medical-records/patient/${patientId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const recordsJson = await recordsRes.json();

        if (!recordsRes.ok || !recordsJson?.success) {
          throw new Error(recordsJson?.message || 'Unable to load medical records.');
        }

        if (isMounted) {
          setRecords(recordsJson.records || []);
        }
      } catch (requestError) {
        console.error('Failed to load medical records', requestError);

        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load medical records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      isMounted = false;
    };
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
              className={`patient-nav-link ${index === 3 ? 'active' : ''}`}
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
            onClick={() => navigate('/patient/profile')}
            title="View Profile"
            style={{ cursor: 'pointer' }}
          >
            {patientName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="patient-page">
          <section className="patient-welcome">
            <div>
              <p className="patient-eyebrow">MEDICAL RECORDS</p>
              <h1>Your medical records</h1>
              <p>Review your recent consultations, diagnosis summaries, and follow-up guidance.</p>
            </div>
            <button className="find-doctor-button" type="button" onClick={() => navigate('/patient/appointments')}>
              View appointments
            </button>
          </section>

          <section className="history-summary" aria-label="Medical records summary">
            <div>
              <span className="history-summary-icon blue">▤</span>
              <div>
                <strong>{records.length}</strong>
                <span>Total records</span>
              </div>
            </div>
            <div>
              <span className="history-summary-icon green">✓</span>
              <div>
                <strong>{records.length ? records.length : 0}</strong>
                <span>Completed visits</span>
              </div>
            </div>
            <div>
              <span className="history-summary-icon gray">◷</span>
              <div>
                <strong>{records.length ? '1' : '0'}</strong>
                <span>Latest follow-up</span>
              </div>
            </div>
          </section>

          <section className="history-section records-panel" aria-label="Medical record list">
            <div className="section-title">
              <div>
                <p className="section-kicker">CONSULTATION HISTORY</p>
                <h2>Latest treatment notes</h2>
              </div>
            </div>

            {loading ? (
              <div className="records-stack">
                <div className="record-card">
                  <div className="record-body">
                    <p>Loading your records...</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="records-stack">
                <div className="record-card">
                  <div className="record-body">
                    <p className="alert-error">{error}</p>
                  </div>
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="records-stack">
                <div className="record-card">
                  <div className="record-body">
                    <p>No medical records are available yet for this account.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="records-stack">
                {records.map((record) => (
                  <article className="record-card" key={record.recordId}>
                    <div className="record-header">
                      <div>
                        <p className="record-meta">{formatRecordDate(record.createdAt)}</p>
                        <h3>{record.doctorName}</h3>
                      </div>
                      <span className="record-badge">Consultation</span>
                    </div>

                    <div className="record-body">
                      <div className="record-block">
                        <span className="record-label">Diagnosis</span>
                        <p>{record.diagnosis || 'No diagnosis recorded.'}</p>
                      </div>

                      <div className="record-block">
                        <span className="record-label">Notes</span>
                        <p>{record.notes || 'No notes recorded for this visit.'}</p>
                      </div>

                      <div className="record-block follow-up">
                        <span className="record-label">Treatment plan</span>
                        <p>{record.treatment || 'No treatment plan recorded.'}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
