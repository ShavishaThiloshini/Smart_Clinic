import { useState, useEffect } from 'react';
import { DoctorSearchCard } from '../../components/doctor/DoctorSearchCard';

export function DoctorSearchPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');

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
    <div className="dashboard-layout">
      {/* Assuming there's a sidebar or layout wrapper, but we keep it simple here or integrate it later if there is a common layout wrapper */}
      <main className="dashboard-main">
        <header className="page-header">
          <h1>Find a Doctor</h1>
          <p>Search and book appointments with our healthcare professionals.</p>
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
              <button type="submit" className="btn-primary" disabled={isLoading}>
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
                <div className="empty-state">
                  <p>No doctors found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
