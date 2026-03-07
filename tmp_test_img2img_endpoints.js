const axios = require('axios');
require('dotenv').config();

const endpoints = [
  'https://gateway.pixazo.ai/sd3/v1/getData',
  'https://gateway.pixazo.ai/sdxl/v1/img2img',
  'https://gateway.pixazo.ai/stable-diffusion/v1/img2img',
  'https://gateway.pixazo.ai/flux-1-dev/v1/img2img',
];

const testImageUrl = 'https://placehold.co/256x256.png';

Promise.all(
  endpoints.map(url =>
    axios.post(url, {
      prompt: 'comic book man',
      init_image: testImageUrl,
      strength: 0.7,
      num_steps: 4
    }, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    .then(r => `✅ ${url}: ${JSON.stringify(r.data).substring(0, 100)}`)
    .catch(e => `❌ ${url}: ${e.response?.status} - ${JSON.stringify(e.response?.data).substring(0, 100)}`)
  )
).then(results => results.forEach(r => console.log(r)));
