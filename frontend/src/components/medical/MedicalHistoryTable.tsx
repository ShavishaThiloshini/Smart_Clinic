import type { MedicalRecord } from '../../types/medical.types';

interface MedicalHistoryTableProps {
  records: MedicalRecord[];
  loading: boolean;
  error?: string;
  onRecordClick?: (record: MedicalRecord) => void;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString as string;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function MedicalHistoryTable({ records, loading, error, onRecordClick }: MedicalHistoryTableProps) {
  if (loading) {
    return (
      <div className="medical-records-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your medical records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medical-records-container">
        <div className="error-state">
          <p className="error-icon">⚠</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="medical-records-container">
        <div className="empty-state">
          <p className="empty-icon">📋</p>
          <p className="empty-title">No medical records yet</p>
          <p className="empty-description">Your medical records will appear here after your consultations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medical-records-container">
      <div className="table-wrapper">
        <table className="medical-records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Doctor</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.recordId} className="record-row">
                <td className="record-date">
                  <strong>{formatDate(record.createdAt)}</strong>
                </td>
                <td className="record-doctor">
                  <span className="doctor-name">Dr. {record.doctorName}</span>
                </td>
                <td className="record-diagnosis">
                  <span className="text-preview">{record.diagnosis || '—'}</span>
                </td>
                <td className="record-treatment">
                  <span className="text-preview">{record.treatment || '—'}</span>
                </td>
                <td className="record-actions">
                  <button
                    type="button"
                    className="view-button"
                    onClick={() => onRecordClick?.(record)}
                    aria-label={`View record from ${record.createdAt}`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .medical-records-container {
          width: 100%;
          margin-top: 1.5rem;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .error-message {
          color: #d32f2f;
          font-weight: 500;
          margin: 0;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.5rem 0 0.25rem;
          color: #333;
        }

        .empty-description {
          font-size: 0.875rem;
          margin: 0;
          color: #999;
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

        .record-date {
          color: #333;
        }

        .record-doctor {
          color: #666;
        }

        .doctor-name {
          font-weight: 500;
        }

        .record-diagnosis,
        .record-treatment {
          color: #666;
        }

        .text-preview {
          display: block;
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .record-actions {
          text-align: center;
        }

        .view-button {
          background-color: #0066cc;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .view-button:hover {
          background-color: #0052a3;
        }

        .view-button:active {
          background-color: #003d7a;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .medical-records-container {
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

          .record-date::before { content: 'Date'; }
          .record-doctor::before { content: 'Doctor'; }
          .record-diagnosis::before { content: 'Diagnosis'; }
          .record-treatment::before { content: 'Treatment'; }
          .record-actions::before { content: 'Actions'; }

          .text-preview {
            max-width: none;
            white-space: normal;
            word-wrap: break-word;
          }

          .record-actions {
            text-align: left;
            padding-left: 0.75rem;
          }

          .view-button {
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
