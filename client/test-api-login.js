import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'realuser3@example.com',
            password: 'password123'
        });
        console.log('Login Result:', res.data);
    } catch (err) {
        console.error('Login Error:', err.response?.data || err.message);
    }
}
test();
