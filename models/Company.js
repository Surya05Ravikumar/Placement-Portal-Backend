const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema({
    role: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    workMode: { type: String, enum: ['onsite', 'hybrid', 'remote'], default: 'onsite' },
    package: { type: Number, required: true },
    bonus: String,
    bond: String
});

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    industry: { type: String, required: true },
    website: String,
    location: { type: String, required: true },
    headquarters: String,
    description: { type: String, required: true },
    logo: String, // Base64 or URL

    jobRoles: [jobRoleSchema],

    eligibleBranches: [String],
    minCGPA: Number,
    allowedBacklogs: Number,
    passingYear: Number,

    applicationStart: Date,
    applicationDeadline: Date,
    driveDate: Date,

    maxApplications: { type: Number, default: Infinity },
    requiredPoints: { type: Number, default: 0 },
    jobType: { type: String, enum: ['intern', 'fulltime'], default: 'fulltime' },
    fcfsEnabled: { type: Boolean, default: false },
    rounds: [{
        name: { type: String, required: true },
        venue: { type: String, default: 'Same College' }
    }],
    applicationsCount: { type: Number, default: 0 },
    selectedCount: { type: Number, default: 0 },

    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' }
}, { timestamps: true });

// Pre-save hook to round minCGPA to 1 decimal place
companySchema.pre('save', function() {
    if (this.minCGPA !== undefined && this.minCGPA !== null) {
        this.minCGPA = Math.round(this.minCGPA * 10) / 10;
    }
});

module.exports = mongoose.model('Company', companySchema);
