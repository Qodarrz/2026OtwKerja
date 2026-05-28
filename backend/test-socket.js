const { io } = require('socket.io-client');
const socket = io('http://localhost:3000/notifications', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  extraHeaders: {
    cookie: 'access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOGE2YjNhMy0wYjQyLTRmOGQtODk1Ni04ZjkxZDM3OGZhMTYiLCJlbWFpbCI6ImFkbWluQGZsb3dnb3YuY29tIiwicm9sZXMiOlsiQURNSU4iXSwiaWF0IjoxNjg1MDMwNjQzLCJleHAiOjE2ODU2MzU0NDN9.ZzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzXzX'
  }
});

socket.on('connect', () => {
  console.log('Connected');
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 2000);
