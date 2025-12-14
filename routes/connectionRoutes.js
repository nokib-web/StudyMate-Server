const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

router.post('/', connectionController.createConnection); // Verify? index.js didn't have it explicitly on POST but likely should
router.get('/', verifyFireBaseToken, connectionController.getConnections);
router.delete('/:id', connectionController.deleteConnection);
router.put('/:id', connectionController.updateConnection);

module.exports = router;
