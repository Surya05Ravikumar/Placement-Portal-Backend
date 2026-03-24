const mongoose = require('mongoose');
const Resource = require('./models/Resource');

async function fix() {
    try {
        console.log("Connecting...");
        await mongoose.connect('mongodb://127.0.0.1:27017/placement_portal');
        console.log("Connected.");
        
        const result = await Resource.updateMany(
            { url: '#' },
            { $set: { url: '/uploads/sample_resource.pdf' } }
        );
        
        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        
        const remaining = await Resource.countDocuments({ url: '#' });
        console.log(`Remaining resources with '#': ${remaining}`);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

fix();
