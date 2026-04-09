import axios from 'axios';

const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      timeout: 10000,
      withCredentials: true
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.accessToken.substring(0, 20) + '...');
    console.log('User:', response.data.user.email);
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
  }
};

testLogin();
