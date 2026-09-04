'use strict';

const { pool } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Controller functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/notifications
 * Returns all notifications for the authenticated user, newest first.
 */
async function getMyNotifications(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT
         n.notification_id AS notificationId,
         n.user_id         AS userId,
         n.appointment_id  AS appointmentId,
         n.title,
         n.message,
         n.type,
         n.is_read         AS isRead,
         n.created_at      AS createdAt
       FROM notifications n
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.userId]
    );

    return res.json({ success: true, notifications: rows.map(mapNotification) });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 */
async function getUnreadCount(req, res, next) {
  try {
    const [[row]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.userId]
    );
    return res.json({ success: true, count: Number(row.count) });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:notificationId/read
 * Marks a single notification as read. User can only mark their own.
 */
async function markAsRead(req, res, next) {
  const notificationId = Number(req.params.notificationId);
  if (!Number.isInteger(notificationId) || notificationId < 1) {
    return res.status(422).json({
      success: false,
      message: 'notificationId must be a positive integer.'
    });
  }

  try {
    const [existing] = await pool.query(
      'SELECT user_id AS userId FROM notifications WHERE notification_id = ?',
      [notificationId]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    if (existing[0].userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own notifications.'
      });
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ?',
      [notificationId]
    );

    const [[updated]] = await pool.query(
      `SELECT notification_id AS notificationId, user_id AS userId,
              appointment_id AS appointmentId, title, message, type,
              is_read AS isRead, created_at AS createdAt
       FROM notifications WHERE notification_id = ?`,
      [notificationId]
    );
    return res.json({
      success: true,
      message: 'Notification marked as read.',
      notification: mapNotification(updated)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all of the authenticated user's notifications as read.
 */
async function markAllAsRead(req, res, next) {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.userId]
    );
    return res.json({
      success: true,
      message: 'All notifications marked as read.',
      updated: result.affectedRows
    });
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────────────────────────────────────

function mapNotification(row) {
  return {
    notificationId: row.notificationId,
    userId:         row.userId,
    appointmentId:  row.appointmentId,
    title:          row.title,
    message:        row.message,
    type:           row.type,
    isRead:         Boolean(row.isRead),
    createdAt:      row.createdAt
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utility — used by appointment controller to emit notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createNotification
 *
 * Inserts a notification row for a single user.
 * Designed to be called from within an existing transaction connection
 * or standalone (pool).
 *
 * @param {object} opts
 * @param {object} opts.connection - DB connection (optional, defaults to pool)
 * @param {number} opts.userId
 * @param {number|null} opts.appointmentId
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} opts.type  — e.g. 'appointment_created'
 */
async function createNotification({ connection, userId, appointmentId, title, message, type }) {
  const conn = connection || pool;
  await conn.query(
    'INSERT INTO notifications (user_id, appointment_id, title, message, type) VALUES (?, ?, ?, ?, ?)',
    [userId, appointmentId || null, title, message, type]
  );
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  mapNotification
};
