const axios = require('axios');

const API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';

async function testPixazo() {
  try {
    const urls = [
      'https://gateway.pixazo.ai/flux-schnell/v1/flux-schnell/generate',
      'https://gateway.pixazo.ai/flux/v1/flux/generate',
      'https://gateway.pixazo.ai/stable-diffusion/v1/stable-diffusion/generate',
      'https://gateway.pixazo.ai/p-video/v1/p-video/generate', // Check if video works to verify auth
    ];

    for (const url of urls) {
      console.log(`\nTesting URL: ${url}`);
      try {
        const payload = url.includes('video') ? { prompt: "A cat walking in a garden" } : { prompt: "A simple sketch of a cat" };
        const res = await axios.post(url, payload, {
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 5000
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
