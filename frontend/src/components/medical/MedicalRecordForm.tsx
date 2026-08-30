import { useState } from 'react';
import type { CreateMedicalRecordRequest, UpdateMedicalRecordRequest } from '../../types/medical.types';

interface MedicalRecordFormProps {
  isEditing?: boolean;
  onSubmit: (data: CreateMedicalRecordRequest | UpdateMedicalRecordRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  initialData?: {
    diagnosis?: string;
    notes?: string;
    treatment?: string;
    patientId?: number;
    appointmentId?: number | null;
  };
}

export function MedicalRecordForm({
  isEditing = false,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialData = {}
}: MedicalRecordFormProps) {
  const [diagnosis, setDiagnosis] = useState(initialData.diagnosis || '');
  const [notes, setNotes] = useState(initialData.notes || '');
  const [treatment, setTreatment] = useState(initialData.treatment || '');
  const [patientId, setPatientId] = useState(initialData.patientId || '');
  const [appointmentId, setAppointmentId] = useState(initialData.appointmentId || '');
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');

    try {
      if (isEditing) {
        const payload: UpdateMedicalRecordRequest = {};
        if (diagnosis) payload.diagnosis = diagnosis;
        if (notes) payload.notes = notes;
        if (treatment) payload.treatment = treatment;
        await onSubmit(payload);
      } else {
        if (!patientId) {
          setSubmitError('Patient ID is required');
          return;
        }

        const payload: CreateMedicalRecordRequest = {
          patientId: Number(patientId),
          diagnosis: diagnosis || undefined,
          notes: notes || undefined,
          treatment: treatment || undefined,
          appointmentId: appointmentId ? Number(appointmentId) : undefined
        };
        await onSubmit(payload);
      }

      // Reset form on success
      if (!isEditing) {
        setDiagnosis('');
        setNotes('');
        setTreatment('');
        setPatientId('');
        setAppointmentId('');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save medical record');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="medical-record-form">
      <fieldset disabled={isLoading}>
        {(error || submitError) && (
          <div className="form-error">
            <p className="error-icon">⚠</p>
            <p className="error-text">{error || submitError}</p>
          </div>
        )}

        {!isEditing && (
          <>
            <div className="form-group">
              <label htmlFor="patientId" className="form-label">
                Patient ID <span className="required">*</span>
              </label>
              <input
                id="patientId"
                type="number"
                min="1"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="appointmentId" className="form-label">
                Appointment ID <span className="optional">(optional)</span>
              </label>
              <input
                id="appointmentId"
                type="number"
                min="1"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Enter appointment ID"
                className="form-input"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="diagnosis" className="form-label">
            Diagnosis <span className="optional">(optional)</span>
          </label>
          <textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter diagnosis"
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Notes <span className="optional">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter consultation notes"
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="treatment" className="form-label">
            Treatment Plan <span className="optional">(optional)</span>
          </label>
          <textarea
            id="treatment"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="Enter treatment plan"
            className="form-textarea"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Record' : 'Create Record'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </fieldset>

      <style jsx>{`
        .medical-record-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 1.5rem;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        fieldset {
          border: none;
          padding: 0;
          margin: 0;
        }

        fieldset:disabled {
          opacity: 0.7;
          pointer-events: none;
        }

        .form-error {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #fce4ec;
          border: 1px solid #f8bbd0;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .error-icon {
          margin: 0;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .error-text {
          margin: 0;
          color: #c2185b;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #333;
        }

        .required {
          color: #d32f2f;
        }

        .optional {
          color: #999;
          font-weight: 400;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .primary-button,
        .secondary-button {
          padding: 0.625rem 1.25rem;
          border-radius: 4px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .primary-button {
          background-color: #0066cc;
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .primary-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .secondary-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #e0e0e0;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #e0e0e0;
        }

        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .medical-record-form {
            padding: 1rem;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
