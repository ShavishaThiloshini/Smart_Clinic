import { useState } from 'react';
import { LoginForm } from '../../components/auth/LoginForm';
import { LoginFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';

export function LoginPage() {
  const [error, setError] = useState('');
  function login(data: LoginFormState) {
    setError('Authentication API is not connected yet. Your Login UI is ready.');
    console.log('Login form submitted', data);
  }
  return <main className="auth-scene"><section className="auth-shell"><header className="brand"><img className="brand-logo" src={logo} alt="Smart Clinic" /></header><article className="auth-card"><LoginForm onSubmit={login} error={error} /></article><p className="security-note">Your healthcare information is protected.</p></section></main>;
}
