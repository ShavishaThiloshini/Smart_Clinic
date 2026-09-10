import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { usePrescriptions } from '../../hooks/usePrescriptions';
import { PrescriptionTable } from '../../components/prescription/PrescriptionTable';
import { PrescriptionCard } from '../../components/prescription/PrescriptionCard';
import type { Prescription } from '../../types/prescription.types';
import { apiRequest } from '../../services/api';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '/patient/appointments' },
  { label: 'Medical records', icon: '▤', path: '/patient/medical-records' },
  { label: 'Prescriptions', icon: '▱', path: '/patient/prescriptions' },
  { label: 'Reviews', icon: '★', path: '/patient/reviews' }
];

export function PrescriptionsPage() {
  const navigate = useNavigate();
  const { prescriptions, loading, error, fetchPatientPrescriptions } = usePrescriptions();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const patientName = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name || 'Patient';
    } catch {
      return 'Patient';
    }
  }, []);

  useEffect(() => {
    async function loadPatientProfile() {
      try {
        const profileJson = await apiRequest<{ success: boolean; profile?: { patientId?: number } }>('/api/patient/profile');
        if (profileJson?.success && profileJson?.profile?.patientId) {
          setPatientId(profileJson.profile.patientId);
        }
      } catch (err) {
        console.error('Failed to load patient profile', err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadPatientProfile();
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientPrescriptions(patientId);
    }
  }, [patientId, fetchPatientPrescriptions]);

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
          {navigation.map((nav) => (
            <button 
              className={`patient-nav-link ${nav.path === '/patient/prescriptions' ? 'active' : ''}`} 
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
              <p className="patient-eyebrow">YOUR CARE</p>
              <h1>Prescriptions</h1>
              <p>Review the medicines prescribed by your doctors.</p>
            </div>
          </section>

          <section className="records-section">
            {profileLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', color: '#666' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #0066cc', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
                <p>Loading your prescriptions...</p>
              </div>
            ) : (
              <PrescriptionTable 
                prescriptions={prescriptions} 
                loading={loading} 
                error={error} 
                onPrescriptionClick={(record) => setSelectedPrescription(record)}
              />
            )}
          </section>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
      </section>

      {selectedPrescription && (
        <PrescriptionCard 
          prescription={selectedPrescription} 
          onClose={() => setSelectedPrescription(null)} 
        />
      )}
    </main>
  );
}
