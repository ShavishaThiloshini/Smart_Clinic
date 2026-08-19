
export function InformationSection({ title, data }: any) {
  return (
    <div className="profile-section-card">
      <h3 className="section-title">{title}</h3>
      <div className="info-grid">
        {data.map((item: any, i: number) => (
          <div key={i} className="info-item">
            <span className="info-label">{item.label}</span>
            <span className="info-value">{item.value || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
