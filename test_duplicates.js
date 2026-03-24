const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:5000';
const ADMIN_ID = 'placement-cell';
const STUDENT_ID = '20CS101';

async function testDuplicates() {
    const socket = io(SOCKET_URL);
    let receiveCount = 0;

    socket.on('connect', () => {
        console.log('Connected to socket');
        socket.emit('join_personal', ADMIN_ID);
        // Also join the chat room to simulate real UI state
        const roomId = [ADMIN_ID, STUDENT_ID].sort().join('_');
        socket.emit('join_chat', roomId);

        console.log('Sending message...');
        socket.emit('send_message', {
            chatId: roomId,
            sender: ADMIN_ID,
            receiver: STUDENT_ID,
            text: 'Duplicate test message'
        });
    });

    socket.on('receive_message', (msg) => {
        receiveCount++;
        console.log(`Received message ${receiveCount}:`, msg.text);
    });

    // Wait 3 seconds then check count
    setTimeout(() => {
        console.log(`Final Receive Count: ${receiveCount}`);
        if (receiveCount === 1) {
            console.log('✅ Success: Received only once!');
        } else {
            console.log(`❌ Failure: Received ${receiveCount} times!`);
        }
        socket.disconnect();
        process.exit(0);
    }, 3000);
}

testDuplicates();
