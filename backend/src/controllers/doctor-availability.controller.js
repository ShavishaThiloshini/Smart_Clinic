'use strict';

const { pool } = require('../config/db');

async function getDoctorIdByUserId(userId) {
  const [rows] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].doctor_id : null;
}

async function getAvailability(req, res, next) {
  try {
    const doctorId = await getDoctorIdByUserId(req.user.userId);
    if (!doctorId) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const [rows] = await pool.query(
      'SELECT availability_id AS id, day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime, slot_duration AS slotDuration, status FROM doctor_availability WHERE doctor_id = ? ORDER BY FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), start_time',
      [doctorId]
    );

    return res.json({ success: true, availability: rows });
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

    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      return res.status(422).json({ success: false, message: 'Availability must be an array.' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing availability
      await connection.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [doctorId]);

      // Insert new availability
      if (availability.length > 0) {
        const values = availability.map(a => [
          doctorId,
          a.dayOfWeek,
          a.startTime,
          a.endTime,
          a.slotDuration || 30,
          a.status !== false
        ]);
        
        await connection.query(
          'INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, status) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      
      const [rows] = await pool.query(
        'SELECT availability_id AS id, day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime, slot_duration AS slotDuration, status FROM doctor_availability WHERE doctor_id = ?',
        [doctorId]
      );
      
      return res.json({ success: true, message: 'Availability updated successfully.', availability: rows });
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

module.exports = { getAvailability, setAvailability };
