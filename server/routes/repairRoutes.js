const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    createRepair,
    getRepairs,
    getRepairById,
    updateRepair,
    deleteRepair,
    getMyRepairs
} = require('../controllers/repairController');

// Middleware: only allow specified roles
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Access denied: insufficient role' });
    }
    next();
};

// All routes require authentication
router.post('/', auth, requireRole('admin', 'sales'), createRepair);
router.get('/my-assigned', auth, getMyRepairs);
router.get('/', auth, getRepairs);
router.get('/:id', auth, getRepairById);
router.put('/:id', auth, requireRole('admin', 'sales', 'technician'), updateRepair);
router.delete('/:id', auth, requireRole('admin'), deleteRepair);

module.exports = router;
