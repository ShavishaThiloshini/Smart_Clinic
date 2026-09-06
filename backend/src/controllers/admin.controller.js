'use strict';

const { pool } = require('../config/db');

const USER_STATUSES = ['active', 'suspended', 'disabled'];
const DOCTOR_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

/**
 * GET /api/admin/dashboard
 *
 * Protected — admin role only.
 *
 * Returns a high-level summary of system data that only an admin
 * should be able to see (total users, doctors, appointments).
 * Demonstrates that authorize('admin') blocks other roles.
 */
async function getDashboard(req, res, next) {
  try {
    // Aggregate counts in a single round-trip using sub-queries
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                     AS totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'patient')             AS totalPatients,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor')              AS totalDoctors,
        (SELECT COUNT(*) FROM users WHERE status = 'active')            AS activeUsers,
        (SELECT COUNT(*) FROM appointments)                             AS totalAppointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'pending')    AS pendingAppointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed')  AS confirmedAppointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed')  AS completedAppointments
    `);

    return res.status(200).json({
      success: true,
      message: 'Admin dashboard data.',
      requestedBy: {
        userId: req.user.userId,  // injected by protect
        role:   req.user.role     // will always be 'admin' here (enforce by authorize)
      },
      stats
    });
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const role = typeof req.query.role === 'string' ? req.query.role : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (['patient', 'doctor', 'admin'].includes(role)) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (USER_STATUSES.includes(status)) {
      conditions.push('status = ?');
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [users] = await pool.query(
      `SELECT user_id AS userId, name, email, role, status, created_at AS createdAt
       FROM users ${where} ORDER BY created_at DESC`,
      params
    );
    return res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  const userId = Number(req.params.userId);
  const { status } = req.body || {};
  if (!Number.isInteger(userId) || userId < 1 || !USER_STATUSES.includes(status)) {
    return res.status(422).json({ success: false, message: 'userId and a valid status are required.' });
  }
  if (userId === req.user.userId) {
    return res.status(409).json({ success: false, message: 'You cannot change your own account status.' });
  }

  try {
    const [result] = await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, message: 'User status updated.', userId, status });
  } catch (error) {
    next(error);
  }
}

async function getDoctors(req, res, next) {
  try {
    const [doctors] = await pool.query(
      `SELECT d.doctor_id AS doctorId, d.user_id AS userId, u.name, u.email, u.status,
              d.approval_status AS approvalStatus, d.qualifications, d.experience,
              d.consultation_fee AS consultationFee, s.name AS specialization,
              c.name AS clinic, d.created_at AS createdAt
       FROM doctors d
       JOIN users u ON u.user_id = d.user_id
       LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
       LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
       ORDER BY d.created_at DESC`
    );
    return res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
}

async function updateDoctorApproval(req, res, next) {
  const doctorId = Number(req.params.doctorId);
  const { approvalStatus } = req.body || {};
  if (!Number.isInteger(doctorId) || doctorId < 1 || !DOCTOR_APPROVAL_STATUSES.includes(approvalStatus)) {
    return res.status(422).json({ success: false, message: 'doctorId and a valid approvalStatus are required.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE doctors SET approval_status = ? WHERE doctor_id = ?',
      [approvalStatus, doctorId]
    );
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    return res.json({ success: true, message: 'Doctor approval status updated.', doctorId, approvalStatus });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const [users] = await pool.query(
      `SELECT user_id AS userId, name, email, role, status,
              created_at AS createdAt, updated_at AS updatedAt
       FROM users WHERE user_id = ?`,
      [req.params.userId]
    );
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user: users[0] });
  } catch (error) {
    next(error);
  }
}

async function getDoctorById(req, res, next) {
  try {
    const [doctors] = await pool.query(
      `SELECT d.doctor_id AS doctorId, d.user_id AS userId, u.name, u.email, u.status,
              d.approval_status AS approvalStatus, d.qualifications, d.experience,
              d.consultation_fee AS consultationFee, d.bio,
              s.name AS specialization, c.name AS clinic, d.created_at AS createdAt
       FROM doctors d
       JOIN users u ON u.user_id = d.user_id
       LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
       LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
       WHERE d.doctor_id = ?`,
      [req.params.doctorId]
    );
    if (!doctors.length) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    return res.json({ success: true, doctor: doctors[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getDoctors,
  getDoctorById,
  updateDoctorApproval
};
