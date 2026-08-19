
export function HealthSummaryCard({ age, bloodGroup, gender, memberSince }: any) {
  const cards = [
    { label: 'Age', value: age || '-', icon: '📅' },
    { label: 'Blood Group', value: bloodGroup || '-', icon: '🩸' },
    { label: 'Gender', value: gender || '-', icon: '👤' },
    { label: 'Member Since', value: memberSince || '-', icon: '⭐' }
  ];

  return (
    <div className="health-summary-row">
      {cards.map(c => (
        <div key={c.label} className="health-summary-card">
          <div className="hsc-icon">{c.icon}</div>
          <div className="hsc-data">
            <span className="hsc-label">{c.label}</span>
            <span className="hsc-value">{c.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
