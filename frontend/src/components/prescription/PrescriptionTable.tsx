import type { Prescription } from '../../types/prescription.types';

interface PrescriptionTableProps {
  prescriptions: Prescription[];
  loading: boolean;
  error?: string | null;
  onPrescriptionClick?: (prescription: Prescription) => void;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function PrescriptionTable({ prescriptions, loading, error, onPrescriptionClick }: PrescriptionTableProps) {
  if (loading) {
    return (
      <div className="prescriptions-container">
        <div className="loading-state" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #0066cc', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prescriptions-container">
        <div className="error-state" style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <p className="error-icon" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠</p>
          <p className="error-message" style={{ margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="prescriptions-container">
        <div className="empty-state" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <p className="empty-icon" style={{ fontSize: '2.5rem', margin: '0 0 1rem', color: '#ccc' }}>▱</p>
          <p className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem', color: '#333' }}>No prescriptions yet</p>
          <p className="empty-description" style={{ color: '#666', margin: 0 }}>Your prescriptions will appear here after they are issued by your doctor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-container">
      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="medical-records-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Doctor</th>
              <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Notes</th>
              <th style={{ padding: '1rem', color: '#666', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription) => (
              <tr key={prescription.prescriptionId} className="record-row" style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{formatDate(prescription.createdAt)}</strong>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="doctor-name" style={{ color: '#0066cc', fontWeight: 500 }}>Dr. {prescription.doctorName}</span>
                </td>
                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                  <span className="text-preview" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#555' }}>
                    {prescription.notes || '—'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    type="button" 
                    className="view-button"
                    style={{ backgroundColor: '#f0f7ff', color: '#0066cc', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => onPrescriptionClick?.(prescription)}
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
