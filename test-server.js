const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(5001, '0.0.0.0', () => console.log('Test server on 5001'));
