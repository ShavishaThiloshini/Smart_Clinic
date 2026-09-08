'use strict';

const { pool } = require('../config/db');

const USER_STATUSES = ['active', 'suspended', 'disabled'];
const DOCTOR_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

function parseReportDate(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

function toNumber(value) {
  return Number(value || 0);
}

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

async function getReports(req, res, next) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = parseReportDate(req.query.from, defaultFrom);
  const to = parseReportDate(req.query.to, today);

  if (!from || !to) {
    return res.status(422).json({ success: false, message: 'from and to must be valid dates in YYYY-MM-DD format.' });
  }
  if (from > to) {
    return res.status(422).json({ success: false, message: 'from must be on or before to.' });
  }

  try {
    const [summaryRows, appointmentTrend, usersByRole, usersByStatus, doctorsByApproval] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS totalAppointments,
               SUM(status = 'pending') AS pendingAppointments,
               SUM(status = 'confirmed') AS confirmedAppointments,
               SUM(status = 'completed') AS completedAppointments,
               SUM(status = 'cancelled') AS cancelledAppointments,
               SUM(status = 'no-show') AS noShowAppointments
        FROM appointments
        WHERE appointment_date BETWEEN ? AND ?`, [from, to]),
      pool.query(`
        SELECT appointment_date AS date, status, COUNT(*) AS count
        FROM appointments
        WHERE appointment_date BETWEEN ? AND ?
        GROUP BY appointment_date, status
        ORDER BY appointment_date ASC, status ASC`, [from, to]),
      pool.query(`SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role`),
      pool.query(`SELECT status, COUNT(*) AS count FROM users GROUP BY status ORDER BY status`),
      pool.query(`SELECT approval_status AS approvalStatus, COUNT(*) AS count FROM doctors GROUP BY approval_status ORDER BY approval_status`)
    ]);

    const [summary] = summaryRows;
    return res.json({
      success: true,
      message: 'Admin report data.',
      requestedBy: { userId: req.user.userId, role: req.user.role },
      report: {
        period: { from, to },
        summary: Object.fromEntries(Object.entries(summary[0]).map(([key, value]) => [key, toNumber(value)])),
        appointmentTrend: appointmentTrend[0].map((row) => ({ date: row.date, status: row.status, count: toNumber(row.count) })),
        usersByRole: usersByRole[0].map((row) => ({ role: row.role, count: toNumber(row.count) })),
        usersByStatus: usersByStatus[0].map((row) => ({ status: row.status, count: toNumber(row.count) })),
        doctorsByApproval: doctorsByApproval[0].map((row) => ({ approvalStatus: row.approvalStatus, count: toNumber(row.count) }))
      }
    });
  } catch (error) {
    next(error);
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
  getReports,
  getUsers,
  getUserById,
  updateUserStatus,
  getDoctors,
  getDoctorById,
  updateDoctorApproval
};
