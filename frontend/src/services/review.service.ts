import type { Review, CreateReviewRequest } from '../types/review.types';
import { apiRequest } from './api';

export async function getDoctorReviews(doctorId: number): Promise<Review[]> {
  const data = await apiRequest<{ reviews?: Review[] }>(`/api/reviews/doctor/${doctorId}`);
  return data.reviews || [];
}

export async function getMyReviews(): Promise<Review[]> {
  const data = await apiRequest<{ reviews?: Review[] }>(`/api/reviews/my`);
  return data.reviews || [];
}

export async function submitReview(payload: CreateReviewRequest): Promise<Review> {
  const data = await apiRequest<{ review: Review }>(`/api/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.review;
}
