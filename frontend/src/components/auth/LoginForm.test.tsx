import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('shows validation message when required fields are empty', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Please enter your email and password.')).toBeInTheDocument();
  });

  it('submits valid credentials to the parent handler', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'patient@smartclinic.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'Patient@1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'patient@smartclinic.com',
      password: 'Patient@1234',
      rememberMe: false
    });
  });
});
