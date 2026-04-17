const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    contactPerson: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    address: {
        type: String
    },
    productsSupplied: [
        {
            type: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Supplier', SupplierSchema);
