const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../middleware/authMiddleware');

router.get('/customer/:customerId', auth, deviceController.getDevicesByCustomer);
router.post('/', auth, deviceController.createDevice);

module.exports = router;
