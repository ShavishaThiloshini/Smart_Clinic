'use strict';

const { pool } = require('../config/db');

async function getPatientId(userId, connection = pool) {
  const [rows] = await connection.query('SELECT patient_id AS patientId FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.patientId || null;
}

async function getDoctorId(userId, connection = pool) {
  const [rows] = await connection.query('SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?', [userId]);
  return rows[0]?.doctorId || null;
}

const RECORD_SELECT = `
  SELECT m.record_id AS recordId, m.patient_id AS patientId, m.doctor_id AS doctorId, m.appointment_id AS appointmentId,
         m.diagnosis, m.notes, m.treatment, m.created_at AS createdAt, m.updated_at AS updatedAt,
         pu.name AS patientName, du.name AS doctorName
  FROM medical_records m
  JOIN patients p ON p.patient_id = m.patient_id
  JOIN users pu ON pu.user_id = p.user_id
  JOIN doctors d ON d.doctor_id = m.doctor_id
  JOIN users du ON du.user_id = d.user_id
`;

function mapRecord(row) {
  return {
    recordId: row.recordId,
    patientId: row.patientId,
    doctorId: row.doctorId,
    appointmentId: row.appointmentId,
    diagnosis: row.diagnosis,
    notes: row.notes,
    treatment: row.treatment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    patientName: row.patientName,
    doctorName: row.doctorName
  };
}

async function createRecord(req, res, next) {
  const { patientId, appointmentId, diagnosis, notes, treatment } = req.body || {};

  if (!Number.isInteger(patientId) || patientId < 1) {
    return res.status(422).json({ success: false, message: 'patientId must be a positive integer.' });
  }
  if (appointmentId !== undefined && appointmentId !== null && (!Number.isInteger(appointmentId) || appointmentId < 1)) {
    return res.status(422).json({ success: false, message: 'appointmentId must be a positive integer or null.' });
  }

  const connection = await pool.getConnection();
  try {
    const doctorId = await getDoctorId(req.user.userId, connection);
    if (!doctorId) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    // Ensure patient exists
    const [patientRows] = await connection.query('SELECT 1 FROM patients WHERE patient_id = ?', [patientId]);
    if (!patientRows.length) {
       return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const [result] = await connection.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, notes, treatment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patientId, doctorId, appointmentId || null, diagnosis || null, notes || null, treatment || null]
    );

    const [rows] = await pool.query(`${RECORD_SELECT} WHERE m.record_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Medical record created successfully.', record: mapRecord(rows[0]) });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
}

async function getPatientRecords(req, res, next) {
  const patientIdParam = Number(req.params.patientId);
  if (!Number.isInteger(patientIdParam) || patientIdParam < 1) {
    return res.status(422).json({ success: false, message: 'patientId must be a positive integer.' });
  }

  try {
    if (req.user.role === 'patient') {
      const loggedInPatientId = await getPatientId(req.user.userId);
      if (loggedInPatientId !== patientIdParam) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own records.' });
      }
    } else if (req.user.role === 'doctor') {
      // Doctors can view their patients' records. For simplicity, any doctor can view records if they are authorized.
      // We will just let doctors view any patient's records since they are authorized.
    }

    const [rows] = await pool.query(`${RECORD_SELECT} WHERE m.patient_id = ? ORDER BY m.created_at DESC`, [patientIdParam]);
    return res.json({ success: true, records: rows.map(mapRecord) });
  } catch (error) {
    next(error);
  }
}

async function getRecordById(req, res, next) {
  const recordId = Number(req.params.recordId);
  if (!Number.isInteger(recordId) || recordId < 1) {
    return res.status(422).json({ success: false, message: 'recordId must be a positive integer.' });
  }

  try {
    const [rows] = await pool.query(`${RECORD_SELECT} WHERE m.record_id = ?`, [recordId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Medical record not found.' });

    const record = mapRecord(rows[0]);

    if (req.user.role === 'patient') {
      const patientId = await getPatientId(req.user.userId);
      if (record.patientId !== patientId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    // Doctors/Admins can view.
    return res.json({ success: true, record });
  } catch (error) {
    next(error);
  }
}

async function updateRecord(req, res, next) {
  const recordId = Number(req.params.recordId);
  if (!Number.isInteger(recordId) || recordId < 1) {
    return res.status(422).json({ success: false, message: 'recordId must be a positive integer.' });
  }

  const { diagnosis, notes, treatment } = req.body || {};

  const connection = await pool.getConnection();
  try {
    const doctorId = await getDoctorId(req.user.userId, connection);
    if (!doctorId) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    const [existing] = await connection.query('SELECT doctor_id FROM medical_records WHERE record_id = ?', [recordId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    if (existing[0].doctor_id !== doctorId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only update records you created.' });
    }

    await connection.query(
      `UPDATE medical_records SET diagnosis = ?, notes = ?, treatment = ? WHERE record_id = ?`,
      [diagnosis || null, notes || null, treatment || null, recordId]
    );

    const [rows] = await pool.query(`${RECORD_SELECT} WHERE m.record_id = ?`, [recordId]);
    return res.json({ success: true, message: 'Medical record updated successfully.', record: mapRecord(rows[0]) });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
}

module.exports = {
  createRecord,
  getPatientRecords,
  getRecordById,
  updateRecord
};
