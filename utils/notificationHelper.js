const Notification = require('../models/Notification');
const User = require('../models/User');

const notify = async (io, recipientId, title, message, type = 'general') => {
    try {
        const notification = new Notification({
            recipient: recipientId,
            title,
            message,
            type
        });
        await notification.save();
        
        if (io) {
            io.to(recipientId.toString()).emit('receive_notification', notification);
        }
        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
    }
};

const notifyAllStudents = async (io, title, message, type = 'new_company') => {
    try {
        const students = await User.find({ role: 'student' }).select('_id');
        const notifications = students.map(student => ({
            recipient: student._id,
            title,
            message,
            type
        }));
        
        await Notification.insertMany(notifications);
        
        if (io) {
            // Emitting to each student's room might be expensive for thousands of students,
            // but for a school project it's fine. Alternatively, use a 'students_room'.
            students.forEach(student => {
                io.to(student._id.toString()).emit('receive_notification', {
                    title,
                    message,
                    type,
                    status: 'unread',
                    createdAt: new Date()
                });
            });
        }
    } catch (err) {
        console.error('Error notifying students:', err);
    }
};

const notifyAdmins = async (io, title, message, type = 'high_applications') => {
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifications = admins.map(admin => ({
            recipient: admin._id,
            title,
            message,
            type
        }));
        
        await Notification.insertMany(notifications);
        
        if (io) {
            admins.forEach(admin => {
                io.to(admin._id.toString()).emit('receive_notification', {
                    title,
                    message,
                    type,
                    status: 'unread',
                    createdAt: new Date()
                });
            });
        }
    } catch (err) {
        console.error('Error notifying admins:', err);
    }
};

module.exports = { notify, notifyAllStudents, notifyAdmins };
