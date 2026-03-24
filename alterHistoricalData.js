require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');

async function alterHistoricalData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    
    // We'll update first few selected applications to historical dates
    const selected = await Application.find({ status: 'Selected' }).limit(4);
    
    if (selected.length < 4) {
        console.log('Not enough selected applications to alter. Found:', selected.length);
        process.exit(0);
    }

    const janDate1 = new Date(2026, 0, 15); // Jan 15
    const janDate2 = new Date(2026, 0, 25); // Jan 25
    const febDate1 = new Date(2026, 1, 10); // Feb 10
    const febDate2 = new Date(2026, 1, 20); // Feb 20

    const dates = [janDate1, janDate2, febDate1, febDate2];

    for (let i = 0; i < selected.length; i++) {
        await Application.findByIdAndUpdate(
            selected[i]._id,
            { updatedAt: dates[i] },
            { timestamps: false } // Crucial: avoid overwriting with current time
        );
        console.log(`Updated App ${selected[i]._id} to ${dates[i].toISOString()}`);
    }

    console.log('Successfully altered historical placement data.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

alterHistoricalData();
