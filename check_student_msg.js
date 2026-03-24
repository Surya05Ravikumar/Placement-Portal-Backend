require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./models/Message');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const STUDENT_ID = '20CS201'; // Suresh Raina
        
        const senders = await Message.distinct('sender', { receiver: STUDENT_ID });
        const receivers = await Message.distinct('receiver', { sender: STUDENT_ID });
        let contactIds = [...new Set([...senders, ...receivers])];
        
        console.log('Contact IDs for student 20CS201:', contactIds);

        // Simulate logic from messageRoutes.js
        if (contactIds.length === 0 && STUDENT_ID !== 'placement-cell') {
            contactIds = ['placement-cell'];
        }
        console.log('Final Contact IDs (with defaults):', contactIds);

        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });
