const mongoose = require('mongoose');
const Company = require('./models/Company');

console.log('Company Schema Rounds:', Company.schema.path('rounds'));
console.log('Is it an array?', Company.schema.path('rounds') instanceof mongoose.Schema.Types.Array);
if (Company.schema.path('rounds').schema) {
    console.log('Sub-schema paths:', Object.keys(Company.schema.path('rounds').schema.paths));
} else {
    console.log('No sub-schema found for rounds (might be simple array)');
}

process.exit(0);
