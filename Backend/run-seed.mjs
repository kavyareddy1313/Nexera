// Quick script to hit the seed endpoint
const http = await import('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/courses/seed-instructors',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.default.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
