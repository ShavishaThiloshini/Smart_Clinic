
export function EmergencyContact({ contact }: any) {
  const hasContact = contact && contact.name;
  return (
    <div className="profile-section-card">
      <h3 className="section-title">Emergency Contact</h3>
      {hasContact ? (
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Contact Name</span>
            <span className="info-value">{contact.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Relationship</span>
            <span className="info-value">{contact.relation}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone Number</span>
            <span className="info-value">{contact.phone}</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>No emergency contact has been added yet.</p>
        </div>
      )}
    </div>
  );
}
