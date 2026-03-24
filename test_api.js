const axios = require('axios');

async function test() {
    try {
        const regNo = '20CS101'; // Based on my debug script showing this user as having 6 offers
        const url = 'http://localhost:5000/api/users/byReg/' + regNo;
        console.log('Testing URL:', url);
        const response = await axios.get(url);
        console.log('Response Status:', response.status);
        console.log('Full Response Data:', JSON.stringify(response.data, null, 2));
        
        console.log('Rank:', response.data.rank);
        console.log('Selected Count:', response.data.selectedCount);
    } catch (err) {
        console.error('API Test Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

test();
