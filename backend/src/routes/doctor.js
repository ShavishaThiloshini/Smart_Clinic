'use strict';

/**
 * doctor.js — Doctor API routes
 *
 * Protected routes (doctor role — require JWT):
 *   GET    /api/doctor/profile
 *   PUT    /api/doctor/profile
 *   GET    /api/doctor/availability
 *   PUT    /api/doctor/availability
 *   GET    /api/doctor/appointments
 *   PATCH  /api/doctor/appointments/:id/status
 *
 * Public routes (mounted separately via createPublicDoctorRouter):
 *   GET    /api/doctors                  → listDoctors
 *   GET    /api/doctors/:doctorId        → getDoctorPublicProfile
 */

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  getMyProfile,
  updateMyProfile,
  getMyAvailability,
  setMyAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  listDoctors,
  getDoctorPublicProfile
} = require('../controllers/doctor.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Protected Doctor Router  — /api/doctor/*
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createDoctorRouter
 *
 * All routes require a valid JWT with role = 'doctor'.
 *
 * Usage in app.js:
 *   app.use('/api/doctor', createDoctorRouter());
 */
function createDoctorRouter() {
  const router = express.Router();

  // Every route in this router requires authentication + doctor role
  router.use(protect, authorize('doctor'));

  // ── Profile ────────────────────────────────────────────────────────────────

  /**
   * GET /api/doctor/profile
   * Returns the authenticated doctor's full profile.
   */
  router.get('/profile', getMyProfile);

  /**
   * PUT /api/doctor/profile
   * Body: { name, specialization?, clinic?, qualifications?, experience?, consultationFee?, bio? }
   * Updates the doctor's professional profile.
   */
  router.put('/profile', updateMyProfile);

  // ── Availability ───────────────────────────────────────────────────────────

  /**
   * GET /api/doctor/availability
   * Returns the doctor's weekly availability slots.
   */
  router.get('/availability', getMyAvailability);

  /**
   * PUT /api/doctor/availability
   * Body: { slots: [ { dayOfWeek, startTime, endTime, slotDuration?, status? }, ... ] }
   * Replaces the doctor's entire availability schedule.
   * Send an empty array to clear all slots.
   */
  router.put('/availability', setMyAvailability);

  // ── Appointments ───────────────────────────────────────────────────────────

  /**
   * GET /api/doctor/appointments
   * Query: ?status=pending&date=2026-08-20&page=1&limit=20
   * Returns a paginated list of the doctor's appointments.
   */
  router.get('/appointments', getMyAppointments);

  /**
   * PATCH /api/doctor/appointments/:id/status
   * Body: { status: 'confirmed' | 'completed' | 'cancelled' | 'no-show' }
   * Updates the status of a specific appointment.
   */
  router.patch('/appointments/:id/status', updateAppointmentStatus);

  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Doctors Router  — /api/doctors/*
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createPublicDoctorRouter
 *
 * No authentication required — accessible by anyone (patients, guests).
 *
 * Usage in app.js:
 *   app.use('/api/doctors', createPublicDoctorRouter());
 */
function createPublicDoctorRouter() {
  const router = express.Router();

  /**
   * GET /api/doctors
   * Query: ?name=john&specialization=cardiology&page=1&limit=10
   * Returns a paginated list of approved doctors.
   */
  router.get('/', listDoctors);

  /**
   * GET /api/doctors/:doctorId
   * Returns the public profile + availability of an approved doctor.
   */
  router.get('/:doctorId', getDoctorPublicProfile);

  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { createDoctorRouter, createPublicDoctorRouter };
