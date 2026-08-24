import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

function renderProtectedRoute(token?: string, role?: string) {
  if (token) localStorage.setItem('sc_token', token);
  if (role) localStorage.setItem('sc_user', JSON.stringify({ role }));

  return render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path="/private" element={<div>Private patient page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/patient/dashboard" element={<div>Patient dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to login when no token is stored', () => {
    renderProtectedRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders protected content for allowed role', () => {
    renderProtectedRoute('valid-token', 'patient');
    expect(screen.getByText('Private patient page')).toBeInTheDocument();
  });

  it('redirects disallowed roles away from protected content', () => {
    renderProtectedRoute('valid-token', 'doctor');
    expect(screen.getByText('Patient dashboard')).toBeInTheDocument();
  });
});
