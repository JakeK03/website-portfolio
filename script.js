document.addEventListener("DOMContentLoaded", () => {
  const MOBILE_QUERY = "(max-width: 800px)";
  const mobileMedia = window.matchMedia(MOBILE_QUERY);

  // -------------------------------------------------
  // Shared weather / footer state
  // -------------------------------------------------
  const temperatureApiKey =
    typeof config !== "undefined" && config.MY_KEY ? config.MY_KEY : "";

  const latitude = 45.3032;
  const longitude = -121.7593;

  const colorOrange = [255, 165, 0];
  const colorBlue = [0, 0, 255];
  const colorBlack = [0, 0, 0];
  const colorPurple = [128, 0, 128];
  const colorDarkBlue = [0, 0, 139];

  let currentTemperature = null;
  let sunrise = null;
  let sunset = null;

  // -------------------------------------------------
  // Main page: Selected Projects
  // -------------------------------------------------
  const siteShell = document.getElementById("site-shell");
  const projectsToggle = document.getElementById("projects-toggle");
  const projectsColumn = document.getElementById("projects-column");
  const projectMedia = document.getElementById("project-media");
  const mediaEmpty = document.getElementById("project-media-empty");
  const projectEntries = [...document.querySelectorAll(".project-entry")];
  const mediaSets = [...document.querySelectorAll(".media-set")];
  const educationToggle = document.getElementById("education-toggle");
  const education = document.getElementById("education");
  const mobileProjects = document.getElementById("mobile-projects");

  let projectsOpen = false;
  let lockedProject = null;
  let mobileProjectsBuilt = false;

  function markMediaLoaded(img) {
    if (!img) return;

    // cached image can already be complete by the time we attach the listener
    if (img.complete && img.naturalWidth > 0 && !img.dataset.src) {
      requestAnimationFrame(() => img.classList.add("is-loaded"));
      return;
    }

    img.addEventListener(
      "load",
      () => requestAnimationFrame(() => img.classList.add("is-loaded")),
      { once: true }
    );
  }

  function hydrateImage(img) {
    if (!img || img.dataset.hydrated === "true") return;

    // Listen before swapping away from the tiny blur placeholder.
    img.addEventListener(
      "load",
      () => requestAnimationFrame(() => img.classList.add("is-loaded")),
      { once: true }
    );

    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
    }

    if (img.dataset.src) {
      img.src = img.dataset.src;
    }

    img.dataset.hydrated = "true";
  }

  function hydrateVideo(video) {
    if (!video || video.dataset.hydrated === "true") return;

    const source = video.querySelector("source[data-src]");

    if (source?.dataset.src) {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    } else if (video.dataset.src) {
      video.src = video.dataset.src;
    }

    video.preload = "metadata";
    video.dataset.hydrated = "true";
    video.load();
  }

  function hydrateMediaSet(mediaSet) {
    if (!mediaSet) return;

    mediaSet.querySelectorAll("img[data-src], img[data-srcset]").forEach(hydrateImage);
    mediaSet.querySelectorAll("video").forEach((video) => {
      if (video.dataset.src || video.querySelector("source[data-src]")) {
        hydrateVideo(video);
      }
    });
  }

  function showProject(projectName) {
    if (mediaEmpty) mediaEmpty.hidden = true;

    mediaSets.forEach((set) => {
      const isVisible = set.dataset.media === projectName;
      set.classList.toggle("is-visible", isVisible);

      if (isVisible) {
        hydrateMediaSet(set);
      }
    });

    projectEntries.forEach((entry) => {
      entry.classList.toggle("is-active", entry.dataset.project === projectName);
    });

    if (projectMedia) projectMedia.scrollTop = 0;
  }

  function clearProject() {
    mediaSets.forEach((set) => set.classList.remove("is-visible"));
    projectEntries.forEach((entry) => entry.classList.remove("is-active"));
    if (mediaEmpty) mediaEmpty.hidden = false;
  }

  function buildMobileProjects() {
    if (!mobileProjects || mobileProjectsBuilt) return;

    mobileProjects.innerHTML = "";

    projectEntries.forEach((entry) => {
      const projectName = entry.dataset.project;
      const title = entry.querySelector("h2");
      const description = entry.querySelector("p");
      const mediaSet = document.querySelector(
        `.media-set[data-media="${projectName}"]`
      );

      if (!title || !description || !mediaSet) return;

      const mediaItems = [...mediaSet.querySelectorAll("img, video")];
      if (!mediaItems.length) return;

      let currentIndex = 0;

      const project = document.createElement("article");
      project.className = "mobile-project";

      const projectTitle = document.createElement("h2");
      projectTitle.className = "mobile-project-title";
      projectTitle.innerHTML = title.innerHTML;

      const mediaWrap = document.createElement("div");
      mediaWrap.className = "mobile-project-image-wrap";

      const displayImage = document.createElement("img");
      displayImage.className = "mobile-project-image";
      displayImage.loading = "eager";

      const prevButton = document.createElement("button");
      prevButton.className = "mobile-project-prev";
      prevButton.type = "button";
      prevButton.setAttribute("aria-label", "Previous image");

      const nextButton = document.createElement("button");
      nextButton.className = "mobile-project-next";
      nextButton.type = "button";
      nextButton.setAttribute("aria-label", "Next image");

      const counter = document.createElement("div");
      counter.className = "mobile-project-counter";

      const projectDescription = document.createElement("div");
      projectDescription.className = "mobile-project-description";
      projectDescription.innerHTML = description.innerHTML;

      function showSlide(index) {
        currentIndex = (index + mediaItems.length) % mediaItems.length;
        const item = mediaItems[currentIndex];

        displayImage.classList.remove("is-loaded");
        displayImage.removeAttribute("srcset");

        if (item.tagName === "IMG") {
          const blurSrc = item.getAttribute("src") || "";
          const fullSrc = item.dataset.src || item.currentSrc || item.src || "";
          const fullSrcset = item.dataset.srcset || "";

          displayImage.src = blurSrc;
          displayImage.alt = item.alt || title.textContent.trim();
          displayImage.classList.add("progressive-media");
          displayImage.style.display = "block";

          // Wait a frame so the tiny placeholder can paint first.
          requestAnimationFrame(() => {
            displayImage.addEventListener(
              "load",
              () => requestAnimationFrame(() => displayImage.classList.add("is-loaded")),
              { once: true }
            );

            if (fullSrcset) displayImage.srcset = fullSrcset;
            displayImage.src = fullSrc;
          });
        } else {
          const poster = item.dataset.poster || item.poster || "";
          displayImage.src = poster;
          displayImage.alt = title.textContent.trim();
          displayImage.style.display = poster ? "block" : "none";
        }

        counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
      }

      prevButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showSlide(currentIndex - 1);
      });

      nextButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showSlide(currentIndex + 1);
      });

      mediaWrap.append(displayImage, prevButton, nextButton);
      project.append(projectTitle, mediaWrap, counter, projectDescription);
      mobileProjects.appendChild(project);

      showSlide(0);
    });

    mobileProjectsBuilt = true;
  }

  function setProjectsOpen(open) {
    projectsOpen = open;

    siteShell?.classList.toggle("projects-open", open);

    if (projectsToggle) {
      projectsToggle.classList.toggle("is-active", open);
      projectsToggle.setAttribute("aria-expanded", String(open));
    }

    projectsColumn?.setAttribute("aria-hidden", String(!open));

    if (open) {
      education?.classList.remove("is-visible");
      if (mobileMedia.matches) buildMobileProjects();
    } else {
      lockedProject = null;
      siteShell?.classList.remove("project-selected");
      clearProject();
      window.scrollTo(0, 0);

      if (projectsColumn) projectsColumn.scrollTop = 0;
      if (projectMedia) projectMedia.scrollTop = 0;
    }
  }

  if (projectsToggle && siteShell) {
    projectsToggle.addEventListener("click", () => {
      setProjectsOpen(!projectsOpen);
    });
  }

  projectEntries.forEach((entry) => {
    const projectName = entry.dataset.project;

    entry.addEventListener("mouseenter", () => {
      if (!mobileMedia.matches && !lockedProject) showProject(projectName);
    });

    entry.addEventListener("mouseleave", () => {
      if (!mobileMedia.matches && !lockedProject) clearProject();
    });

    entry.addEventListener("focus", () => {
      if (!mobileMedia.matches && !lockedProject) showProject(projectName);
    });

    entry.addEventListener("click", () => {
      if (mobileMedia.matches) return;

      lockedProject = projectName;
      siteShell?.classList.add("project-selected");
      showProject(projectName);
    });

    entry.addEventListener("keydown", (event) => {
      if (
        (event.key === "Enter" || event.key === " ") &&
        !mobileMedia.matches
      ) {
        event.preventDefault();
        entry.click();
      }
    });
  });

  if (educationToggle) {
    educationToggle.addEventListener("click", () => {
      if (projectsOpen) {
        setProjectsOpen(false);
        return;
      }

      education?.classList.toggle("is-visible");
    });
  }

  if (mobileMedia.matches) buildMobileProjects();

  function handleLayoutChange(event) {
    window.scrollTo(0, 0);

    if (event.matches) {
      buildMobileProjects();
    } else {
      if (projectsColumn) projectsColumn.scrollTop = 0;
      if (projectMedia) projectMedia.scrollTop = 0;
    }
  }

  if (typeof mobileMedia.addEventListener === "function") {
    mobileMedia.addEventListener("change", handleLayoutChange);
  } else if (typeof mobileMedia.addListener === "function") {
    mobileMedia.addListener(handleLayoutChange);
  }

  // -------------------------------------------------
  // Description page: View All snapshot archive
  // -------------------------------------------------
  const snapshotArchive = document.getElementById("snapshot-archive");
  const snapshotToggle = document.getElementById("snapshot-toggle");
  const liveSnapshot = document.getElementById("live-snapshot");

  const SNAPSHOT_SERVER = "https://snapshots.jakekuerbis.com";

  let snapshotArchiveLoaded = false;
  let snapshotArchiveLoading = false;

  function snapshotUrl(src) {
    if (!src) return "";

    if (/^https?:\/\//i.test(src)) {
      return src;
    }

    if (src.startsWith("/")) {
      return `${SNAPSHOT_SERVER}${src}`;
    }

    return `${SNAPSHOT_SERVER}/${src}`;
  }

  async function loadSnapshotArchive() {
    if (!snapshotArchive || snapshotArchiveLoaded || snapshotArchiveLoading) {
      return;
    }

    snapshotArchiveLoading = true;

    try {
      const response = await fetch(`${SNAPSHOT_SERVER}/?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Snapshot archive request failed: ${response.status}`
        );
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      let snapshots = Array.from(doc.querySelectorAll("img"))
        .map((img) => img.getAttribute("src"))
        .filter((src) => {
          if (!src) return false;

          const lower = src.toLowerCase();

          return (
            lower.includes("webcam-sunset") &&
            /\.(jpg|jpeg|png)(\?.*)?$/.test(lower)
          );
        });

      snapshots = [...new Set(snapshots)].sort((a, b) =>
        b.localeCompare(a)
      );

      snapshotArchive.innerHTML = "";

      snapshots.forEach((src) => {
        const img = document.createElement("img");
        img.className = "snapshot";
        img.alt = "Mount Hood sunset capture";
        img.loading = "lazy";
        img.src = snapshotUrl(src);
        snapshotArchive.appendChild(img);
      });

      snapshotArchiveLoaded = true;
      console.log(`Snapshots loaded: ${snapshots.length}`);
    } catch (error) {
      console.error("Failed to load snapshot archive:", error);
    } finally {
      snapshotArchiveLoading = false;
    }
  }

  if (snapshotToggle && snapshotArchive) {
    snapshotToggle.addEventListener("click", async () => {
      const willOpen = !snapshotArchive.classList.contains("is-visible");

      if (willOpen) {
        await loadSnapshotArchive();
      }

      snapshotArchive.classList.toggle("is-visible", willOpen);
      snapshotToggle.classList.toggle("is-active", willOpen);
      snapshotToggle.setAttribute("aria-expanded", String(willOpen));

      // Keep the wording as "View All"; blue indicates the open state.
      snapshotToggle.textContent =
      willOpen ? "Hide All" : "View All";
    });
  }

  function refreshDescriptionWebcam() {
    if (!liveSnapshot) return;

    liveSnapshot.src =
      "https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg?nocache=" +
      Date.now();
  }

  if (liveSnapshot) {
    refreshDescriptionWebcam();
    setInterval(refreshDescriptionWebcam, 60000);
  }

  // -------------------------------------------------
  // Weather / footer / homepage webcam
  // -------------------------------------------------
  function fetchTemperature() {
    if (!temperatureApiKey) return;

    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${temperatureApiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Temperature request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (typeof data?.main?.temp === "number") {
          currentTemperature = Math.round(data.main.temp);
          updateClock();
        }
      })
      .catch((error) =>
        console.error("Error fetching temperature:", error)
      );
  }

  function fetchSunTimes() {
    if (!temperatureApiKey) return;

    fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=imperial&appid=${temperatureApiKey}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sun-times request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const today = data?.daily?.[0];
        if (!today) return;

        sunrise = new Date(today.sunrise * 1000);
        sunset = new Date(today.sunset * 1000);

        updateStatus();
        updateBackgroundColor();
      })
      .catch((error) =>
        console.error("Error fetching sun times:", error)
      );
  }

  function updateClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    const timeString = new Date().toLocaleTimeString("en-US", {
      timeZone: "America/Los_Angeles",
    });

    const temperatureDisplay =
      currentTemperature !== null ? `${currentTemperature}°F` : "Loading...";

    clock.textContent = `${timeString} (PST) / ${temperatureDisplay}`;
  }

  function updateStatus() {
    const about = document.getElementById("about");
    if (!about || !sunrise || !sunset) return;

    const now = new Date();

    if (now >= sunrise && now < sunset) {
      about.textContent = "Status: Online";
      return;
    }

    const nextSunrise = new Date(sunrise);
    if (now >= sunset) {
      nextSunrise.setDate(nextSunrise.getDate() + 1);
    }

    const minutesUntilSunrise = Math.max(
      0,
      Math.ceil((nextSunrise.getTime() - now.getTime()) / 60000)
    );

    about.textContent = `Status: ${minutesUntilSunrise} min until sunrise`;
  }

  function interpolateColor(colorA, colorB, ratio) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    const r = Math.round(
      colorA[0] + (colorB[0] - colorA[0]) * clampedRatio
    );
    const g = Math.round(
      colorA[1] + (colorB[1] - colorA[1]) * clampedRatio
    );
    const b = Math.round(
      colorA[2] + (colorB[2] - colorA[2]) * clampedRatio
    );

    return `rgb(${r}, ${g}, ${b})`;
  }

  function updateBackgroundColor() {
    const footer = document.querySelector("footer");
    if (!footer || !sunrise || !sunset) return;

    const now = Date.now();
    const sunriseTime = sunrise.getTime();
    const sunsetTime = sunset.getTime();
    const transition = 30 * 60 * 1000;
    const segment = transition / 3;

    let backgroundColor;

    if (now < sunriseTime - transition) {
      backgroundColor = "rgb(0, 0, 0)";
    } else if (now < sunriseTime) {
      const elapsed = now - (sunriseTime - transition);

      if (elapsed < segment) {
        backgroundColor = interpolateColor(
          colorBlack,
          colorDarkBlue,
          elapsed / segment
        );
      } else if (elapsed < segment * 2) {
        backgroundColor = interpolateColor(
          colorDarkBlue,
          colorPurple,
          (elapsed - segment) / segment
        );
      } else {
        backgroundColor = interpolateColor(
          colorPurple,
          colorOrange,
          (elapsed - segment * 2) / segment
        );
      }
    } else if (now < sunriseTime + transition) {
      backgroundColor = interpolateColor(
        colorOrange,
        colorBlue,
        (now - sunriseTime) / transition
      );
    } else if (now < sunsetTime - transition) {
      backgroundColor = `rgb(${colorBlue.join(", ")})`;
    } else if (now < sunsetTime) {
      backgroundColor = interpolateColor(
        colorBlue,
        colorOrange,
        (now - (sunsetTime - transition)) / transition
      );
    } else if (now < sunsetTime + transition) {
      const elapsed = now - sunsetTime;

      if (elapsed < segment) {
        backgroundColor = interpolateColor(
          colorOrange,
          colorPurple,
          elapsed / segment
        );
      } else if (elapsed < segment * 2) {
        backgroundColor = interpolateColor(
          colorPurple,
          colorDarkBlue,
          (elapsed - segment) / segment
        );
      } else {
        backgroundColor = interpolateColor(
          colorDarkBlue,
          colorBlack,
          (elapsed - segment * 2) / segment
        );
      }
    } else {
      backgroundColor = "rgb(0, 0, 0)";
    }

    footer.style.backgroundColor = backgroundColor;
  }

  function updateWebcam() {
    const webcam = document.getElementById("webcam");
    if (!webcam) return;

    webcam.src =
      "https://www.timberlinelodge.com/snowcameras//palmerbottom.jpg?nocache=" +
      Date.now();
  }

  updateClock();
  updateWebcam();
  fetchTemperature();
  fetchSunTimes();

  setInterval(updateClock, 1000);
  setInterval(updateStatus, 60000);
  setInterval(updateWebcam, 60000);
  setInterval(fetchTemperature, 300000);
  setInterval(updateBackgroundColor, 1000);
  setInterval(fetchSunTimes, 60 * 60 * 1000);
});
