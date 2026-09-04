'use strict';

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = require('../controllers/notification.controller');

function createNotificationRouter() {
  const router = express.Router();

  // Get all notifications for the current user
  router.get('/', protect, getMyNotifications);

  // Get unread notification count
  router.get('/unread-count', protect, getUnreadCount);

  // Mark all notifications as read (must be before /:notificationId)
  router.patch('/read-all', protect, markAllAsRead);

  // Mark a single notification as read
  router.patch('/:notificationId/read', protect, markAsRead);

  return router;
}

module.exports = { createNotificationRouter };
