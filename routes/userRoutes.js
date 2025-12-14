const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const validate = require('../middleware/validateMiddleware');
const { createUserSchema } = require('../models/validationSchemas');

// Define routes
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/all', userController.getAllUsers); // Place generic routes BEFORE param routes if needed, but 'all' != ':email' usually unless email is 'all'
router.get('/:email', userController.getUserByEmail);
router.get('/admin/:email', userController.getAdmin);
router.patch('/role/:id', userController.updateUserRole);
router.put('/:email', userController.updateUser);

module.exports = router;
