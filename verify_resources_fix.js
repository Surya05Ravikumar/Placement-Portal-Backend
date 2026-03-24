const mongoose = require('mongoose');
const Resource = require('./models/Resource');

async function check() {
    try {
        console.log("Connecting...");
        await mongoose.connect('mongodb://127.0.0.1:27017/placement_portal');
        console.log("Connected.");
        
        const count = await Resource.countDocuments();
        console.log("Total resources:", count);
        
        const samples = await Resource.find().limit(5);
        console.log("Samples (URLs):", samples.map(s => ({ title: s.title, url: s.url })));
        
        const hashed = await Resource.countDocuments({ url: '#' });
        console.log("Resources with '#' url:", hashed);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

check();
