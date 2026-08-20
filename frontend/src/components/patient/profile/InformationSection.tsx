type Item = { label: string; value?: string };
export function InformationSection({ title, data }: { title: string; data: Item[] }) {
  return <section className="profile-section-card"><h3>{title}</h3><div className="info-grid">{data.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value || '-'}</strong></div>)}</div></section>;
}
