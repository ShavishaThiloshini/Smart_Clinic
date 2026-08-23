import { ProtectedRoute } from './ProtectedRoute';

export function PatientRoute() {
	return <ProtectedRoute allowedRoles={['patient']} />;
}
