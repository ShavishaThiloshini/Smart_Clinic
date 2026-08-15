require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    console.log('MySQL connection successful.');
  } catch (error) {
    console.warn('MySQL is not available yet. Starting the Express server without database connection.');
    console.warn('To enable DB features, start MySQL and configure DB_* values in the .env file.');
  }

  app.listen(PORT, () => {
    console.log(`Smart Clinic backend running on http://localhost:${PORT}`);
  });
}

startServer();
