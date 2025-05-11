
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
      sunrise = new Date(data.daily[0].sunrise * 1000);
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


    let isImgOneProjectOpen = false;
    let currentImageIndex = 0;
    let currentImageIndexTwo = 0;
    let currentImageIndexThree = 0;
    let currentImageIndexFour = 0;
    let currentImageIndexFive = 0;
    let currentImageIndexSix = 0;

const imagePool = [
  'photos/Scan_176.png',
  'photos/Scan_177.png',
  'photos/Scan_178.png',
  'photos/Scan_179.png',
  'photos/Scan_180.png',
  // 'photos/book-scan_041125.mp4',
  'photos/spread-animation_7.gif',
  'photos/6E9A5538.jpeg',
  'photos/6E9A5650.jpeg',
  'photos/IMG_8520.jpeg',
  'photos/Scan_upd_2.jpg',
  'photos/Scan_upd_3.1.jpg'
];

const imagePoolTwo = [
  'photos/100IMG_1.mov',
  'photos/Screenshot 2024-09-19 at 4.47.03 PM.png',
  'photos/100IMG/100IMG_13.png',
  'photos/100IMG/100IMG_14.png',
  'photos/100IMG/100IMG_20_2.png',
  'photos/100IMG/100IMG_19_2.png',
  // 'photos/stretch-test-book.mov'
];

const imagePoolThree = [
  ''
];

const imagePoolFour = [
  ''
];

const imagePoolFive = [
  ''
];

const imagePoolSix = [
  ''
];

document.addEventListener("DOMContentLoaded", function () {
  const selectedProjects = document.querySelector(".selected-projects");
  const figures = document.querySelectorAll("figure");
  const imageGrid = document.querySelector("#image_grid");
  const projectList = document.querySelector(".selected-projects-list");
  const webcamContainer = document.querySelector("#webcam-container");
  const education = document.querySelector(".education");
  const headerTitle = document.querySelector(".header-title");
  const webcamTopRight = document.querySelector("#global-container-two");
  const webcamTopRightContainer = document.querySelector("#webcam-container-two");
  
  const imgOneList = document.querySelector('#list-one-full');
  const imgTwoList = document.querySelector('#list-two-full');
  const imgThreeList = document.querySelector('#list-three-full');
  const imgFourList = document.querySelector('#list-four-full');
  const imgFiveList = document.querySelector('#list-five-full');
  const imgSixList = document.querySelector('#list-six-full');
  
  const imgOneImage = imgOneList.querySelector('img');
  const imgTwoImage = imgTwoList.querySelector('img');
  const imgThreeImage = imgThreeList.querySelector('img');
  const imgFourImage = imgFourList.querySelector('img');
  const imgFiveImage = imgFiveList.querySelector('img');
  const imgSixImage = imgSixList.querySelector('img');

  const imgOne = document.querySelector('#img-one');
  const imgTwo = document.querySelector('#img-two');
  const imgThree = document.querySelector('#img-three');
  const imgFour = document.querySelector('#img-four');
  const imgFive = document.querySelector('#img-five');
  const imgSix = document.querySelector('#img-six');

  const listOne = document.querySelector('#list-one');
  const listTwo = document.querySelector('#list-two');
  const listThree = document.querySelector('#list-three');
  const listFour = document.querySelector('#list-four');
  const listFive = document.querySelector('#list-five');
  const listSix = document.querySelector('#list-six');

  const webcamImage = document.getElementById('webcam');
  const originalWebcamSrc = webcamImage.src;
  const newImageSrc = 'photos/DSC_2852.JPG';
  

  const workTopRight = document.querySelector('#work-top-right');

  let isProjectsVisible = false;

  // if (imgOneImage) {
  //   imgOneImage.style.maxWidth = '40em';
  //   imgOneImage.style.height = 'auto';
  // }
  // if (imgTwoImage) {
  //   imgTwoImage.style.maxHeight = 'fit-content';
  //   imgTwoImage.style.height = 'auto';
  // }
  // if (imgThreeImage) {
  //   imgThreeImage.style.maxHeight = 'fit-content';
  //   imgThreeImage.style.height = 'auto';
  // }

  if (headerTitle) {
    headerTitle.addEventListener("click", () => {
      education.style.display = education.style.display === "block" ? "none" : "block";
    });
  }

  headerTitle.addEventListener('mouseenter', () => {
      webcamImage.src = newImageSrc;
    });

  headerTitle.addEventListener('mouseleave', () => {
      webcamImage.src = originalWebcamSrc;
    });

  if (selectedProjects) {
    selectedProjects.addEventListener("click", () => {
      if (isImgOneProjectOpen) {
        isImgOneProjectOpen = false;
        imageGrid.style.display = 'none';
        // imgOne.style.display = 'block';
        // imgTwo.style.display = 'none';
        // imgThree.style.display = 'none';
        // imgFour.style.display = 'none';
        // imgFive.style.display = 'none';
        // imgSix.style.display = 'none';
        projectList.style.display = 'block';
        selectedProjects.textContent = "Selected Projects";
      }
     
      isProjectsVisible = !isProjectsVisible;
      selectedProjects.style.color = isProjectsVisible ? "blue" : "black";
      projectList.style.display = isProjectsVisible ? "block" : "none";
      webcamTopRight.style.display = isProjectsVisible ? "block" : "none";
      webcamContainer.style.display = isProjectsVisible ? "none" : "block";
      imageGrid.style.display = isProjectsVisible ? "flex" : "none";
      // imgOneList.style.display = "none";
      // imgTwoList.style.display = "none";
      workTopRight.style.display = "none";
    });
  }

  listOne.addEventListener("mouseenter", () => {
    imgOne.style.display = "block";
    listOne.style.color = "blue";
  });

  listOne.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgOne.style.display = "none";
      listOne.style.color = "black";
    }
  });

  listTwo.addEventListener("mouseenter", () => {
    imgTwo.style.display = "block";
    listTwo.style.color = "blue";
  });

  listTwo.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgTwo.style.display = "none";
      listTwo.style.color = "black";
    }
  });

  listThree.addEventListener("mouseenter", () => {
    imgThree.style.display = "block";
    listThree.style.color = "blue";
  });

  listThree.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgThree.style.display = "none";
      listThree.style.color = "black";
    }
  });

  listFour.addEventListener("mouseenter", () => {
    imgFour.style.display = "block";
    listFour.style.color = "blue";
  });

  listFour.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgFour.style.display = "none";
      listFour.style.color = "black";
    }
  });

  listFive.addEventListener("mouseenter", () => {
    imgFive.style.display = "block";
    listFive.style.color = "blue";
  });

  listFive.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgFive.style.display = "none";
      listFive.style.color = "black";
    }
  });

  listSix.addEventListener("mouseenter", () => {
    imgSix.style.display = "block";
    listSix.style.color = "blue";
  });

  listSix.addEventListener("mouseleave", () => {
    if (!isImgOneProjectOpen) {
      imgSix.style.display = "none";
      listSix.style.color = "black";
    }
  });

  if (listOne) {
    listOne.addEventListener("click", () => {
      selectedProjects.textContent = "Back";
      isImgOneProjectOpen = true;
      currentImageIndexThree = 0;
      imgOneImage.src = imagePoolOne[currentImageIndexOne];
      imgOneList.style.display = 'block';
      imageGrid.style.display = 'none';
      // workTopRight.style.display = 'block';
      listOne.style.display = 'block';
  }
)};
  

  if (webcamTopRightContainer) {
    webcamTopRightContainer.addEventListener("click", () => {
      isImgOneProjectOpen = false;
      isProjectsVisible = false;
      webcamContainer.style.display = 'block';
      webcamTopRight.style.display = 'none';
      // imageGrid.style.display = 'none';
      // imgOneList.style.display = 'none';
      // imgTwoList.style.display = 'none';
      workTopRight.style.display = 'none';
      imgOne.style.display = 'none';
      // listTwo.style.display = 'none';
      projectList.style.display = 'none';
      selectedProjects.textContent = "Selected Projects";
      selectedProjects.style.color = "black";
      // figures.forEach((figure) => {
      //   figure.style.display = 'none';
      // });
    });
  }

});

    
    
        

     

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('hover-overlay');
    const backgroundImage = document.getElementById('background-image');

    const extraText = document.getElementById('extra-text');
    const extraImg = document.getElementById('extra-img');
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
  const extraImg = document.getElementById('extra-img');
  extraImg.classList.add('show');
    });
    
    overlay.addEventListener('mouseleave', () => {
      backgroundImage.style.display = 'none';
      
      const extraText = document.getElementById('extra-text');
  extraText.classList.remove('show');
  const extraImg = document.getElementById('extra-img');
  extraImg.classList.remove('show');
    });
    
    // const headerTitle = document.querySelector('.header-title');
    // const webcamImage = document.getElementById('webcam');
    // const imgOne = document.querySelector('#img-one');
    // const imgTwo = document.querySelector('#img-two');
    // const imgThree = document.querySelector('#img-three');
    // const imgFour = document.querySelector('#img-four');
    // const imgFive = document.querySelector('#img-five');
    // const imgSix = document.querySelector('#img-six');
    // const imgSeven = document.querySelector('#img-seven');
    // const imgEight = document.querySelector('#img-eight');
    // const imgNine = document.querySelector('#img-nine');
    // const listOne = document.querySelector('#list-one');
    // const listTwo = document.querySelector('#list-two');
    // const listThree = document.querySelector('#list-three');
    // const listFour = document.querySelector('#list-four');
    // const listFive = document.querySelector('#list-five');
    // const listSix = document.querySelector('#list-six');
    // const listSeven = document.querySelector('#list-seven');
    // const listEight = document.querySelector('#list-eight');
    // const listNine = document.querySelector('#list-nine');
    
    
    // const originalWebcamSrc = webcamImage.src;
    // const newImageSrc = 'photos/DSC_2852.JPG'; // <-- update with your correct path

    // imgOne.addEventListener('mouseenter', () => {
    //   listOne.style.display = "block";
    // });

    // imgTwo.addEventListener('mouseenter', () => {
    //   listTwo.style.display = "block";
    // });

    // imgThree.addEventListener('mouseenter', () => {
    //   listThree.style.display = "block";
    // });

    // imgFour.addEventListener('mouseenter', () => {
    //   listFour.style.display = "block";
    // });

    // imgFive.addEventListener('mouseenter', () => {
    //   listFive.style.display = "block";
    // });

    // imgSix.addEventListener('mouseenter', () => {
    //   listSix.style.display = "block";
    // });

    // imgSeven.addEventListener('mouseenter', () => {
    //   listSeven.style.display = "block";
    // });

    // imgEight.addEventListener('mouseenter', () => {
    //   listEight.style.display = "block";
    // });

    // imgNine.addEventListener('mouseenter', () => {
    //   listNine.style.display = "block";
    // });

    // imgOne.addEventListener('mouseleave', () => {
    //   if (!isImgOneProjectOpen) {
    //     listOne.style.display = "none";
    //   }
    // });
    
    // imgTwo.addEventListener('mouseleave', () => {
    //   listTwo.style.display = "none";
    // });

    // imgThree.addEventListener('mouseleave', () => {
    //   listThree.style.display = "none";
    // });

    // imgFour.addEventListener('mouseleave', () => {
    //   listFour.style.display = "none";
    // });

    // imgFive.addEventListener('mouseleave', () => {
    //   listFive.style.display = "none";
    // });

    // imgSix.addEventListener('mouseleave', () => {
    //   listSix.style.display = "none";
    // });

    // imgSeven.addEventListener('mouseleave', () => {
    //   listSeven.style.display = "none";
    // });

    // imgEight.addEventListener('mouseleave', () => {
    //   listEight.style.display = "none";
    // });

    // imgThree.addEventListener('mouseleave', () => {
    //   listThree.style.display = "none";
    // });

    // imgNine.addEventListener('mouseleave', () => {
    //   listNine.style.display = "none";
    // });
    
    // headerTitle.addEventListener('mouseenter', () => {
    //   webcamImage.src = newImageSrc;
    // });
    
    // headerTitle.addEventListener('mouseleave', () => {
    //   webcamImage.src = originalWebcamSrc;
    // });


      fetchSunTimes();
      fetchTemperature();
      updateClock();
      updateWebcam();

      setInterval(updateClock, 1000);
      setInterval(fetchTemperature, 300000);
      setInterval(updateBackgroundColor, 1000);
      
    });