import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { DoctorRoute } from './DoctorRoute';
import { PatientRoute } from './PatientRoute';
import { AvailabilityPage } from '../pages/doctor/AvailabilityPage';
import { DoctorProfilePage } from '../pages/doctor/DoctorProfilePage';
import { DoctorSearchPage } from '../pages/patient/DoctorSearchPage';
import { PatientDashboard } from '../pages/patient/PatientDashboard';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

export function AppRouter() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />

			<Route element={<PatientRoute />}>
				<Route path="/patient/dashboard" element={<PatientDashboard />} />
				<Route path="/patient/profile" element={<PatientProfilePage />} />
				<Route path="/patient/search" element={<DoctorSearchPage />} />
			</Route>

			<Route element={<DoctorRoute />}>
				<Route path="/doctor/dashboard" element={<Navigate to="/doctor/profile" replace />} />
				<Route path="/doctor/profile" element={<DoctorProfilePage />} />
				<Route path="/doctor/availability" element={<AvailabilityPage />} />
			</Route>

			<Route element={<AdminRoute />}>
				<Route path="/admin/dashboard" element={<Navigate to="/login" replace />} />
			</Route>
			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	);
}
