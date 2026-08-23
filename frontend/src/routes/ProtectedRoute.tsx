import { Navigate, Outlet, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
	allowedRoles?: string[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
	const location = useLocation();
	const token = localStorage.getItem('sc_token');
	const user = (() => {
		try {
			return JSON.parse(localStorage.getItem('sc_user') || '{}') as { role?: string };
		} catch {
			return {};
		}
	})();

	if (!token) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
		if (!user.role) return <Navigate to="/login" replace />;
		return <Navigate to={`/${user.role}/dashboard`} replace />;
	}

	return <Outlet />;
}
