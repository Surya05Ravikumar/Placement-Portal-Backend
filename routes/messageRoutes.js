const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// @route   GET /api/messages/conversations/:userId
// @desc    Get all users who have a conversation with this user
router.get('/conversations/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find the user to get their registerNumber if the provided ID is an _id
        let userRegNo = userId;
        try {
            if (userId.length === 24) {
                const user = await User.findById(userId);
                if (user) userRegNo = user.registerNumber;
            }
        } catch (e) {}

        // Find everyone user has talked to (matching either id or registerNumber)
        const senders = await Message.distinct('sender', { 
            $or: [{ receiver: userId }, { receiver: userRegNo }] 
        });
        const receivers = await Message.distinct('receiver', { 
            $or: [{ sender: userId }, { sender: userRegNo }] 
        });
        
        // Filter out null/undefined and cast to string
        let contactIds = [...new Set([...senders, ...receivers])].filter(id => id != null).map(String);

        // RESTRICTION: If the requester is a student, they can ONLY see conversations with admins
        const requestingUser = await User.findOne({ 
            $or: [{ _id: userId.length === 24 ? userId : null }, { registerNumber: userRegNo }] 
        });

        if (requestingUser && requestingUser.role === 'student') {
            // Filter contactIds to only include admins OR the hardcoded 'placement-cell'
            const filteredContactIds = [];
            for (const cId of contactIds) {
                if (cId === 'placement-cell') {
                    filteredContactIds.push(cId);
                    continue;
                }
                const contactUser = await User.findOne({ 
                    $or: [{ _id: cId.length === 24 ? cId : null }, { registerNumber: cId }] 
                });
                if (contactUser && contactUser.role === 'admin') {
                    filteredContactIds.push(cId);
                }
            }
            contactIds = filteredContactIds;

            // If no conversations exist yet, provide 'placement-cell' as default for students
            if (contactIds.length === 0) {
                contactIds = ['placement-cell'];
            }
        }

        const conversations = await Promise.all(contactIds.map(async (contactId) => {
            let name, avatar;
            if (contactId === 'placement-cell') {
                name = 'Surya Ravikumar';
                avatar = 'SR';
            } else {
                let contactUser;
                try {
                    contactUser = await User.findOne({ registerNumber: contactId });
                    if (!contactUser && contactId && contactId.length === 24) {
                        try {
                            contactUser = await User.findById(contactId);
                        } catch (e) {
                            // Suppress invalid ObjectId error
                        }
                    }
                } catch (err) {
                    console.error('Error finding user for contactId:', contactId, err.message);
                }
                
                name = (contactUser && contactUser.name) ? contactUser.name : String(contactId || 'Unknown');
                avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }

            const lastMessage = await Message.findOne({
                $or: [
                    { sender: userId, receiver: contactId },
                    { sender: userRegNo, receiver: contactId },
                    { sender: contactId, receiver: userId },
                    { sender: contactId, receiver: userRegNo }
                ]
            }).sort({ createdAt: -1 });

            const unreadCount = await Message.countDocuments({
                sender: contactId,
                $or: [{ receiver: userId }, { receiver: userRegNo }],
                isRead: false
            });

            return {
                id: contactId,
                name: name,
                avatar: avatar,
                lastMessage: lastMessage ? (lastMessage.text || (lastMessage.file ? 'Attachment' : '')) : 'Start a conversation...',
                time: lastMessage ? (lastMessage.timestamp || lastMessage.createdAt) : null,
                unread: unreadCount,
                online: true // Assume online for now
            };
        }));

        // Robust sorting using getTime()
        res.json(conversations.sort((a, b) => {
            const timeA = a.time ? new Date(a.time).getTime() : 0;
            const timeB = b.time ? new Date(b.time).getTime() : 0;
            return timeB - timeA;
        }));
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/messages/unread-count/:userId
// @desc    Get total unread message count for a user
router.get('/unread-count/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const count = await Message.countDocuments({
            receiver: userId,
            isRead: false
        });
        res.json({ count });
    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/messages/users
// @desc    Search for users (students) to start a new chat
router.get('/users', async (req, res) => {
    try {
        const { search, requesterRole } = req.query;
        
        // If requester is a student, they shouldn't be searching for other students
        if (requesterRole === 'student') {
            return res.json([]);
        }

        let query = { role: 'student' };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registerNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('name registerNumber department photo')
            .limit(20);

        res.json(users.map(u => ({
            id: u.registerNumber,
            name: u.name,
            department: u.department,
            avatar: u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        })));
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/messages/:userA/:userB
// @desc    Get messages between two users (with student restriction)
router.get('/:userA/:userB', async (req, res) => {
    try {
        const { userA, userB } = req.params;

        // Security Check: If one of them is a student, the other MUST be an admin or 'placement-cell'
        const resolveUser = async (id) => {
            if (id === 'placement-cell') return { role: 'admin' };
            return await User.findOne({ $or: [{ _id: id.length === 24 ? id : null }, { registerNumber: id }] });
        };

        const [uA, uB] = await Promise.all([resolveUser(userA), resolveUser(userB)]);
        
        // If both are students, block the request
        if (uA && uB && uA.role === 'student' && uB.role === 'student') {
            return res.status(403).json({ message: 'Direct student-to-student messaging is restricted.' });
        }
        
        // If IDs might be _ids, resolve their registerNumbers for broad matching
        let regA = userA, regB = userB;
        try {
            if (userA.length === 24) {
                const uA = await User.findById(userA);
                if (uA) regA = uA.registerNumber;
            }
            if (userB.length === 24) {
                const uB = await User.findById(userB);
                if (uB) regB = uB.registerNumber;
            }
        } catch (e) {}

        const messages = await Message.find({
            $or: [
                { sender: userA, receiver: userB },
                { sender: regA, receiver: userB },
                { sender: userA, receiver: regB },
                { sender: regA, receiver: regB },
                { sender: userB, receiver: userA },
                { sender: regB, receiver: userA },
                { sender: userB, receiver: regA },
                { sender: regB, receiver: regA }
            ]
        }).sort({ timestamp: 1 });

        // Mark as read
        await Message.updateMany(
            { 
                sender: userB, 
                $or: [{ receiver: userA }, { receiver: regA }], 
                isRead: false 
            },
            { $set: { isRead: true } }
        );

        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/messages
// @desc    Send a message (with student restriction)
router.post('/', async (req, res) => {
    try {
        const { sender, receiver, text } = req.body;

        // Security Check: Prevent student-to-student messaging
        const resolveUser = async (id) => {
            if (id === 'placement-cell') return { role: 'admin' };
            return await User.findOne({ $or: [{ _id: id.length === 24 ? id : null }, { registerNumber: id }] });
        };

        const [uSender, uReceiver] = await Promise.all([resolveUser(sender), resolveUser(receiver)]);
        if (uSender && uReceiver && uSender.role === 'student' && uReceiver.role === 'student') {
            return res.status(403).json({ message: 'Communication restricted to Placement Cell only.' });
        }

        const newMessage = new Message({ sender, receiver, text });
        const savedMessage = await newMessage.save();
        res.status(201).json(savedMessage);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
