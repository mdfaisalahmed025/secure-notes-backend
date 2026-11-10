const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All note routes require authentication
router.use(protect);

// User routes (also accessible to admin)
router.route('/')
  .post(noteController.createNote)
  .get(noteController.getUserNotes);

router.route('/:id')
  .get(noteController.getNoteById)
  .put(noteController.updateNote)
  .delete(noteController.deleteNote);

module.exports = router;

