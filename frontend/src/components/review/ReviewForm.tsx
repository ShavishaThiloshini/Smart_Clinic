import { useState } from 'react';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  appointmentId: number;
  doctorName: string;
  date: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
}

export function ReviewForm({ appointmentId, doctorName, date, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await onSubmit(rating, comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      setLoading(false); // only reset loading on error so the form doesn't flicker while closing
    }
  };

  return (
    <div className="review-form-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={onCancel}>
      <div className="review-form-container" style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#333' }}>Write a Review</h2>
        <p style={{ margin: '0 0 1.5rem', color: '#666', fontSize: '0.9375rem' }}>For your appointment with Dr. {doctorName} on {date}</p>
        
        {error && (
          <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 600, color: '#333' }}>How was your experience?</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#333' }}>Additional comments (optional)</label>
            <textarea
              id="comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us about your visit..."
              rows={4}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onCancel} disabled={loading} style={{ padding: '0.625rem 1.25rem', backgroundColor: 'transparent', color: '#666', border: '1px solid #ccc', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '0.625rem 1.25rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
