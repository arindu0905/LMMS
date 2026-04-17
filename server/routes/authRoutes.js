const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { register, login, getUsers, deleteUser, updateUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/', auth, getUsers);
router.delete('/:id', auth, deleteUser);
router.put('/:id', auth, updateUser);

module.exports = router;
