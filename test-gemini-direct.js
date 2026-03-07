// Direct API test for Gemini
const https = require('https');

const API_KEY = 'AIzaSyCNQh3EmKJ2P6MHQDAEEi1YAfp-FTMRan8';

// Try listing models using direct API call
const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${API_KEY}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Testing Gemini API with direct HTTP call...');
console.log(`URL: https://${options.hostname}${options.path.replace(API_KEY, 'YOUR_KEY')}`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nStatus Code:', res.statusCode);
    console.log('\nResponse:');
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log('\nAvailable Models:');
        parsed.models.forEach(model => {
          console.log(`- ${model.name} (${model.displayName})`);
          if (model.supportedGenerationMethods) {
            console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
          }
        });
      } else {
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
