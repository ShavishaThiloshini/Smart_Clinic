'use strict';

const { pool } = require('../config/db');

const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ALLOWED_SLOT_DURATIONS = new Set([15, 20, 30, 45, 60]);
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const AVAILABILITY_SELECT = `
  SELECT availability_id AS id, day_of_week AS dayOfWeek, start_time AS startTime,
    end_time AS endTime, slot_duration AS slotDuration, status
  FROM doctor_availability
`;

function validationError(message, errors) {
  return { message, errors };
}

function formatTime(value) {
  if (!value) return value;
  if (typeof value === 'string') {
    const match = value.match(TIME_PATTERN);
    if (match) return `${match[1]}:${match[2]}`;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  return String(value).slice(0, 5);
}

function normalizeStatus(value) {
  return value === true || value === 1 || value === '1';
}

function mapAvailabilityRow(row) {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    startTime: formatTime(row.startTime),
    endTime: formatTime(row.endTime),
    slotDuration: row.slotDuration,
    status: normalizeStatus(row.status)
  };
}

function validateAvailability(availability) {
  const errors = {};

  if (!Array.isArray(availability)) {
    return { error: validationError('Availability must be an array.', { availability: 'Must be an array.' }) };
  }

  availability.forEach((slot, index) => {
    const prefix = `availability[${index}]`;

    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      errors[prefix] = 'Each slot must be an object.';
      return;
    }

    if (!VALID_DAYS.includes(slot.dayOfWeek)) {
      errors[`${prefix}.dayOfWeek`] = 'dayOfWeek must be a valid weekday name.';
    }

    if (typeof slot.startTime !== 'string' || !TIME_PATTERN.test(slot.startTime)) {
      errors[`${prefix}.startTime`] = 'startTime must use HH:mm format.';
    }

    if (typeof slot.endTime !== 'string' || !TIME_PATTERN.test(slot.endTime)) {
      errors[`${prefix}.endTime`] = 'endTime must use HH:mm format.';
    }

    if (
      typeof slot.startTime === 'string' &&
      typeof slot.endTime === 'string' &&
      TIME_PATTERN.test(slot.startTime) &&
      TIME_PATTERN.test(slot.endTime) &&
      formatTime(slot.startTime) >= formatTime(slot.endTime)
    ) {
      errors[`${prefix}.endTime`] = 'endTime must be after startTime.';
    }

    const duration = Number(slot.slotDuration ?? 30);
    if (!ALLOWED_SLOT_DURATIONS.has(duration)) {
      errors[`${prefix}.slotDuration`] = 'slotDuration must be 15, 20, 30, 45, or 60 minutes.';
    }
  });

  if (Object.keys(errors).length > 0) {
    return { error: validationError('Please correct the highlighted availability fields.', errors) };
  }

  return {
    value: availability.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      slotDuration: Number(slot.slotDuration ?? 30),
      status: slot.status !== false && slot.status !== 0 && slot.status !== '0'
    }))
  };
}

async function getDoctorIdByUserId(userId) {
  const [rows] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].doctor_id : null;
}

async function approveReadyDoctor(connection, doctorId) {
  const [[profile]] = await connection.query(
    `SELECT d.specialization_id AS specializationId, d.clinic_id AS clinicId,
      d.qualifications, d.experience, d.consultation_fee AS consultationFee,
      d.bio, u.name
     FROM doctors d
     JOIN users u ON u.user_id = d.user_id
     WHERE d.doctor_id = ?`,
    [doctorId]
  );
  const [[activeSlots]] = await connection.query(
    'SELECT COUNT(*) AS count FROM doctor_availability WHERE doctor_id = ? AND status = TRUE',
    [doctorId]
  );
  const profileReady = profile && profile.name?.trim() && profile.specializationId && profile.clinicId
    && profile.qualifications?.trim() && profile.experience !== null
    && profile.consultationFee !== null && profile.bio?.trim();

  if (profileReady && Number(activeSlots.count) > 0) {
    await connection.query(
      `UPDATE doctors SET approval_status = 'approved'
       WHERE doctor_id = ? AND approval_status = 'pending'`,
      [doctorId]
    );
  }
}

async function fetchAvailabilityByDoctorId(doctorId, activeOnly = false) {
  const statusFilter = activeOnly ? ' AND status = TRUE' : '';
  const [rows] = await pool.query(
    `${AVAILABILITY_SELECT}
     WHERE doctor_id = ?${statusFilter}
     ORDER BY FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), start_time`,
    [doctorId]
  );
  return rows.map(mapAvailabilityRow);
}

async function getAvailability(req, res, next) {
  try {
    const doctorId = await getDoctorIdByUserId(req.user.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const availability = await fetchAvailabilityByDoctorId(doctorId);
    return res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
}

async function getAvailabilityByDoctorId(req, res, next) {
  try {
    const doctorId = Number.parseInt(req.params.doctorId, 10);
    if (!Number.isInteger(doctorId) || doctorId < 1) {
      return res.status(400).json({ success: false, message: 'Doctor ID must be a positive number.' });
    }

    const [rows] = await pool.query(
      `SELECT d.doctor_id AS doctorId
       FROM doctors d
       JOIN users u ON u.user_id = d.user_id
       WHERE d.doctor_id = ? AND u.status = 'active' AND d.approval_status = 'approved'`,
      [doctorId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const availability = await fetchAvailabilityByDoctorId(doctorId, true);
    return res.json({ success: true, doctorId, availability });
  } catch (error) {
    next(error);
  }
}

async function setAvailability(req, res, next) {
  try {
    const doctorId = await getDoctorIdByUserId(req.user.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const validation = validateAvailability(req.body?.availability);
    if (validation.error) {
      return res.status(422).json({ success: false, ...validation.error });
    }

    const availability = validation.value;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [doctorId]);

      if (availability.length > 0) {
        const values = availability.map((slot) => [
          doctorId,
          slot.dayOfWeek,
          slot.startTime,
          slot.endTime,
          slot.slotDuration,
          slot.status
        ]);

        await connection.query(
          'INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, status) VALUES ?',
          [values]
        );
      }

      await approveReadyDoctor(connection, doctorId);

      await connection.commit();
      const saved = await fetchAvailabilityByDoctorId(doctorId);
      return res.json({ success: true, message: 'Availability updated successfully.', availability: saved });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAvailability,
  getAvailabilityByDoctorId,
  setAvailability,
  validateAvailability,
  formatTime,
  mapAvailabilityRow
};
