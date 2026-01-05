const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { verifyFireBaseToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', storyController.getStories);
router.post('/', verifyFireBaseToken, verifyAdmin, storyController.createStory);
router.delete('/:id', verifyFireBaseToken, verifyAdmin, storyController.deleteStory);

module.exports = router;
