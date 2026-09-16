# Smart Clinic Deployment Guide

## Recommended production deployment (Docker)

This repository includes a self-contained production deployment. The frontend
is served by Nginx and proxies `/api` to the Express backend, so no public API
URL or cross-origin configuration is needed.

On an Ubuntu 22.04+ server with Docker Engine and Docker Compose installed:

```bash
git clone https://github.com/ShavishaThiloshini/Smart_Clinic.git
cd Smart_Clinic
cp .env.production.example .env.production
# Edit .env.production and replace every placeholder password and JWT secret.
docker compose --env-file .env.production up -d --build
```

Verify the deployment:

```bash
curl http://localhost/api/health
docker compose --env-file .env.production ps
```

The application listens on port 80 by default. Point a domain's DNS record to
the server, then place it behind a TLS-enabled reverse proxy such as Caddy or
your hosting provider's HTTPS load balancer. For a non-default port, set
`APP_PORT` in `.env.production`.

To update the running deployment after pulling changes:

```bash
git pull
docker compose --env-file .env.production up -d --build
```

The MySQL data is stored in the `mysql_data` Docker volume. Back it up before
updating schema code or replacing the server.

## Vercel with TiDB Cloud

Deploy the backend and frontend as separate Vercel projects from the same GitHub
repository. Being a GitHub organization member allows you to import the
repository, but the Vercel project owner must also add you to its Vercel team if
you need to create deployments there.

### Backend project

1. Import the repository into Vercel and set **Root Directory** to `backend`.
2. Vercel detects the included `api/[...path].js` serverless entry point. Do not
   use `npm start` as the Vercel build command.
3. Set these Vercel environment variables from the TiDB Cloud connection page:

```text
NODE_ENV=production
DB_HOST=<TiDB-host>
DB_PORT=4000
DB_NAME=<database-name>
DB_USER=<username>
DB_PASSWORD=<password>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<frontend-project>.vercel.app
```

4. Deploy, then open `https://<backend-project>.vercel.app/api/health`.

TiDB schema setup must be run once using a trusted machine with the same TiDB
environment variables. Do not run schema initialization from a Vercel function.

### Frontend project

1. Create a second Vercel project from the same repository with **Root
   Directory** set to `frontend`.
2. Set `VITE_API_URL` to `https://<backend-project>.vercel.app`.
3. Deploy and use the generated frontend URL. Vercel automatically handles
   React client-side routes for this Vite application.

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
