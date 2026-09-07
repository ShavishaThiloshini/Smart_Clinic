import type { AdminDoctor } from '../../types/admin.types';

type DoctorManagementTableProps = {
	doctors: AdminDoctor[];
	updatingDoctorId: number | null;
	onApprovalChange: (doctorId: number, approvalStatus: string) => void;
};

export function DoctorManagementTable({ doctors, updatingDoctorId, onApprovalChange }: DoctorManagementTableProps) {
	return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Doctor</th><th>Specialization</th><th>Clinic</th><th>Account</th><th>Approval</th></tr></thead><tbody>
		{doctors.map((doctor) => <tr key={doctor.doctorId}><td><strong>{doctor.name}</strong><small>{doctor.email}</small></td><td>{doctor.specialization || 'Not assigned'}</td><td>{doctor.clinic || 'Not assigned'}</td><td><span className={`admin-status ${doctor.status}`}>{doctor.status}</span></td><td><select aria-label={`Approval for ${doctor.name}`} value={doctor.approvalStatus} disabled={updatingDoctorId === doctor.doctorId} onChange={(event) => onApprovalChange(doctor.doctorId, event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></td></tr>)}
		{doctors.length === 0 && <tr><td colSpan={5}>No doctors found.</td></tr>}
	</tbody></table></div>;
}
