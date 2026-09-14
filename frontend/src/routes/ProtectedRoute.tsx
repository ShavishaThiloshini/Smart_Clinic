import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearStoredSession } from '../services/api';

type ProtectedRouteProps = {
	allowedRoles?: string[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
	const location = useLocation();
	const token = localStorage.getItem('sc_token');
	const tokenClaims = (() => {
		if (!token) return false;
		try {
			const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
			return { role: typeof payload.role === 'string' ? payload.role : '', isExpired: typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now() };
		} catch { return null; }
	})();
	const isExpired = !tokenClaims || tokenClaims.isExpired;

	if (!token || isExpired) {
		if (isExpired) clearStoredSession();
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (allowedRoles && (!tokenClaims?.role || !allowedRoles.includes(tokenClaims.role))) {
		if (!tokenClaims?.role) return <Navigate to="/login" replace />;
		return <Navigate to={`/${tokenClaims.role}/dashboard`} replace />;
	}

	return <Outlet />;
}
