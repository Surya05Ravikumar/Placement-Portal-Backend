require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    console.log('--- Database Connection Test ---');
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';
    console.log('Attempting to connect to:', uri.split('@')[1] || uri); // Hide credentials
    
    try {
        await mongoose.connect(uri);
        console.log('✅ DATABASE CONNECTION SUCCESSFUL');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Available Collections:', collections.map(c => c.name).join(', '));
        
        // Check if essential collections exist
        const essentialCollections = ['users', 'companies', 'applications', 'resources'];
        essentialCollections.forEach(col => {
            if (collections.some(c => c.name === col)) {
                console.log(`- Collection "${col}" found.`);
            } else {
                console.warn(`- WARNING: Collection "${col}" is missing!`);
            }
        });

    } catch (err) {
        console.error('❌ DATABASE CONNECTION FAILED');
        console.error('Error Details:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
        process.exit(0);
    }
}

testConnection();
