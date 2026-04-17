const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getSuppliers, addSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

router.get('/', auth, getSuppliers);
router.post('/', auth, addSupplier);
router.put('/:id', auth, updateSupplier);
router.delete('/:id', auth, deleteSupplier);

module.exports = router;
