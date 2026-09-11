import { apiRequest } from './api';

export async function getPatientProfile() {
  return apiRequest<{ success: boolean; profile?: { patientId?: number; name?: string; email?: string; phone?: string; dateOfBirth?: string; gender?: string; address?: string; medicalInfo?: string } }>('/api/patient/profile');
}

export async function updatePatientProfile(profile: any) {
  return apiRequest<{ success: boolean; message?: string }>('/api/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}