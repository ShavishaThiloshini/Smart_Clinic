import { ProtectedRoute } from './ProtectedRoute';

export function DoctorRoute() {
	return <ProtectedRoute allowedRoles={['doctor']} />;
}
