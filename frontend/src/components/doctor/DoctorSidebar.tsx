import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

type DoctorSidebarProps = {
  onSignOut: () => void;
};

const menuItems = [
  { label: 'My Profile', icon: '👤', path: '/doctor/profile' },
  { label: 'Prescriptions', icon: '💊', path: '/doctor/prescriptions' },
  { label: 'Availability', icon: '⏰', path: '/doctor/availability' },
] as const;

export function DoctorSidebar({ onSignOut }: DoctorSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAppointmentsPage = location.pathname === '/doctor/appointments';

  function isActive(path: string) {
    return location.pathname === path;
  }

  return (
    <aside className="doctor-profile-sidebar">
      <img src={logo} alt="Smart Clinic" />
      <p className="doctor-profile-role">DOCTOR PORTAL</p>
      <nav aria-label="Doctor navigation">
        <button
          type="button"
          className={isActive('/doctor/profile') ? 'avail-nav-active' : ''}
          onClick={() => navigate('/doctor/profile')}
        >
          <span aria-hidden="true">👤</span> My Profile
        </button>

        <button
          type="button"
          className={isAppointmentsPage ? 'avail-nav-active' : ''}
          onClick={() => navigate('/doctor/appointments')}
        >
          <span aria-hidden="true">📋</span> Appointments
        </button>

        {menuItems.slice(1).map((item) => (
          <button
            key={item.path}
            type="button"
            className={isActive(item.path) ? 'avail-nav-active' : ''}
            onClick={() => navigate(item.path)}
          >
            <span aria-hidden="true">{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>
      <button className="doctor-signout" type="button" onClick={onSignOut}>Sign out</button>
    </aside>
  );
}
