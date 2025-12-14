const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { verifyFireBaseToken } = require('../middleware/authMiddleware');

const validate = require('../middleware/validateMiddleware');
const { createGroupSchema } = require('../models/validationSchemas');

router.post('/', verifyFireBaseToken, validate(createGroupSchema), groupController.createGroup);
router.get('/', groupController.getPublicGroups);
router.get('/my-groups', verifyFireBaseToken, groupController.getMyGroups);
router.post('/join', verifyFireBaseToken, groupController.joinGroup);
router.post('/dm', verifyFireBaseToken, groupController.createDM);
router.post('/request-join', verifyFireBaseToken, groupController.requestJoin);
router.post('/approve-join', verifyFireBaseToken, groupController.approveJoin);

module.exports = router;
