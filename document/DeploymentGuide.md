# Smart Clinic Deployment Guide

## 1. Backend deployment

Use a managed MySQL instance and create a backend environment with:

```text
NODE_ENV=production
PORT=5000
DB_HOST=<mysql-host>
DB_PORT=3306
DB_NAME=smart_clinic
DB_USER=<least-privilege-user>
DB_PASSWORD=<database-password>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<frontend-host>
```

Install and start the service:

```bash
cd backend
npm ci --omit=dev
npm run db:init
npm run db:migrate:patient-profile
npm run db:migrate:prescriptions
npm run db:migrate:reviews
npm start
```

The backend health check is `GET /api/health`. It should return HTTP 200 with `status: "ok"` before the frontend is published.

## 2. Frontend deployment

Set the API origin to the deployed backend before building:

```text
VITE_API_URL=https://<backend-host>
```

Build and serve the static frontend with the hosting provider:

```bash
cd frontend
npm ci
npm run build
```

Publish the generated `frontend/dist` directory. Configure the host to serve `index.html` for client-side routes such as `/login` and `/patient/dashboard`.

## 3. Release verification

1. Confirm `GET https://<backend-host>/api/health` returns 200.
2. Run `npm run test:day27` from `backend` against the deployed API/database using the release environment.
3. Run `npm test -- --run` and `npm run build` from `frontend`.
4. Verify patient login, doctor search, appointment booking, medical records, prescriptions, notifications, and admin reports.
5. Confirm `CORS_ORIGIN` matches the exact frontend origin and that development secrets are not deployed.

Do not commit `.env` files or production credentials. Run migrations before starting application traffic, and use a database backup before schema changes.