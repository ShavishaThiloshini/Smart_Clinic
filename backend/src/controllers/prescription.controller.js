'use strict';

const { pool } = require('../config/db');

async function getPatientId(userId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query('SELECT patient_id AS patientId FROM patients WHERE user_id = ?', [userId]);
  return rows[0] ? rows[0].patientId : null;
}

async function getDoctorId(userId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query('SELECT doctor_id AS doctorId FROM doctors WHERE user_id = ?', [userId]);
  return rows[0] ? rows[0].doctorId : null;
}

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

async function fetchPrescriptionWithItems(prescriptionId, connection) {
  const conn = connection || pool;
  const [rows] = await conn.query(PRESCRIPTION_SELECT + ' WHERE p.prescription_id = ?', [prescriptionId]);
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
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item !== 'object' || item === null) {
      return 'items[' + i + '] must be an object.';
    }
    const name = item.medicineName != null ? item.medicineName : item.medicine_name;
    if (typeof name !== 'string' || name.trim().length === 0) {
      return 'items[' + i + '].medicineName is required and must be a non-empty string.';
    }
    const optionals = ['dosage', 'frequency', 'duration'];
    for (const f of optionals) {
      if (item[f] !== undefined && item[f] !== null && typeof item[f] !== 'string') {
        return 'items[' + i + '].' + f + ' must be a string or null.';
      }
    }
  }
  return null;
}

