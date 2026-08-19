import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '#' },
  { label: 'My appointments', icon: '▣', path: '#' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' }
];

export function PatientProfilePage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    medicalInfo: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const patientInitials = useMemo(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
      return savedUser.name ? savedUser.name.charAt(0).toUpperCase() : 'P';
    } catch {
      return 'P';
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('sc_token');
      const res = await fetch('/api/patient/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setFormData({
          name: json.profile.name || '',
          phone: json.profile.phone || '',
          dateOfBirth: json.profile.dateOfBirth ? json.profile.dateOfBirth.split('T')[0] : '',
          gender: json.profile.gender || '',
          address: json.profile.address || '',
          medicalInfo: json.profile.medicalInfo || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('sc_token');
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update local storage name if it changed
        const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
        savedUser.name = formData.name;
        localStorage.setItem('sc_user', JSON.stringify(savedUser));
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again later.' });
    } finally {
      setIsSaving(false);
    }
  }

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
              className="patient-nav-link" 
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
          <div className="patient-avatar" aria-hidden="true">{patientInitials}</div>
        </header>

        <div className="patient-page">
          <section className="patient-welcome">
            <div>
              <p className="patient-eyebrow">PATIENT PROFILE</p>
              <h1>Personal Information</h1>
              <p>View and update your personal and medical details.</p>
            </div>
          </section>

          <article className="profile-card dashboard-form-container">
            {isLoading ? (
              <p style={{ color: '#71809a' }}>Loading profile information...</p>
            ) : (
              <form className="dashboard-form" onSubmit={handleSubmit}>
                {message.text && (
                  <div className={message.type === 'success' ? 'success-message' : 'form-error'}>
                    {message.text}
                  </div>
                )}
                
                <label>
                  Full Name
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </label>
                
                <div className="dashboard-form-row">
                  <label>
                    Phone Number
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                    />
                  </label>
                  
                  <label>
                    Date of Birth
                    <input 
                      type="date" 
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </label>
                  
                  <label>
                    Gender
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>
                
                <label>
                  Residential Address
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter your full residential address"
                    rows={2}
                  />
                </label>
                
                <label>
                  Medical Information & History
                  <textarea 
                    value={formData.medicalInfo}
                    onChange={(e) => setFormData({...formData, medicalInfo: e.target.value})}
                    placeholder="Allergies, ongoing medications, past surgeries, or chronic conditions..."
                    rows={4}
                  />
                </label>
                
                <div className="dashboard-form-actions">
                  <button type="button" className="secondary-action" onClick={() => navigate('/patient/dashboard')}>Cancel</button>
                  <button type="submit" className="primary-action" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
