'use strict';

const { pool } = require('../config/db');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(value) {
  if (typeof value !== 'string') return value;
  return value.slice(0, 5);
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function mapAppointment(row) {
  return {
    appointmentId: row.appointmentId,
    patientId: row.patientId,
    doctorId: row.doctorId,
    clinicId: row.clinicId,
    appointmentDate: row.appointmentDate,
    startTime: formatTime(row.startTime),
    endTime: formatTime(row.endTime),
    queueNumber: row.queueNumber,
    status: row.status,
    reason: row.reason,
    patientName: row.patientName,
    doctorName: row.doctorName,
    clinicName: row.clinicName,
    createdAt: row.createdAt
  };
}

const APPOINTMENT_SELECT = `
  SELECT a.appointment_id AS appointmentId, a.patient_id AS patientId,
    a.doctor_id AS doctorId, a.clinic_id AS clinicId,
    DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointmentDate, a.start_time AS startTime,
    a.end_time AS endTime, a.queue_number AS queueNumber, a.status, a.reason,
    a.created_at AS createdAt, pu.name AS patientName, du.name AS doctorName,
    c.name AS clinicName
  FROM appointments a
  JOIN patients p ON p.patient_id = a.patient_id
  JOIN users pu ON pu.user_id = p.user_id
  JOIN doctors d ON d.doctor_id = a.doctor_id
  JOIN users du ON du.user_id = d.user_id
  LEFT JOIN clinics c ON c.clinic_id = a.clinic_id`;

async function getPatientId(userId, connection = pool) {
  const [rows] = await connection.query('SELECT patient_id AS patientId FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.patientId || null;
}

async function getAppointments(req, res, next) {
  try {
    const params = [];
    let filter = '';

    if (req.user.role === 'patient') {
      const patientId = await getPatientId(req.user.userId);
      if (!patientId) return res.status(404).json({ success: false, message: 'Patient profile not found.' });
      filter = ' WHERE a.patient_id = ?';
      params.push(patientId);
    } else if (req.user.role === 'doctor') {
      const [doctorRows] = await pool.query('SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?', [req.user.userId]);
      if (!doctorRows.length) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      filter = ' WHERE a.doctor_id = ?';
      params.push(doctorRows[0].doctorId);
    }

    const [rows] = await pool.query(`${APPOINTMENT_SELECT}${filter} ORDER BY a.appointment_date ASC, a.start_time ASC`, params);
    return res.json({ success: true, appointments: rows.map(mapAppointment) });
  } catch (error) {
    next(error);
  }
}

async function createAppointment(req, res, next) {
  const { doctorId, appointmentDate, startTime, reason = '' } = req.body || {};

  if (!Number.isInteger(doctorId) || doctorId < 1) {
    return res.status(422).json({ success: false, message: 'doctorId must be a positive integer.' });
  }
  if (!isValidDate(appointmentDate) || appointmentDate < todayIso()) {
    return res.status(422).json({ success: false, message: 'appointmentDate must be today or a valid future date.' });
  }
  if (typeof startTime !== 'string' || !TIME_PATTERN.test(startTime)) {
    return res.status(422).json({ success: false, message: 'startTime must use HH:mm format.' });
  }
  if (typeof reason !== 'string' || reason.trim().length > 1000) {
    return res.status(422).json({ success: false, message: 'reason must be text and no more than 1000 characters.' });
  }

  const connection = await pool.getConnection();
  try {
    const patientId = await getPatientId(req.user.userId, connection);
    if (!patientId) return res.status(404).json({ success: false, message: 'Patient profile not found.' });

    const [doctorRows] = await connection.query(
      `SELECT d.doctor_id AS doctorId, d.clinic_id AS clinicId
       FROM doctors d JOIN users u ON u.user_id = d.user_id
       WHERE d.doctor_id = ? AND u.status = 'active' AND d.approval_status = 'approved'`,
      [doctorId]
    );
    if (!doctorRows.length) return res.status(404).json({ success: false, message: 'Approved doctor not found.' });

    const date = new Date(`${appointmentDate}T00:00:00Z`);
    const dayOfWeek = DAY_NAMES[date.getUTCDay()];
    const [availabilityRows] = await connection.query(
      `SELECT start_time AS startTime, end_time AS endTime, slot_duration AS slotDuration
       FROM doctor_availability
       WHERE doctor_id = ? AND day_of_week = ? AND status = TRUE`,
      [doctorId, dayOfWeek]
    );

    const matchingSlot = availabilityRows.find((slot) => {
      const availableStart = formatTime(slot.startTime);
      const availableEnd = formatTime(slot.endTime);
      const endTime = addMinutes(startTime, Number(slot.slotDuration));
      return endTime && startTime >= availableStart && endTime <= availableEnd;
    });
    if (!matchingSlot) {
      return res.status(409).json({ success: false, message: 'The selected time is not available for this doctor.' });
    }

    const endTime = addMinutes(startTime, Number(matchingSlot.slotDuration));
    await connection.beginTransaction();
    const [[queueRow]] = await connection.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS queueNumber
       FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status IN ('pending', 'confirmed')`,
      [doctorId, appointmentDate]
    );
    const [result] = await connection.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, clinic_id, appointment_date, start_time, end_time, queue_number, status, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [patientId, doctorId, doctorRows[0].clinicId, appointmentDate, startTime, endTime, queueRow.queueNumber, reason.trim() || null]
    );
    await connection.commit();

    const [rows] = await pool.query(`${APPOINTMENT_SELECT} WHERE a.appointment_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Appointment booked successfully.', appointment: mapAppointment(rows[0]) });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'The selected appointment slot is already booked.' });
    }
    next(error);
  } finally {
    connection.release();
  }
}

async function getAppointmentHistory(req, res, next) {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied. Only patients can view their appointment history.' });
    }

    const patientId = await getPatientId(req.user.userId);
    if (!patientId) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const filter = ` WHERE a.patient_id = ? AND (a.status IN ('completed', 'cancelled', 'no-show') OR a.appointment_date < CURDATE())`;
    const [rows] = await pool.query(`${APPOINTMENT_SELECT}${filter} ORDER BY a.appointment_date DESC, a.start_time DESC`, [patientId]);

    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, message: 'No appointment history found.', appointments: [] });
    }

    return res.status(200).json({ success: true, appointments: rows.map(mapAppointment) });
  } catch (error) {
    next(error);
  }
}

module.exports = { createAppointment, getAppointments, getAppointmentHistory, isValidDate, addMinutes };