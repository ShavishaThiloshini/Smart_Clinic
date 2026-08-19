
export function ProfileCompletion({ profile }: any) {
  if (!profile) return null;
  const fields = ['name', 'phone', 'dateOfBirth', 'gender', 'address', 'bloodGroup', 'emergencyContactName'];
  const filled = fields.filter(f => profile[f]).length;
  const percentage = Math.round((filled / fields.length) * 100);

  if (percentage === 100) return null;

  return (
    <div className="completion-card">
      <div className="completion-header">
        <strong>Profile Completion</strong>
        <span>{percentage}%</span>
      </div>
      <div className="completion-bar">
        <div className="completion-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <p>Complete your profile information for a better experience.</p>
    </div>
  );
}
