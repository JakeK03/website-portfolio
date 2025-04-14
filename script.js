
var mykey = config.MY_KEY;
const temperatureApiKey = mykey; // Replace with your OpenWeatherMap API key
const weatherLatitude = 45.3032;
    const weatherLongitude = -121.7593;
    const latitude = 45.3032;
    const longitude = -121.7593;

    const colorOrange = [255, 165, 0];
    const colorBlue = [0, 0, 255];
    const colorBlack = [0, 0, 0];
const colorPurple = [128, 0, 128];
const colorDarkBlue = [0, 0, 139];

    let currentTemperature = null;
    let sunrise, sunset;

    function toLocalTime(utcDateString, timezone = "America/Los_Angeles") {
      return new Date(new Date(utcDateString).toLocaleString("en-US", { timeZone: timezone }));
    }

    function fetchTemperature() {
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${weatherLatitude}&lon=${weatherLongitude}&units=imperial&appid=${temperatureApiKey}`)
        .then(response => response.json())
        .then(data => {
          currentTemperature = Math.round(data.main.temp);
          updateClockTemperatureDisplay();
        })
        .catch(error => console.error("Error fetching temperature:", error));
    }

    function updateClock() {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" });
      updateClockTemperatureDisplay(timeString);
    }

    function updateClockTemperatureDisplay(timeString = 'Loading...') {
      const clockTemperatureElement = document.getElementById('clock');
      if (clockTemperatureElement) {
        const temperatureDisplay = currentTemperature !== null ? `${currentTemperature}°F` : "Loading...";
        clockTemperatureElement.innerText = `${timeString} (PST) / ${temperatureDisplay}`;
      }
    }

    function updateStatus() {
      const now = new Date();
      const aboutElement = document.getElementById("about");
      if (!sunrise || !sunset) return;
      if (now >= sunrise && now < sunset) {
        aboutElement.innerText = "Status: Online";
      } else {
        let nextSunrise = new Date(sunrise);
        if (now >= sunset) nextSunrise.setDate(nextSunrise.getDate() + 1);
        const timeUntilSunrise = Math.ceil((nextSunrise - now) / (1000 * 60));
        aboutElement.innerText = `Status: ${timeUntilSunrise} minutes until sunrise`;
      }
    }

    function fetchSunTimes() {
      fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=imperial&appid=${temperatureApiKey}`)

    .then(response => response.json())
    .then(data => {
      sunrise = new Date(data.daily[0].sunrise * 1000 - 1 * 60 * 1000);
      sunset = new Date(data.daily[0].sunset * 1000);

      
      const now = Date.now();
// const timeUntilSunrise = sunrise.getTime() - now;
// const timeUntilSunset = sunset.getTime() - now;

// Safety check: if time is in the future, schedule the snapshot
// if (timeUntilSunrise > 0) {
//   setTimeout(() => captureWebcamImage('sunrise-snapshot'), timeUntilSunrise);
// }

// if (timeUntilSunset > 0) {
//   setTimeout(() => captureWebcamImage('sunset-snapshot'), timeUntilSunset);
// }


      // console.log('--- Sun Times Fetched (OpenWeatherMap) ---');
      // console.log('Sunrise (Local):', sunrise.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      // console.log('Sunset (Local):', sunset.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      console.log('API Response:', data);


      updateBackgroundColor(data.current.dt * 1000);


      updateStatus();

      setInterval(updateStatus, 60000);
      setInterval(updateClock, 1000);
      setInterval(updateWebcam, 60000);
      setInterval(updateBackgroundColor, 1000);
    })
    .catch(error => console.error("Error fetching sun times:", error));
    }

    function interpolateColor(colorA, colorB, ratio) {
      const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * ratio);
      const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * ratio);
      const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }

    function updateBackgroundColor(nowTimestamp = null) {
      const now = nowTimestamp !== null ? nowTimestamp : Date.now();
      

      const footerElement = document.querySelector('footer');
      if (!footerElement || !sunrise || !sunset) return;

      const sunriseTime = sunrise.getTime();
      const sunsetTime = sunset.getTime();
      const totalTransitionDuration = 30 * 60 * 1000;

      // console.log('--- Background Color Check ---');
      // console.log('Now:', new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      // console.log('Sunrise:', sunrise.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      // console.log('Sunset:', sunset.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
      // console.log('Now (ms):', now);
      // console.log('Sunrise (ms):', sunriseTime);
      // console.log('Sunset (ms):', sunsetTime);

      let backgroundColor;

      if (now < sunriseTime - totalTransitionDuration) {
        backgroundColor = interpolateColor(colorBlack, colorBlack, 1);
      } else if (now >= sunriseTime - totalTransitionDuration && now < sunriseTime) {
        const elapsed = now - (sunriseTime - totalTransitionDuration);
        const segment = totalTransitionDuration / 3;
      
        if (elapsed < segment) {
          const ratio = elapsed / segment;
          backgroundColor = interpolateColor(colorBlack, colorDarkBlue, ratio);
        } else if (elapsed < 2 * segment) {
          const ratio = (elapsed - segment) / segment;
          backgroundColor = interpolateColor(colorDarkBlue, colorPurple, ratio);
        } else {
          const ratio = (elapsed - 2 * segment) / segment;
          backgroundColor = interpolateColor(colorPurple, colorOrange, ratio);
        }
      } else if (now >= sunriseTime && now < sunriseTime + totalTransitionDuration) {
        const ratio = (now - sunriseTime) / totalTransitionDuration;
        backgroundColor = interpolateColor(colorOrange, colorBlue, ratio);
      } else if (now >= sunriseTime + totalTransitionDuration && now < sunsetTime - totalTransitionDuration) {
        backgroundColor = `rgb(${colorBlue[0]}, ${colorBlue[1]}, ${colorBlue[2]})`;
      } else if (now >= sunsetTime - totalTransitionDuration && now < sunsetTime) {
        const ratio = (now - (sunsetTime - totalTransitionDuration)) / totalTransitionDuration;
        backgroundColor = interpolateColor(colorBlue, colorOrange, ratio);
      } else if (now >= sunsetTime && now < sunsetTime + totalTransitionDuration) {
        const elapsed = now - sunsetTime;
const segment = totalTransitionDuration / 3;

if (elapsed < segment) {
  const ratio = elapsed / segment;
  backgroundColor = interpolateColor(colorOrange, colorPurple, ratio);
} else if (elapsed < 2 * segment) {
  const ratio = (elapsed - segment) / segment;
  backgroundColor = interpolateColor(colorPurple, colorDarkBlue, ratio);
} else if (elapsed < 3 * segment) {
  const ratio = (elapsed - 2 * segment) / segment;
  backgroundColor = interpolateColor(colorDarkBlue, colorBlack, ratio);
} else {
  backgroundColor = interpolateColor(colorBlack, colorBlack, 1);
}
      } else {
        backgroundColor = interpolateColor(colorBlack, colorBlack, 1);
      }

      footerElement.style.backgroundColor = backgroundColor;
    }

    function updateWebcam() {
      const webcam = document.getElementById('webcam');
      if (webcam) {
        webcam.src = `https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg?nocache=${Date.now()}`;
      }
    }
    
    

     

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hover-overlay');
    const backgroundImage = document.getElementById('background-image');

    const extraText = document.getElementById('extra-text');
    const imagePool = [
      'photos/mt_hood_series/IMG_2035.jpeg',
      'photos/mt_hood_series/IMG_2499.jpeg',
      'photos/mt_hood_series/IMG_2505.jpeg',
      'photos/mt_hood_series/IMG_2534.jpeg',
      'photos/mt_hood_series/IMG_2552.jpeg',
      'photos/mt_hood_series/IMG_2555.jpeg',
      'photos/mt_hood_series/IMG_2557.jpeg',
      'photos/mt_hood_series/IMG_2572.jpeg',
      'photos/mt_hood_series/IMG_2565\ 2.jpeg',
      'photos/mt_hood_series/IMG_2591.jpeg',
      'photos/mt_hood_series/IMG_2593.jpeg',
      'photos/mt_hood_series/IMG_9288.jpeg'
    ];
  
    overlay.addEventListener('mouseenter', () => {
      const randomIndex = Math.floor(Math.random() * imagePool.length);
      backgroundImage.src = imagePool[randomIndex];
      backgroundImage.style.display = 'block';
      
      const extraText = document.getElementById('extra-text');
  extraText.classList.add('show');
    });
    
    overlay.addEventListener('mouseleave', () => {
      backgroundImage.style.display = 'none';
      
      const extraText = document.getElementById('extra-text');
  extraText.classList.remove('show');
    });
    
      fetchSunTimes();
      fetchTemperature();
      updateClock();
      updateWebcam();

      setInterval(updateClock, 1000);
      setInterval(fetchTemperature, 300000);
      
    });