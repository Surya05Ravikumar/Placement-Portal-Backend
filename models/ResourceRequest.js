const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
    userRegisterNumber: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    stack: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Approved', 'Rejected']
    },
    description: {
        type: String,
        required: true
    },
    note: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);
