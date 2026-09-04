interface StarRatingProps {
  rating: number;
  maxStars?: number;
  readOnly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ rating, maxStars = 5, readOnly = false, onRatingChange }: StarRatingProps) {
  return (
    <div className="star-rating" style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;
        
        return (
          <span
            key={i}
            onClick={() => !readOnly && onRatingChange?.(starValue)}
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              color: filled ? '#f5a623' : '#e0e0e0',
              fontSize: '1.5rem',
              lineHeight: 1,
              transition: 'color 0.2s'
            }}
            aria-label={`${starValue} Star${starValue !== 1 ? 's' : ''}`}
            role={readOnly ? 'img' : 'button'}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
