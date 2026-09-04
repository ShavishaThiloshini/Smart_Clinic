export type Review = {
  reviewId: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  patientName: string;
  doctorName: string;
};

export type CreateReviewRequest = {
  appointmentId: number;
  rating: number;
  comment?: string | null;
};
