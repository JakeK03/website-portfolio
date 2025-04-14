const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function captureWebcamImage(timeOfDay) {
  try {
    const url = 'https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg';
    const response = await axios({
      url,
      responseType: 'stream',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webcam-${timeOfDay}-${timestamp}.jpg`;
    const filepath = path.join(__dirname, 'snapshots', filename);

    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    writer.on('finish', () => console.log(`✅Image saved: ${filepath}`));
    writer.on('error', (err) => console.error(' Error writing image:', err));
  } catch (error) {
    console.error(' Error capturing webcam image:', error.message);
  }
}

const timeOfDay = process.argv[2] || 'snapshot';
captureWebcamImage(timeOfDay);
