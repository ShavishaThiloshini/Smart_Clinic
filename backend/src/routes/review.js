'use strict';

const express = require('express'); const { protect, authorize } = require('../middleware/auth.middleware'); const { submitReview, getMyReviews, getDoctorReviews, getAllReviews, moderateReview } = require('../controllers/review.controller');
function createReviewRouter() { const router = express.Router(); router.get('/doctor/:doctorId', getDoctorReviews); router.get('/my', protect, authorize('patient'), getMyReviews); router.post('/', protect, authorize('patient'), submitReview); router.get('/admin', protect, authorize('admin'), getAllReviews); router.patch('/:reviewId/status', protect, authorize('admin'), moderateReview); return router; }
module.exports = { createReviewRouter };
