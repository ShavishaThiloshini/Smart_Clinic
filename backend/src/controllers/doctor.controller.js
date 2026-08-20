'use strict';

/**
 * doctor.controller.js
 *
 * Handles all HTTP logic for the Doctor module.
 *
 * Protected routes (doctor role only — require JWT):
 *   getMyProfile           GET  /api/doctor/profile
 *   updateMyProfile        PUT  /api/doctor/profile
 *   getMyAvailability      GET  /api/doctor/availability
 *   setMyAvailability      PUT  /api/doctor/availability
 *   getMyAppointments      GET  /api/doctor/appointments
 *   updateAppointmentStatus PATCH /api/doctor/appointments/:id/status
 *
 * Public routes (no auth required):
 *   listDoctors            GET  /api/doctors
 *   getDoctorPublicProfile GET  /api/doctors/:doctorId
 */

const { pool } = require('../config/db');
const {
  findDoctorByUserId,
  findDoctorById,
  searchDoctors,
  findOrCreateSpecialization,
  findOrCreateClinic,
  updateDoctorProfile,
  getAvailability,
  setAvailability,
  getDoctorAppointments,
  VALID_DAYS
} = require('../models/doctor.model');

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const ALLOWED_APPOINTMENT_STATUSES = new Set(['confirmed', 'completed', 'cancelled', 'no-show']);

/**
 * Validate profile update body.
 * Returns { error } or { value }.
 */
function validateProfileBody(body) {
  const errors = {};
  const { name, experience, consultationFee } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }
  if (experience !== undefined && experience !== null && experience !== '') {
    const exp = Number(experience);
    if (!Number.isInteger(exp) || exp < 0 || exp > 80) {
      errors.experience = 'Experience must be a whole number between 0 and 80.';
    }
  }
  if (consultationFee !== undefined && consultationFee !== null && consultationFee !== '') {
    const fee = Number(consultationFee);
    if (!Number.isFinite(fee) || fee < 0) {
      errors.consultationFee = 'Consultation fee must be a positive number.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { error: { message: 'Please correct the highlighted fields.', errors } };
  }

  return {
    value: {
      name: name.trim(),
      specialization: (body.specialization || '').trim(),
      clinic: (body.clinic || '').trim(),
      qualifications: (body.qualifications || '').trim() || null,
      experience: (experience !== undefined && experience !== null && experience !== '') ? Number(experience) : null,
      consultationFee: (consultationFee !== undefined && consultationFee !== null && consultationFee !== '') ? Number(consultationFee) : null,
      bio: (body.bio || '').trim() || null
    }
  };
}

/**
 * Validate an array of availability slots.
 * Returns { error } or { value: validatedSlots }.
 */
function validateAvailabilitySlots(slots) {
  if (!Array.isArray(slots)) {
    return { error: 'slots must be an array.' };
  }
  if (slots.length > 50) {
    return { error: 'Maximum 50 availability slots allowed.' };
  }

  const validated = [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (!s || typeof s !== 'object') {
      return { error: `Slot ${i + 1}: must be an object.` };
    }
    if (!VALID_DAYS.has(s.dayOfWeek)) {
      return { error: `Slot ${i + 1}: dayOfWeek must be a valid day (Monday–Sunday).` };
    }
    if (!s.startTime || !TIME_REGEX.test(s.startTime)) {
      return { error: `Slot ${i + 1}: startTime must be in HH:MM format.` };
    }
    if (!s.endTime || !TIME_REGEX.test(s.endTime)) {
      return { error: `Slot ${i + 1}: endTime must be in HH:MM format.` };
    }
    if (s.startTime >= s.endTime) {
      return { error: `Slot ${i + 1}: startTime must be earlier than endTime.` };
    }
    const duration = s.slotDuration !== undefined ? Number(s.slotDuration) : 30;
    if (!Number.isInteger(duration) || duration < 5 || duration > 240) {
      return { error: `Slot ${i + 1}: slotDuration must be between 5 and 240 minutes.` };
    }
    validated.push({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: duration,
      status: s.status !== false   // default true
    });
  }
  return { value: validated };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/doctor/profile  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor views their own full profile.
 */
async function getMyProfile(req, res, next) {
  try {
    const profile = await findDoctorByUserId(pool, req.user.userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PUT /api/doctor/profile  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor updates their own professional profile.
 *
 * Body (all optional except name):
 *   name, specialization, clinic, qualifications,
 *   experience, consultationFee, bio
 */
async function updateMyProfile(req, res, next) {
  const validation = validateProfileBody(req.body);
  if (validation.error) {
    return res.status(422).json({ success: false, ...validation.error });
  }

  const { name, specialization, clinic, qualifications, experience, consultationFee, bio } = validation.value;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const specializationId = await findOrCreateSpecialization(connection, specialization);
    const clinicId = await findOrCreateClinic(connection, clinic);

    const updated = await updateDoctorProfile(connection, req.user.userId, {
      name,
      specializationId,
      clinicId,
      qualifications,
      experience,
      consultationFee,
      bio
    });

    if (!updated) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    await connection.commit();

    // Re-fetch the updated profile to return fresh data
    const profile = await findDoctorByUserId(pool, req.user.userId);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/doctor/availability  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor reads their weekly availability schedule.
 */
async function getMyAvailability(req, res, next) {
  try {
    // Resolve doctorId from userId
    const [[doctor]] = await pool.query(
      'SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?',
      [req.user.userId]
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor record not found.' });
    }

    const slots = await getAvailability(doctor.doctorId);
    return res.status(200).json({ success: true, availability: slots });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PUT /api/doctor/availability  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor replaces their entire weekly availability.
 *
 * Body: { slots: [ { dayOfWeek, startTime, endTime, slotDuration?, status? }, ... ] }
 *
 * Sending an empty slots array clears all existing slots.
 */
async function setMyAvailability(req, res, next) {
  const { slots = [] } = req.body || {};

  const validation = validateAvailabilitySlots(slots);
  if (validation.error) {
    return res.status(422).json({ success: false, message: validation.error });
  }

  const connection = await pool.getConnection();
  try {
    // Resolve doctorId
    const [[doctor]] = await connection.query(
      'SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?',
      [req.user.userId]
    );
    if (!doctor) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Doctor record not found.' });
    }

    await connection.beginTransaction();
    await setAvailability(connection, doctor.doctorId, validation.value);
    await connection.commit();

    // Re-fetch the saved availability
    const saved = await getAvailability(doctor.doctorId);
    return res.status(200).json({
      success: true,
      message: `Availability updated. ${saved.length} slot(s) saved.`,
      availability: saved
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/doctor/appointments  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor views their appointments.
 *
 * Query params (all optional):
 *   status  — filter by appointment status
 *   date    — filter by date (YYYY-MM-DD)
 *   page    — pagination (default 1)
 *   limit   — results per page (default 20, max 50)
 */
async function getMyAppointments(req, res, next) {
  try {
    const [[doctor]] = await pool.query(
      'SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?',
      [req.user.userId]
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor record not found.' });
    }

    const { status, date, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 50);

    const result = await getDoctorAppointments(doctor.doctorId, {
      status: status || '',
      date: date || '',
      page: Number(page),
      limit: safeLimit
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PATCH /api/doctor/appointments/:id/status  (doctor only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Doctor updates the status of one of their appointments.
 *
 * Body: { status: 'confirmed' | 'completed' | 'cancelled' | 'no-show' }
 *
 * Rules:
 *  - Only the doctor assigned to the appointment may update it.
 *  - Cannot change a cancelled or completed appointment.
 */
async function updateAppointmentStatus(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
    }

    const { status } = req.body || {};
    if (!status || !ALLOWED_APPOINTMENT_STATUSES.has(status)) {
      return res.status(422).json({
        success: false,
        message: `Status must be one of: ${[...ALLOWED_APPOINTMENT_STATUSES].join(', ')}.`
      });
    }

    // Verify the appointment belongs to this doctor
    const [[appointment]] = await pool.query(
      `SELECT a.appointment_id, a.status, d.user_id AS doctorUserId
       FROM appointments a
       JOIN doctors d ON d.doctor_id = a.doctor_id
       WHERE a.appointment_id = ?`,
      [appointmentId]
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (appointment.doctorUserId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this appointment.' });
    }
    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot update a ${appointment.status} appointment.`
      });
    }

    await pool.query(
      'UPDATE appointments SET status = ? WHERE appointment_id = ?',
      [status, appointmentId]
    );

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to "${status}".`,
      appointmentId,
      status
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /api/doctors  (public)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Public doctor listing with search and pagination.
 *
 * Query params (all optional):
 *   name           — partial name search
 *   specialization — partial specialization search
 *   page           — page number (default 1)
 *   limit          — results per page (default 10, max 50)
 */
async function listDoctors(req, res, next) {
  try {
    const { name = '', specialization = '', page = 1, limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit) || 10, 50);

    const result = await searchDoctors({
      name: String(name),
      specialization: String(specialization),
      page: Number(page),
      limit: safeLimit
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /api/doctors/:doctorId  (public)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Public doctor profile — patients use this to view doctor details.
 * Only returns approved doctors.
 */
async function getDoctorPublicProfile(req, res, next) {
  try {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
    }

    const profile = await findDoctorById(doctorId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    if (profile.approvalStatus !== 'approved') {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Also fetch availability for the public profile
    const availability = await getAvailability(doctorId);

    return res.status(200).json({ success: true, profile, availability });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyAvailability,
  setMyAvailability,
  getMyAppointments,
  updateAppointmentStatus,
  listDoctors,
  getDoctorPublicProfile
};
