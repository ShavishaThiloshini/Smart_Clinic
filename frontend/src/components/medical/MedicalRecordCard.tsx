import type { MedicalRecord } from '../../types/medical.types';

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onClose?: () => void;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString as string;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
}

function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MedicalRecordCard({ record, onClose }: MedicalRecordCardProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Medical Record</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="record-section">
            <h3 className="section-title">Consultation Information</h3>
            <div className="record-grid">
              <div className="record-field">
                <label className="field-label">Doctor</label>
                <p className="field-value">Dr. {record.doctorName}</p>
              </div>
              <div className="record-field">
                <label className="field-label">Date</label>
                <p className="field-value">{formatDate(record.createdAt)}</p>
              </div>
              <div className="record-field">
                <label className="field-label">Time</label>
                <p className="field-value">{formatTime(record.createdAt) || 'Not specified'}</p>
              </div>
              {record.appointmentId && (
                <div className="record-field">
                  <label className="field-label">Appointment ID</label>
                  <p className="field-value">#{record.appointmentId}</p>
                </div>
              )}
            </div>
          </div>

          <div className="record-section">
            <h3 className="section-title">Clinical Details</h3>
            <div className="record-content">
              {record.diagnosis && (
                <div className="content-item">
                  <h4 className="content-label">Diagnosis</h4>
                  <p className="content-text">{record.diagnosis}</p>
                </div>
              )}
              {record.notes && (
                <div className="content-item">
                  <h4 className="content-label">Notes</h4>
                  <p className="content-text">{record.notes}</p>
                </div>
              )}
              {record.treatment && (
                <div className="content-item">
                  <h4 className="content-label">Treatment</h4>
                  <p className="content-text">{record.treatment}</p>
                </div>
              )}
              {!record.diagnosis && !record.notes && !record.treatment && (
                <p className="no-content">No clinical details recorded.</p>
              )}
            </div>
          </div>

          <div className="record-section metadata">
            <p className="metadata-text">
              Last updated: {formatDate(record.updatedAt)}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .close-button:hover {
          color: #333;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .record-section {
          margin-bottom: 2rem;
        }

        .record-section.metadata {
          margin-bottom: 0;
        }

        .section-title {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0066cc;
        }

        .record-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .record-field {
          display: flex;
          flex-direction: column;
        }

        .field-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #999;
          margin-bottom: 0.25rem;
        }

        .field-value {
          margin: 0;
          font-size: 1rem;
          color: #333;
          font-weight: 500;
        }

        .record-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .content-item {
          display: flex;
          flex-direction: column;
        }

        .content-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .content-text {
          margin: 0;
          font-size: 0.9375rem;
          color: #666;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .no-content {
          margin: 0;
          font-size: 0.9375rem;
          color: #999;
          font-style: italic;
        }

        .metadata-text {
          margin: 0;
          font-size: 0.75rem;
          color: #999;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .secondary-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #e0e0e0;
          padding: 0.625rem 1.25rem;
          border-radius: 4px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background-color: #e0e0e0;
          border-color: #bbb;
        }

        /* Responsive design */
        @media (max-width: 600px) {
          .modal-content {
            max-height: 100vh;
            border-radius: 0;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-title {
            font-size: 1.125rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .record-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .record-section {
            margin-bottom: 1.5rem;
          }

          .record-content {
            gap: 1rem;
          }

          .modal-footer {
            padding: 0.75rem 1rem;
            flex-direction: column-reverse;
          }

          .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
