const http = require('http');

http.get('http://localhost:5000/api/users', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('--- RAW RESPONSE ANALYSIS ---');
      console.log('Type of response:', typeof json);
      console.log('Is Array?', Array.isArray(json));
      if (typeof json === 'object' && !Array.isArray(json)) {
        console.log('Keys:', Object.keys(json));
        if (json.data) {
          console.log('Type of "data" key:', typeof json.data);
          console.log('Is "data" key an array?', Array.isArray(json.data));
          if (Array.isArray(json.data)) {
             console.log('Length of "data" array:', json.data.length);
          }
        }
      }
      console.log('First 500 chars of raw data:', data.substring(0, 500));
    } catch (e) {
      console.log('Failed to parse JSON');
      console.log('Raw data first 500 chars:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
