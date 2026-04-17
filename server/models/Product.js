const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['mobile', 'accessory', 'part'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    costPrice: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    supplier: {
        type: String
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    },
    sku: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
