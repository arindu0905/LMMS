import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Real User Test',
            email: 'realuser3@example.com',
            password: 'password123',
            role: 'user'
        });
        console.log('Register Response:', res.status, res.data);
    } catch (err) {
        console.error('Register Error:', err.response?.data || err.message);
    }
}
test();
