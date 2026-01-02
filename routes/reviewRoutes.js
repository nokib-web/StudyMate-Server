const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

// Public route to get reviews
router.get('/:partnerId', reviewController.getReviewsByPartnerId);

// Protected route to add review
router.post('/', verifyFireBaseToken, reviewController.addReview);

module.exports = router;
