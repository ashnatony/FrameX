const axios = require('axios');
const fs = require('fs');

const API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';

async function testPixazo() {
  let log = '';
  try {
    const urls = [
      { method: 'GET', url: 'https://gateway.pixazo.ai/p-video/v1/p-video/12gkggc805rmw0cwmg9skrgcb8' },
      { method: 'GET', url: 'https://gateway.pixazo.ai/p-video/v1/p-video/status/12gkggc805rmw0cwmg9skrgcb8' },
      { method: 'POST', url: 'https://gateway.pixazo.ai/p-video/v1/p-video/status', data: { id: "12gkggc805rmw0cwmg9skrgcb8" } },
      { method: 'GET', url: 'https://gateway.pixazo.ai/p-video/v1/p-video/generate/12gkggc805rmw0cwmg9skrgcb8' }
    ];

    for (const req of urls) {
      log += `\nTesting URL: ${req.method} ${req.url}\n`;
      try {
        const config = {
          method: req.method,
          url: req.url,
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        };
        if (req.data) config.data = req.data;
        const res = await axios(config);
        log += `SUCCESS (${req.url}):\n${JSON.stringify(res.data, null, 2)}\n`;
      } catch (err) {
        log += `FAILED (${req.url}): ${err.response?.status} - ${JSON.stringify(err.response?.data) || err.message}\n`;
      }
    }
  } catch (err) {
    log += `Fatal error: ${err}\n`;
  }
  fs.writeFileSync('test_results3.txt', log);
}

testPixazo();
