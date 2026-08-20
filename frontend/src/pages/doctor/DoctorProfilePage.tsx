import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

type DoctorProfile = {
  name: string;
  email: string;
  specialization: string;
  clinic: string;
  qualifications: string;
  experience: string;
  consultationFee: string;
  bio: string;
  approvalStatus?: string;
};

const emptyProfile: DoctorProfile = {
  name: '', email: '', specialization: '', clinic: '', qualifications: '',
  experience: '', consultationFee: '', bio: ''
};

export function DoctorProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  const initials = useMemo(() => profile.name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'DR', [profile.name]);
  const profileProgress = useMemo(() => {
    const fields = [profile.name, profile.specialization, profile.clinic, profile.qualifications, profile.experience, profile.consultationFee, profile.bio];
    return Math.round((fields.filter((field) => Boolean(field?.trim())).length / fields.length) * 100);
  }, [profile]);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
    setProfile((current) => ({ ...current, name: savedUser.name || '', email: savedUser.email || '' }));

    async function loadProfile() {
      try {
        const response = await fetch('/api/doctor/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}` }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setProfile((current) => ({ ...current, ...result.profile, experience: result.profile.experience?.toString() || '', consultationFee: result.profile.consultationFee?.toString() || '' }));
        } else if (response.status !== 404) {
          setNotice({ type: 'error', text: result.message || 'Unable to load your profile.' });
        }
      } catch {
        setNotice({ type: 'error', text: 'Unable to reach the profile service. You can still complete the form.' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function update(field: keyof DoctorProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile.name.trim().length < 2) {
      setNotice({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (profile.experience && (!/^\d+$/.test(profile.experience) || Number(profile.experience) > 80)) {
      setNotice({ type: 'error', text: 'Experience must be a whole number between 0 and 80.' });
      return;
    }
    if (profile.consultationFee && (Number.isNaN(Number(profile.consultationFee)) || Number(profile.consultationFee) < 0)) {
      setNotice({ type: 'error', text: 'Consultation fee must be a valid positive amount.' });
      return;
    }

    setSaving(true);
    setNotice({ type: '', text: '' });
    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}` },
        body: JSON.stringify({ ...profile, experience: profile.experience ? Number(profile.experience) : null, consultationFee: profile.consultationFee ? Number(profile.consultationFee) : null })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to save profile.');
      localStorage.setItem('sc_user', JSON.stringify({ ...JSON.parse(localStorage.getItem('sc_user') || '{}'), name: profile.name }));
      setNotice({ type: 'success', text: 'Doctor profile updated successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    navigate('/login', { replace: true });
  }

  return <main className="doctor-profile-shell">
    <aside className="doctor-profile-sidebar">
      <img src={logo} alt="Smart Clinic" />
      <p className="doctor-profile-role">DOCTOR PORTAL</p>
      <nav aria-label="Doctor navigation">
        <button type="button" onClick={() => navigate('/doctor/profile')}>My profile</button>
        <button type="button" disabled>Appointments</button>
        <button type="button" disabled>Patients</button>
        <button type="button" disabled>Availability</button>
      </nav>
      <button className="doctor-signout" type="button" onClick={signOut}>Sign out</button>
    </aside>
    <section className="doctor-profile-content">
      <header className="doctor-profile-header"><span>Account settings</span><div className="doctor-avatar">{initials}</div></header>
      <div className="doctor-profile-page">
        <p className="doctor-profile-kicker">PROFESSIONAL PROFILE</p>
        <h1>My Doctor Profile</h1>
        <p className="doctor-profile-intro">Build a clear, trustworthy profile that patients can understand before booking.</p>
        <section className="doctor-profile-overview" aria-label="Profile overview">
          <article className="doctor-public-preview">
            <div className="doctor-preview-avatar">{initials}</div>
            <div><span>PUBLIC PROFILE PREVIEW</span><h2>{profile.name || 'Your name'}</h2><p>{profile.specialization || 'Add your specialization'} · {profile.clinic || 'Add your clinic'}</p></div>
            <strong className={`doctor-approval ${profile.approvalStatus || 'pending'}`}>{profile.approvalStatus === 'approved' ? 'Verified' : 'Profile review'}</strong>
          </article>
          <article className="doctor-completion-card">
            <div><span>PROFILE READY</span><strong>{profileProgress}%</strong></div>
            <div className="doctor-progress"><i style={{ width: `${profileProgress}%` }} /></div>
            <p>{profileProgress === 100 ? 'Your profile is ready for patients.' : 'Complete your practice details to help patients choose you.'}</p>
          </article>
        </section>
        <form className="doctor-profile-card" onSubmit={saveProfile}>
          {notice.text && <div className={`doctor-notice ${notice.type}`}>{notice.text}</div>}
          {loading ? <p className="doctor-loading">Loading profile information...</p> : <>
            <section className="doctor-form-section"><h2>Account information</h2><div className="doctor-form-grid">
              <label>Full name<input value={profile.name} onChange={(event) => update('name', event.target.value)} required minLength={2} /></label>
              <label>Email address<input value={profile.email} readOnly aria-readonly="true" /></label>
            </div></section>
            <section className="doctor-form-section"><h2>Practice information</h2><div className="doctor-form-grid">
              <label>Specialization<input value={profile.specialization} onChange={(event) => update('specialization', event.target.value)} placeholder="e.g. Cardiology" /></label>
              <label>Clinic<input value={profile.clinic} onChange={(event) => update('clinic', event.target.value)} placeholder="e.g. Smart Clinic Colombo" /></label>
              <label>Years of experience<input type="number" min="0" max="80" value={profile.experience} onChange={(event) => update('experience', event.target.value)} placeholder="e.g. 8" /></label>
              <label>Consultation fee (LKR)<input type="number" min="0" step="0.01" value={profile.consultationFee} onChange={(event) => update('consultationFee', event.target.value)} placeholder="e.g. 3500" /></label>
            </div></section>
            <section className="doctor-form-section"><h2>Professional details</h2>
              <label>Qualifications<textarea value={profile.qualifications} onChange={(event) => update('qualifications', event.target.value)} maxLength={1000} placeholder="Degrees, certifications, and areas of expertise" rows={3} /></label>
              <label>About me<textarea value={profile.bio} onChange={(event) => update('bio', event.target.value)} maxLength={2000} placeholder="Introduce your experience and approach to patient care" rows={5} /></label>
            </section>
            <aside className="doctor-profile-tip"><span>✦ Profile tip</span><p>Patients usually look first for a specialty, clinic, qualifications, and consultation fee. Add these details to make your profile easier to trust.</p></aside>
            <footer className="doctor-form-actions"><button type="button" className="doctor-cancel" onClick={() => navigate('/doctor/profile')}>Reset</button><button type="submit" className="doctor-save" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></footer>
          </>}
        </form>
      </div>
    </section>
  </main>;
}
