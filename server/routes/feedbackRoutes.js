const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getFeedback, addFeedback, getFeedbackByProduct } = require('../controllers/feedbackController');

router.get('/', auth, getFeedback);
router.get('/product/:productId', getFeedbackByProduct);
router.post('/', addFeedback);

module.exports = router;
