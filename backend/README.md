# Smart Clinic Backend

This folder contains the Express.js backend for the Smart Clinic application.

## Tech stack

- Node.js
- Express.js
- MySQL
- mysql2

## Setup

1. Open the backend folder.
2. Copy `.env.example` to `.env`.
3. Set `DB_PASSWORD` to your local MySQL root password.
4. Install dependencies:

```bash
npm install
```

5. Start MySQL (Windows service name: `MySQL267`):

```powershell
net start MySQL267
```

6. Create the database and tables:

```bash
npm run db:init
```

7. Start the development server:

```bash
npm run dev
```

Or use the helper script (PowerShell):

```powershell
.\scripts\setup-mysql.ps1 -Password "your_mysql_password"
```

## Default routes

- `GET /` → app info
- `GET /api/health` → health check
- `GET /api/appointments` → authenticated patient/doctor appointment list
- `POST /api/appointments` → patient books an available doctor slot

### Appointment booking API

`POST /api/appointments` requires a patient JWT and accepts:

```json
{
	"doctorId": 1,
	"appointmentDate": "2099-01-05",
	"startTime": "09:00",
	"reason": "Routine consultation"
}
```

The API accepts only active, approved doctors and active availability slots. It calculates the end time from the configured slot duration, assigns a queue number, creates a `pending` appointment, and returns `409` when the time is unavailable or already booked.

## Doctor search API

These public endpoints return only active doctors whose profiles have been approved by an administrator.

- `GET /api/doctors` — paginated doctor list
- `GET /api/doctors?q=maya&specialization=cardiology&clinic=colombo&page=1&limit=12` — search doctors
- `GET /api/doctors/:doctorId` — one doctor's public profile

`limit` defaults to 12 and is capped at 50. Search results include professional details, consultation fee, and approved-review rating totals.

## MySQL note

The init script creates `smart_clinic` and applies `src/config/schema.sql` automatically.
Ensure MySQL is listening on port 3306 before running `npm run db:init`.

## Prescription database support

For databases created before the prescription lookup indexes were added, run:

```bash
npm run db:migrate:prescriptions
```

The command is safe to run repeatedly. To check prescription request validation without a database connection, run:

```bash
npm run test:prescriptions
```
