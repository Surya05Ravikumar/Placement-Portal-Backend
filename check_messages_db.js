require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const ADMIN_ID = 'placement-cell';
        
        const senders = await Message.distinct('sender', { receiver: ADMIN_ID });
        const receivers = await Message.distinct('receiver', { sender: ADMIN_ID });
        let contactIds = [...new Set([...senders, ...receivers])];
        
        console.log('Contact IDs for admin:', contactIds);

        const allMessages = await Message.find({
            $or: [{ sender: ADMIN_ID }, { receiver: ADMIN_ID }]
        }).sort({ timestamp: -1 }).limit(5);

        console.log('Recent 5 messages for admin:');
        allMessages.forEach(m => console.log(`- From: ${m.sender}, To: ${m.receiver}, Text: ${m.text}`));

        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });
