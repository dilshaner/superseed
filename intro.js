// Scene configuration
const scenes = [
  {
      image: "/Assets/Intro/intro1.webp",
      audio: "/Assets/Intro/voice1.mp3",
      dialog: "An old man, David, holds a glowing seed by a tree on a broken Earth.",
      duration: 6800 // 6s
  },
  {
      image: "/Assets/Intro/intro2.webp",
      audio: "/Assets/Intro/voice2.mp3",
      dialog: "David gives young Milo the glowing seed as Earth falls apart behind them.",
      duration: 7400 // 8s
  },
  {
      image: "/Assets/Intro/intro3.webp",
      audio: "/Assets/Intro/voice3.mp3",
      dialog: "Milo’s shuttle crashes on Mars, and he steps out holding the seed.",
      duration: 8000 // 5s
  },
  {
      image: "/Assets/Intro/intro4.webp",
      audio: "/Assets/Intro/voice4.mp3",
      dialog: "Milo puts the seed in Mars’ dirt, and a tiny plant starts to grow.",
      duration: 8500 // 7s
  },
  {
      image: "/Assets/Intro/intro5.webp",
      audio: "/Assets/Intro/voice5.mp3",
      dialog: "A big tree with Superseed fruit grows on Mars, and Milo looks up at it. Now you’re Milo. The tree is here, and Mars is yours to shape.",
      duration: 18000 // 15s
  }
];

// DOM elements
const introContainer = document.createElement("div");
const introImage = document.createElement("img");
const dialogBox = document.createElement("div");

// Loading screen DOM elements
const loadingScreen = document.createElement("div");
const loadingTitle = document.createElement("h1");
const loadingTagline = document.createElement("p");
const loadingBarContainer = document.createElement("div");
const loadingBar = document.createElement("div");
const clickPrompt = document.createElement("p");

// Background music setup
const backgroundMusic = new Audio("/Assets/Intro/bgintro1.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;

// Audio control elements
let currentAudio = null;
let sceneTimeout = null;

// Ensure body takes full viewport height
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.height = "100vh";
document.body.style.overflow = "hidden";

// Intro container styling
introContainer.style.position = "absolute";
introContainer.style.width = "100vw";
introContainer.style.height = "100vh";
introContainer.style.top = "0";
introContainer.style.left = "0";
introContainer.style.backgroundColor = "#000";
introContainer.style.transition = "opacity 1s ease-in-out";
introContainer.style.maxWidth = "1920px";
introContainer.style.maxHeight = "1080px";
introContainer.style.margin = "0 auto";
introContainer.style.opacity = "0"; // Hidden until intro starts

introImage.style.width = "100%";
introImage.style.height = "100%";
introImage.style.objectFit = "cover";
introImage.style.opacity = "0";
introImage.style.transition = "opacity 1s ease-in-out";

// Sci-fi themed dialog box
dialogBox.style.position = "absolute";
dialogBox.style.bottom = "5vh";
dialogBox.style.left = "50%";
dialogBox.style.transform = "translateX(-50%)";
dialogBox.style.color = "#E0F7FA";
dialogBox.style.fontFamily = "'Mynerve', sans-serif";
dialogBox.style.fontSize = "16px";
dialogBox.style.background = "linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))";
dialogBox.style.padding = "20px";
dialogBox.style.border = "1px solid #00BCD4";
dialogBox.style.borderRadius = "8px";
dialogBox.style.boxShadow = "0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)";
dialogBox.style.zIndex = "1000";
dialogBox.style.transition = "transform 0.3s ease, opacity 0.3s ease";
dialogBox.style.width = "clamp(300px, 40vw, 600px)";
dialogBox.style.textAlign = "center";

// Loading screen styling
loadingScreen.style.position = "absolute";
loadingScreen.style.width = "100vw";
loadingScreen.style.height = "100vh";
loadingScreen.style.backgroundColor = "#0A192F"; // Dark sci-fi blue-gray
loadingScreen.style.display = "flex";
loadingScreen.style.flexDirection = "column";
loadingScreen.style.justifyContent = "center";
loadingScreen.style.alignItems = "center";
loadingScreen.style.zIndex = "2000";
loadingScreen.style.transition = "opacity 1s ease-in-out";

loadingTitle.textContent = "SuperSeed Odyssey";
loadingTitle.style.color = "#E0F7FA"; // Light cyan
loadingTitle.style.fontFamily = "'Mynerve', sans-serif";
loadingTitle.style.fontSize = "48px";
loadingTitle.style.margin = "0";
loadingTitle.style.textShadow = "0 0 10px rgba(0, 188, 212, 0.7)";

loadingTagline.textContent = "Plant the Seed, Grow the Future";
loadingTagline.style.color = "#B0BEC5"; // Light gray
loadingTagline.style.fontFamily = "'Mynerve', sans-serif";
loadingTagline.style.fontSize = "20px";
loadingTagline.style.margin = "10px 0 30px 0";

loadingBarContainer.style.width = "300px";
loadingBarContainer.style.height = "10px";
loadingBarContainer.style.backgroundColor = "#263238"; // Darker gray
loadingBarContainer.style.borderRadius = "5px";
loadingBarContainer.style.overflow = "hidden";

loadingBar.style.width = "0%";
loadingBar.style.height = "100%";
loadingBar.style.backgroundColor = "#00BCD4"; // Cyan
loadingBar.style.transition = "width 2s ease-in-out";

clickPrompt.textContent = "Click anywhere to continue";
clickPrompt.style.color = "#E0F7FA";
clickPrompt.style.fontFamily = "'Mynerve', sans-serif";
clickPrompt.style.fontSize = "16px";
clickPrompt.style.marginTop = "30px";
clickPrompt.style.opacity = "0";
clickPrompt.style.transition = "opacity 0.5s ease";

// Append elements
introContainer.appendChild(introImage);
introContainer.appendChild(dialogBox);
loadingScreen.appendChild(loadingTitle);
loadingScreen.appendChild(loadingTagline);
loadingScreen.appendChild(loadingBarContainer);
loadingBarContainer.appendChild(loadingBar);
loadingScreen.appendChild(clickPrompt);
document.body.appendChild(loadingScreen);
document.body.appendChild(introContainer);

// Preload images
function preloadImages() {
  scenes.forEach(scene => {
      const img = new Image();
      img.src = scene.image;
  });
}

// Simulate loading
function simulateLoading() {
  let progress = 0;
  const interval = setInterval(() => {
      progress += 10;
      loadingBar.style.width = `${progress}%`;
      if (progress >= 100) {
          clearInterval(interval);
          clickPrompt.style.opacity = "1";
          loadingScreen.style.cursor = "pointer";
          loadingScreen.addEventListener("click", startIntroAfterLoading, { once: true });
      }
  }, 200); // 2 seconds total loading time
}

// Typewriter effect
function typeWriter(text, element, speed = 50, callback) {
  element.textContent = "";
  let i = 0;
  function type() {
      if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
      } else if (callback) {
          callback();
      }
  }
  type();
}

// Scene transition logic
let currentScene = 0;

function showScene(sceneIndex) {
  if (sceneIndex >= scenes.length) {
      endIntro();
      return;
  }

  // Stop current audio if playing
  if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
  }

  // Fade out current image
  introImage.style.opacity = "0";

  // Load new scene after fade-out completes
  setTimeout(() => {
      introImage.src = scenes[sceneIndex].image;
      currentAudio = new Audio(scenes[sceneIndex].audio);
      currentAudio.play();
      introImage.style.opacity = "1"; // Fade in new image
      typeWriter(scenes[sceneIndex].dialog, dialogBox);
  }, 1000); // Matches the 1s transition duration

  // Schedule next scene
  clearTimeout(sceneTimeout);
  sceneTimeout = setTimeout(() => {
      currentScene++;
      showScene(currentScene);
  }, scenes[sceneIndex].duration);
}

// Start the intro after user click
function startIntroAfterLoading() {
  loadingScreen.style.opacity = "0";
  setTimeout(() => {
      document.body.removeChild(loadingScreen);
      introContainer.style.opacity = "1"; // Fade in intro
      backgroundMusic.play(); // Start background music after interaction
      showScene(currentScene); // Start scene transitions
  }, 1000); // Matches fade-out duration
}

// End intro and load login.js
function endIntro() {
  if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
  }
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  clearTimeout(sceneTimeout);
  introContainer.style.opacity = "0";

  setTimeout(() => {
      if (introContainer.parentNode) {
          document.body.removeChild(introContainer);
      }
      document.body.style.overflow = "";
      document.body.style.height = "";
      loadLogin();
  }, 1000); // Matches container fade-out duration
}


// Dynamically load login.js
function loadLogin() {
  const script = document.createElement("script");
  script.src = "login.js";
  script.type = "module";
  script.onload = () => console.log("login.js loaded");
  script.onerror = () => console.error("Failed to load login.js");
  document.body.appendChild(script);
}

// Start loading when page loads
window.onload = () => {
  preloadImages();
  simulateLoading();
};

// Allow skipping intro with a click
introContainer.addEventListener("click", () => {
  if (currentAudio) {
    currentAudio.pause();
  }
  backgroundMusic.pause(); // Stop background music on skip
  clearTimeout(sceneTimeout);
  currentScene = scenes.length;
  endIntro();
});

// Handle window resize for dynamic adjustment
function adjustLayout() {
  introContainer.style.height = `${window.innerHeight}px`;
  introContainer.style.width = `${window.innerWidth}px`;
  loadingScreen.style.height = `${window.innerHeight}px`;
  loadingScreen.style.width = `${window.innerWidth}px`;
}
window.addEventListener("resize", adjustLayout);
adjustLayout();