import { useState, useEffect, useMemo, type FormEvent } from 'react';
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

type Doctor = {
  doctorId: number;
  name: string;
  specialization: string | null;
  clinic: string | null;
  experience: number | null;
  consultationFee: number | null;
  rating: number;
  reviewCount: number;
};

type SortOption = 'name' | 'experience' | 'fee-low' | 'rating';

const specializations = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Practitioner'];

export function DoctorSearchPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinic, setClinic] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

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

  async function fetchDoctors(filters = { query: searchQuery, specialty: specialization, clinicName: clinic }) {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.query.trim()) params.append('q', filters.query.trim());
      if (filters.specialty.trim()) params.append('specialization', filters.specialty.trim());
      if (filters.clinicName.trim()) params.append('clinic', filters.clinicName.trim());

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

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    fetchDoctors();
  }

  function clearFilters() {
    setSearchQuery('');
    setSpecialization('');
    setClinic('');
    setSortBy('name');
    fetchDoctors({ query: '', specialty: '', clinicName: '' });
  }

  const filteredDoctors = useMemo(() => [...doctors].sort((first, second) => {
    if (sortBy === 'rating') return Number(second.rating) - Number(first.rating);
    if (sortBy === 'experience') return Number(second.experience || 0) - Number(first.experience || 0);
    if (sortBy === 'fee-low') return Number(first.consultationFee || 0) - Number(second.consultationFee || 0);
    return first.name.localeCompare(second.name);
  }), [doctors, sortBy]);

  const activeFilterCount = [searchQuery, specialization, clinic].filter((value) => value.trim()).length;

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

          <section className="search-section card" aria-label="Doctor filters">
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
                  {specializations.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              
              <div className="form-group search-btn-group">
                <button type="submit" className="btn-primary full-width" disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            <div className="doctor-filter-bar">
              <div className="filter-control">
                <label htmlFor="clinic">Clinic</label>
                <input id="clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') fetchDoctors(); }} placeholder="Any clinic" />
              </div>
              <div className="filter-control">
                <label htmlFor="doctorSort">Sort results</label>
                <select id="doctorSort" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                  <option value="name">Name: A–Z</option>
                  <option value="rating">Highest rated</option>
                  <option value="experience">Most experience</option>
                  <option value="fee-low">Lowest fee</option>
                </select>
              </div>
              <button className="clear-doctor-filters" type="button" onClick={clearFilters} disabled={!activeFilterCount && sortBy === 'name'}>Clear filters</button>
            </div>
            <div className="filter-summary" aria-live="polite">
              <span>{activeFilterCount ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'Showing all available doctors'}</span>
              {specialization && <button type="button" onClick={() => { setSpecialization(''); fetchDoctors({ query: searchQuery, specialty: '', clinicName: clinic }); }}>{specialization} ×</button>}
              {clinic && <button type="button" onClick={() => { setClinic(''); fetchDoctors({ query: searchQuery, specialty: specialization, clinicName: '' }); }}>{clinic} ×</button>}
            </div>
          </section>

          {error && <div className="alert-error">{error}</div>}

          <section className="results-section">
            <h2 className="section-title">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Found
            </h2>
            
            {isLoading ? (
              <div className="loading-spinner">Loading doctors...</div>
            ) : (
              <div className="doctor-grid">
                {filteredDoctors.map(doctor => (
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
