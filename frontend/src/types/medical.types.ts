export type MedicalRecord = {
  recordId: number;
  patientId: number;
  doctorId: number;
  appointmentId: number | null;
  diagnosis: string | null;
  notes: string | null;
  treatment: string | null;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  doctorName: string;
};

export type CreateMedicalRecordRequest = {
  patientId: number;
  appointmentId?: number | null;
  diagnosis?: string | null;
  notes?: string | null;
  treatment?: string | null;
};

export type UpdateMedicalRecordRequest = {
  diagnosis?: string | null;
  notes?: string | null;
  treatment?: string | null;
};
