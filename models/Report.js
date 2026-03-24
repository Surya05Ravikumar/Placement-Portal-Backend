const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'Placement Progress', 'Department Wise', 'Company Wise'
    generatedBy: { type: String, default: 'Admin' },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Completed' },
    fileUrl: { type: String }, // Optional link to actual file if generated
    stats: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
