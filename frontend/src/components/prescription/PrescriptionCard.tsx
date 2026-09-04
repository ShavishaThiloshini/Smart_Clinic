import type { Prescription } from '../../types/prescription.types';

interface PrescriptionCardProps {
  prescription: Prescription;
  onClose: () => void;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function PrescriptionCard({ prescription, onClose }: PrescriptionCardProps) {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={onClose}>
      <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
        
        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fbfc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a' }}>Prescription Details</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9375rem' }}>{formatDate(prescription.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999', padding: '0.5rem' }} aria-label="Close">✕</button>
        </header>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#888', margin: '0 0 0.5rem' }}>DOCTOR</p>
              <p style={{ margin: 0, fontWeight: 500, color: '#333' }}>Dr. {prescription.doctorName}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#888', margin: '0 0 0.5rem' }}>PATIENT</p>
              <p style={{ margin: 0, fontWeight: 500, color: '#333' }}>{prescription.patientName}</p>
            </div>
            {prescription.notes && (
              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#888', margin: '0 0 0.5rem' }}>NOTES</p>
                <p style={{ margin: 0, color: '#444', lineHeight: 1.5 }}>{prescription.notes}</p>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#333' }}>Prescribed Medicines</h3>
          
          {(!prescription.items || prescription.items.length === 0) ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No medicines recorded for this prescription.</p>
          ) : (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>Medicine</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>Dosage</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>Frequency</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#555' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items.map((item, i) => (
                    <tr key={item.itemId || i} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#333' }}>{item.medicineName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{item.dosage || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{item.frequency || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{item.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fbfbfb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.625rem 1.5rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}>Close</button>
        </footer>
      </div>
    </div>
  );
}
