'use strict';

const { pool } = require('../config/db');
const REVIEW_SELECT = `SELECT r.review_id AS reviewId, r.appointment_id AS appointmentId, r.patient_id AS patientId, r.doctor_id AS doctorId, r.rating, r.comment, r.status, r.created_at AS createdAt, pu.name AS patientName, du.name AS doctorName FROM reviews r JOIN patients p ON p.patient_id = r.patient_id JOIN users pu ON pu.user_id = p.user_id JOIN doctors d ON d.doctor_id = r.doctor_id JOIN users du ON du.user_id = d.user_id`;

function positiveId(value) { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; }
function validReviewInput(body) { const { appointmentId, rating, comment } = body || {}; if (!positiveId(appointmentId)) return 'appointmentId must be a positive integer.'; if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'rating must be a whole number between 1 and 5.'; if (comment !== undefined && comment !== null && typeof comment !== 'string') return 'comment must be a string.'; if (typeof comment === 'string' && comment.trim().length > 1000) return 'comment must not exceed 1000 characters.'; return null; }
async function patientIdForUser(userId) { const [rows] = await pool.query('SELECT patient_id AS patientId FROM patients WHERE user_id = ?', [userId]); return rows[0]?.patientId || null; }

async function submitReview(req, res, next) {
  const validationError = validReviewInput(req.body); if (validationError) return res.status(422).json({ success: false, message: validationError });
  const patientId = await patientIdForUser(req.user.userId); if (!patientId) return res.status(404).json({ success: false, message: 'Patient profile not found.' });
  const { appointmentId, rating } = req.body; const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() || null : null;
  try {
    const [appointments] = await pool.query('SELECT patient_id AS patientId, doctor_id AS doctorId, status FROM appointments WHERE appointment_id = ?', [appointmentId]);
    if (!appointments.length) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    const appointment = appointments[0];
    if (appointment.patientId !== patientId) return res.status(403).json({ success: false, message: 'You can only review your own appointments.' });
    if (appointment.status !== 'completed') return res.status(422).json({ success: false, message: 'Only completed appointments can be reviewed.' });
    const [existing] = await pool.query('SELECT review_id FROM reviews WHERE appointment_id = ?', [appointmentId]);
    if (existing.length) return res.status(409).json({ success: false, message: 'A review has already been submitted for this appointment.' });
    const [result] = await pool.query('INSERT INTO reviews (patient_id, doctor_id, appointment_id, rating, comment, status) VALUES (?, ?, ?, ?, ?, \'pending\')', [patientId, appointment.doctorId, appointmentId, rating, comment]);
    await pool.query('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.userId, 'create', 'review', String(result.insertId), 'Patient submitted a review.']);
    const [rows] = await pool.query(`${REVIEW_SELECT} WHERE r.review_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Review submitted for moderation.', review: rows[0] });
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A review has already been submitted for this appointment.' }); next(error); }
}

async function getMyReviews(req, res, next) { try { const patientId = await patientIdForUser(req.user.userId); if (!patientId) return res.status(404).json({ success: false, message: 'Patient profile not found.' }); const [reviews] = await pool.query(`${REVIEW_SELECT} WHERE r.patient_id = ? ORDER BY r.created_at DESC`, [patientId]); return res.json({ success: true, reviews }); } catch (error) { next(error); } }
async function getDoctorReviews(req, res, next) { const doctorId = positiveId(req.params.doctorId); if (!doctorId) return res.status(422).json({ success: false, message: 'doctorId must be a positive integer.' }); try { const [reviews] = await pool.query(`${REVIEW_SELECT} WHERE r.doctor_id = ? AND r.status = 'approved' ORDER BY r.created_at DESC`, [doctorId]); return res.json({ success: true, reviews: reviews.map((review) => ({ ...review, patientName: 'Patient' })) }); } catch (error) { next(error); } }
async function getAllReviews(req, res, next) { const status = req.query.status; if (status && !['pending', 'approved', 'rejected'].includes(status)) return res.status(422).json({ success: false, message: 'status must be pending, approved, or rejected.' }); try { const [reviews] = await pool.query(`${REVIEW_SELECT}${status ? ' WHERE r.status = ?' : ''} ORDER BY r.created_at DESC`, status ? [status] : []); return res.json({ success: true, reviews }); } catch (error) { next(error); } }
async function moderateReview(req, res, next) { const reviewId = positiveId(req.params.reviewId); const { status } = req.body || {}; if (!reviewId) return res.status(422).json({ success: false, message: 'reviewId must be a positive integer.' }); if (!['approved', 'rejected'].includes(status)) return res.status(422).json({ success: false, message: 'status must be approved or rejected.' }); try { const [updated] = await pool.query('UPDATE reviews SET status = ? WHERE review_id = ?', [status, reviewId]); if (!updated.affectedRows) return res.status(404).json({ success: false, message: 'Review not found.' }); await pool.query('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.userId, 'moderate', 'review', String(reviewId), `Review ${status}.`]); const [rows] = await pool.query(`${REVIEW_SELECT} WHERE r.review_id = ?`, [reviewId]); return res.json({ success: true, message: `Review ${status}.`, review: rows[0] }); } catch (error) { next(error); } }

module.exports = { submitReview, getMyReviews, getDoctorReviews, getAllReviews, moderateReview, validReviewInput };
