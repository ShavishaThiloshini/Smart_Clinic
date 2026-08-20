type Props = { profile: Record<string, string>; onEdit: () => void };
export function ProfileHeader({ profile, onEdit }: Props) {
  const initials = profile.name ? profile.name.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase() : 'PT';
  return <section className="profile-header-card"><div className="profile-avatar">{initials}</div><div className="profile-header-info"><span>Patient Profile</span><h2>{profile.name || 'Unknown Patient'}</h2><p>Patient ID: {profile.patientId || 'PT-PENDING'} <b>Active</b></p></div><button className="primary-action" onClick={onEdit}>Edit Profile</button></section>;
}
