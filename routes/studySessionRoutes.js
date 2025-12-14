const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

router.post('/', verifyFireBaseToken, studySessionController.createSession);
router.post('/rsvp', verifyFireBaseToken, studySessionController.toggleRSVP);
router.get('/:id', verifyFireBaseToken, studySessionController.getSession);

module.exports = router;
