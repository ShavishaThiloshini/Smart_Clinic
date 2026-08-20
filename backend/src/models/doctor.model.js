'use strict';

/**
 * doctor.model.js
 *
 * Reusable database query functions for the Doctor module.
 * All functions accept a pool/connection so they can be used
 * inside transactions or standalone queries.
 *
 * Tables involved:
 *   users, doctors, specializations, clinics,
 *   doctor_availability, appointments, patients, reviews
 */

const { pool } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Profile Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full SELECT used for the doctor's own profile view.
 * Returns all professional fields joined with users, specializations, clinics.
 *
 * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} db
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findDoctorByUserId(db, userId) {
  const [rows] = await db.query(
    `SELECT
       d.doctor_id        AS doctorId,
       d.user_id          AS userId,
       u.name,
       u.email,
       u.status           AS accountStatus,
       d.qualifications,
       d.experience,
       d.consultation_fee AS consultationFee,
       d.bio,
       d.approval_status  AS approvalStatus,
       d.created_at       AS memberSince,
       s.specialization_id AS specializationId,
       s.name              AS specialization,
       c.clinic_id         AS clinicId,
       c.name              AS clinic,
       c.address           AS clinicAddress,
       c.phone             AS clinicPhone,
       c.operating_hours   AS clinicHours
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
     LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
     WHERE d.user_id = ?`,
    [userId]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Public profile — used by patients browsing doctors.
 * Includes average rating and review count.
 *
 * @param {number} doctorId
 * @returns {Promise<object|null>}
 */
async function findDoctorById(doctorId) {
  const [rows] = await pool.query(
    `SELECT
       d.doctor_id        AS doctorId,
       u.name,
       d.qualifications,
       d.experience,
       d.consultation_fee AS consultationFee,
       d.bio,
       d.approval_status  AS approvalStatus,
       s.name             AS specialization,
       c.name             AS clinic,
       c.address          AS clinicAddress,
       c.phone            AS clinicPhone,
       c.operating_hours  AS clinicHours,
       ROUND(AVG(r.rating), 1) AS avgRating,
       COUNT(r.review_id)      AS reviewCount
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
     LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
     LEFT JOIN reviews r ON r.doctor_id = d.doctor_id AND r.status = 'approved'
     WHERE d.doctor_id = ?
     GROUP BY d.doctor_id`,
    [doctorId]
  );
  return rows.length ? rows[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Listing / Search
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated doctor search for patients.
 * Filters: name (partial), specialization (partial), approved only.
 *
 * @param {{ name?: string, specialization?: string, page?: number, limit?: number }} filters
 * @returns {Promise<{ doctors: object[], total: number, page: number, limit: number }>}
 */
async function searchDoctors({ name = '', specialization = '', page = 1, limit = 10 } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const params = [];

  // Build WHERE clauses
  const conditions = [`d.approval_status = 'approved'`, `u.status = 'active'`];

  if (name.trim()) {
    conditions.push('u.name LIKE ?');
    params.push(`%${name.trim()}%`);
  }
  if (specialization.trim()) {
    conditions.push('s.name LIKE ?');
    params.push(`%${specialization.trim()}%`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  // Count total matching records
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
     ${where}`,
    params
  );

  // Fetch paginated results
  const [doctors] = await pool.query(
    `SELECT
       d.doctor_id        AS doctorId,
       u.name,
       d.qualifications,
       d.experience,
       d.consultation_fee AS consultationFee,
       d.bio,
       s.name             AS specialization,
       c.name             AS clinic,
       c.address          AS clinicAddress,
       ROUND(AVG(r.rating), 1)  AS avgRating,
       COUNT(r.review_id)       AS reviewCount
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
     LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
     LEFT JOIN reviews r ON r.doctor_id = d.doctor_id AND r.status = 'approved'
     ${where}
     GROUP BY d.doctor_id
     ORDER BY u.name ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    doctors,
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Update Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find an existing specialization by name (case-insensitive) or create it.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {string} name
 * @returns {Promise<number|null>}
 */
async function findOrCreateSpecialization(connection, name) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  const [existing] = await connection.query(
    'SELECT specialization_id AS id FROM specializations WHERE LOWER(name) = LOWER(?)',
    [trimmed]
  );
  if (existing.length) return existing[0].id;
  const [created] = await connection.query(
    'INSERT INTO specializations (name) VALUES (?)',
    [trimmed]
  );
  return created.insertId;
}

/**
 * Find an existing clinic by name (case-insensitive) or create it.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {string} name
 * @returns {Promise<number|null>}
 */
async function findOrCreateClinic(connection, name) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  const [existing] = await connection.query(
    'SELECT clinic_id AS id FROM clinics WHERE LOWER(name) = LOWER(?)',
    [trimmed]
  );
  if (existing.length) return existing[0].id;
  const [created] = await connection.query(
    'INSERT INTO clinics (name) VALUES (?)',
    [trimmed]
  );
  return created.insertId;
}

/**
 * Update the doctor's professional profile (users + doctors tables).
 * Must be called inside an existing transaction.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {number} userId
 * @param {{ name, specializationId, clinicId, qualifications, experience, consultationFee, bio }} data
 * @returns {Promise<boolean>} true if a row was updated
 */
async function updateDoctorProfile(connection, userId, data) {
  const { name, specializationId, clinicId, qualifications, experience, consultationFee, bio } = data;

  await connection.query(
    'UPDATE users SET name = ? WHERE user_id = ?',
    [name, userId]
  );

  const [result] = await connection.query(
    `UPDATE doctors
     SET specialization_id = ?, clinic_id = ?,
         qualifications = ?, experience = ?,
         consultation_fee = ?, bio = ?
     WHERE user_id = ?`,
    [specializationId, clinicId, qualifications || null, experience, consultationFee, bio || null, userId]
  );

  return result.affectedRows > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Availability
// ─────────────────────────────────────────────────────────────────────────────

const VALID_DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

/**
 * Get all availability slots for a doctor.
 *
 * @param {number} doctorId
 * @returns {Promise<object[]>}
 */
async function getAvailability(doctorId) {
  const [rows] = await pool.query(
    `SELECT
       availability_id AS availabilityId,
       day_of_week     AS dayOfWeek,
       start_time      AS startTime,
       end_time        AS endTime,
       slot_duration   AS slotDuration,
       status
     FROM doctor_availability
     WHERE doctor_id = ?
     ORDER BY FIELD(day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), start_time`,
    [doctorId]
  );
  return rows;
}

/**
 * Replace all availability slots for a doctor (delete + re-insert).
 * Must be called inside an existing transaction.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {number} doctorId
 * @param {Array<{ dayOfWeek, startTime, endTime, slotDuration?, status? }>} slots
 */
async function setAvailability(connection, doctorId, slots) {
  await connection.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [doctorId]);
  if (!slots.length) return;

  const values = slots.map(s => [
    doctorId,
    s.dayOfWeek,
    s.startTime,
    s.endTime,
    s.slotDuration || 30,
    s.status !== undefined ? s.status : true
  ]);

  await connection.query(
    `INSERT INTO doctor_availability
       (doctor_id, day_of_week, start_time, end_time, slot_duration, status)
     VALUES ?`,
    [values]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get appointments for a doctor with optional filters.
 *
 * @param {number} doctorId
 * @param {{ status?: string, date?: string, page?: number, limit?: number }} filters
 * @returns {Promise<{ appointments: object[], total: number }>}
 */
async function getDoctorAppointments(doctorId, { status = '', date = '', page = 1, limit = 20 } = {}) {
  const offset = (Math.max(1, page) - 1) * limit;
  const params = [doctorId];
  const conditions = ['a.doctor_id = ?'];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (date) {
    conditions.push('a.appointment_date = ?');
    params.push(date);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM appointments a ${where}`,
    params
  );

  const [appointments] = await pool.query(
    `SELECT
       a.appointment_id   AS appointmentId,
       a.appointment_date AS date,
       a.start_time       AS startTime,
       a.end_time         AS endTime,
       a.queue_number     AS queueNumber,
       a.status,
       a.reason,
       a.created_at       AS bookedAt,
       u.name             AS patientName,
       u.email            AS patientEmail,
       p.phone            AS patientPhone,
       p.date_of_birth    AS patientDob,
       p.gender           AS patientGender,
       c.name             AS clinic
     FROM appointments a
     JOIN patients p ON p.patient_id = a.patient_id
     JOIN users u ON u.user_id = p.user_id
     LEFT JOIN clinics c ON c.clinic_id = a.clinic_id
     ${where}
     ORDER BY a.appointment_date DESC, a.start_time DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    appointments,
    total: Number(total),
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
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
};
