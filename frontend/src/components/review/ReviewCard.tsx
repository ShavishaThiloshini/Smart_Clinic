import { StarRating } from './StarRating';
import type { Review } from '../../types/review.types';

interface ReviewCardProps {
  review: Review;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.25rem', color: '#333', fontSize: '1rem' }}>Dr. {review.doctorName}</h4>
          <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>{formatDate(review.createdAt)}</p>
        </div>
        <StarRating rating={review.rating} maxStars={5} readOnly={true} />
      </div>
      
      {review.comment && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.5, fontSize: '0.9375rem', fontStyle: 'italic' }}>
            "{review.comment}"
          </p>
        </div>
      )}
    </div>
  );
}
