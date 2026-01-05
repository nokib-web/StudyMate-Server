const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

router.get('/stats/:email', verifyFireBaseToken, dashboardController.getDashboardStats);

module.exports = router;
