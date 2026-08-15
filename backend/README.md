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

## MySQL note

The init script creates `smart_clinic` and applies `src/config/schema.sql` automatically.
Ensure MySQL is listening on port 3306 before running `npm run db:init`.
