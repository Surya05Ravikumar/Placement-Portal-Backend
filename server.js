require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Prevent backend from crashing automatically on unhandled errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Default Route
app.get('/', (req, res) => {
    res.send('Placement Portal API Running');
});

// Import Routes
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage: storage });

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Or specific frontend URL
        methods: ["GET", "POST"]
    }
});

// Make io globally accessible or export it
app.set('socketio', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a personal room based on User ID
    socket.on('join_personal', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined personal room: ${userId}`);
    });

    // Join a specific chat room (sorted combination of both IDs)
    socket.on('join_chat', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined chat room: ${roomId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
        try {
            if (!data.receiver || !data.sender) {
                console.error("Cannot send message: sender or receiver missing");
                return;
            }

            // Save to DB via the Mongoose model
            const Message = require('./models/Message');
            const newMessage = new Message({
                sender: data.sender,
                receiver: data.receiver,
                text: data.text,
                file: data.file,
                isRead: false
            });
            const savedMessage = await newMessage.save();

            // Emit to both the sender and the receiver's personal rooms
            // AND the specific chat room (chatId) if provided
            console.log(`Emitting message to: ${data.receiver}, ${data.sender}, ${data.chatId || 'no-chat-id'}`);
            
            const emitter = io.to(data.receiver).to(data.sender);
            if (data.chatId) {
                emitter.to(data.chatId);
            }
            
            emitter.emit('receive_message', savedMessage);
        } catch (error) {
            console.error("Error saving/sending message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal')
    .then(() => {
        console.log("Connected to MongoDB");
        // Start the HTTP server (which includes socket.io) instead of directly app.listen
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error(err));
