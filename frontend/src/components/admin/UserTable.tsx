import type { AdminUser } from '../../types/admin.types';

type UserTableProps = {
	users: AdminUser[];
	updatingUserId: number | null;
	onStatusChange: (userId: number, status: string) => void;
};

export function UserTable({ users, updatingUserId, onStatusChange }: UserTableProps) {
	return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>
		{users.map((user) => <tr key={user.userId}><td><strong>{user.name}</strong><small>{user.email}</small></td><td><span className="admin-badge">{user.role}</span></td><td><span className={`admin-status ${user.status}`}>{user.status}</span></td><td>{new Date(user.createdAt).toLocaleDateString('en-GB')}</td><td><select aria-label={`Status for ${user.name}`} value={user.status} disabled={updatingUserId === user.userId} onChange={(event) => onStatusChange(user.userId, event.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option><option value="disabled">Disabled</option></select></td></tr>)}
		{users.length === 0 && <tr><td colSpan={5}>No users match these filters.</td></tr>}
	</tbody></table></div>;
}
