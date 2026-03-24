const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users',
  method: 'GET'
};

console.log('--- API Health Check ---');
console.log(`Pinging http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('--- API Response Data ---');
    console.log('Raw data length:', data.length);
    if (!data) {
        console.log('⚠️ API RESPONDED WITH EMPTY DATA');
        return;
    }
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ API RESPONDED SUCCESSFULLY');
      console.log('Is Array?', Array.isArray(jsonData));
      console.log(`Total items in response: ${Array.isArray(jsonData) ? jsonData.length : (typeof jsonData === 'object' ? Object.keys(jsonData).length : 'N/A')}`);
      if (jsonData.data) {
        console.log('--- Inside "data" key ---');
        console.log('Is Array?', Array.isArray(jsonData.data));
        console.log(`Length: ${Array.isArray(jsonData.data) ? jsonData.data.length : 'N/A'}`);
        if (Array.isArray(jsonData.data) && jsonData.data.length > 0) {
            console.log('Sample data item:', JSON.stringify(jsonData.data[0]).substring(0, 150) + '...');
        }
      }
    } catch (e) {
      console.log('❌ FAILED TO PARSE JSON RESPONSE');
      console.log('Raw output head:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ API REQUEST FAILED: ${e.message}`);
});

req.end();
