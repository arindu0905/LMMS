const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, customerController.getCustomers);
router.post('/', auth, customerController.createCustomer);

module.exports = router;
