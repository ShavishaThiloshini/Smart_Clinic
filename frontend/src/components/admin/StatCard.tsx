import { ReactNode } from 'react';

type StatCardProps = {
	title: string;
	value: string | number;
	icon: ReactNode;
	colorTheme?: 'blue' | 'teal' | 'green' | 'purple' | 'orange';
};

export function StatCard({ title, value, icon, colorTheme = 'blue' }: StatCardProps) {
	return (
		<article className="admin-stat-card">
			<div className={`admin-stat-icon ${colorTheme}`}>
				{icon}
			</div>
			<div className="admin-stat-content">
				<p className="admin-stat-label">{title}</p>
				<h3 className="admin-stat-value">{value}</h3>
			</div>
		</article>
	);
}
