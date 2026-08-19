import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import {
  ProfileHeader,
  HealthSummaryCard,
  InformationSection,
  EmergencyContact,
  ProfileCompletion,
  LoadingSkeleton
} from '../../components/patient/profile';

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

  const [profile, setProfile] = useState<any>({});
  const [formData, setFormData] = useState<any>({});

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
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const p = json.profile;
        if (p.dateOfBirth) p.dateOfBirth = p.dateOfBirth.split('T')[0];
        if (p.memberSince) p.memberSince = p.memberSince.split('T')[0].split('-')[0];

        setProfile(p);
        setFormData(p);
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
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
        setProfile(formData);
        setIsEditing(false);

        const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
        savedUser.name = formData.name;
        localStorage.setItem('sc_user', JSON.stringify(savedUser));

        // Hide success message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: json.message || 'Unable to update your profile right now. Please try again.' });
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

  const personalInfoData = [
    { label: 'Full Name', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Phone Number', value: profile.phone },
    { label: 'Date of Birth', value: profile.dateOfBirth },
    { label: 'Gender', value: profile.gender },
    { label: 'Address', value: profile.address }
  ];

  const accountInfoData = [
    { label: 'Patient ID', value: profile.patientId || 'PT-PENDING' },
    { label: 'Account Status', value: profile.accountStatus || 'Active' },
    { label: 'Member Since', value: profile.memberSince || '-' },
  ];

  return (
    <main className="patient-shell">
      <aside className="patient-sidebar">
        <img className="patient-logo" src={logo} alt="Smart Clinic" />
        <nav aria-label="Patient navigation">
          {navigation.map((nav, idx) => (
            <button 
              className={`patient-nav-link ${idx === 0 ? 'active' : ''}`}
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
          <div className="patient-avatar" aria-hidden="true" title="View Profile" style={{ cursor: 'pointer' }}>
            {patientInitials}
          </div>
        </header>

        <div className="patient-page profile-redesign">
          {message.text && (
            <div className={`toast-notification ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {isLoading ? (
            <LoadingSkeleton />
          ) : isEditing ? (
             <article className="profile-card dashboard-form-container edit-mode-card">
               <h2 className="section-title" style={{marginBottom: '24px'}}>Edit Profile</h2>
               <form className="dashboard-form" onSubmit={handleSubmit}>
                 <div className="dashboard-form-row">
                   <label>Full Name
                     <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                   </label>
                   <label>Email
                     <input type="email" value={formData.email || ''} disabled style={{opacity: 0.7, cursor: 'not-allowed'}} />
                   </label>
                 </div>
                 <div className="dashboard-form-row">
                   <label>Phone Number
                     <input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </label>
                   <label>Date of Birth
                     <input type="date" value={formData.dateOfBirth || ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                   </label>
                 </div>
                 <div className="dashboard-form-row">
                   <label>Gender
                     <select value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})}>
                       <option value="">Select</option>
                       <option value="male">Male</option>
                       <option value="female">Female</option>
                       <option value="other">Other</option>
                     </select>
                   </label>
                   <label>Blood Group
                     <select value={formData.bloodGroup || ''} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                       <option value="">Select</option>
                       <option value="A+">A+</option>
                       <option value="A-">A-</option>
                       <option value="B+">B+</option>
                       <option value="B-">B-</option>
                       <option value="O+">O+</option>
                       <option value="O-">O-</option>
                       <option value="AB+">AB+</option>
                       <option value="AB-">AB-</option>
                     </select>
                   </label>
                 </div>
                 <label>Address
                   <textarea value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} />
                 </label>
                 <label>Medical Information
                   <textarea value={formData.medicalInfo || ''} onChange={e => setFormData({...formData, medicalInfo: e.target.value})} rows={3} />
                 </label>
                 
                 <h3 className="section-title" style={{marginTop: '16px', marginBottom: '8px', fontSize: '1.1rem'}}>Emergency Contact</h3>
                 <div className="dashboard-form-row">
                   <label>Contact Name
                     <input type="text" value={formData.emergencyContactName || ''} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} />
                   </label>
                   <label>Relationship
                     <input type="text" value={formData.emergencyContactRelation || ''} onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} />
                   </label>
                   <label>Phone Number
                     <input type="tel" value={formData.emergencyContactPhone || ''} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} />
                   </label>
                 </div>
                 
                 <div className="dashboard-form-actions">
                   <button type="button" className="secondary-action" onClick={() => setIsEditing(false)}>Cancel</button>
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
                age={profile.dateOfBirth ? (new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()) : null}
                bloodGroup={profile.bloodGroup}
                gender={profile.gender}
                memberSince={profile.memberSince}
              />
              
              <div className="profile-grid">
                <InformationSection title="Personal Information" data={personalInfoData} />
                <div className="profile-grid-column">
                  <EmergencyContact contact={{
                    name: profile.emergencyContactName,
                    relation: profile.emergencyContactRelation,
                    phone: profile.emergencyContactPhone
                  }} />
                  <InformationSection title="Account Information" data={accountInfoData} />
                  
                  <div className="profile-section-card">
                    <h3 className="section-title">Account & Security</h3>
                    <div className="info-grid single-col">
                      <div className="info-item">
                        <span className="info-label">Password</span>
                        <div className="password-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span className="info-value">••••••••••••</span>
                          <button className="secondary-action small">Change</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section >
    </main >
  );
}
