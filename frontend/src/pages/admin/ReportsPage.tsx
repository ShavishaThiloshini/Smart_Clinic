import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import { useReports } from '../../hooks/useReports';
import { StatCard } from '../../components/admin/StatCard';
import { ReportChart } from '../../components/admin/ReportChart';
import './ReportsPage.css';

const navigation = [
	{ label: 'Dashboard', icon: '⌂', path: '/admin/dashboard' },
	{ label: 'Users', icon: '👥', path: '/admin/users' },
	{ label: 'Doctors', icon: '👨‍⚕️', path: '/admin/doctors' },
	{ label: 'Reports', icon: '📊', path: '/admin/reports' },
];

export function ReportsPage() {
	const navigate = useNavigate();
	const { data, loading, error, fetchReports } = useReports();

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	function logout() {
		localStorage.removeItem('sc_token');
		localStorage.removeItem('sc_user');
		navigate('/login', { replace: true });
	}

	const adminName = (() => {
		try {
			const savedUser = JSON.parse(localStorage.getItem('sc_user') || '{}');
			return savedUser.name || 'Administrator';
		} catch {
			return 'Administrator';
		}
	})();

	return (
		<main className="patient-shell admin-shell">
			<aside className="patient-sidebar admin-sidebar">
				<img className="patient-logo" src={logo} alt="Smart Clinic" />
				<nav aria-label="Admin navigation">
					{navigation.map((nav) => (
						<button 
							className={`patient-nav-link ${nav.label === 'Reports' ? 'active' : ''}`} 
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

				<div className="patient-page reports-page-container">
					<section className="patient-welcome">
						<div>
							<p className="patient-eyebrow">ADMINISTRATION</p>
							<h1>Reports & Analytics</h1>
							<p>View clinic performance, appointment trends, and operational metrics.</p>
						</div>
						<button type="button" className="primary-action" onClick={fetchReports}>
							↻ Refresh Data
						</button>
					</section>

					{error && (
						<div className="alert-error" style={{ marginBottom: '20px' }}>
							{error}
						</div>
					)}

					{loading && !data ? (
						<div className="reports-loading-skeleton">
							<div className="admin-stats-grid">
								{[...Array(4)].map((_, i) => (
									<div key={i} className="admin-stat-card skeleton-card" style={{ height: '110px' }} />
								))}
							</div>
							<div className="reports-chart-skeleton skeleton-card" style={{ height: '350px', marginTop: '24px', borderRadius: '18px' }} />
						</div>
					) : data ? (
						<>
							{/* Summary Cards */}
							<section className="admin-stats-section">
								<div className="admin-stats-grid reports-stats-grid">
									<StatCard 
										title="Total Appointments" 
										value={data.summary.totalAppointments} 
										icon="📅" 
										colorTheme="blue" 
									/>
									<StatCard 
										title="Completed Visits" 
										value={data.summary.completedAppointments} 
										icon="✅" 
										colorTheme="green" 
									/>
									<StatCard 
										title="Pending Requests" 
										value={data.summary.pendingAppointments} 
										icon="⌛" 
										colorTheme="orange" 
									/>
									<StatCard 
										title="Total Patients" 
										value={data.summary.totalPatients} 
										icon="👥" 
										colorTheme="purple" 
									/>
								</div>
							</section>

							<div className="reports-main-grid">
								{/* Appointment Status Chart */}
								<section className="reports-chart-card admin-summary-card">
									<div className="card-heading">
										<div>
											<p className="section-kicker">APPOINTMENTS</p>
											<h2>Status Breakdown</h2>
										</div>
									</div>
									<div className="reports-chart-wrapper">
										<ReportChart 
											breakdown={data.statusBreakdown} 
											total={data.summary.totalAppointments} 
										/>
									</div>
								</section>

								{/* Top Doctors Leaderboard */}
								<section className="reports-leaderboard-card admin-info-card">
									<div className="card-heading">
										<div>
											<p className="section-kicker">PERFORMANCE</p>
											<h2>Top Doctors</h2>
										</div>
									</div>
									
									{data.topDoctors.length > 0 ? (
										<div className="reports-leaderboard">
											{data.topDoctors.map((doc, idx) => (
												<div key={doc.doctorId} className="leaderboard-item">
													<div className="lb-rank">#{idx + 1}</div>
													<div className="lb-info">
														<strong>Dr. {doc.name}</strong>
														<span>{doc.specialization}</span>
													</div>
													<div className="lb-stats">
														<div className="lb-stat" title="Total Appointments">
															<span className="lb-icon">▣</span>
															<span>{doc.appointmentCount}</span>
														</div>
														{doc.averageRating !== null && (
															<div className="lb-stat rating" title="Average Rating">
																<span className="lb-icon">★</span>
																<span>{Number(doc.averageRating).toFixed(1)}</span>
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="reports-empty">
											<span className="reports-empty-icon">🏆</span>
											<p>No doctor performance data available yet.</p>
										</div>
									)}
								</section>
							</div>

							{/* Monthly Trend (Fallback display) */}
							{data.monthlyTrend && data.monthlyTrend.length > 0 && (
								<section className="reports-trend-section">
									<div className="section-title">
										<div>
											<p className="section-kicker">HISTORICAL</p>
											<h2>Monthly Appointment Trend</h2>
										</div>
									</div>
									<div className="reports-trend-list">
										{data.monthlyTrend.map(trend => (
											<div key={trend.month} className="trend-row">
												<span className="trend-month">{trend.month}</span>
												<div className="trend-metrics">
													<span className="trend-metric total" title="Total">Total: <strong>{trend.total}</strong></span>
													<span className="trend-metric completed" title="Completed">Completed: <strong>{trend.completed}</strong></span>
													<span className="trend-metric cancelled" title="Cancelled">Cancelled: <strong>{trend.cancelled}</strong></span>
												</div>
											</div>
										))}
									</div>
								</section>
							)}
						</>
					) : null}
				</div>
			</section>
		</main>
	);
}
