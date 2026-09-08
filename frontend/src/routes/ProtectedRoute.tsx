import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearStoredSession } from '../services/api';

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

	const isExpired = (() => {
		if (!token) return false;
		try {
			const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
			return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
		} catch { return false; }
	})();

	if (!token || isExpired) {
		if (isExpired) clearStoredSession();
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
		if (!user.role) return <Navigate to="/login" replace />;
		return <Navigate to={`/${user.role}/dashboard`} replace />;
	}

	return <Outlet />;
}
