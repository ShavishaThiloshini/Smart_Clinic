import { ROLES } from './constants';

// Check if user has specific role
export function hasRole(userRole: string, requiredRole: string): boolean {
  return userRole === requiredRole;
}

// Check if user has any of the specified roles
export function hasAnyRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// Check if user is patient
export function isPatient(userRole: string): boolean {
  return userRole === ROLES.PATIENT;
}

// Check if user is doctor
export function isDoctor(userRole: string): boolean {
  return userRole === ROLES.DOCTOR;
}

// Check if user is admin
export function isAdmin(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

// Get role display name
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [ROLES.PATIENT]: 'Patient',
    [ROLES.DOCTOR]: 'Doctor',
    [ROLES.ADMIN]: 'Administrator',
  };
  return roleNames[role] || 'Unknown';
}

// Check if role can access patient data
export function canAccessPatientData(userRole: string): boolean {
  return [ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN].includes(userRole);
}

// Check if role can access doctor data
export function canAccessDoctorData(userRole: string): boolean {
  return [ROLES.DOCTOR, ROLES.ADMIN].includes(userRole);
}

// Check if role can manage appointments
export function canManageAppointments(userRole: string): boolean {
  return [ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN].includes(userRole);
}

// Check if role can create medical records
export function canCreateMedicalRecords(userRole: string): boolean {
  return [ROLES.DOCTOR, ROLES.ADMIN].includes(userRole);
}

// Check if role can manage users
export function canManageUsers(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

// Check if role can approve doctors
export function canApproveDoctors(userRole: string): boolean {
  return userRole === ROLES.ADMIN;
}

// Get dashboard route for role
export function getDashboardRoute(role: string): string {
  const routes: Record<string, string> = {
    [ROLES.PATIENT]: '/patient/dashboard',
    [ROLES.DOCTOR]: '/doctor/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
  };
  return routes[role] || '/login';
}