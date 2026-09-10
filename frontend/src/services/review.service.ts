import type { Review, CreateReviewRequest } from '../types/review.types';
import { apiRequest } from './api';

export async function getDoctorReviews(doctorId: number): Promise<Review[]> {
  const data = await apiRequest<{ success: boolean; reviews?: Review[] }>(`/api/reviews/doctor/${doctorId}`);
  if (!data.success) return [];
  return data.reviews || [];
}

export async function getMyReviews(): Promise<Review[]> {
  const data = await apiRequest<{ success: boolean; reviews?: Review[] }>(`/api/reviews/my`);
  if (!data.success) return [];
  return data.reviews || [];
}

export async function submitReview(payload: CreateReviewRequest): Promise<Review> {
  const data = await apiRequest<{ success: boolean; review: Review }>(`/api/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!data.success) throw new Error('Failed to submit review');
  return data.review;
}
