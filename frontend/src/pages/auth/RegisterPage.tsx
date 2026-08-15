import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { RegisterFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';

export function RegisterPage() {
  const [error, setError]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate                = useNavigate();

  async function register(data: RegisterFormState) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     data.name,
          email:    data.email,
          password: data.password,
          role:     data.role,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        // Show field-level validation errors if present
        if (json.errors && json.errors.length > 0) {
          setError(json.errors.map((e: { message: string }) => e.message).join(' '));
        } else {
          setError(json.message || 'Registration failed. Please try again.');
        }
        return;
      }

      // Store token + user
      localStorage.setItem('sc_token', json.token);
      localStorage.setItem('sc_user',  JSON.stringify(json.user));

      // Redirect based on role
      const role: string = json.user.role;
      if (role === 'doctor') navigate('/doctor/dashboard',  { replace: true });
      else                   navigate('/patient/dashboard', { replace: true });

    } catch {
      setError('Unable to reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-scene">
      <section className="auth-shell">
        <header className="brand">
          <img className="brand-logo" src={logo} alt="Smart Clinic" />
        </header>
        <article className="auth-card">
          <RegisterForm onSubmit={register} isLoading={isLoading} error={error} />
        </article>
        <p className="security-note">Secure care starts with a protected account.</p>
      </section>
    </main>
  );
}
