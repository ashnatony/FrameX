const axios = require('axios');
const fs = require('fs');

const API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';

async function testPixazo() {
  let log = '';
  try {
    const url = 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';
    
    log += `\nTesting URL: ${url}\n`;
    const payload = { 
      prompt: "A simple sketch of a cat",
      num_steps: 4,
      height: 512,
      width: 512
    };
    
    const res = await axios.post(url, payload, {
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000 // 30 sec timeout for sync image generation
    });
    
    log += `SUCCESS:\n${JSON.stringify(res.data, null, 2)}\n`;
  } catch (err) {
    log += `FAILED: ${err.response?.status} - ${JSON.stringify(err.response?.data) || err.message}\n`;
  }
  
  fs.writeFileSync('test_results_sync.txt', log);
  console.log(log);
}

testPixazo();
