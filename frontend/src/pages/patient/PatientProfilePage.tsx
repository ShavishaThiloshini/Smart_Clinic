import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import {
  EmergencyContact,
  HealthSummaryCard,
  InformationSection,
  LoadingSkeleton,
  ProfileCompletion,
  ProfileHeader
} from '../../components/patient/profile';

const navigation = [
  { label: 'Dashboard', icon: '⌂', path: '/patient/dashboard' },
  { label: 'Find a doctor', icon: '⌕', path: '/patient/search' },
  { label: 'My appointments', icon: '▣', path: '#' },
  { label: 'Medical records', icon: '▤', path: '#' },
  { label: 'Prescriptions', icon: '▱', path: '#' },
  { label: 'Notifications', icon: '◌', path: '#' }
];

export function PatientProfilePage() {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
        const loadedProfile = {
          ...json.profile,
          dateOfBirth: json.profile.dateOfBirth ? json.profile.dateOfBirth.split('T')[0] : ''
        };
        setProfile(loadedProfile);
        setFormData(loadedProfile);
      } else {
        setMessage({ type: 'error', text: json.message || 'Unable to load profile data right now.' });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      setMessage({ type: 'error', text: 'Unable to load profile data right now.' });
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
        setProfile(formData);
        setIsEditing(false);
        
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

  const personalInfo = [
    { label: 'Full Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Phone Number', value: profile.phone },
    { label: 'Date of Birth', value: profile.dateOfBirth },
    { label: 'Gender', value: profile.gender },
    { label: 'Address', value: profile.address }
  ];

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
          <button className="patient-avatar" type="button" onClick={() => navigate('/patient/profile')} aria-label="Open profile">{patientInitials}</button>
        </header>

        <div className="patient-page profile-redesign">
          {message.text && <div className={`profile-message ${message.type}`}>{message.text}</div>}
          {isLoading ? <LoadingSkeleton /> : isEditing ? (
            <article className="profile-card dashboard-form-container">
              <h2>Edit Profile</h2>
              <form className="dashboard-form" onSubmit={handleSubmit}>
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
                <label>
                  Blood Group
                  <select value={formData.bloodGroup || ''} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}>
                    <option value="">Select blood group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </label>
                <h3 style={{ margin: '8px 0 0', color: '#243451', fontSize: '1.05rem' }}>Emergency Contact</h3>
                <div className="dashboard-form-row">
                  <label>Contact Name<input type="text" value={formData.emergencyContactName || ''} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} /></label>
                  <label>Relationship<input type="text" value={formData.emergencyContactRelation || ''} onChange={(e) => setFormData({...formData, emergencyContactRelation: e.target.value})} /></label>
                  <label>Phone Number<input type="tel" value={formData.emergencyContactPhone || ''} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} /></label>
                </div>
                
                <div className="dashboard-form-actions">
                  <button type="button" className="secondary-action" onClick={() => { setFormData(profile); setIsEditing(false); }}>Cancel</button>
                  <button type="submit" className="primary-action" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </article>
          ) : (
            <div className="profile-view-layout">
              <ProfileHeader profile={profile} onEdit={() => setIsEditing(true)} />
              <ProfileCompletion profile={profile} />
              <HealthSummaryCard
                age={profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : undefined}
                bloodGroup={profile.bloodGroup}
                gender={profile.gender}
                memberSince={profile.memberSince}
              />
              <div className="profile-grid">
                <InformationSection title="Personal Information" data={personalInfo} />
                <EmergencyContact contact={{ name: profile.emergencyContactName, relation: profile.emergencyContactRelation, phone: profile.emergencyContactPhone }} />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
