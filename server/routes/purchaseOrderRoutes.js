const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus } = require('../controllers/purchaseOrderController');

// All endpoints currently public for UI interaction ease but should be protected with auth middleware
router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
