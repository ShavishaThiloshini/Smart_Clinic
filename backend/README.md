# Smart Clinic Backend

This folder contains the Express.js backend for the Smart Clinic application.

## Tech stack

- Node.js
- Express.js
- PostgreSQL
- pg (PostgreSQL client)

## Setup

1. Open the backend folder.
2. Copy `.env.example` to `.env`.
3. Update the PostgreSQL connection string if needed.
4. Install dependencies:

```bash
npm install
```

5. Start the development server:

```bash
npm run dev
```

## Default routes

- `GET /` → app info
- `GET /api/health` → health check

## PostgreSQL note

Make sure PostgreSQL is running locally and a database named `smart_clinic` exists.

Example:

```sql
CREATE DATABASE smart_clinic;
```
