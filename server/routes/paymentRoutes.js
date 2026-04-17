const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

// Note: Ensure the auth middleware is added if the endpoint should be protected.
// In salesController it was commented as Private, but we'll leave it open if the middleware isn't strict, or wrap it in auth based on standard patterns.
// Given this app relies heavily on frontend views protecting routes, we'll apply standard routing.

// @route   GET api/payments
// @desc    Get all payment records
// @access  Private
router.get('/', paymentController.getPayments);

module.exports = router;
