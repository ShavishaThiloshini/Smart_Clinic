type Contact = { name?: string; relation?: string; phone?: string };
export function EmergencyContact({ contact }: { contact: Contact }) {
  return <section className="profile-section-card"><h3>Emergency Contact</h3>{contact.name ? <div className="info-grid"><div><span>Name</span><strong>{contact.name}</strong></div><div><span>Relationship</span><strong>{contact.relation || '-'}</strong></div><div><span>Phone</span><strong>{contact.phone || '-'}</strong></div></div> : <p className="empty-state">No emergency contact has been added yet.</p>}</section>;
}
