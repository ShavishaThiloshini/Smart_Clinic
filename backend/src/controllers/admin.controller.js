'use strict';

const { pool } = require('../config/db');

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

/**
 * GET /api/admin/users
 * Protected — admin role only.
 */
async function getUsers(req, res, next) {
  try {
    const { role, status } = req.query;
    
    let query = 'SELECT user_id, name, email, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users/:userId
 * Protected — admin role only.
 */
async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;

    const [[user]] = await pool.query(`
      SELECT user_id, name, email, role, status, created_at, updated_at 
      FROM users 
      WHERE user_id = ?
    `, [userId]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/users/:userId/status
 * Protected — admin role only.
 */
async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const [result] = await pool.query('UPDATE users SET status = ? WHERE user_id = ?', [status, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/doctors
 * Protected — admin role only.
 */
async function getDoctors(req, res, next) {
  try {
    const { approval_status } = req.query;

    let query = `
      SELECT 
        d.doctor_id, d.user_id, d.qualifications, d.experience, 
        d.consultation_fee, d.approval_status, d.created_at,
        u.name, u.email, u.status AS user_status,
        s.name AS specialization,
        c.name AS clinic_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      LEFT JOIN specializations s ON d.specialization_id = s.specialization_id
      LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
      WHERE 1=1
    `;
    const params = [];

    if (approval_status) {
      query += ' AND d.approval_status = ?';
      params.push(approval_status);
    }

    query += ' ORDER BY d.created_at DESC';

    const [doctors] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/doctors/:doctorId
 * Protected — admin role only.
 */
async function getDoctorById(req, res, next) {
  try {
    const { doctorId } = req.params;

    const [[doctor]] = await pool.query(`
      SELECT 
        d.doctor_id, d.user_id, d.qualifications, d.experience, 
        d.consultation_fee, d.bio, d.approval_status, d.created_at,
        u.name, u.email, u.status AS user_status,
        s.name AS specialization,
        c.name AS clinic_name
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      LEFT JOIN specializations s ON d.specialization_id = s.specialization_id
      LEFT JOIN clinics c ON d.clinic_id = c.clinic_id
      WHERE d.doctor_id = ?
    `, [doctorId]);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.status(200).json({
      success: true,
      doctor
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/doctors/:doctorId/approval
 * Protected — admin role only.
 */
async function updateDoctorApproval(req, res, next) {
  try {
    const { doctorId } = req.params;
    const { approval_status } = req.body;

    if (!approval_status) {
      return res.status(400).json({ success: false, message: 'Approval status is required.' });
    }

    const [result] = await pool.query('UPDATE doctors SET approval_status = ? WHERE doctor_id = ?', [approval_status, doctorId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor approval status updated successfully.'
    });
  } catch (err) {
    next(err);
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
