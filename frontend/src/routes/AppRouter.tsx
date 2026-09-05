import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { DoctorRoute } from './DoctorRoute';
import { PatientRoute } from './PatientRoute';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AvailabilityPage } from '../pages/doctor/AvailabilityPage';
import { DoctorProfilePage } from '../pages/doctor/DoctorProfilePage';
import { PrescriptionPage } from '../pages/doctor/PrescriptionPage';
import { DoctorSearchPage } from '../pages/patient/DoctorSearchPage';
import { DoctorPublicProfilePage } from '../pages/patient/DoctorPublicProfilePage';
import { AppointmentBookingPage } from '../pages/patient/AppointmentBookingPage';
import { BookingConfirmationPage } from '../pages/patient/BookingConfirmationPage';
import { AppointmentHistoryPage } from '../pages/patient/AppointmentHistoryPage';
import { MedicalRecordsPage } from '../pages/patient/MedicalRecordsPage';
import { PatientDashboard } from '../pages/patient/PatientDashboard';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';
import { PrescriptionsPage } from '../pages/patient/PrescriptionsPage';
import { ReviewPage } from '../pages/patient/ReviewPage';
import { NotificationsPage } from '../pages/patient/NotificationsPage';
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
				<Route path="/patient/appointments" element={<AppointmentHistoryPage />} />
				<Route path="/patient/medical-records" element={<MedicalRecordsPage />} />
				<Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
				<Route path="/patient/reviews" element={<ReviewPage />} />
				<Route path="/patient/notifications" element={<NotificationsPage />} />
				<Route path="/patient/doctor/:doctorId" element={<DoctorPublicProfilePage />} />
				<Route path="/patient/book/:doctorId" element={<AppointmentBookingPage />} />
				<Route path="/patient/booking-confirmation" element={<BookingConfirmationPage />} />
			</Route>

			<Route element={<DoctorRoute />}>
				<Route path="/doctor/dashboard" element={<Navigate to="/doctor/profile" replace />} />
				<Route path="/doctor/profile" element={<DoctorProfilePage />} />
				<Route path="/doctor/availability" element={<AvailabilityPage />} />
				<Route path="/doctor/prescriptions" element={<PrescriptionPage />} />
			</Route>

			<Route element={<AdminRoute />}>
				<Route path="/admin/dashboard" element={<AdminDashboard />} />
			</Route>
			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	);
}
