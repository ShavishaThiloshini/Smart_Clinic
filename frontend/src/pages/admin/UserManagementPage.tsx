import { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUserStatus } from '../../services/admin.service';
import type { AdminUser } from '../../types/admin.types';
import { UserTable } from '../../components/admin/UserTable';
import { AdminLayout } from '../../components/layout/AdminLayout';

export function UserManagementPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [query, setQuery] = useState('');
	const [role, setRole] = useState('');
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(true);
	const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function loadUsers() { setLoading(true); setError(null); try { setUsers(await getAdminUsers({ q: query, role, status })); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load users.'); } finally { setLoading(false); } }
	useEffect(() => { void loadUsers(); }, [query, role, status]);
	async function changeStatus(userId: number, nextStatus: string) { setUpdatingUserId(userId); setError(null); try { await updateAdminUserStatus(userId, nextStatus); await loadUsers(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update user.'); } finally { setUpdatingUserId(null); } }

	return <AdminLayout activePage="users" title="User management" description="Review accounts and control access to the clinic platform."><section className="admin-management-panel"><div className="admin-toolbar"><input aria-label="Search users" placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter users by role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option><option value="patient">Patients</option><option value="doctor">Doctors</option><option value="admin">Admins</option></select><select aria-label="Filter users by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option></select><button className="admin-refresh-button" type="button" onClick={() => void loadUsers()} disabled={loading}>Refresh</button></div>{error && <p className="alert-error">{error}</p>}{loading ? <p className="admin-loading" role="status">Loading users...</p> : <UserTable users={users} updatingUserId={updatingUserId} onStatusChange={changeStatus} />}</section></AdminLayout>;
}
