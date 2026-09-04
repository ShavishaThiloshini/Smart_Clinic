export type PrescriptionItem = {
  itemId?: number;
  prescriptionId?: number;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
};

export type Prescription = {
  prescriptionId: number;
  patientId: number;
  doctorId: number;
  appointmentId: number | null;
  notes: string | null;
  createdAt: string;
  patientName: string;
  doctorName: string;
  items?: PrescriptionItem[];
};

export type CreatePrescriptionRequest = {
  patientId: number;
  appointmentId?: number | null;
  notes?: string | null;
  items: PrescriptionItem[];
};
