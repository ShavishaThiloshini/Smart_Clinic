import { FormEvent, useState } from 'react';
import { RegisterFormState } from '../../types/auth.types';

interface Props { onSubmit: (data: RegisterFormState) => void; isLoading?: boolean; error?: string; }

export function RegisterForm({ onSubmit, isLoading = false, error }: Props) {
  const [form, setForm] = useState<RegisterFormState>({ name: '', email: '', role: 'patient', password: '', confirmPassword: '', agreeToTerms: false });
  const [message, setMessage] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.email || !form.password) return setMessage('Please complete all required fields.');
    if (form.password !== form.confirmPassword) return setMessage('Passwords do not match.');
    if (!form.agreeToTerms) return setMessage('Please accept the terms to continue.');
    setMessage(''); onSubmit(form);
  }
  return <form onSubmit={submit} className="auth-form">
    <div className="form-heading"><span className="eyebrow">SMART CLINIC</span><h2>Create account</h2><p>Book appointments and keep your care organized.</p></div>
    {(error || message) && <p className="form-error">{error || message}</p>}
    <label>Full name<input autoComplete="name" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
    <label>Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
    <label>I am registering as<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as RegisterFormState['role'] })}><option value="patient">Patient</option><option value="doctor">Doctor</option></select></label>
    <label>Password<input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
    <label>Confirm password<input type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></label>
    <label className="check terms"><input type="checkbox" checked={form.agreeToTerms} onChange={e => setForm({ ...form, agreeToTerms: e.target.checked })} />I agree to the privacy policy and terms.</label>
    <button className="primary-button" disabled={isLoading}>{isLoading ? 'Creating account…' : 'Create account'}</button>
    <p className="switch-copy">Already have an account? <a href="/login">Sign in</a></p>
  </form>;
}
