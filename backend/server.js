require('dotenv').config();

const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    console.log('✅ MySQL connection successful.');
  } catch (error) {
    console.warn('⚠️  MySQL is not available yet. Starting Express without DB.');
    console.warn('   → Start MySQL and configure .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Smart Clinic backend running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
