/**
 * Direct Pixazo API Test Script
 * Tests Flux 1 Schnell API with proper logging
 */

const https = require('https');

const PIXAZO_API_KEY = 'bfc527e3a1274921aacffa1f9c993cab';
const BASE_URL = 'gateway.pixazo.ai';

console.log('='.repeat(60));
console.log('🧪 PIXAZO API TEST SCRIPT');
console.log('='.repeat(60));
console.log(`📅 Date: ${new Date().toISOString()}`);
console.log(`🔑 API Key: ${PIXAZO_API_KEY.substring(0, 8)}...`);
console.log('');

/**
 * Test 1: Submit image generation request
 */
async function testSubmitRequest() {
  return new Promise((resolve, reject) => {
    console.log('📤 TEST 1: Submitting image generation request...');
    console.log('-'.repeat(60));

    const requestBody = JSON.stringify({
      prompt: "Professional storyboard sketch, black and white pencil drawing, hand-drawn style, a hero standing on a cliff at sunset",
      num_steps: 4,
      height: 768,
      width: 1024,
      seed: 12345
    });

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: '/flux-1-schnell/v1/getDataBatch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': PIXAZO_API_KEY,
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    console.log('🌐 Endpoint:', `https://${options.hostname}${options.path}`);
    console.log('📋 Request Body:', JSON.parse(requestBody));
    console.log('🔐 Headers:', {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': `${PIXAZO_API_KEY.substring(0, 8)}...`,
      'Cache-Control': 'no-cache'
    });
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`✅ Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('📥 Response Headers:', res.headers);
      console.log('');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📦 Response Body:', JSON.stringify(response, null, 2));
          console.log('');

          if (res.statusCode === 200) {
            console.log('✅ TEST 1 PASSED: Request submitted successfully');
            console.log('');
            resolve(response);
          } else {
            console.error('❌ TEST 1 FAILED: Unexpected status code');
            console.error('Error:', response);
            console.log('');
            reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          console.error('❌ TEST 1 FAILED: Invalid JSON response');
          console.error('Raw data:', data);
          console.log('');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ TEST 1 FAILED: Request error');
      console.error('Error:', error.message);
      console.log('');
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ TEST 1 FAILED: Request timeout');
      console.log('');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 second timeout
    req.write(requestBody);
    req.end();
  });
}

/**
 * Test 2: Check status of generation
 */
async function testCheckStatus(requestId) {
  return new Promise((resolve, reject) => {
    console.log('🔍 TEST 2: Checking generation status...');
    console.log('-'.repeat(60));
    console.log(`📝 Request ID: ${requestId}`);
    console.log('');

    const requestBody = JSON.stringify({
      requestId: requestId
    });

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: '/flux-1-schnell/v1/checkStatus',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': PIXAZO_API_KEY,
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    console.log('🌐 Endpoint:', `https://${options.hostname}${options.path}`);
    console.log('📋 Request Body:', JSON.parse(requestBody));
    console.log('');

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`✅ Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📦 Response Body:', JSON.stringify(response, null, 2));
          console.log('');

          if (res.statusCode === 200) {
            console.log(`📊 Status: ${response.status}`);
            if (response.output) {
              console.log(`🖼️  Image URL: ${response.output}`);
            }
            console.log('');
            resolve(response);
          } else {
            console.error('❌ TEST 2 FAILED: Unexpected status code');
            console.log('');
            reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          console.error('❌ TEST 2 FAILED: Invalid JSON response');
          console.error('Raw data:', data);
          console.log('');
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ TEST 2 FAILED: Request error');
      console.error('Error:', error.message);
      console.log('');
      reject(error);
    });

    req.setTimeout(10000); // 10 second timeout
    req.write(requestBody);
    req.end();
  });
}

/**
 * Polling function
 */
async function pollForCompletion(requestId, maxAttempts = 60, interval = 2000) {
  console.log('⏳ Starting polling for completion...');
  console.log(`⚙️  Max attempts: ${maxAttempts}, Interval: ${interval}ms`);
  console.log('');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Poll attempt ${attempt}/${maxAttempts}...`);
    
    try {
      const status = await testCheckStatus(requestId);
      
      if (status.status === 'completed' && status.output) {
        console.log('');
        console.log('='.repeat(60));
        console.log('✅ IMAGE GENERATION COMPLETED!');
        console.log('='.repeat(60));
        console.log(`🖼️  Image URL: ${status.output}`);
        console.log(`⏱️  Completed in ${attempt} polls (${(attempt * interval) / 1000}s)`);
        console.log('='.repeat(60));
        return status.output;
      }

      if (status.status === 'failed') {
        throw new Error('Image generation failed on server');
      }

      console.log(`⏳ Status: ${status.status} - waiting ${interval}ms...`);
      console.log('');

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));

    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(`Polling failed after ${maxAttempts} attempts: ${error.message}`);
      }
      console.warn(`⚠️  Poll error: ${error.message} - retrying...`);
      console.log('');
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw new Error(`Timeout: Image did not complete in ${maxAttempts} polls`);
}

/**
 * Main test execution
 */
async function runTests() {
  try {
    // Test 1: Submit request
    const submitResponse = await testSubmitRequest();

    // Check if we got immediate output or need to poll
    if (submitResponse.output) {
      console.log('='.repeat(60));
      console.log('✅ IMMEDIATE RESPONSE - Image generated synchronously!');
      console.log('='.repeat(60));
      console.log(`🖼️  Image URL: ${submitResponse.output}`);
      console.log('='.repeat(60));
      return;
    }

    // If we got a requestId, poll for completion
    if (submitResponse.requestId) {
      await pollForCompletion(submitResponse.requestId);
    } else {
      throw new Error('Invalid response: No output or requestId received');
    }

  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.error('❌ TEST SUITE FAILED');
    console.log('='.repeat(60));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run tests
runTests();
