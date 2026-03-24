const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
    event: String,
    date: Date,
    type: { type: String, enum: ['success', 'pending', 'info'] },
    description: String
});

const roundsSchema = new mongoose.Schema({
    roundName: String,
    status: { type: String, enum: ['Completed', 'Pending', 'In Progress'] },
    date: Date,
    description: String
});

const applicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    userRegisterNumber: { type: String, required: true }, // easy lookup without populate
    companyName: { type: String, required: true }, // easy lookup without populate
    status: { type: String, enum: ['Shortlisted', 'Applied', 'In-Progress', 'Selected', 'Rejected', 'Pending'], default: 'Applied' },
    appliedDate: { type: Date, default: Date.now },
    lastUpdate: { type: Date, default: Date.now },
    progress: { type: Number, default: 20 },
    currentRound: String,
    nextStep: [String],
    role: String,
    package: Number,
    rounds: [roundsSchema],
    timeline: [timelineSchema],
    experienceUploaded: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

applicationSchema.index({ user: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
