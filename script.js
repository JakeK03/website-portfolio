

const temperatureApiKey = config.MY_KEY; // Replace with your OpenWeatherMap API key
const weatherLatitude = 45.3032; // Timberline Lodge, Oregon
const weatherLongitude = -121.7593;
const latitude = 45.3032; // Government Camp, Oregon
const longitude = -121.7593;

const colorOrange = [255, 165, 0]; // RGB for Orange
const colorBlue = [0, 0, 255]; // RGB for Blue
const colorBlack = [0, 0, 0]; // RGB for Black

let currentTemperature = null; // Store the temperature to update with clock
let sunrise, sunset; // Variables for sunrise and sunset times

// Fetch current temperature from OpenWeatherMap
function fetchTemperature() {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${weatherLatitude}&lon=${weatherLongitude}&units=imperial&appid=${temperatureApiKey}`)
      .then(response => response.json())
      .then(data => {
        currentTemperature = Math.round(data.main.temp);
        updateClockTemperatureDisplay(); // Update display with time and temperature
      })
      .catch(error => console.error("Error fetching temperature:", error));
}


// Update clock with temperature in the format "8:43:55 / 55°F"
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" });
    updateClockTemperatureDisplay(timeString);
}

// Update the combined clock and temperature display
function updateClockTemperatureDisplay(timeString = 'Loading...') {
    const clockTemperatureElement = document.getElementById('clock');
    if (clockTemperatureElement) {
        const temperatureDisplay = currentTemperature !== null ? `${currentTemperature}°F` : "Loading...";
        clockTemperatureElement.innerText = `${timeString} (PST) / ${temperatureDisplay}`;
    } else {
        console.error("Clock temperature element not found in the footer.");
    }
}

function updateStatus() {
    const now = new Date();
    const aboutElement = document.getElementById("about");

    if (!sunrise || !sunset) {
        console.warn("Sunrise or sunset times are not defined.");
        return;
    }

    // Determine if it's day or night
    if (now >= sunrise && now < sunset) {
        aboutElement.innerText = "Status: Online";
    } else {
        // Calculate time until next sunrise
        let nextSunrise = new Date(sunrise);
        
        // If after sunset, set the next sunrise to tomorrow
        if (now >= sunset) {
            nextSunrise.setDate(nextSunrise.getDate() + 1);
        }
        
        const timeUntilSunrise = Math.ceil((nextSunrise - now) / (1000 * 60)); // Minutes until sunrise
        aboutElement.innerText = `Status: ${timeUntilSunrise} minutes until sunrise`;
    }
}

function fetchSunTimes() {
    // Fetch sunrise and sunset times for the location
    fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log(data); // Log the full response
        
        // Parse the sunrise and sunset times from the response
        sunrise = new Date(data.results.sunrise);
        sunset = new Date(data.results.sunset);
        
        // Shift the times forward by 3 hours
        const shiftByThreeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        sunrise = new Date(sunrise.getTime());
        sunset = new Date(sunset.getTime());
        
        console.log('Adjusted Sunrise:', sunrise);
        console.log('Adjusted Sunset:', sunset);
        
        updateBackgroundColor();
        updateStatus(); // Initial call to update status
        checkDayNight(sunrise, sunset); // Initial call to check if online/offline
       
        setInterval(updateStatus, 60000); // Update status every minute
        setInterval(() => updateClock(), 1000);
        setInterval(() => updateWebcam(sunrise, sunset), 60000);
        setInterval(() => updateBackgroundColor(), 60000); // Update color periodically
        setInterval(() => checkDayNight(sunrise, sunset), 60000); // Check day/night status every minute
      })
      .catch(error => console.error("Error fetching sun times:", error));
  }
  



// function updateClock() {
//   const now = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });
//   document.getElementById('clock').innerText = now;
  
// }


// Interpolates from colorA to colorB based on a given ratio (0 to 1)
function interpolateColor(colorA, colorB, ratio) {
    const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * ratio);
    const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * ratio);
    const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * ratio);
    return `rgb(${r}, ${g}, ${b})`; // Return as RGB color string
}

// Updates the background color based on the current time relative to sunrise and sunset
function updateBackgroundColor() {
    const now = new Date();
    const footerElement = document.querySelector('footer');
    
    if (!footerElement) {
        console.error("Footer element not found.");
        return;
    }
    
    if (!sunrise || !sunset) {
        console.warn("Sunrise or sunset times are not defined.");
        return;
    }

    const totalTransitionDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    const midday = new Date((sunrise.getTime() + sunset.getTime()) / 2);
    let backgroundColor;

    if (now < sunrise) {
        // Before sunrise: black transitioning to orange (30 minutes before sunrise)
        const transitionStart = new Date(sunrise.getTime() - totalTransitionDuration);
        const ratio = Math.min(1, Math.max(0, (now - transitionStart) / totalTransitionDuration));
        backgroundColor = interpolateColor(colorBlack, colorOrange, ratio);
        console.log('Before Sunrise: Black to Orange Transition');
    } else if (now >= sunrise && now < sunrise.getTime() + totalTransitionDuration) {
        // Sunrise to 30 minutes after sunrise: orange transitioning to blue
        const ratio = Math.min(1, (now - sunrise) / totalTransitionDuration);
        backgroundColor = interpolateColor(colorOrange, colorBlue, ratio);
        console.log('Sunrise to Morning: Orange to Blue Transition');
    } else if (now >= sunrise.getTime() + totalTransitionDuration && now < sunset.getTime() - totalTransitionDuration) {
        // Daytime between morning transition and evening transition: constant blue
        backgroundColor = `rgb(${colorBlue[0]}, ${colorBlue[1]}, ${colorBlue[2]})`;
        console.log('Daytime: Constant Blue');
    } else if (now >= sunset.getTime() - totalTransitionDuration && now < sunset) {
        // 30 minutes before sunset to sunset: blue transitioning to orange
        const ratio = Math.min(1, (now - (sunset.getTime() - totalTransitionDuration)) / totalTransitionDuration);
        backgroundColor = interpolateColor(colorBlue, colorOrange, ratio);
        console.log('Afternoon to Sunset: Blue to Orange Transition');
    } else {
        // After sunset: orange transitioning to black (30 minutes after sunset)
        const transitionEnd = new Date(sunset.getTime() + totalTransitionDuration);
        const ratio = Math.min(1, Math.max(0, 1 - (now - sunset) / totalTransitionDuration));
        backgroundColor = interpolateColor(colorOrange, colorBlack, ratio);
        console.log('After Sunset: Orange to Black Transition');
    }

    // Apply the computed color to the footer background
    footerElement.style.backgroundColor = backgroundColor;
    console.log('Current Background Color:', backgroundColor);
}



function checkDayNight(sunrise, sunset) {
    const now = new Date();
    const titleElement = document.getElementById('page-title');
    const webcam = document.getElementById('webcam');
  
    if (titleElement) {
      titleElement.innerText = now >= sunrise && now < sunset ? 'Jake Kuerbis' : 'Currently Offline';
    } else {
      console.warn("Title element not found.");
    }
  
    if (webcam) {
      webcam.style.display = now >= sunrise && now < sunset ? 'block' : 'none';
    } else {
      console.warn("Webcam element not found.");
    }
  }

function updateWebcam(sunrise, sunset) {
  const now = new Date();
  const webcam = document.getElementById('webcam');
  
  if (now >= sunrise && now < sunset) {
    webcam.src = `https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg?nocache=${new Date().getTime()}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSunTimes();
  fetchTemperature();
  updateClock();
  checkDayNight();
  
  // Set a timer to add the 'fade-out' class after 10 seconds
//   setTimeout(() => {
//     headerTitle.classList.add('fade-out');
//   }, 5000); // 10000 milliseconds = 10 seconds
  
  setInterval(updateClock, 1000); // Ensure clock updates every minute
  setInterval(fetchTemperature, 300000); // Update temperature every 5 minutes
  setInterval(() => updateBackgroundColor(), 60000); // Call this every minute
});


