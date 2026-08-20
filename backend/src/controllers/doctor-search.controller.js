'use strict';

const { pool } = require('../config/db');

const MAX_PAGE_SIZE = 50;

function positiveInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, maximum);
}

function searchCriteria(query) {
  const filters = ["u.role = 'doctor'", "u.status = 'active'", "d.approval_status = 'approved'"];
  const values = [];

  if (query.q?.trim()) {
    const term = `%${query.q.trim()}%`;
    filters.push('(u.name LIKE ? OR s.name LIKE ? OR d.qualifications LIKE ?)');
    values.push(term, term, term);
  }
  if (query.specialization?.trim()) {
    filters.push('s.name LIKE ?');
    values.push(`%${query.specialization.trim()}%`);
  }
  if (query.clinic?.trim()) {
    filters.push('c.name LIKE ?');
    values.push(`%${query.clinic.trim()}%`);
  }
  return { where: filters.join(' AND '), values };
}

async function searchDoctors(req, res, next) {
  try {
    const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInteger(req.query.limit, 12, MAX_PAGE_SIZE);
    const offset = (page - 1) * limit;
    const { where, values } = searchCriteria(req.query);
    const joins = `FROM doctors d
      JOIN users u ON u.user_id = d.user_id
      LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
      LEFT JOIN clinics c ON c.clinic_id = d.clinic_id`;

    const [[count]] = await pool.query(`SELECT COUNT(*) AS total ${joins} WHERE ${where}`, values);
    const [doctors] = await pool.query(
      `SELECT d.doctor_id AS doctorId, u.name, s.name AS specialization, c.name AS clinic,
        d.qualifications, d.experience, d.consultation_fee AS consultationFee, d.bio,
        COALESCE(ROUND(AVG(CASE WHEN r.status = 'approved' THEN r.rating END), 1), 0) AS rating,
        COUNT(CASE WHEN r.status = 'approved' THEN r.review_id END) AS reviewCount
       ${joins}
       LEFT JOIN reviews r ON r.doctor_id = d.doctor_id
       WHERE ${where}
       GROUP BY d.doctor_id, u.name, s.name, c.name, d.qualifications, d.experience, d.consultation_fee, d.bio
       ORDER BY u.name ASC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return res.json({ success: true, doctors, pagination: { page, limit, total: count.total, totalPages: Math.ceil(count.total / limit) } });
  } catch (error) { next(error); }
}

async function getDoctorById(req, res, next) {
  try {
    const doctorId = positiveInteger(req.params.doctorId, 0, Number.MAX_SAFE_INTEGER);
    if (!doctorId) return res.status(400).json({ success: false, message: 'Doctor ID must be a positive number.' });
    const [rows] = await pool.query(
      `SELECT d.doctor_id AS doctorId, u.name, s.name AS specialization, c.name AS clinic,
        d.qualifications, d.experience, d.consultation_fee AS consultationFee, d.bio,
        COALESCE(ROUND(AVG(CASE WHEN r.status = 'approved' THEN r.rating END), 1), 0) AS rating,
        COUNT(CASE WHEN r.status = 'approved' THEN r.review_id END) AS reviewCount
       FROM doctors d
       JOIN users u ON u.user_id = d.user_id
       LEFT JOIN specializations s ON s.specialization_id = d.specialization_id
       LEFT JOIN clinics c ON c.clinic_id = d.clinic_id
       LEFT JOIN reviews r ON r.doctor_id = d.doctor_id
       WHERE d.doctor_id = ? AND u.status = 'active' AND d.approval_status = 'approved'
       GROUP BY d.doctor_id, u.name, s.name, c.name, d.qualifications, d.experience, d.consultation_fee, d.bio`,
      [doctorId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    return res.json({ success: true, doctor: rows[0] });
  } catch (error) { next(error); }
}

module.exports = { searchDoctors, getDoctorById };
