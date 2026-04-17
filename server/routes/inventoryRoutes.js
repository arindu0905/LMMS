const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getProducts, getProduct, addProduct, updateProduct, deleteProduct, getInventoryLogs } = require('../controllers/inventoryController');

router.get('/logs', auth, getInventoryLogs);
router.get('/', auth, getProducts);
router.get('/:id', auth, getProduct);
router.post('/', auth, addProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
