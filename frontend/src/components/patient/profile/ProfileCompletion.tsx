export function ProfileCompletion({ profile }: { profile: Record<string, string> }) {
  const fields = ['name', 'phone', 'dateOfBirth', 'gender', 'address'];
  const percent = Math.round(fields.filter((field) => profile[field]).length / fields.length * 100);
  return <section className="completion-card"><div><strong>Profile Completion</strong><strong>{percent}%</strong></div><i><b style={{ width: `${percent}%` }} /></i><p>Complete your profile information for a better experience.</p></section>;
}
