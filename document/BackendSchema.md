# Smart Clinic & Doctor Appointment System
# Backend Schema Document

## 1. Database Overview

Database:

MySQL

The database will use a relational structure to manage:

- Users
- Patients
- Doctors
- Specializations
- Clinics
- Doctor availability
- Appointments
- Medical records
- Prescriptions
- Prescription items
- Notifications
- Reviews
- Audit logs

---

# 2. Entity Relationship Overview

```text
Users
 |
 +--------------------+
 |                    |
 v                    v
Patients             Doctors
                       |
             +---------+---------+
             |                   |
             v                   v
      Specializations        Clinics
             |
             v
      Doctor Availability
             |
             v
       Appointments
        /    |     \
       /     |      \
      v      v       v
 Patients Doctors  Medical Records
                    |
                    v
               Prescriptions
                    |
                    v
             Prescription Items

Patients -------- Reviews -------- Doctors

Users -------- Audit Logs

Users -------- Notifications

3. Users Table
Purpose

Stores common account and authentication information.

Column	Type	Constraints
user_id	UUID / SERIAL	PRIMARY KEY
name	VARCHAR	NOT NULL
email	VARCHAR	UNIQUE, NOT NULL
password_hash	VARCHAR	NOT NULL
role	VARCHAR	NOT NULL
status	VARCHAR	NOT NULL
created_at	TIMESTAMP	DEFAULT NOW()
updated_at	TIMESTAMP	DEFAULT NOW()
Role Values
patient
doctor
admin


4. Patients Table
Column	Type	Constraints
patient_id	UUID / SERIAL	PRIMARY KEY
user_id	UUID / INTEGER	FOREIGN KEY
phone	VARCHAR	
date_of_birth	DATE	
gender	VARCHAR	
address	TEXT	
medical_info	TEXT	
created_at	TIMESTAMP	

Relationship:

Users 1 ---- 1 Patients


5. Doctors Table
Column	Type	Constraints
doctor_id	UUID / SERIAL	PRIMARY KEY
user_id	UUID / INTEGER	FOREIGN KEY
specialization_id	UUID / INTEGER	FOREIGN KEY
clinic_id	UUID / INTEGER	FOREIGN KEY
qualifications	TEXT	
experience	INTEGER	
consultation_fee	DECIMAL	
bio	TEXT	
approval_status	VARCHAR	
created_at	TIMESTAMP	

Relationship:

Users 1 ---- 1 Doctors

Specializations 1 ---- N Doctors

Clinics 1 ---- N Doctors


6. Specializations Table
Column	Type	Constraints
specialization_id	UUID / SERIAL	PRIMARY KEY
name	VARCHAR	UNIQUE
description	TEXT	
created_at	TIMESTAMP	

Examples:

Cardiology
Dermatology
Pediatrics
Neurology
General Medicine


7. Clinics Table
Column	Type	Constraints
clinic_id	UUID / SERIAL	PRIMARY KEY
name	VARCHAR	NOT NULL
address	TEXT	
phone	VARCHAR	
operating_hours	TEXT	
created_at	TIMESTAMP


8. Doctor Availability Table
Column	Type	Constraints
availability_id	UUID / SERIAL	PRIMARY KEY
doctor_id	UUID / INTEGER	FOREIGN KEY
day_of_week	VARCHAR	NOT NULL
start_time	TIME	NOT NULL
end_time	TIME	NOT NULL
slot_duration	INTEGER	
status	BOOLEAN	DEFAULT TRUE

Relationship:

Doctors 1 ---- N Doctor_Availability


9. Appointments Table
Column	Type	Constraints
appointment_id	UUID / SERIAL	PRIMARY KEY
patient_id	UUID / INTEGER	FOREIGN KEY
doctor_id	UUID / INTEGER	FOREIGN KEY
clinic_id	UUID / INTEGER	FOREIGN KEY
appointment_date	DATE	NOT NULL
start_time	TIME	NOT NULL
end_time	TIME	NOT NULL
queue_number	INTEGER	
status	VARCHAR	NOT NULL
reason	TEXT	
created_at	TIMESTAMP	
updated_at	TIMESTAMP	
Appointment Status
Pending
Confirmed
Completed
Cancelled
No-show
Important Rule

The database/application must prevent two active appointments
from occupying the same doctor, date and time slot.

Relationship:

Patients 1 ---- N Appointments

Doctors 1 ---- N Appointments

Clinics 1 ---- N Appointments


10. Medical Records Table
Column	Type	Constraints
record_id	UUID / SERIAL	PRIMARY KEY
patient_id	UUID / INTEGER	FOREIGN KEY
doctor_id	UUID / INTEGER	FOREIGN KEY
appointment_id	UUID / INTEGER	FOREIGN KEY
diagnosis	TEXT	
notes	TEXT	
treatment	TEXT	
created_at	TIMESTAMP	
updated_at	TIMESTAMP	

Relationship:

Patients 1 ---- N Medical_Records

Doctors 1 ---- N Medical_Records

Appointments 1 ---- 1/N Medical_Records


11. Prescriptions Table
Column	Type	Constraints
prescription_id	UUID / SERIAL	PRIMARY KEY
patient_id	UUID / INTEGER	FOREIGN KEY
doctor_id	UUID / INTEGER	FOREIGN KEY
appointment_id	UUID / INTEGER	FOREIGN KEY
notes	TEXT	
created_at	TIMESTAMP	

Relationship:

Patients 1 ---- N Prescriptions

Doctors 1 ---- N Prescriptions

Appointments 1 ---- N Prescriptions


12. Prescription Items Table
Column	Type	Constraints
item_id	UUID / SERIAL	PRIMARY KEY
prescription_id	UUID / INTEGER	FOREIGN KEY
medicine_name	VARCHAR	NOT NULL
dosage	VARCHAR	
frequency	VARCHAR	
duration	VARCHAR	

Relationship:

Prescriptions 1 ---- N Prescription_Items


13. Notifications Table
Column	Type	Constraints
notification_id	UUID / SERIAL	PRIMARY KEY
user_id	UUID / INTEGER	FOREIGN KEY
appointment_id	UUID / INTEGER	FOREIGN KEY
title	VARCHAR	
message	TEXT	
type	VARCHAR	
is_read	BOOLEAN	DEFAULT FALSE
created_at	TIMESTAMP	

Notification types may include:

appointment_created
appointment_confirmed
appointment_cancelled
appointment_rescheduled
appointment_reminder


14. Reviews Table
Column	Type	Constraints
review_id	UUID / SERIAL	PRIMARY KEY
patient_id	UUID / INTEGER	FOREIGN KEY
doctor_id	UUID / INTEGER	FOREIGN KEY
appointment_id	UUID / INTEGER	FOREIGN KEY
rating	INTEGER	
comment	TEXT	
status	VARCHAR	
created_at	TIMESTAMP	
Review Rules
Patient must be authorized.
Appointment must be eligible.
Appointment should be completed.
Patient should not submit unauthorized reviews.
Administrators can moderate reviews.


15. Audit Logs Table
Column	Type	Constraints
audit_id	UUID / SERIAL	PRIMARY KEY
user_id	UUID / INTEGER	FOREIGN KEY
action	VARCHAR	
entity_type	VARCHAR	
entity_id	UUID / INTEGER	
description	TEXT	
created_at	TIMESTAMP


16. Main Relationships
Users
  |
  +---- Patients
  |
  +---- Doctors
  |
  +---- Notifications
  |
  +---- Audit Logs

Doctors
  |
  +---- Specialization
  |
  +---- Clinic
  |
  +---- Availability
  |
  +---- Appointments
  |
  +---- Medical Records
  |
  +---- Prescriptions
  |
  +---- Reviews

Patients
  |
  +---- Appointments
  |
  +---- Medical Records
  |
  +---- Prescriptions
  |
  +---- Reviews

Appointments
  |
  +---- Medical Records
  |
  +---- Prescriptions
  |
  +---- Notifications
  |
  +---- Reviews


  17. Database Security

The backend must ensure:

Passwords are never stored as plain text.
Passwords are securely hashed.
Protected data requires authentication.
Role-based authorization is enforced.
Patients can only access permitted records.
Doctors can only access authorized patient information.
Administrators have system-level management access.
Sensitive healthcare data must not be exposed through unauthorized APIs.


18. Database Indexing

Indexes should be considered for commonly searched fields such as:

Users.email
Doctors.specialization_id
Doctors.clinic_id
Appointments.doctor_id
Appointments.patient_id
Appointments.appointment_date
Notifications.user_id

The SRS specifies that database queries should be indexed where appropriate.
