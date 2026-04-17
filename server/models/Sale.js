const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    customerName: {
        type: String
    },
    customerPhone: {
        type: String
    },
    soldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'online'],
        default: 'cash'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sale', SaleSchema);
