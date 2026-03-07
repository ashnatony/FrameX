const axios = require('axios');
const fs = require('fs');

const API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';

async function testPixazo() {
  let log = '';
  try {
    const urls = [
      'https://gateway.pixazo.ai/flux-schnell/v1/flux-schnell/generate',
      'https://gateway.pixazo.ai/flux/v1/flux/generate',
      'https://gateway.pixazo.ai/stable-diffusion/v1/stable-diffusion/generate',
      'https://gateway.pixazo.ai/p-video/v1/p-video/generate', 
      'https://gateway.pixazo.ai/flux-1-schnell/v1/getDataBatch'
    ];

    for (const url of urls) {
      log += `\nTesting URL: ${url}\n`;
      try {
        const payload = url.includes('video') ? { prompt: "A cat walking in a garden" } : { prompt: "A simple sketch of a cat" };
        const res = await axios.post(url, payload, {
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        log += `SUCCESS (${url}):\n${JSON.stringify(res.data, null, 2)}\n`;
      } catch (err) {
        log += `FAILED (${url}): ${err.response?.status} - ${JSON.stringify(err.response?.data) || err.message}\n`;
      }
    }
  } catch (err) {
    log += `Fatal error: ${err}\n`;
  }
  fs.writeFileSync('test_results.txt', log);
}

testPixazo();
