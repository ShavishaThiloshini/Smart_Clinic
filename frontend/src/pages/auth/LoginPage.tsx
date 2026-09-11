import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { LoginFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';
import { login } from '../../services/auth.service';

export function LoginPage() {
  const [error, setError]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const navigate                = useNavigate();
  const location                = useLocation();

  useEffect(() => {
    if (location.state?.sessionExpired) setError('Your session expired. Please sign in again.');
  }, [location.state]);

  async function handleLogin(data: LoginFormState) {
    setError('');
    setLoading(true);
    try {
      const json = await login(data.email, data.password);

      // Store token + user in localStorage
      if (!json.token || !json.user?.role) throw new Error('The sign-in response was incomplete. Please try again.');
      localStorage.setItem('sc_token', json.token);
      localStorage.setItem('sc_user',  JSON.stringify(json.user));

      // Redirect based on role
      const role: string = json.user.role;
      if (role === 'admin')   navigate('/admin/dashboard',   { replace: true });
      else if (role === 'doctor') navigate('/doctor/dashboard', { replace: true });
      else                    navigate('/patient/dashboard', { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
        </article>
        <p className="security-note">Your healthcare information is protected.</p>
      </section>
    </main>
  );
}
