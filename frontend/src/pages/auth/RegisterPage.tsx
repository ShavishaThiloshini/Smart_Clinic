import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { RegisterFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';
import { register } from '../../services/auth.service';

export function RegisterPage() {
  const [error, setError]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate                = useNavigate();

  async function handleRegister(data: RegisterFormState) {
    setError('');
    setLoading(true);
    try {
      const json = await register(data.name, data.email, data.password, data.role);

      // Store token + user
      if (!json.token || !json.user?.role) throw new Error('The registration response was incomplete. Please try again.');
      localStorage.setItem('sc_token', json.token);
      localStorage.setItem('sc_user',  JSON.stringify(json.user));

      // Redirect based on role
      const role: string = json.user.role;
      if (role === 'doctor') navigate('/doctor/dashboard',  { replace: true });
      else                   navigate('/patient/dashboard', { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
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
          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />
        </article>
        <p className="security-note">Secure care starts with a protected account.</p>
      </section>
    </main>
  );
}
