'use strict';

const { pool } = require('../config/db');

function profileSelect() {
  return `SELECT u.name, u.email, d.qualifications, d.experience,
    d.consultation_fee AS consultationFee, d.bio, d.approval_status AS approvalStatus,
    s.name AS specialization, c.name AS clinic
    FROM doctors d
    JOIN users u ON u.user_id = d.user_id
    LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
    LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
    WHERE d.user_id = ?`;
}

async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query(profileSelect(), [req.user.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    return res.json({ success: true, profile: rows[0] });
  } catch (error) { next(error); }
}

async function findOrCreateByName(connection, table, name) {
  if (!name?.trim()) return null;
  const cleanName = name.trim();
  const [existing] = await connection.query(`SELECT ${table.slice(0, -1)}_id AS id FROM ${table} WHERE name = ?`, [cleanName]);
  if (existing.length) {
    await connection.query(`UPDATE ${table} SET name = ? WHERE ${table.slice(0, -1)}_id = ?`, [cleanName, existing[0].id]);
    return existing[0].id;
  }
  const [created] = await connection.query(`INSERT INTO ${table} (name) VALUES (?)`, [cleanName]);
  return created.insertId;
}

async function updateProfile(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { name, specialization = '', clinic = '', qualifications = '', experience = null, consultationFee = null, bio = '' } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanQualifications = typeof qualifications === 'string' ? qualifications.trim() : '';
    const cleanBio = typeof bio === 'string' ? bio.trim() : '';
    if (cleanName.length < 2) return res.status(422).json({ success: false, message: 'Name must contain at least 2 characters.' });
    if (experience !== null && (!Number.isInteger(experience) || experience < 0 || experience > 80)) return res.status(422).json({ success: false, message: 'Experience must be a whole number from 0 to 80.' });
    if (consultationFee !== null && (!Number.isFinite(consultationFee) || consultationFee < 0)) return res.status(422).json({ success: false, message: 'Consultation fee must be a positive amount.' });

    await connection.beginTransaction();
    const specializationId = await findOrCreateByName(connection, 'specializations', specialization);
    const clinicId = await findOrCreateByName(connection, 'clinics', clinic);
    await connection.query('UPDATE users SET name = ? WHERE user_id = ?', [cleanName, req.user.userId]);
    const [result] = await connection.query(
      `UPDATE doctors SET specialization_id = ?, clinic_id = ?, qualifications = ?, experience = ?, consultation_fee = ?, bio = ? WHERE user_id = ?`,
      [specializationId, clinicId, cleanQualifications || null, experience, consultationFee, cleanBio || null, req.user.userId]
    );
    if (!result.affectedRows) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Doctor profile not found.' }); }
    await connection.commit();
    const [rows] = await pool.query(profileSelect(), [req.user.userId]);
    return res.json({ success: true, message: 'Doctor profile updated successfully.', profile: rows[0] });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally { connection.release(); }
}

module.exports = { getProfile, updateProfile };
