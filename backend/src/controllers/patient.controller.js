'use strict';
const { pool } = require('../config/db');

const ALLOWED_GENDERS = new Set(['male', 'female', 'other']);

function validationError(message, errors) {
  return { message, errors };
}

function optionalText(value, field, maxLength, errors) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    errors[field] = `${field} must be text.`;
    return null;
  }

  const text = value.trim();
  if (text.length > maxLength) {
    errors[field] = `${field} must not exceed ${maxLength} characters.`;
  }
  return text || null;
}

function validateProfile(payload) {
  const errors = {};
  const body = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const { name } = body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name must contain between 2 and 100 characters.';
  }

  const phone = optionalText(body.phone, 'phone', 50, errors);
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (!/^[+()\d\s.-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = 'Phone must be a valid phone number containing 7 to 15 digits.';
    }
  }

  let dateOfBirth = null;
  if (body.dateOfBirth !== undefined && body.dateOfBirth !== null && body.dateOfBirth !== '') {
    if (typeof body.dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must use YYYY-MM-DD format.';
    } else {
      const date = new Date(`${body.dateOfBirth}T00:00:00.000Z`);
      const isRealDate = !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === body.dateOfBirth;
      if (!isRealDate || date > new Date()) {
        errors.dateOfBirth = 'Date of birth must be a valid date in the past.';
      } else {
        dateOfBirth = body.dateOfBirth;
      }
    }
  }

  let gender = null;
  if (body.gender !== undefined && body.gender !== null && body.gender !== '') {
    if (typeof body.gender !== 'string' || !ALLOWED_GENDERS.has(body.gender.toLowerCase())) {
      errors.gender = 'Gender must be male, female, or other.';
    } else {
      gender = body.gender.toLowerCase();
    }
  }

  const address = optionalText(body.address, 'address', 1000, errors);
  const medicalInfo = optionalText(body.medicalInfo, 'medicalInfo', 5000, errors);

  if (Object.keys(errors).length > 0) {
    return { error: validationError('Please correct the highlighted profile fields.', errors) };
  }

  return {
    value: {
      name: name.trim(), phone, dateOfBirth, gender, address, medicalInfo
    }
  };
}

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
  try {
    const { userId } = req.user;
    const validation = validateProfile(req.body);
    if (validation.error) {
      return res.status(422).json({ success: false, ...validation.error });
    }
    const { name, phone, dateOfBirth, gender, address, medicalInfo } = validation.value;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [patientUpdate] = await connection.query(
        `UPDATE patients
         SET phone = ?, date_of_birth = ?, gender = ?, address = ?, medical_info = ?
         WHERE user_id = ?`,
        [phone, dateOfBirth, gender, address, medicalInfo, userId]
      );

      if (patientUpdate.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Patient profile not found.' });
      }

      await connection.query('UPDATE users SET name = ? WHERE user_id = ?', [name, userId]);
      await connection.commit();

      return res.status(200).json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, validateProfile };
