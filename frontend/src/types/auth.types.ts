export type UserRole = 'patient' | 'doctor' | 'admin';

export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormState {
  name: string;
  email: string;
  role: 'patient' | 'doctor';
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}
