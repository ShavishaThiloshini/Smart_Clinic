import { ProtectedRoute } from './ProtectedRoute';

export function AdminRoute() {
	return <ProtectedRoute allowedRoles={['admin']} />;
}
