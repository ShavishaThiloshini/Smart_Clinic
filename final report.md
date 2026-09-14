# Smart Clinic - Final Project Report

**Project:** Smart Clinic and Doctor Appointment System  
**Version:** 1.0  
**Date:** September 14, 2026  
**Status:** Functional full-stack project

## 1. Project Overview

Smart Clinic is a role-based clinic management web application. Patients can find approved doctors, book appointments, view their medical information, receive notifications, submit reviews, and view prescriptions. Doctors can manage their profile and availability, review patient bookings, accept appointments, complete visits, create prescriptions, and manage patient care. Administrators can manage users, doctors, reviews, specializations, appointments, and reports.

The project contains:

- A React, TypeScript, and Vite frontend.
- An Express.js and Node.js backend.
- A MySQL database.
- JWT authentication and role-based authorization.
- In-app notifications.
- Automated frontend and backend validation suites.

## 2. Technology Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | MySQL with mysql2 |
| Authentication | JWT and bcryptjs |
| Security | Helmet, CORS, rate limiting, validation middleware |
| Frontend testing | Vitest, Testing Library, jsdom |
| Backend testing | Node.js integration and validation scripts |

## 3. Project Structure

```text
Smart_Clinic/
|-- backend/
|   |-- server.js
|   |-- package.json
|   |-- src/
|   |   |-- app.js
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |-- scripts/
|   |-- README.md
|-- frontend/
|   |-- package.json
|   |-- vite.config.ts
|   |-- src/
|       |-- components/
|       |-- context/
|       |-- hooks/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       |-- types/
|-- document/
|   |-- PRD.md
|   |-- TRD.md
|   |-- AddFlow.md
|   |-- UIUXDesignBrief.md
|   |-- BackendSchema.md
|   |-- ImplementationPlan.md
|   |-- DeploymentGuide.md
|-- README.md
|-- final report.md
```

## 4. Prerequisites

Install the following before starting:

- Node.js 18 or newer.
- npm.
- MySQL 8 or compatible MySQL server.
- Git.
- A modern browser such as Chrome, Edge, Firefox, or Safari.

Check installed versions:

```powershell
node --version
npm --version
mysql --version
```

The backend normally uses MySQL on port `3306`. The frontend development server normally uses port `3000`. The backend normally uses port `5000`.

## 5. Environment Configuration

Create `backend/.env` with values similar to the following:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_clinic
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

For production, use a long random JWT secret, a least-privilege database user, and the real frontend origin. Never commit `.env` files or passwords.

The frontend uses the Vite API proxy during development. For a deployed frontend, set the backend API origin according to the deployment configuration, for example:

```env
VITE_API_URL=https://your-backend-host.example.com
```

## 6. Installation and First Run

### 6.1 Install backend dependencies

```powershell
Set-Location .\backend
npm install
```

### 6.2 Install frontend dependencies

Open another terminal:

```powershell
Set-Location .\frontend
npm install
```

### 6.3 Start MySQL

If MySQL is installed as the documented Windows service:

```powershell
net start MySQL267
```

The service name may be different on another computer. Start MySQL using the service name configured on that machine.

### 6.4 Initialize the database

From `backend`:

```powershell
npm run db:init
```

This creates the `smart_clinic` database and applies the schema.

Seed development data when needed:

```powershell
npm run db:seed
```

Run migrations for an existing database when required:

```powershell
npm run db:migrate:patient-profile
npm run db:migrate:prescriptions
npm run db:migrate:reviews
```

### 6.5 Start the backend

From `backend`:

```powershell
npm run dev
```

The backend should be available at `http://localhost:5000`.

Verify the backend:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### 6.6 Start the frontend

From `frontend`:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## 7. User Roles and Access Rules

### Patient

Patients can access only patient routes and APIs. They can:

- Open the Patient Dashboard.
- Search active, approved doctors.
- View public doctor profiles and availability.
- Book, cancel, and reschedule their own appointments.
- View their own appointment status.
- View their own medical records and prescriptions.
- Submit reviews for completed appointments.
- View notifications intended for their account.

### Doctor

Doctors can access only doctor routes and APIs. They can:

- Open the Doctor Dashboard and appointment queue.
- Edit their professional profile.
- Manage their availability.
- View appointments assigned to them.
- Accept pending appointments.
- Mark accepted appointments as completed.
- Create prescriptions for completed consultations.
- Create and update authorized medical records.
- View notifications intended for their account.

### Administrator

Administrators can access the administrative dashboard and management APIs. They can:

- Manage users and doctor approval.
- Manage specializations.
- Moderate reviews.
- View reports and operational totals.

The frontend protects routes using the JWT role. The backend independently protects APIs using JWT authentication and role authorization. Hiding a menu item is not the security boundary.

## 8. Main Business Workflows

### 8.1 Patient appointment workflow

```text
Patient login
  -> Find a doctor
  -> Select an approved doctor
  -> Select an available date and time
  -> Book appointment
  -> Appointment is created as Pending
  -> Doctor receives a New Appointment notification
```

### 8.2 Doctor acceptance workflow

```text
Doctor opens Appointments
  -> Sees the patient booking as Pending
  -> Selects Accept appointment
  -> Appointment changes to Accepted
  -> Patient receives an Appointment Accepted notification
```

### 8.3 Completing a visit

```text
Doctor opens an Accepted appointment
  -> Selects Mark completed
  -> Appointment changes to Completed
  -> Patient can now submit a review
  -> Doctor can issue a prescription
```

### 8.4 Doctor rating and feedback workflow

```text
Completed appointment
  -> Patient opens Reviews
  -> Selects Leave review
  -> Selects 1 to 5 stars
  -> Enters a feedback summary
  -> Submits review
  -> Review is stored as Pending moderation
  -> Admin approves the review
  -> Approved rating contributes to the doctor's average
  -> Rating and feedback appear on the doctor search card and profile
```

Public ratings use approved reviews only. Pending and rejected reviews do not affect the public rating.

### 8.5 Prescription workflow

```text
Completed appointment
  -> Doctor opens Prescriptions
  -> Selects patient and completed appointment
  -> Adds medicine name, dosage, frequency, and duration
  -> Adds optional instructions
  -> Issues prescription
  -> Patient views the prescription from the Patient portal
```

## 9. How to Use the Application

### 9.1 Register

1. Open `http://localhost:3000/register`.
2. Enter name, email, password, and role.
3. Choose Patient or Doctor.
4. Submit the registration form.
5. A doctor account starts pending and requires admin approval before appearing in the public directory.

### 9.2 Patient testing steps

1. Log in with a patient account.
2. Confirm the app opens `/patient/dashboard`.
3. Open Find a doctor.
4. Search or filter by name, specialization, or clinic.
5. Open a doctor profile.
6. Review the doctor rating, review count, availability, and approved feedback.
7. Book an available slot.
8. Open My appointments and confirm the status is Pending.
9. Wait for or simulate doctor acceptance.
10. Confirm the status changes to Accepted and the notification appears.
11. After the doctor marks the appointment Completed, open Reviews.
12. Click Leave review, choose stars, type feedback, and submit.

### 9.3 Doctor testing steps

1. Log in with a doctor account.
2. Confirm the app opens `/doctor/dashboard` and redirects to appointments.
3. Open Availability and save at least one future working slot.
4. Wait for a patient booking or create one using a patient account.
5. Open Appointments and confirm the new booking is Pending.
6. Click Accept appointment.
7. Confirm the appointment becomes Accepted.
8. Click Mark completed after the consultation.
9. Open Prescriptions and select the completed patient appointment.
10. Create and issue a prescription.

### 9.4 Administrator testing steps

1. Log in with an admin account.
2. Open doctor management.
3. Approve pending doctor accounts.
4. Open review management.
5. Approve or reject pending patient reviews.
6. Open reports to inspect user and appointment totals.

## 10. API Summary

### Authentication

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |

### Doctor discovery

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/doctors` | Public |
| GET | `/api/doctors/:doctorId` | Public |
| GET | `/api/doctors/:doctorId/availability` | Public |

Only active, approved, registered doctors are returned by public discovery endpoints.

### Appointments

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/appointments` | Patient or Doctor; scoped to current user |
| POST | `/api/appointments` | Patient |
| PATCH | `/api/appointments/:id/status` | Doctor or Admin |
| PATCH | `/api/appointments/:id/cancel` | Owning Patient |
| PUT | `/api/appointments/:id/reschedule` | Owning Patient |
| GET | `/api/appointments/:id/queue-status` | Owning Patient or Doctor |

Example booking request:

```json
{
  "doctorId": 1,
  "appointmentDate": "2099-01-05",
  "startTime": "09:00",
  "reason": "Routine consultation"
}
```

### Notifications

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/notifications` | Current authenticated user |
| GET | `/api/notifications/unread-count` | Current authenticated user |
| PATCH | `/api/notifications/:id/read` | Notification owner |
| PATCH | `/api/notifications/read-all` | Current authenticated user |

### Reviews

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/reviews` | Patient with completed appointment |
| GET | `/api/reviews/my` | Current Patient |
| GET | `/api/reviews/doctor/:doctorId` | Public approved reviews |
| GET | `/api/reviews/admin` | Admin |
| PATCH | `/api/reviews/:reviewId/status` | Admin |

### Prescriptions and records

Prescription and medical-record routes require the appropriate patient, doctor, or admin role. Doctors can create prescriptions only for completed consultations.

## 11. Testing Guide

Run commands from the directory that contains the related `package.json`.

### 11.1 Frontend tests

Run all frontend tests:

```powershell
Set-Location .\frontend
npm test
```

Run the production build:

```powershell
npm run build
```

Run selected route tests:

```powershell
npm test -- src/routes/ProtectedRoute.test.tsx src/routes/AppRouter.test.tsx
```

The frontend test suite covers authentication form validation, route protection, patient route rendering, and prescription form behavior.

### 11.2 Backend validation tests

Run validation-only suites:

```powershell
Set-Location .\backend
npm run test:middleware
npm run test:patient-profile
npm run test:availability
npm run test:prescriptions
```

Run API integration suites with MySQL and the backend running:

```powershell
npm run test:auth
npm run test:patient-profile-api
npm run test:doctor-profile-api
npm run test:doctor-search
npm run test:availability-api
npm run test:appointments
npm run test:medical-record-security
npm run test:prescriptions-api
npm run test:reviews
npm run test:notifications
npm run test:admin
```

Run milestone suites:

```powershell
npm run test:milestone1
npm run test:milestone3
npm run test:day27
```

`test:day27` is the broadest backend verification command. It runs validation and API/database integration suites for authentication, profiles, doctor search, availability, appointments, records, prescriptions, reviews, notifications, and admin operations.

### 11.3 Manual end-to-end test checklist

- [ ] Patient registration works.
- [ ] Doctor registration creates a pending doctor profile.
- [ ] Admin can approve the doctor.
- [ ] Approved doctor appears once in Find a doctor.
- [ ] Patient can see doctor availability.
- [ ] Patient can book an available slot.
- [ ] Doctor sees the booking as Pending.
- [ ] Doctor receives a new-appointment alert.
- [ ] Doctor can accept the appointment.
- [ ] Patient sees Accepted status and alert.
- [ ] Doctor can mark the visit Completed.
- [ ] Patient can submit a 1-5 star review and feedback.
- [ ] Admin can approve the review.
- [ ] Approved rating appears on the search card and doctor profile.
- [ ] Doctor can issue a prescription for the completed appointment.
- [ ] Patient can view the prescription.
- [ ] Patient cannot access doctor routes.
- [ ] Doctor cannot access patient routes.
- [ ] Unauthorized API calls return 401 or 403.

## 12. Security and Data Rules

- Passwords are hashed before storage.
- JWT tokens contain the authenticated user ID and role.
- Protected APIs require a valid Bearer token.
- Role authorization is enforced independently on the backend.
- Patients can access only their own appointments, records, prescriptions, reviews, and notifications.
- Doctors can access only their assigned appointments and authorized patient-care data.
- Public doctor discovery exposes only active, approved doctor profiles.
- Public doctor ratings use approved reviews only.
- Appointment booking validates doctor approval, availability, date, time, and duplicate slots.
- Notification ownership is checked before a notification can be marked read.
- Security headers, rate limiting, CORS, and request validation are enabled by the backend configuration.

## 13. Troubleshooting

### Frontend cannot connect to the backend

1. Confirm the backend is running on port 5000.
2. Check `GET http://localhost:5000/api/health`.
3. Confirm the frontend Vite proxy points to port 5000.
4. Check the browser console for CORS or network errors.

### No doctors appear in Find a doctor

- Confirm the doctor account exists.
- Confirm the user account is active.
- Confirm an administrator approved the doctor.
- Confirm the doctor profile row exists.
- Refresh the browser after approval.

### Review page has no Leave review button

A review can be submitted only for a completed appointment. The normal flow is Pending, Accepted, then Completed. The doctor must mark the visit completed before the patient can review it.

### Public rating remains 0.0

Reviews are initially pending moderation. An administrator must approve the review. Only approved reviews contribute to the average and review count.

### Prescription patient list is empty

Prescriptions require completed appointments. Confirm the doctor selected the correct completed appointment and that the appointment belongs to that doctor.

### Database initialization fails

- Confirm MySQL is running.
- Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- Confirm the configured database user has permission to create the database and tables.
- Run the required migration scripts for an existing database.

## 14. Deployment Summary

### Backend

```powershell
Set-Location .\backend
npm ci --omit=dev
npm run db:init
npm run db:migrate:patient-profile
npm run db:migrate:prescriptions
npm run db:migrate:reviews
npm start
```

### Frontend

```powershell
Set-Location .\frontend
npm ci
npm run build
```

Deploy the generated `frontend/dist` directory. Configure the hosting provider to route unknown frontend paths to `index.html` so client-side routes continue to work.

Before production release:

1. Set production environment variables.
2. Use a managed MySQL database and a least-privilege user.
3. Use a long random `JWT_SECRET`.
4. Configure the exact frontend origin in `CORS_ORIGIN`.
5. Run database migrations.
6. Run `npm run test:day27` against the release database/API.
7. Run frontend tests and build.
8. Verify login, appointment booking, notifications, reviews, prescriptions, and admin access.
9. Confirm `.env` files and credentials are not committed.

## 15. Existing Documentation

Additional project documentation is available in:

- [README.md](README.md)
- [Backend README](backend/README.md)
- [Deployment Guide](document/DeploymentGuide.md)
- [Product Requirements Document](document/PRD.md)
- [Technical Requirements Document](document/TRD.md)
- [Application Flow](document/AddFlow.md)
- [UI/UX Design Brief](document/UIUXDesignBrief.md)
- [Backend Schema](document/BackendSchema.md)
- [Implementation Plan](document/ImplementationPlan.md)

## 16. Final Verification Status

The implemented project has been validated with the following checks during development:

- Frontend test suite: passing.
- Frontend TypeScript production build: passing.
- Backend appointment integration suite: passing.
- Backend notification integration suite: passing.
- Backend review integration suite: passing.
- Backend doctor search suite: passing.
- Role-protected frontend routes: covered by tests.
- Patient and doctor appointment lifecycle: implemented from booking through acceptance and completion.
- Public doctor rating display: implemented using approved reviews.

The exact final test result can vary with the current database contents and environment configuration. Run the commands in Section 11 before submitting or deploying a release.
