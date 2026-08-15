const express = require('express');

function createHealthRouter() {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'smart-clinic-backend',
      database: 'mysql'
    });
  });

  return router;
}

module.exports = { createHealthRouter };
