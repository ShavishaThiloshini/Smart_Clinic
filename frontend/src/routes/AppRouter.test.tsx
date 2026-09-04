import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from './AppRouter';

describe('AppRouter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it('renders the login page on the root redirect', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders the register page', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });

  it('protects patient routes without a token', () => {
    render(
      <MemoryRouter initialEntries={['/patient/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders patient dashboard for authenticated patients', () => {
    localStorage.setItem('sc_token', 'demo-token');
    localStorage.setItem('sc_user', JSON.stringify({ name: 'Sample Patient', role: 'patient' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, count: 0 })
    }));

    render(
      <MemoryRouter initialEntries={['/patient/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Good morning, Sample\./i })).toBeInTheDocument();
  });

  it('renders the medical records page for authenticated patients', () => {
    localStorage.setItem('sc_token', 'demo-token');
    localStorage.setItem('sc_user', JSON.stringify({ name: 'Sample Patient', role: 'patient' }));

    vi.stubGlobal('fetch', vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes('/api/patient/profile')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, profile: { patientId: 42 } }) });
      }
      if (url.includes('/api/medical-records/patient/42')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            records: [{
              recordId: 1,
              diagnosis: 'Routine follow-up',
              notes: 'Feels well after treatment.',
              treatment: 'Continue hydration and rest.',
              createdAt: '2026-08-14T00:00:00.000Z',
              doctorName: 'Dr. S. Perera'
            }]
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, count: 0 }) });
    }));

    render(
      <MemoryRouter initialEntries={['/patient/medical-records']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Your medical records/i, level: 1 })).toBeInTheDocument();
  });
});
