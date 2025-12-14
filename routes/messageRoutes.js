const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController'); // Reusing controller since logic is there
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

router.get('/:room', verifyFireBaseToken, groupController.getMessages);
router.patch('/read', verifyFireBaseToken, groupController.markRead);

module.exports = router;
