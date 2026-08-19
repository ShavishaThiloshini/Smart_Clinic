
export function ProfileHeader({ profile, onEdit }: any) {
  const initials = profile?.name ? profile.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';
  return (
    <div className="profile-header-card">
      <div className="profile-avatar">{initials}</div>
      <div className="profile-header-info">
        <span className="profile-label">Patient Profile</span>
        <h2>{profile?.name || 'Unknown Patient'}</h2>
        <div className="profile-meta">
          <span>Patient ID: {profile?.patientId || 'PT-PENDING'}</span>
          <span className="status-badge active">● {profile?.accountStatus || 'Active'}</span>
        </div>
      </div>
      <button className="primary-action edit-btn" onClick={onEdit}>Edit Profile</button>
    </div>
  );
}
