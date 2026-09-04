import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { MedicalHistoryTable } from '../../components/medical/MedicalHistoryTable';
import { MedicalRecordCard } from '../../components/medical/MedicalRecordCard';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import type { MedicalRecord } from '../../types/medical.types';
import { useNotifications } from '../../hooks/useNotifications';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Reviews', icon: '★', path: '/patient/reviews' },
  { label: 'Notifications', icon: '◌', path: '/patient/notifications' }
];

const API_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost:3000';

export function MedicalRecordsPage() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const { records, loading, error, fetchPatientRecords, clearError } = useMedicalRecords();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const patientName = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user') || '{}').name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPatientRecords() {
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
        
        if (isMounted) {
          setProfileLoading(false);
          await fetchPatientRecords(patientId);
        }
      } catch (requestError) {
        console.error('Failed to load medical records', requestError);

        if (isMounted) {
          setProfileError(requestError instanceof Error ? requestError.message : 'Unable to load your profile.');
          setProfileLoading(false);
        }
      }
    }

    loadPatientRecords();

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
                <strong>{records.length}</strong>
                <span>Completed visits</span>
              </div>
            </div>
            <div>
              <span className="history-summary-icon gray">◷</span>
              <div>
                <strong>{records.length > 0 ? records[0]?.createdAt?.split('T')[0] : 'None'}</strong>
                <span>Latest visit</span>
              </div>
            </div>
          </section>

          <section className="history-section records-panel" aria-label="Medical record list">
            <div className="section-title">
              <div>
                <p className="section-kicker">CONSULTATION HISTORY</p>
                <h2>Your medical records</h2>
              </div>
              {error && !profileError && (
                <button
                  type="button"
                  className="retry-button"
                  onClick={() => {
                    clearError();
                    window.location.reload();
                  }}
                  aria-label="Retry loading records"
                >
                  ↻ Retry
                </button>
              )}
            </div>

            {profileError && (
              <div className="error-container">
                <p className="error-message">⚠️ {profileError}</p>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => navigate('/login')}
                >
                  Return to Login
                </button>
              </div>
            )}

            {profileLoading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p>Loading your medical records...</p>
              </div>
            ) : (
              <MedicalHistoryTable
                records={records}
                loading={loading}
                error={error || undefined}
                onRecordClick={setSelectedRecord}
              />
            )}
          </section>
        </div>
      </section>

      {selectedRecord && (
        <MedicalRecordCard
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      <style jsx>{`
        .error-container {
          padding: 2rem;
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          text-align: center;
          margin-top: 1rem;
        }

        .error-message {
          margin: 0 0 1rem 0;
          color: #856404;
          font-size: 0.9375rem;
        }

        .primary-action {
          background-color: #0066cc;
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 4px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .primary-action:hover {
          background-color: #0052a3;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .retry-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #e0e0e0;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </main>
  );
}
