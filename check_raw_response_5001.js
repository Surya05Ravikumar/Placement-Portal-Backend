const http = require('http');

http.get('http://localhost:5001/api/users', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('--- RAW RESPONSE ANALYSIS (PORT 5001) ---');
      console.log('Type of response:', typeof json);
      console.log('Is Array?', Array.isArray(json));
      console.log('Raw data first 100 chars:', data.substring(0, 100));
    } catch (e) {
      console.log('Failed to parse JSON');
      console.log('Raw data:', data.substring(0, 100));
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
