const axios = require('axios');
const fs = require('fs');
const path = require('path');

// var mykey = config.MY_KEY;
const LATITUDE = 45.3032;
const LONGITUDE = -121.7593;
const API_KEY = '8b1a5b132498779f6d84d14b4533d1f5'; // Replace with your API key

async function fetchSunTimes() {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/3.0/onecall?lat=${LATITUDE}&lon=${LONGITUDE}&exclude=minutely,hourly,alerts&units=imperial&appid=${API_KEY}`);
    const data = response.data;

    const sunrise = new Date(data.daily[0].sunrise * 1000);
    const sunset = new Date(data.daily[0].sunset * 1000);

    console.log('✅ Fetched sunrise/sunset times:');
    console.log('Sunrise:', sunrise.toLocaleString());
    console.log('Sunset:', sunset.toLocaleString());

    return { sunrise, sunset };
  } catch (error) {
    console.error('❌ Error fetching sun times:', error.message);
    throw error;
  }
}

async function captureWebcamImage(timeOfDay) {
  try {
    const url = 'https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg';
    const response = await axios({
      url,
      responseType: 'stream',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webcam-${timeOfDay}-${timestamp}.jpg`;
    const folder = path.join(__dirname, 'snapshots');
    const filepath = path.join(folder, filename);

    fs.mkdirSync(folder, { recursive: true });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    writer.on('finish', () => console.log(`✅ Image saved: ${filepath}`));
    writer.on('error', (err) => console.error('❌ Error writing image:', err));
  } catch (error) {
    console.error('❌ Error capturing webcam image:', error.message);
  }
}

function scheduleCapture(time, timeOfDay) {
  const now = Date.now();
  const delay = time.getTime() - now;

  if (delay <= 0) {
    console.log(`⏰ Skipped scheduling ${timeOfDay}, time already passed.`);
    return;
  }

  console.log(`🕒 Scheduled ${timeOfDay} capture in ${Math.round(delay / 1000 / 60)} minutes.`);

  setTimeout(() => {
    captureWebcamImage(timeOfDay);
  }, delay);
}

async function start() {
  try {
    const { sunrise, sunset } = await fetchSunTimes();

    scheduleCapture(sunrise, 'sunrise');
    scheduleCapture(sunset, 'sunset');

    // Re-fetch sun times every 24 hours
    const ONE_DAY = 24 * 60 * 60 * 1000;
    setTimeout(start, ONE_DAY);

    console.log('🚀 Auto scheduler running...');
  } catch (error) {
    console.error('❌ Failed to start scheduler:', error.message);
    console.log('🔁 Retrying in 1 hour...');
    setTimeout(start, 60 * 60 * 1000); // Retry in 1 hour
  }
}

start();
