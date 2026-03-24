const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    allowIneligible: { type: Boolean, default: false },
    allowMultipleApps: { type: Boolean, default: false },
    enableFCFS: { type: Boolean, default: true },
    enableOpenApps: { type: Boolean, default: false },
    autoCloseDrive: { type: Boolean, default: true },
    notifyNewCompany: { type: Boolean, default: true },
    notifyAccepted: { type: Boolean, default: true },
    notifyResult: { type: Boolean, default: true },
    autoMarkPlaced: { type: Boolean, default: true },
    requireResume: { type: Boolean, default: true },
    maxApplicationsRequired: { type: Boolean, default: true },
    allowEditProfile: { type: Boolean, default: true },
    allowWithdraw: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
