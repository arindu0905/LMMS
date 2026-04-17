const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createSale, getSales, getSalesReport, emailInvoice } = require('../controllers/salesController');

router.post('/', auth, createSale);
router.get('/', auth, getSales);
router.get('/report', auth, getSalesReport);
router.post('/email-invoice', auth, emailInvoice);

module.exports = router;
