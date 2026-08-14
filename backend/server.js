require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    console.log('PostgreSQL connection successful.');
  } catch (error) {
    console.warn('PostgreSQL is not available yet. Starting the Express server without database connection.');
    console.warn('To enable DB features, start PostgreSQL and configure DATABASE_URL in the .env file.');
  }

  app.listen(PORT, () => {
    console.log(`Smart Clinic backend running on http://localhost:${PORT}`);
  });
}

startServer();
