CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS specializations (
  specialization_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clinics (
  clinic_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  operating_hours TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  patient_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  phone VARCHAR(50), date_of_birth DATE, gender VARCHAR(50), address TEXT, medical_info TEXT,
  blood_group VARCHAR(5), emergency_contact_name VARCHAR(100),
  emergency_contact_relation VARCHAR(100), emergency_contact_phone VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  specialization_id INT UNSIGNED NULL, clinic_id INT UNSIGNED NULL,
  qualifications TEXT, experience INT, consultation_fee DECIMAL(10,2), bio TEXT,
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_doctors_specialization FOREIGN KEY (specialization_id) REFERENCES specializations(specialization_id),
  CONSTRAINT fk_doctors_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id),
  INDEX idx_doctors_specialization (specialization_id), INDEX idx_doctors_clinic (clinic_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctor_availability (
  availability_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT UNSIGNED NOT NULL, day_of_week VARCHAR(20) NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL,
  slot_duration INT UNSIGNED NOT NULL DEFAULT 30, status BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  INDEX idx_availability_doctor (doctor_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL, doctor_id INT UNSIGNED NOT NULL, clinic_id INT UNSIGNED NULL,
  appointment_date DATE NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, queue_number INT UNSIGNED,
  status ENUM('pending','confirmed','completed','cancelled','no-show') NOT NULL DEFAULT 'pending', reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id),
  CONSTRAINT uq_appointment_slot UNIQUE (doctor_id, appointment_date, start_time),
  INDEX idx_appointments_patient (patient_id), INDEX idx_appointments_date (appointment_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medical_records (
  record_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL, doctor_id INT UNSIGNED NOT NULL, appointment_id INT UNSIGNED NULL,
  diagnosis TEXT, notes TEXT, treatment TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_records_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_records_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prescriptions (
  prescription_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL, doctor_id INT UNSIGNED NOT NULL, appointment_id INT UNSIGNED NULL, notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_prescriptions_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_prescriptions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
  INDEX idx_prescriptions_patient_created (patient_id, created_at),
  INDEX idx_prescriptions_doctor_created (doctor_id, created_at),
  INDEX idx_prescriptions_appointment (appointment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prescription_items (
  item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, prescription_id INT UNSIGNED NOT NULL,
  medicine_name VARCHAR(255) NOT NULL, dosage VARCHAR(100), frequency VARCHAR(100), duration VARCHAR(100),
  CONSTRAINT fk_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
  INDEX idx_prescription_items_prescription (prescription_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, appointment_id INT UNSIGNED NULL,
  title VARCHAR(255), message TEXT, type VARCHAR(50), is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
  INDEX idx_notifications_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, patient_id INT UNSIGNED NOT NULL, doctor_id INT UNSIGNED NOT NULL,
  appointment_id INT UNSIGNED NOT NULL, rating TINYINT UNSIGNED NOT NULL, comment TEXT, status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
  CONSTRAINT uq_reviews_appointment UNIQUE (appointment_id),
  INDEX idx_reviews_doctor_status_created (doctor_id, status, created_at),
  INDEX idx_reviews_patient_created (patient_id, created_at),
  CONSTRAINT chk_review_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, action VARCHAR(255), entity_type VARCHAR(255),
  entity_id VARCHAR(255), description TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;
