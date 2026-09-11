import { apiRequest } from './api';

export async function getDoctorProfile() {
  return apiRequest<{ success: boolean; profile?: any }>('/api/doctor/profile');
}

export async function updateDoctorProfile(profile: any) {
  return apiRequest<{ success: boolean; message?: string }>('/api/doctor/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function getDoctorById(doctorId: number) {
  return apiRequest<{ success: boolean; doctor?: any }>(`/api/doctors/${doctorId}`);
}

export async function searchDoctors(params: { q?: string; specialization?: string; clinic?: string }) {
  const queryString = new URLSearchParams();
  if (params.q) queryString.append('q', params.q);
  if (params.specialization) queryString.append('specialization', params.specialization);
  if (params.clinic) queryString.append('clinic', params.clinic);
  
  return apiRequest<{ success: boolean; doctors?: any[] }>(`/api/doctors?${queryString.toString()}`);
}