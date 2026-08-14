-- Smart Clinic Database Schema
-- Run this file once to initialize the database

CREATE DATABASE IF NOT EXISTS smart_clinic
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_clinic;

-- ─────────────────────────────────────────────
-- 1. USERS TABLE
-- Central authentication & account table.
-- Patients, Doctors, and Admins all have a user row.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('patient','doctor','admin') NOT NULL DEFAULT 'patient',
  status        ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- ─────────────────────────────────────────────
-- NOTE: Additional tables (patients, doctors,
-- specializations, clinics, appointments, etc.)
-- will be added in subsequent implementation days
-- as per the 30-Day Implementation Plan.
-- ─────────────────────────────────────────────
