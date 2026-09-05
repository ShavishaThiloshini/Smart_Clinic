import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { useAdmin } from '../../hooks/useAdmin';
import { StatCard } from '../../components/admin/StatCard';

const navigation = [
	{ label: 'Dashboard', icon: '⌂', path: '/admin/dashboard' },
	{ label: 'Users', icon: '👥', path: '/admin/users' },
	{ label: 'Doctors', icon: '👨‍⚕️', path: '/admin/doctors' },
	{ label: 'Specializations', icon: '⚕️', path: '/admin/specializations' },
	{ label: 'Clinics', icon: '🏥', path: '/admin/clinics' },
	{ label: 'Schedules', icon: '📅', path: '/admin/schedules' },
	{ label: 'Appointments', icon: '▣', path: '/admin/appointments' },
	{ label: 'Reviews', icon: '★', path: '/admin/reviews' },
	{ label: 'Reports', icon: '📊', path: '/admin/reports' },
	{ label: 'Audit Logs', icon: '📝', path: '/admin/logs' },
	{ label: 'Settings', icon: '⚙️', path: '/admin/settings' }
];

export function AdminDashboard() {
	const navigate = useNavigate();
	const { stats, loading, error, fetchDashboardStats } = useAdmin();
	
	const adminName = useMemo(() => {
		try {
			const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
			return savedUser.name || 'Administrator';
		} catch {
			return 'Administrator';
		}
	}, []);

	useEffect(() => {
		fetchDashboardStats();
	}, [fetchDashboardStats]);

	function logout() {
		localStorage.removeItem('sc_token');
		localStorage.removeItem('sc_user');
		navigate('/login', { replace: true });
	}

	return (
		<main className="patient-shell admin-shell">
			<aside className="patient-sidebar admin-sidebar">
				<img className="patient-logo" src={logo} alt="Smart Clinic" />
				<nav aria-label="Admin navigation">
					{navigation.map((nav, index) => (
						<button 
							className={`patient-nav-link ${index === 0 ? 'active' : ''}`} 
							key={nav.label} 
							type="button"
							onClick={() => navigate(nav.path)}
						>
							<span aria-hidden="true">{nav.icon}</span>{nav.label}
						</button>
					))}
				</nav>
				<button className="patient-logout" type="button" onClick={logout}>↪ Sign out</button>
			</aside>

			<section className="patient-content">
				<header className="patient-header">
					<button className="mobile-menu" type="button" aria-label="Open navigation">☰</button>
					<div className="patient-header-spacer" />
					<div className="patient-avatar" aria-hidden="true" title="Admin">
						{adminName.charAt(0).toUpperCase()}
					</div>
				</header>

				<div className="patient-page">
					<section className="patient-welcome">
						<div>
							<p className="patient-eyebrow">ADMINISTRATION DASHBOARD</p>
							<h1>Welcome back, {adminName.split(' ')[0]}.</h1>
							<p>Here is an overview of the clinic's system metrics and activity.</p>
						</div>
					</section>

					{error && (
						<div className="alert-error" style={{ marginBottom: '20px' }}>
							{error}
						</div>
					)}

					<section className="admin-stats-section">
						<div className="section-title">
							<div>
								<p className="section-kicker">SYSTEM METRICS</p>
								<h2>Overview</h2>
							</div>
							<button type="button" onClick={fetchDashboardStats}>↻ Refresh</button>
						</div>
						
						{loading || !stats ? (
							<div className="admin-stats-grid">
								{[...Array(4)].map((_, i) => (
									<div key={i} className="admin-stat-card skeleton-card" style={{ height: '110px' }} />
								))}
							</div>
						) : (
							<div className="admin-stats-grid">
								<StatCard 
									title="Total Users" 
									value={stats.totalUsers} 
									icon="👥" 
									colorTheme="blue" 
								/>
								<StatCard 
									title="Total Doctors" 
									value={stats.totalDoctors} 
									icon="👨‍⚕️" 
									colorTheme="teal" 
								/>
								<StatCard 
									title="Total Appointments" 
									value={stats.totalAppointments} 
									icon="📅" 
									colorTheme="purple" 
								/>
								<StatCard 
									title="Pending Appointments" 
									value={stats.pendingAppointments} 
									icon="⌛" 
									colorTheme="orange" 
								/>
							</div>
						)}
					</section>

					<section className="dashboard-grid admin-dashboard-grid">
						<article className="upcoming-card admin-summary-card">
							<div className="card-heading">
								<div>
									<p className="section-kicker">APPOINTMENTS</p>
									<h2>Status Breakdown</h2>
								</div>
							</div>
							{loading || !stats ? (
								<div className="admin-breakdown-skeleton" style={{ height: '150px', marginTop: '20px' }} />
							) : (
								<div className="admin-status-breakdown">
									<div className="breakdown-item">
										<span className="breakdown-label">Confirmed</span>
										<span className="breakdown-val confirmed">{stats.confirmedAppointments}</span>
									</div>
									<div className="breakdown-item">
										<span className="breakdown-label">Completed</span>
										<span className="breakdown-val completed">{stats.completedAppointments}</span>
									</div>
									<div className="breakdown-item">
										<span className="breakdown-label">Pending</span>
										<span className="breakdown-val pending">{stats.pendingAppointments}</span>
									</div>
								</div>
							)}
						</article>

						<article className="care-tip-card admin-info-card">
							<span className="care-tip-icon">ℹ️</span>
							<p className="section-kicker">SYSTEM STATUS</p>
							<h2>All Systems Normal</h2>
							{stats && (
								<p>Currently supporting {stats.activeUsers} active users across the platform.</p>
							)}
						</article>
					</section>

					<section className="quick-access">
						<div className="section-title">
							<div>
								<p className="section-kicker">QUICK ACCESS</p>
								<h2>Management Areas</h2>
							</div>
						</div>
						<div className="quick-grid">
							<button type="button" className="quick-card admin-quick-card" onClick={() => navigate('/admin/users')}>
								<span className="quick-icon blue">👥</span>
								<strong>Manage Users</strong>
								<small>View, add or edit system users</small>
								<i>→</i>
							</button>
							<button type="button" className="quick-card admin-quick-card" onClick={() => navigate('/admin/doctors')}>
								<span className="quick-icon teal">👨‍⚕️</span>
								<strong>Manage Doctors</strong>
								<small>Approve or manage doctor profiles</small>
								<i>→</i>
							</button>
							<button type="button" className="quick-card admin-quick-card" onClick={() => navigate('/admin/appointments')}>
								<span className="quick-icon purple">▣</span>
								<strong>Appointments</strong>
								<small>Monitor clinic-wide appointments</small>
								<i>→</i>
							</button>
							<button type="button" className="quick-card admin-quick-card" onClick={() => navigate('/admin/reports')}>
								<span className="quick-icon orange">📊</span>
								<strong>Reports</strong>
								<small>View operational analytics</small>
								<i>→</i>
							</button>
						</div>
					</section>
				</div>
			</section>
		</main>
	);
}
