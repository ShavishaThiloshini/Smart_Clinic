import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

type AdminLayoutProps = {
	activePage: 'users' | 'doctors';
	title: string;
	description: string;
	children: ReactNode;
};

export function AdminLayout({ activePage, title, description, children }: AdminLayoutProps) {
	const navigate = useNavigate();

	return (
		<main className="patient-shell admin-shell">
			<aside className="patient-sidebar admin-sidebar">
				<img className="patient-logo" src={logo} alt="Smart Clinic" />
				<nav aria-label="Admin navigation">
					<button className="patient-nav-link" type="button" onClick={() => navigate('/admin/dashboard')}>⌂ Dashboard</button>
					<button className={`patient-nav-link${activePage === 'users' ? ' active' : ''}`} type="button" onClick={() => navigate('/admin/users')}>👥 Users</button>
					<button className={`patient-nav-link${activePage === 'doctors' ? ' active' : ''}`} type="button" onClick={() => navigate('/admin/doctors')}>👨‍⚕️ Doctors</button>
				</nav>
			</aside>
			<section className="patient-content">
				<div className="patient-page">
					<section className="patient-welcome"><div><p className="patient-eyebrow">ADMINISTRATION</p><h1>{title}</h1><p>{description}</p></div></section>
					{children}
				</div>
			</section>
		</main>
	);
}
