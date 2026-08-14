import { FormEvent, useState } from 'react';
import { LoginFormState } from '../../types/auth.types';

interface Props { onSubmit: (data: LoginFormState) => void; isLoading?: boolean; error?: string; }

export function LoginForm({ onSubmit, isLoading = false, error }: Props) {
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.email || !form.password) return setMessage('Please enter your email and password.');
    setMessage(''); onSubmit(form);
  }

  return <form onSubmit={submit} className="auth-form">
    <div className="form-heading"><span className="eyebrow">PATIENT PORTAL</span><h2>Welcome back</h2><p>Sign in to manage your care and appointments.</p></div>
    {(error || message) && <p className="form-error">{error || message}</p>}
    <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
    <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><button type="button" className="icon-button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
    <div className="form-row"><label className="check"><input type="checkbox" checked={form.rememberMe} onChange={e => setForm({ ...form, rememberMe: e.target.checked })} />Remember me</label><a href="#forgot">Forgot password?</a></div>
    <button className="primary-button" disabled={isLoading}>{isLoading ? 'Signing in…' : 'Sign in'}</button>
    <p className="switch-copy">New to Smart Clinic? <a href="/register">Create an account</a></p>
  </form>;
}
