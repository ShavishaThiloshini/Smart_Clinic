# PRODUCT REQUIREMENTS DOCUMENT
## Smart Clinic & Doctor Appointment System

| | |
|---|---|
| **Document Type** | Product Requirements Document (PRD) |
| **Source** | Derived from Smart Clinic & Doctor Appointment System – SRS v1.0 |
| **Product** | Smart Clinic & Doctor Appointment System (web-based) |
| **Technology Stack** | React.js (frontend) · Express.js / Node.js (backend) · MySQL (database) |
| **Version** | 1.0 |
| **Status** | Draft |
| **Date** | August 13, 2026 |

---

## 1. Overview

### 1.1 Purpose
This Product Requirements Document (PRD) translates the approved System Requirements Specification (SRS) for the Smart Clinic & Doctor Appointment System into a product-oriented definition of what will be built, for whom, and why. It defines the problem, the target users, the scope of the release, the features required, and the criteria that will be used to judge success. It is intended to guide design, engineering, and QA through delivery of the first version of the product.

### 1.2 Problem Statement
Clinics that rely on manual, phone-based, or walk-in appointment processes face long patient wait times, double-booked or missed slots, scattered paper-based medical records, and limited visibility into doctor availability. Patients lack a simple way to discover doctors, check availability, and self-serve their bookings, while doctors and administrators lack a single system to manage schedules, consultations, records, and clinic operations.

### 1.3 Product Vision
A single, secure, web-based platform where patients can find the right doctor and book an appointment in minutes, doctors can manage their schedule and patient care digitally, and administrators can oversee the clinic's operations from one dashboard — replacing manual scheduling with a centralized, role-based digital workflow.

---

## 2. Goals & Objectives

The system is designed to meet the following business and product objectives:

- Provide an easy and secure online doctor appointment booking facility.
- Allow doctors to manage their availability and appointments efficiently.
- Reduce manual appointment scheduling effort and unnecessary patient waiting time.
- Maintain organized, permission-controlled patient medical and prescription records.
- Provide role-based dashboards for patients, doctors, and administrators.
- Improve overall clinic operational efficiency through centralized digital management.
- Provide administrators with reports and analytics to support clinic decision-making.

### 2.1 Success Metrics
Because this is the initial release, success will be measured qualitatively and functionally against the criteria below rather than live production KPIs. Once deployed, the following indicators can be tracked:

| Metric | Target for v1.0 |
|---|---|
| Appointment booking completion rate | Patient can complete a booking (search → select → confirm) without error |
| Double-booking incidents | Zero double bookings for the same doctor/time slot |
| Role coverage | 100% of core flows available for Patient, Doctor, and Administrator roles |
| Average time to book | Under 2 minutes from doctor search to confirmed appointment |
| Record integrity | No loss or corruption of appointment/medical data on failed requests |
| Cross-device usability | Core flows usable on desktop, tablet, and mobile viewports |

---

## 3. Target Users & Roles

The product serves three primary roles, each with a dedicated dashboard and permission set.

| Role | Main Responsibilities | Access |
|---|---|---|
| **Patient** | Register, manage profile, search doctors, book/manage appointments, view records and prescriptions, submit reviews. | Patient dashboard and their own permitted personal data |
| **Doctor** | Manage profile, availability, appointments, patient records and prescriptions. | Doctor dashboard and assigned patient/appointment data |
| **Administrator** | Manage users, doctors, specialties, schedules, appointments, reports and system settings. | Administrative dashboard and system-wide management |

---

## 4. Scope

### 4.1 In Scope (v1.0)
- User registration, login, and role-based access control (Patient, Doctor, Administrator).
- Patient profile and medical information management.
- Doctor profiles, specialization, and consultation information.
- Doctor availability and schedule management.
- Doctor search, filtering, and profile viewing.
- Online appointment booking, rescheduling, and cancellation.
- Appointment status and queue management.
- Medical records and prescription management.
- Notifications and appointment reminders.
- Reviews and ratings for doctors.
- Admin management and operational reporting.
- Audit and security controls.

### 4.2 Out of Scope (v1.0)
- AI-based symptom guidance and doctor recommendations.
- Online video consultation.
- Online payment processing and invoice generation.
- SMS/WhatsApp appointment reminders (in-app/email only for v1.0).
- Digital lab report upload and management.
- Pharmacy and medicine ordering integration.
- Multi-clinic / multi-branch support (single-clinic in v1.0, schema allows future expansion).
- Advanced analytics and predictive appointment insights.

These items are captured as candidates for future releases in Section 10.

---

## 5. Features & Functional Requirements

Functional requirements are grouped into feature areas (epics). Each requirement is written from the perspective of the end user and role.

### 5.1 Authentication & Authorization
- Users shall be able to register and log in securely.
- Users shall be able to log out and manage their account.
- The system shall provide role-based access for Patient, Doctor, and Administrator.
- The system shall protect authenticated API routes using secure authorization mechanisms.
- The system should provide password reset/change functionality.

### 5.2 Patient Management
- Patients shall be able to create and update their profiles.
- Patients shall be able to store relevant contact and basic medical information.
- Patients shall be able to view their appointment history.
- Patients shall be able to view prescriptions and medical records permitted to them.

### 5.3 Doctor Management
- Doctors shall have profiles containing name, specialization, qualifications, experience, consultation fee, and clinic details.
- Doctors shall be able to update their professional profile.
- Doctors shall be able to define available consultation days and time slots.
- Administrators shall be able to approve, update, deactivate, or manage doctor accounts.

### 5.4 Doctor Search & Discovery
- Patients shall be able to search doctors by name or specialization.
- Patients shall be able to filter doctors based on availability and other supported criteria.
- Patients shall be able to view doctor profiles and available appointment slots.

### 5.5 Appointment Management
- Patients shall be able to select a doctor, date, and available time slot and submit an appointment.
- The system shall prevent double booking of the same doctor/time slot.
- Patients shall be able to view upcoming and previous appointments.
- Patients shall be able to cancel or request rescheduling according to clinic rules.
- Doctors shall be able to view and manage their appointment schedules.
- Administrators shall be able to monitor and manage appointments.

### 5.6 Queue & Visit Management
- The system may generate an appointment/queue number.
- Doctors or authorized staff shall be able to update appointment status such as Pending, Confirmed, Completed, Cancelled, or No-show.
- Patients shall be able to view the current status of their appointments.

### 5.7 Medical Records
- Authorized doctors shall be able to create and update visit notes and medical records.
- Patients shall be able to view their permitted medical history.
- Records shall be associated with the relevant patient and appointment.

### 5.8 Prescription Management
- Doctors shall be able to create prescriptions for completed consultations.
- Prescriptions shall include medicine name, dosage, frequency, and duration where applicable.
- Patients shall be able to view their prescriptions.

### 5.9 Notifications
- The system shall notify users about appointment creation, confirmation, cancellation, and rescheduling.
- The system should support appointment reminders.
- Notifications may be delivered through in-app notifications and/or email depending on implementation.

### 5.10 Reviews & Ratings
- Patients may rate and review doctors after eligible completed appointments.
- The system shall prevent unauthorized reviews.
- Administrators shall be able to moderate inappropriate reviews.

### 5.11 Administration
- Administrators shall manage users and roles.
- Administrators shall manage doctor specialties and clinic information.
- Administrators shall monitor appointments and system activity.
- Administrators shall generate basic operational reports.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Passwords must be securely hashed. Authentication tokens/sessions must be protected. Role-based authorization must be enforced. Sensitive healthcare data must not be exposed through unauthorized endpoints. |
| **Performance** | Common pages and API requests should respond efficiently under the expected project workload. Database queries should be indexed where appropriate. |
| **Availability** | The deployed system should be available during normal clinic operating periods with appropriate error handling. |
| **Usability** | The interface should be simple, responsive, and usable on desktop, tablet, and mobile screens. |
| **Scalability** | The architecture should allow additional doctors, clinics, users, and modules to be added without major redesign. |
| **Maintainability** | Frontend and backend code should use modular components, clear naming, validation, and documentation. |
| **Reliability** | The system should validate data and handle failed requests without corrupting appointment or patient information. |
| **Compatibility** | The web application should support current versions of major browsers such as Chrome, Edge, Firefox, and Safari. |

---

## 7. Proposed Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, JavaScript/TypeScript, HTML5, CSS3, Tailwind CSS or equivalent UI framework |
| **Backend** | Node.js runtime with Express.js REST API |
| **Database** | MySQL relational database |
| **Authentication** | JWT or secure session-based authentication with role-based authorization |
| **API Testing** | Postman or equivalent API testing tool |
| **Version Control** | Git and GitHub |
| **Development Environment** | Visual Studio Code or equivalent IDE |
| **Deployment** | A suitable cloud platform for frontend, backend, and MySQL hosting |

### 7.1 Suggested Database Entities
Users, Patients, Doctors, Specializations, Clinics, Doctor_Availability, Appointments, Medical_Records, Prescriptions, Prescription_Items, Notifications, Reviews, Audit_Logs.

---

## 8. Business Rules
- A patient cannot book an unavailable or already occupied time slot.
- Only authorized doctors can create or update their patients' consultation records.
- Only eligible patients can submit a review for a completed appointment.
- Cancelled appointments should not remain available as completed visits.
- Administrators can deactivate accounts without deleting historical transaction/medical data where retention is required.
- Every appointment must be associated with a patient, doctor, date/time, and status.

---

## 9. Constraints, Assumptions & Risks

### 9.1 Constraints & Assumptions
- The system is intended as an academic/project implementation and is not a replacement for a certified hospital information system.
- Users require an internet connection and a supported web browser.
- Actual SMS/email/payment integrations depend on third-party services and credentials.
- Healthcare data must be handled according to applicable privacy, security, and institutional requirements.
- The first version may support a single clinic, with the database design allowing future multi-clinic expansion.

### 9.2 Key Risks

| Risk | Mitigation |
|---|---|
| Double-booking or race conditions on slot selection | Enforce slot locking/uniqueness constraints at the database and API level |
| Unauthorized access to medical records | Strict role-based authorization on every API route; least-privilege data access |
| Data loss from failed requests | Transactional writes and validation before persisting appointment/record changes |
| Scope creep from future-enhancement features | Freeze v1.0 scope per Section 4; track additions in the roadmap (Section 10) |
| Third-party dependency delays (email/SMS/payment) | Treat as pluggable integrations; ship v1.0 without hard dependency on them |

---

## 10. Future Enhancements (Post-v1.0 Roadmap)
- AI-based symptom guidance and doctor recommendations, with appropriate safety limitations.
- Online video consultation.
- Online payment and invoice generation.
- SMS/WhatsApp appointment reminders.
- Digital lab report upload and management.
- Pharmacy and medicine ordering integration.
- Multi-clinic and multi-branch support.
- Advanced analytics and predictive appointment insights.

---

## 11. Summary
The Smart Clinic & Doctor Appointment System will provide a centralized platform for managing patients, doctors, appointments, schedules, medical records, and clinic administration. The React.js frontend, Express.js backend, and MySQL database provide a practical, scalable, and well-structured technology foundation for delivering the scope defined in this PRD.
