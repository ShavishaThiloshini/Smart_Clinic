const express = require('express');
const cors = require('cors');
const { createHealthRouter } = require('./routes/health');
const { createAuthRouter }  = require('./routes/auth');
const { createAdminRouter } = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'Smart Clinic Backend',
    status: 'running',
    message: 'Express.js server is active.'
  });
});

app.use('/api',       createHealthRouter());
app.use('/api/auth',  createAuthRouter());
app.use('/api/admin', createAdminRouter());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server.'
  });
});

module.exports = app;
