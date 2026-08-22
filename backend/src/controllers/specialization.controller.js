'use strict';

const { pool } = require('../config/db');

async function getAllSpecializations(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT specialization_id AS id, name, description FROM specializations ORDER BY name ASC');
    return res.json({ success: true, specializations: rows });
  } catch (error) {
    next(error);
  }
}

async function createSpecialization(req, res, next) {
  try {
    const { name, description = '' } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(422).json({ success: false, message: 'Name must contain at least 2 characters.' });
    }
    
    const [existing] = await pool.query('SELECT specialization_id FROM specializations WHERE name = ?', [name.trim()]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Specialization already exists.' });
    }

    const [result] = await pool.query('INSERT INTO specializations (name, description) VALUES (?, ?)', [name.trim(), description.trim()]);
    return res.status(201).json({ 
      success: true, 
      message: 'Specialization created.', 
      specialization: { id: result.insertId, name: name.trim(), description: description.trim() } 
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAllSpecializations, createSpecialization };
