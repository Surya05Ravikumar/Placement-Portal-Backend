require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Application = require('./models/Application');

async function verifySelection() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const selected = await Application.find({ 
      status: 'Selected', 
      updatedAt: { $gte: start, $lte: end } 
    }).populate('user', 'name registerNumber');

    console.log(`Total Selected in March 2026: ${selected.length}`);
    selected.forEach((a, i) => {
        const name = a.user?.name || 'Unknown';
        const reg = a.user?.registerNumber || a.studentId || 'No Reg';
        console.log(`${i+1}. ${name} (${reg})`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifySelection();
