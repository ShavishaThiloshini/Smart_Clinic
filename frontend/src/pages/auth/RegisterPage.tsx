import { useState } from 'react';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { RegisterFormState } from '../../types/auth.types';
import logo from '../../assets/images/logo.png';

export function RegisterPage() {
  const [error, setError] = useState('');
  function register(data: RegisterFormState) {
    setError('Registration API is not connected yet. Your Register UI is ready.');
    console.log('Register form submitted', data);
  }
  return <main className="auth-scene"><section className="auth-shell"><header className="brand"><img className="brand-logo" src={logo} alt="Smart Clinic" /></header><article className="auth-card"><RegisterForm onSubmit={register} error={error} /></article><p className="security-note">Secure care starts with a protected account.</p></section></main>;
}
