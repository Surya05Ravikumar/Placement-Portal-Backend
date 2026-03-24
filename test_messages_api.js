require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_ID = 'placement-cell';

const testSessions = async () => {
    try {
        console.log(`--- Testing Conversations for ${ADMIN_ID} ---`);
        const res = await axios.get(`${API_URL}/messages/conversations/${ADMIN_ID}`);
        console.log('Status Code:', res.status);
        console.log('Conversations:', JSON.stringify(res.data, null, 2));

        if (res.data.length > 0) {
            const firstChat = res.data[0].id;
            console.log(`\n--- Testing Messages for ${ADMIN_ID} and ${firstChat} ---`);
            const resMsgs = await axios.get(`${API_URL}/messages/${ADMIN_ID}/${firstChat}`);
            console.log('Status Code:', resMsgs.status);
            console.log('Messages count:', resMsgs.data.length);
        } else {
            console.log('\nNo conversations found for admin.');
        }

    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testSessions();
