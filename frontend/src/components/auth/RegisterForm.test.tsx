import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  it('requires matching passwords before submit', () => {
    render(<RegisterForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Your full name'), {
      target: { value: 'Sample Patient' }
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
      target: { value: 'Patient@1234' }
    });
    fireEvent.change(screen.getByPlaceholderText('Repeat your password'), {
      target: { value: 'Different@1234' }
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('submits valid registration data', () => {
    const onSubmit = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Your full name'), {
      target: { value: 'Sample Patient' }
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
      target: { value: 'Patient@1234' }
    });
    fireEvent.change(screen.getByPlaceholderText('Repeat your password'), {
      target: { value: 'Patient@1234' }
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Sample Patient',
      email: 'patient@example.com',
      role: 'patient',
      password: 'Patient@1234',
      confirmPassword: 'Patient@1234',
      agreeToTerms: true
    });
  });
});
