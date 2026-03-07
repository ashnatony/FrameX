// Quick test to verify OpenSubtitles API key
const https = require('https');

const API_KEY = 'u4riEzwm9pX7ummPhApVRl5f8kldTSLI';
const API_URL = 'https://api.opensubtitles.com/api/v1';

console.log('🔑 Testing OpenSubtitles API Key...\n');

const options = {
  hostname: 'api.opensubtitles.com',
  port: 443,
  path: '/api/v1/subtitles?query=Matrix&languages=en',
  method: 'GET',
  headers: {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
    'User-Agent': 'ScreenX v1.0'
  }
};

const req = https.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Response:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.error('📋 Error Code:', error.code);
  console.error('\n💡 This could mean:');
  console.error('   1. Invalid API key');
  console.error('   2. Network/firewall blocking the connection');
  console.error('   3. OpenSubtitles API is down');
  console.error('\n🔗 Test your API key at: https://www.opensubtitles.com/en/consumers');
});

req.end();
