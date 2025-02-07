const express = require('express');
const { getObjects, getObject, createObject, deleteObject, updateObject } = require('../controllers/objectController');
const { userVerification } = require('../middleware/AuthMiddleware');
const { authorizeBoardAccess } = require('../middleware/BoardMiddleware');

const router = express.Router();

router.use(userVerification);

// GET all notes
router.get('/:boardId', getObjects);

// GET a single note
router.get('/:id', getObject);

// POST a new note
router.post('/', authorizeBoardAccess, createObject);

// DELETE a note
router.delete('/:id', authorizeBoardAccess, deleteObject);

// UPDATE a note
router.put('/:id', authorizeBoardAccess, updateObject);

module.exports = router;