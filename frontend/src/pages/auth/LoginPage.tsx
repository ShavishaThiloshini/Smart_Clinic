import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { LoginFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';

export function LoginPage() {
  const [error, setError]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate                = useNavigate();

  async function login(data: LoginFormState) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, password: data.password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Login failed. Please try again.');
        return;
      }

      // Store token + user in localStorage
      localStorage.setItem('sc_token', json.token);
      localStorage.setItem('sc_user',  JSON.stringify(json.user));

      // Redirect based on role
      const role: string = json.user.role;
      if (role === 'admin')   navigate('/admin/dashboard',   { replace: true });
      else if (role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else                    navigate('/patient/dashboard', { replace: true });

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
          <LoginForm onSubmit={login} isLoading={isLoading} error={error} />
        </article>
        <p className="security-note">Your healthcare information is protected.</p>
      </section>
    </main>
  );
}
