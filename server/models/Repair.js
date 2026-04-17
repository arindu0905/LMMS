const mongoose = require('mongoose');

const RepairSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    deviceModel: {
        type: String,
        required: true
    },
    issueDescription: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'delivered'],
        default: 'pending'
    },
    estimatedCost: {
        type: Number,
        default: 0
    },
    finalCost: {
        type: Number,
        default: 0
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Repair', RepairSchema);
