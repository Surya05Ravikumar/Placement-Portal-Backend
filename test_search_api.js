const API_URL = 'http://localhost:5000/api/messages';

async function testSearch() {
    try {
        console.log('Testing student search via fetch...');
        const response = await fetch(`${API_URL}/users?search=Suresh`);
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Search Results:', JSON.stringify(data, null, 2));
        
        if (data.length > 0) {
            console.log('✅ Student search working!');
        } else {
            console.log('❌ No students found (check if Suresh Raina was seeded)');
        }
    } catch (err) {
        console.error('❌ Search test failed:', err.message);
    }
}

testSearch();
