const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testStoryboard() {
  try {
    const srt1 = path.join(__dirname, 'mock_aadu1.srt');
    const srt2 = path.join(__dirname, 'mock_aadu2.srt');

    // Make the content > 100 characters and somewhat meaningful
    fs.writeFileSync(srt1, "1\n00:00:01,000 --> 00:00:05,000\nThis is a long test subtitle for Aadu 1. Shaji Pappan and the magic goat are back!\n\n2\n00:00:06,000 --> 00:00:10,000\nAbu is here too, ready to make a huge mess. They win a tug of war and get a goat as a prize.\n\n3\n00:00:11,000 --> 00:00:15,000\nThe goat is named Pinky and causes chaos in the van named Mary.");
    fs.writeFileSync(srt2, "1\n00:00:01,000 --> 00:00:05,000\nThis is a long test subtitle for Aadu 2. They go to Bangkok to find the goat.\n\n2\n00:00:06,000 --> 00:00:10,000\nBoss needs it because it is magical and can save his life. The team reunites.\n\n3\n00:00:11,000 --> 00:00:15,000\nChaos ensues in Bangkok as Cleetus looks for a cricket pitch.");

    const form = new FormData();
    form.append('movieNames', 'Aadu 1, Aadu 2');
    form.append('srtFiles', fs.createReadStream(srt1));
    form.append('srtFiles', fs.createReadStream(srt2));

    console.log('Sending request to http://localhost:3000/movie/generate-combined-comic-storyboard...');
    const result = await axios.post('http://localhost:3000/movie/generate-combined-comic-storyboard', form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 120000 // 2 mins max
    });

    console.log('SUCCESS! Response length:', JSON.stringify(result.data).length);
    console.log('First frame:', JSON.stringify(result.data.storyboard?.frames?.[0], null, 2));

  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

testStoryboard();
