/**
 * ReportChart — A pure CSS bar chart that visualises the appointment
 * status breakdown (pending / confirmed / completed / cancelled / no-show).
 *
 * Uses no external charting library so there are zero new dependencies.
 */

import type { AppointmentStatusBreakdown } from '../../types/admin.types';

interface ReportChartProps {
	breakdown: AppointmentStatusBreakdown;
	total: number;
}

interface BarDatum {
	label: string;
	value: number;
	cssClass: string;
	bgVar: string;
}

function pct(value: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((value / total) * 100);
}

export function ReportChart({ breakdown, total }: ReportChartProps) {
	const bars: BarDatum[] = [
		{ label: 'Completed',  value: breakdown.completed,  cssClass: 'rc-bar-completed',  bgVar: '#22c55e' },
		{ label: 'Confirmed',  value: breakdown.confirmed,  cssClass: 'rc-bar-confirmed',  bgVar: '#315be7' },
		{ label: 'Pending',    value: breakdown.pending,    cssClass: 'rc-bar-pending',    bgVar: '#f59e0b' },
		{ label: 'Cancelled',  value: breakdown.cancelled,  cssClass: 'rc-bar-cancelled',  bgVar: '#ef4444' },
		{ label: 'No-show',    value: breakdown.noShow,     cssClass: 'rc-bar-noshow',     bgVar: '#8b5cf6' },
	];

	const max = Math.max(...bars.map((b) => b.value), 1);

	if (total === 0) {
		return (
			<div className="rc-empty">
				<span className="rc-empty-icon">📊</span>
				<p>No appointment data to display.</p>
			</div>
		);
	}

	return (
		<div className="rc-root" aria-label="Appointment status chart">
			{/* Stacked proportion strip */}
			<div className="rc-strip" role="img" aria-label="Appointment status proportion strip">
				{bars.map((b) =>
					b.value > 0 ? (
						<div
							key={b.label}
							className="rc-strip-seg"
							style={{ flex: b.value, background: b.bgVar }}
							title={`${b.label}: ${b.value} (${pct(b.value, total)}%)`}
						/>
					) : null
				)}
			</div>

			{/* Bar chart */}
			<div className="rc-bars" aria-hidden="true">
				{bars.map((b) => (
					<div key={b.label} className="rc-bar-item">
						<div className="rc-bar-track">
							<div
								className={`rc-bar-fill ${b.cssClass}`}
								style={{ height: `${(b.value / max) * 100}%`, background: b.bgVar }}
							/>
						</div>
						<span className="rc-bar-value">{b.value}</span>
						<span className="rc-bar-label">{b.label}</span>
					</div>
				))}
			</div>

			{/* Legend row */}
			<div className="rc-legend">
				{bars.map((b) => (
					<div key={b.label} className="rc-legend-item">
						<span className="rc-legend-dot" style={{ background: b.bgVar }} />
						<span className="rc-legend-text">
							{b.label} <strong>{pct(b.value, total)}%</strong>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
