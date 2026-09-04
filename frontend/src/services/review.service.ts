import type { Review, CreateReviewRequest } from '../types/review.types';

function authHeaders(includeJson = false): HeadersInit {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('sc_token') || ''}`,
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, headers: { ...authHeaders(Boolean(options.body)), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete review action.');
  return data;
}

export async function getDoctorReviews(doctorId: number): Promise<Review[]> {
  const data = await request<{ reviews?: Review[] }>(`/api/reviews/doctor/${doctorId}`);
  return data.reviews || [];
}

export async function getMyReviews(): Promise<Review[]> {
  const data = await request<{ reviews?: Review[] }>(`/api/reviews/my`);
  return data.reviews || [];
}

export async function submitReview(payload: CreateReviewRequest): Promise<Review> {
  const data = await request<{ review: Review }>(`/api/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.review;
}
