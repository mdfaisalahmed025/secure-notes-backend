const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const noteController = require('../controllers/noteController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All admin routes require authentication and 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Admin notes list
router.get('/notes', noteController.getAllNotesAdmin);

// Admin user management
router.route('/users')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/users/:id')
  .get(userController.getUserById)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;

