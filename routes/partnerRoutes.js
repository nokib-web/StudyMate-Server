const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

const validate = require('../middleware/validateMiddleware');
const { createPartnerSchema } = require('../models/validationSchemas');

// Public routes
router.get('/', partnerController.getPartners);
router.get('/top-partners', partnerController.getTopPartners);

// Protected routes
router.get('/:id', verifyFireBaseToken, partnerController.getPartnerById);
router.post('/', verifyFireBaseToken, validate(createPartnerSchema), partnerController.createPartner);
router.patch('/:id', partnerController.updatePartnerCount); // Maybe secure this? kept as is from index.js
router.delete('/:id', partnerController.deletePartner); // Maybe secure this? kept as is

module.exports = router;
