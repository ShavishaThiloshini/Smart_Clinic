'use strict';

const { pool } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getPatientId(userId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    'SELECT patient_id AS patientId FROM patients WHERE user_id = ?',
    [userId]
  );
  return rows[0] ? rows[0].patientId : null;
}

async function getDoctorId(userId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    'SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?',
    [userId]
  );
  return rows[0] ? rows[0].doctorId : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL fragments
// ─────────────────────────────────────────────────────────────────────────────

const PRESCRIPTION_SELECT =
  'SELECT p.prescription_id AS prescriptionId, p.patient_id AS patientId,' +
  ' p.doctor_id AS doctorId, p.appointment_id AS appointmentId,' +
  ' p.notes, p.created_at AS createdAt,' +
  ' pu.name AS patientName, du.name AS doctorName' +
  ' FROM prescriptions p' +
  ' JOIN patients pt ON pt.patient_id = p.patient_id' +
  ' JOIN users    pu ON pu.user_id    = pt.user_id' +
  ' JOIN doctors  d  ON d.doctor_id   = p.doctor_id' +
  ' JOIN users    du ON du.user_id    = d.user_id';

const ITEMS_SELECT =
  'SELECT item_id AS itemId, prescription_id AS prescriptionId,' +
  ' medicine_name AS medicineName, dosage, frequency, duration' +
  ' FROM prescription_items WHERE prescription_id = ? ORDER BY item_id ASC';

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

function mapPrescription(row) {
  return {
    prescriptionId: row.prescriptionId,
    patientId:      row.patientId,
    doctorId:       row.doctorId,
    appointmentId:  row.appointmentId,
    notes:          row.notes,
    createdAt:      row.createdAt,
    patientName:    row.patientName,
    doctorName:     row.doctorName
  };
}

function mapItem(row) {
  return {
    itemId:         row.itemId,
    prescriptionId: row.prescriptionId,
    medicineName:   row.medicineName,
    dosage:         row.dosage    || null,
    frequency:      row.frequency || null,
    duration:       row.duration  || null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPrescriptionWithItems(prescriptionId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query(
    PRESCRIPTION_SELECT + ' WHERE p.prescription_id = ?',
    [prescriptionId]
  );
  if (!rows.length) return null;
  const [itemRows] = await conn.query(ITEMS_SELECT, [prescriptionId]);
  const result = mapPrescription(rows[0]);
  result.items = itemRows.map(mapItem);
  return result;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'items must be a non-empty array of prescription items.';
  }
  if (items.length > 50) {
    return 'items cannot contain more than 50 prescription items.';
  }
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item !== 'object' || item === null) {
      return 'items[' + i + '] must be an object.';
    }
    const name = item.medicineName != null ? item.medicineName : item.medicine_name;
    if (typeof name !== 'string' || name.trim().length === 0) {
      return 'items[' + i + '].medicineName is required and must be a non-empty string.';
    }
    if (name.trim().length > 255) {
      return 'items[' + i + '].medicineName must not exceed 255 characters.';
    }
    const optionals = ['dosage', 'frequency', 'duration'];
    for (const f of optionals) {
      if (item[f] !== undefined && item[f] !== null && typeof item[f] !== 'string') {
        return 'items[' + i + '].' + f + ' must be a string or null.';
      }
      if (typeof item[f] === 'string' && item[f].trim().length > 100) {
        return 'items[' + i + '].' + f + ' must not exceed 100 characters.';
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/prescriptions
 * Doctor-only: create a prescription with one or more medication items.
 */
async function createPrescription(req, res, next) {
  const { patientId, appointmentId, notes, items } = req.body || {};

  // Validate patientId
  if (!Number.isInteger(patientId) || patientId < 1) {
    return res.status(422).json({
      success: false,
      message: 'patientId must be a positive integer.'
    });
  }

  // Validate optional appointmentId
  if (
    appointmentId !== undefined &&
    appointmentId !== null &&
    (!Number.isInteger(appointmentId) || appointmentId < 1)
  ) {
    return res.status(422).json({
      success: false,
      message: 'appointmentId must be a positive integer or null.'
    });
  }

  // Validate notes (optional)
  if (notes !== undefined && notes !== null && typeof notes !== 'string') {
    return res.status(422).json({ success: false, message: 'notes must be a string.' });
  }
  const trimmedNotes = notes ? String(notes).trim() : null;
  if (trimmedNotes && trimmedNotes.length > 5000) {
    return res.status(422).json({ success: false, message: 'notes must not exceed 5000 characters.' });
  }

  // Validate items
  const itemsError = validateItems(items);
  if (itemsError) {
    return res.status(422).json({ success: false, message: itemsError });
  }

  const connection = await pool.getConnection();
  try {
    const doctorId = await getDoctorId(req.user.userId, connection);
    if (!doctorId) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Verify patient exists
    const [patientRows] = await connection.query(
      'SELECT 1 FROM patients WHERE patient_id = ?',
      [patientId]
    );
    if (!patientRows.length) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // If appointmentId provided, verify it belongs to this patient and doctor
    if (appointmentId) {
      const [apptRows] = await connection.query(
        'SELECT patient_id AS pId, doctor_id AS dId, status FROM appointments WHERE appointment_id = ?',
        [appointmentId]
      );
      if (!apptRows.length) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }
      if (apptRows[0].pId !== patientId || apptRows[0].dId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. The appointment does not belong to this patient and doctor.'
        });
      }
      if (apptRows[0].status !== 'completed') {
        return res.status(422).json({
          success: false,
          message: 'A prescription can only be linked to a completed appointment.'
        });
      }
    }

    await connection.beginTransaction();

    // Insert prescription header
    const [result] = await connection.query(
      'INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, notes) VALUES (?, ?, ?, ?)',
      [patientId, doctorId, appointmentId || null, trimmedNotes]
    );
    const prescriptionId = result.insertId;

    // Insert each medication item
    for (const item of items) {
      const name = (item.medicineName || item.medicine_name).trim();
      const dosage    = item.dosage    ? String(item.dosage).trim()    : null;
      const frequency = item.frequency ? String(item.frequency).trim() : null;
      const duration  = item.duration  ? String(item.duration).trim()  : null;

      await connection.query(
        'INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration) VALUES (?, ?, ?, ?, ?)',
        [prescriptionId, name, dosage, frequency, duration]
      );
    }

    await connection.commit();

    const prescription = await fetchPrescriptionWithItems(prescriptionId);
    return res.status(201).json({
      success: true,
      message: 'Prescription created successfully.',
      prescription
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * GET /api/prescriptions/patient/:patientId
 * Patient sees their own; doctor sees prescriptions they wrote for that patient;
 * admin sees all for that patient.
 */
async function getPatientPrescriptions(req, res, next) {
  const patientIdParam = Number(req.params.patientId);
  if (!Number.isInteger(patientIdParam) || patientIdParam < 1) {
    return res.status(422).json({
      success: false,
      message: 'patientId must be a positive integer.'
    });
  }

  try {
    // Patient: can only see their own
    if (req.user.role === 'patient') {
      const loggedInPatientId = await getPatientId(req.user.userId);
      if (loggedInPatientId !== patientIdParam) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own prescriptions.'
        });
      }
    }

    // Doctor: can only see prescriptions they wrote for this patient
    if (req.user.role === 'doctor') {
      const doctorId = await getDoctorId(req.user.userId);
      if (!doctorId) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }

      const [rows] = await pool.query(
        PRESCRIPTION_SELECT +
          ' WHERE p.patient_id = ? AND p.doctor_id = ? ORDER BY p.created_at DESC',
        [patientIdParam, doctorId]
      );

      const prescriptions = await Promise.all(
        rows.map((row) => fetchPrescriptionWithItems(row.prescriptionId))
      );
      return res.json({ success: true, prescriptions });
    }

    // Admin / patient (already validated above)
    const [rows] = await pool.query(
      PRESCRIPTION_SELECT + ' WHERE p.patient_id = ? ORDER BY p.created_at DESC',
      [patientIdParam]
    );

    const prescriptions = await Promise.all(
      rows.map((row) => fetchPrescriptionWithItems(row.prescriptionId))
    );
    return res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/prescriptions/:prescriptionId
 * Patient: own only. Doctor: prescriptions they created. Admin: all.
 */
async function getPrescriptionById(req, res, next) {
  const prescriptionId = Number(req.params.prescriptionId);
  if (!Number.isInteger(prescriptionId) || prescriptionId < 1) {
    return res.status(422).json({
      success: false,
      message: 'prescriptionId must be a positive integer.'
    });
  }

  try {
    const prescription = await fetchPrescriptionWithItems(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    if (req.user.role === 'patient') {
      const patientId = await getPatientId(req.user.userId);
      if (prescription.patientId !== patientId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else if (req.user.role === 'doctor') {
      const doctorId = await getDoctorId(req.user.userId);
      if (!doctorId) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }
      if (prescription.doctorId !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view prescriptions you created.'
        });
      }
    }

    return res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/prescriptions/appointment/:appointmentId
 * Fetch prescriptions linked to a specific appointment.
 * Patient: own appointment only. Doctor: their appointment only. Admin: all.
 */
async function getPrescriptionsByAppointment(req, res, next) {
  const appointmentId = Number(req.params.appointmentId);
  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return res.status(422).json({
      success: false,
      message: 'appointmentId must be a positive integer.'
    });
  }

  try {
    // Verify appointment exists and enforce ownership
    const [apptRows] = await pool.query(
      'SELECT patient_id AS patientId, doctor_id AS doctorId FROM appointments WHERE appointment_id = ?',
      [appointmentId]
    );
    if (!apptRows.length) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const { patientId: apptPatientId, doctorId: apptDoctorId } = apptRows[0];

    if (req.user.role === 'patient') {
      const patientId = await getPatientId(req.user.userId);
      if (patientId !== apptPatientId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else if (req.user.role === 'doctor') {
      const doctorId = await getDoctorId(req.user.userId);
      if (!doctorId || doctorId !== apptDoctorId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const [rows] = await pool.query(
      PRESCRIPTION_SELECT + ' WHERE p.appointment_id = ? ORDER BY p.created_at DESC',
      [appointmentId]
    );

    const prescriptions = await Promise.all(
      rows.map((row) => fetchPrescriptionWithItems(row.prescriptionId))
    );
    return res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  getPrescriptionsByAppointment,
  validateItems
};
