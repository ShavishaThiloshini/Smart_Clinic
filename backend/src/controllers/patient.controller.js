'use strict';
const { pool } = require('../config/db');

async function getProfile(req, res, next) {
  try {
    const { userId } = req.user;

    const [rows] = await pool.query(
      `SELECT
         u.name,
         u.email,
         p.phone,
         p.date_of_birth AS dateOfBirth,
         p.gender,
         p.address,
         p.medical_info AS medicalInfo
       FROM users u
       JOIN patients p ON u.user_id = p.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    return res.status(200).json({ success: true, profile: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { userId } = req.user;
    const { name, phone, dateOfBirth, gender, address, medicalInfo } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(422).json({ message: 'Name must be at least 2 characters.' });
    }

    await connection.beginTransaction();

    await connection.query('UPDATE users SET name = ? WHERE user_id = ?', [name.trim(), userId]);

    await connection.query(
      `UPDATE patients
       SET phone = ?, date_of_birth = ?, gender = ?, address = ?, medical_info = ?
       WHERE user_id = ?`,
      [
        phone || null,
        dateOfBirth || null,
        gender || null,
        address || null,
        medicalInfo || null,
        userId
      ]
    );

    await connection.commit();

    return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = { getProfile, updateProfile };
