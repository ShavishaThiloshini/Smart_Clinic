import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import logo from './assets/images/logo.png';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

function LoadingScreen() {
  return <main className="loading-scene" aria-label="Loading Smart Clinic">
    <div className="loading-orb orb-one" /><div className="loading-orb orb-two" />
    <section className="loading-card">
      <img className="loading-logo" src={logo} alt="Smart Clinic" />
      <p>Preparing your care experience</p>
      <div className="loading-track"><span /></div>
    </section>
  </main>;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
