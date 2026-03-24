const http = require('http');

const userId = '69bd0d4959aa5f251c676f5b'; // Admin ID from previous test

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/notifications',
  method: 'GET',
  headers: {
    'x-user-id': userId
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json).substring(0, 500));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
