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

module.exports = { getDashboard };
