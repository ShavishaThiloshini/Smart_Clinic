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
      <div className="table-wrapper">
        <table className="medical-records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription) => (
              <tr key={prescription.prescriptionId} className="record-row">
                <td data-label="Date">
                  <strong>{formatDate(prescription.createdAt)}</strong>
                </td>
                <td data-label="Doctor">
                  <span className="doctor-name">Dr. {prescription.doctorName}</span>
                </td>
                <td data-label="Notes" style={{ maxWidth: '300px' }}>
                  <span className="text-preview">
                    {prescription.notes || '—'}
                  </span>
                </td>
                <td data-label="Actions" style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="view-button prescription-view-button"
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .prescriptions-container {
          width: 100%;
          margin-top: 1.5rem;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .medical-records-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
        }

        .medical-records-table thead {
          background-color: #f5f5f5;
          border-bottom: 2px solid #e0e0e0;
        }

        .medical-records-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .medical-records-table tbody tr {
          border-bottom: 1px solid #e0e0e0;
          transition: background-color 0.2s ease;
        }

        .medical-records-table tbody tr:hover {
          background-color: #fafafa;
        }

        .medical-records-table tbody tr:last-child {
          border-bottom: none;
        }

        .medical-records-table td {
          padding: 1rem;
          font-size: 0.9375rem;
        }

        .doctor-name {
          color: #0066cc;
          font-weight: 500;
        }

        .text-preview {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #555;
        }

        .prescription-view-button {
          background-color: #f0f7ff;
          color: #0066cc;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .prescription-view-button:hover {
          background-color: #e0efff;
        }

        .prescription-view-button:active {
          background-color: #cce5ff;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .prescriptions-container {
            margin-top: 1rem;
          }

          .medical-records-table thead {
            display: none;
          }

          .medical-records-table,
          .medical-records-table tbody,
          .medical-records-table tr,
          .medical-records-table td {
            display: block;
            width: 100%;
          }

          .medical-records-table tbody tr {
            margin-bottom: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
          }

          .medical-records-table tbody tr:hover {
            background-color: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .medical-records-table td {
            padding: 0.75rem;
            position: relative;
            padding-left: 120px;
            border-bottom: 1px solid #f0f0f0;
          }

          .medical-records-table td:last-child {
            border-bottom: none;
          }

          .medical-records-table td::before {
            content: attr(data-label);
            position: absolute;
            left: 0.75rem;
            font-weight: 600;
            color: #333;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            width: 100px;
          }

          .text-preview {
            max-width: none;
            white-space: normal;
            word-wrap: break-word;
          }

          .prescription-view-button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .medical-records-table td {
            padding: 0.5rem;
            padding-left: 100px;
          }

          .medical-records-table td::before {
            width: 90px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
