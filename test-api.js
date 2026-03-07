const http = require('http');

const movieName = process.argv[2] || 'The Matrix';

console.log(`🎬 Testing ScreenX API with movie: "${movieName}"\n`);

const data = JSON.stringify({
  movieName: movieName
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/movie/generate-script',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\n📄 Response:\n');
    
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the server is running with: npm run start:dev');
});

req.write(data);
req.end();
