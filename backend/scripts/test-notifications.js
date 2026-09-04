'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');
const {
  SEED_USERS,
  resetCounters,
  assert,
  request,
  login,
  printHeader,
  printSummary
} = require('./test-helpers');

async function run() {
  resetCounters();
  printHeader('Smart Clinic - Notification API Tests');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'smart_clinic',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  let notificationId;
  try {
    const [[patient]] = await connection.query(
      'SELECT user_id AS userId FROM users WHERE email = ?',
      [SEED_USERS.patient.email]
    );
    const [[doctor]] = await connection.query(
      'SELECT user_id AS userId FROM users WHERE email = ?',
      [SEED_USERS.doctor.email]
    );

    const [inserted] = await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Test notification', 'Notification API integration test', 'test')`,
      [patient.userId]
    );
    notificationId = inserted.insertId;

    const patientToken = await login(SEED_USERS.patient);
    const doctorToken = await login(SEED_USERS.doctor);

    const unauthorized = await request('GET', '/api/notifications');
    assert('GET notifications without token -> 401', unauthorized.status === 401);

    const list = await request('GET', '/api/notifications', { token: patientToken });
    assert('Patient can list notifications -> 200', list.status === 200);
    assert('Notification list contains the test notification', list.json?.notifications?.some((item) => item.notificationId === notificationId));

    const count = await request('GET', '/api/notifications/unread-count', { token: patientToken });
    assert('Patient can retrieve unread count -> 200', count.status === 200);
    assert('Unread count is numeric', Number.isInteger(count.json?.count));

    const forbidden = await request('PATCH', `/api/notifications/${notificationId}/read`, { token: doctorToken });
    assert('Other user cannot mark notification as read -> 403', forbidden.status === 403);

    const invalid = await request('PATCH', '/api/notifications/not-a-number/read', { token: patientToken });
    assert('Invalid notification id is rejected -> 422', invalid.status === 422);

    const marked = await request('PATCH', `/api/notifications/${notificationId}/read`, { token: patientToken });
    assert('Owner can mark notification as read -> 200', marked.status === 200);
    assert('Marked notification is returned as read', marked.json?.notification?.isRead === true);

    const allRead = await request('PATCH', '/api/notifications/read-all', { token: patientToken });
    assert('Owner can mark all notifications as read -> 200', allRead.status === 200);
  } finally {
    if (notificationId) {
      await connection.query('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);
    }
    await connection.end();
  }

  if (printSummary() > 0) process.exit(1);
}

run().catch((error) => {
  console.error('\n  Fatal error running tests:', error.message);
  process.exit(1);
});