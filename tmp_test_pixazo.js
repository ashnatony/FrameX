const axios = require('axios');

const API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';

async function testPixazo() {
  try {
    const urls = [
      'https://gateway.pixazo.ai/flux-1-schnell/v1/getDataBatch', // Copilot's guess
      'https://gateway.pixazo.ai/flux/v1/flux/generate',
      'https://gateway.pixazo.ai/flux-schnell/v1/flux-schnell/generate',
      'https://gateway.pixazo.ai/text-to-image/v1/generate',
      'https://gateway.pixazo.ai/stable-diffusion/v1/stable-diffusion/generate',
    ];

    for (const url of urls) {
      console.log(`\nTesting URL: ${url}`);
      try {
        const res = await axios.post(url, {
          prompt: "A simple sketch of a cat"
        }, {
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        console.log(`SUCCESS (${url}):`, res.data);
      } catch (err) {
        console.log(`FAILED (${url}):`, err.response?.status, err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err);
  }
}

testPixazo();
