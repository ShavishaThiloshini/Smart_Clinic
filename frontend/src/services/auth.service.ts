import { apiRequest } from './api';

export async function login(email: string, password: string) {
  return apiRequest<{ token: string; user: { role?: string; name?: string; email?: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
}

export async function register(name: string, email: string, password: string, role: string) {
  return apiRequest<{ token: string; user: { role?: string; name?: string; email?: string } }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  }, false);
}