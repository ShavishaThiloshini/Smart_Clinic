import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRouter } from './AppRouter';

describe('AppRouter', () => {
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

    render(
      <MemoryRouter initialEntries={['/patient/dashboard']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Good morning, Sample\./i })).toBeInTheDocument();
  });
});
