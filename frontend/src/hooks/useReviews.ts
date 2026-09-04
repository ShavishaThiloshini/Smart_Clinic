import { useState, useCallback } from 'react';
import { getDoctorReviews, getMyReviews, submitReview } from '../services/review.service';
import type { Review, CreateReviewRequest } from '../types/review.types';

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctorReviews = useCallback(async (doctorId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctorReviews(doctorId);
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyReviews();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addReview = useCallback(async (payload: CreateReviewRequest): Promise<Review | null> => {
    setLoading(true);
    setError(null);
    try {
      const record = await submitReview(payload);
      setReviews((prev) => [record, ...prev]);
      return record;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    reviews,
    loading,
    error,
    fetchDoctorReviews,
    fetchMyReviews,
    addReview,
    clearError,
  };
}
