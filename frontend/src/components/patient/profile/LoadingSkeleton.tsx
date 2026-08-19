
export function LoadingSkeleton() {
  return (
    <div className="skeleton-container">
      <div className="skeleton skeleton-header"></div>
      <div className="skeleton-row">
        <div className="skeleton skeleton-card"></div>
        <div className="skeleton skeleton-card"></div>
        <div className="skeleton skeleton-card"></div>
        <div className="skeleton skeleton-card"></div>
      </div>
      <div className="skeleton skeleton-section"></div>
      <div className="skeleton skeleton-section"></div>
    </div>
  );
}
