const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    stack: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: String,
        required: true,
        default: 'Placement Cell'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    views: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    },
    url: {
        type: String,
        required: true
    },
    visibility: {
        type: String,
        enum: ['public', 'department'],
        default: 'public'
    },
    departments: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
