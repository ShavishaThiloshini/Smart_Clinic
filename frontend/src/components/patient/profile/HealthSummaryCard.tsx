type Props = { age?: number; bloodGroup?: string; gender?: string; memberSince?: string };
export function HealthSummaryCard({ age, bloodGroup, gender, memberSince }: Props) {
  const cards = [['Age', age || '-'], ['Blood Group', bloodGroup || '-'], ['Gender', gender || '-'], ['Member Since', memberSince || '-']];
  return <section className="health-summary-row">{cards.map(([label, value]) => <div className="health-summary-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>;
}
