const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: String,
    level: { type: String, enum: ['basic', 'intermediate', 'advanced'] },
    category: String,
    image: String,
});

const certificationSchema = new mongoose.Schema({
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    image: String
});

const resumeSchema = new mongoose.Schema({
    name: String,
    uploadedDate: Date,
    size: String,
    primary: Boolean,
    fileData: String // For base64 content
});

const loginHistorySchema = new mongoose.Schema({
    device: String,
    location: String,
    ip: String,
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    date: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    registerNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    mobile: String, // Supporting both phone and mobile
    password: { type: String }, // Optional for now to avoid breaking existing users
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    department: { type: String, default: 'CSE' },
    year: { type: String, default: '2024' },
    cgpa: { type: String, default: '0.00' },
    stream: String,
    dateOfBirth: Date,
    gender: String,
    skills: [skillSchema],
    certifications: [certificationSchema],
    resumes: [resumeSchema],
    activityPoints: {
        total: { type: Number, default: 0 },
        max: { type: Number, default: 150 },
        badgeLevel: { type: String, default: 'Bronze' }
    },
    rank: { type: Number, default: 0 },
    placementStatus: {
        type: String,
        enum: ['placed', 'shortlisted', 'applied', 'eligible', 'not_eligible'],
        default: 'eligible'
    },
    placedCompany: String,
    package: String,
    status: { 
        type: String, 
        enum: ['active', 'pending', 'rejected'], 
        default: 'active' 
    },
    designation: { type: String, default: 'Placement Officer' },
    officeLocation: { type: String, default: 'Admin Block' },
    photo: String, // Base64 or URL
    applicationsCount: { type: Number, default: 0 },
    settings: {
        notifications: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false },
            newCompanyAlerts: { type: Boolean, default: true },
            applicationUpdates: { type: Boolean, default: true },
            deadlineReminders: { type: Boolean, default: true },
            placementCellMessages: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: false }
        },
        privacy: {
            profileVisibility: { type: String, enum: ['public', 'placement-cell', 'private'], default: 'placement-cell' },
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false },
            showResume: { type: Boolean, default: true }
        },
        appearance: {
            theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
            language: { type: String, default: 'en' },
            fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
        },
        emailPrefs: {
            dailyDigest: { type: Boolean, default: false },
            weeklyReport: { type: Boolean, default: true },
            monthlyNewsletter: { type: Boolean, default: false },
            companyRecommendations: { type: Boolean, default: true }
        }
    },
    loginHistory: [loginHistorySchema],
    twoFactorEnabled: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save hook to round cgpa to 1 decimal place
userSchema.pre('save', function() {
    if (this.cgpa && typeof this.cgpa === 'string') {
        const numericCGPA = parseFloat(this.cgpa);
        if (!isNaN(numericCGPA)) {
            this.cgpa = (Math.round(numericCGPA * 10) / 10).toFixed(1);
        }
    } else if (this.cgpa && typeof this.cgpa === 'number') {
        this.cgpa = (Math.round(this.cgpa * 10) / 10).toFixed(1);
    }
});

module.exports = mongoose.model('User', userSchema);
