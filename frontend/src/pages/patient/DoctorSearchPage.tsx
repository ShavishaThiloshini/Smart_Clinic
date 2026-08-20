import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoctorSearchCard } from '../../components/doctor/DoctorSearchCard';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '#' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' }
];

export function DoctorSearchPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');

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

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (specialization.trim()) params.append('specialization', specialization.trim());

      const res = await fetch(`/api/doctors?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Failed to fetch doctors.');
        return;
      }
      
      setDoctors(data.doctors || []);
    } catch (err) {
      setError('An error occurred while fetching doctors.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchDoctors();
  }

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
          <header className="patient-welcome" style={{ marginBottom: '25px' }}>
            <div>
              <p className="patient-eyebrow">DIRECTORY</p>
              <h1>Find a Doctor</h1>
              <p>Search and book appointments with our healthcare professionals.</p>
            </div>
          </header>

          <section className="search-section card">
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label htmlFor="searchQuery">Doctor Name or Clinic</label>
                <input
                  id="searchQuery"
                  type="text"
                  placeholder="Search by name, clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <select 
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">All Specializations</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="General Practitioner">General Practitioner</option>
                </select>
              </div>
              
              <div className="form-group search-btn-group">
                <button type="submit" className="btn-primary full-width" disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </section>

          {error && <div className="alert-error">{error}</div>}

          <section className="results-section">
            <h2 className="section-title">
              {doctors.length} {doctors.length === 1 ? 'Doctor' : 'Doctors'} Found
            </h2>
            
            {isLoading ? (
              <div className="loading-spinner">Loading doctors...</div>
            ) : (
              <div className="doctor-grid">
                {doctors.map(doctor => (
                  <DoctorSearchCard key={doctor.doctorId} doctor={doctor} />
                ))}
                {doctors.length === 0 && !isLoading && !error && (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <p>No doctors found matching your criteria.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
