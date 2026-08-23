import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import logo from './assets/images/logo.png';
import { AppRouter } from './routes/AppRouter';
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
      <AppRouter />
    </BrowserRouter>
  );
}
