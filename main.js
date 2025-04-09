// main.js
import { initializeRovers } from "./rovers.js";
import * as THREE from "three";
import TownHall from "./townhall.js";
import { createLowPolyGoldenTree } from "./superseedtree.js";
import { createSpaceUI } from "./spaceui.js";
import { spawnMeteoroids } from "./meteoroids.js";
import {
  createGround,
  generateOrbitObjects,
  scatterRockFormations,
} from "./marsEnvironment.js";
import {
  createCraters,
  createGoldVeins,
  createIronRocks,
  createPlatinumClusters,
  createRocks,
} from "./MartianTerrain.js";
import { ResourceUI } from "./ResourceUI.js";
import { LoanManager, initializePopupLogic } from "./loanManager.js";
import { Leaderboard } from './leaderboard.js';
import { BaseOperationsTab } from './BaseOperationsTab.js';
import { AttackButton } from './attackButton.js'; 
import { initializeChatbox } from './chatbox.js'; 

// Initialize socket globally
const socket = io("https://superseed-odyssey.dilshaner.com/");
window.auctionSocket = socket;

export function initGame(username) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  
  // 🎵 Call this line to start music
  setupBackgroundMusic(camera);



  // Lighting (unchanged)
  const ambientLight = new THREE.AmbientLight(0x404040, 5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  

  // Camera controls (unchanged)
  let isDragging = false,
    zoom = 10;
  function resetCamera() {
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 2, 0);
  }
  resetCamera();

  document.addEventListener("mousedown", () => (isDragging = true));
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    camera.position.x -= e.movementX * 0.05;
    camera.position.z -= e.movementY * 0.05;
    camera.position.y = Math.max(camera.position.y, 5);

    const distance = camera.position.length();
    if (distance > 300) {
      const scale = 300 / distance;
      camera.position.set(
        camera.position.x * scale,
        camera.position.y * scale,
        camera.position.z * scale
      );
    }
    camera.lookAt(0, 2, 0);
  });
  document.addEventListener("mouseup", () => (isDragging = false));
  document.addEventListener("wheel", (e) => {
    zoom += e.deltaY * 0.05;
    zoom = Math.max(5, Math.min(zoom, 300));
    updateCameraPosition();
  });

  function updateCameraPosition() {
    const angle = Math.atan2(camera.position.z, camera.position.x);
    let newX = Math.cos(angle) * zoom;
    let newZ = Math.sin(angle) * zoom;
    let newY = Math.max(zoom / 2, 5);

    const distance = Math.sqrt(newX * newX + newY * newY + newZ * newZ);
    if (distance > 300) {
      const scale = 300 / distance;
      newX *= scale;
      newY *= scale;
      newZ *= scale;
    }

    camera.position.set(newX, newY, newZ);
    camera.lookAt(0, 2, 0);
  }

  // BG
function setupBackgroundMusic(camera) {
  // Create an AudioListener and attach to camera
  const listener = new THREE.AudioListener();
  camera.add(listener);

  // Create audio source and load music
  const bgMusic = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();

  audioLoader.load('/Assets/spacebg.mp3', (buffer) => {
    bgMusic.setBuffer(buffer);
    bgMusic.setLoop(true);
    bgMusic.setVolume(0.1);
    bgMusic.play();
  });
}


  // Add environment (unchanged)
  createSpaceUI(scene);
  spawnMeteoroids(scene);
  createGround(scene);
  generateOrbitObjects(scene);
  scatterRockFormations(scene);

  createCraters(scene);
  createGoldVeins(scene);
  createIronRocks(scene);
  createPlatinumClusters(scene);
  createRocks(scene);


  // Initialize the  AttackButton
  const attackButton = new AttackButton(socket, username);

  //ResoureUI

  let resourceUI;
  if (!document.getElementById("resource-container")) {
    resourceUI = new ResourceUI(socket);
  } else {
    console.log("ResourceUI already initialized.");
  }

  const loggedInUser = JSON.parse(sessionStorage.getItem("user"));
  if (loggedInUser) {
    resourceUI.resources = loggedInUser.resources;
    resourceUI.updateUI();
  }
  //LeaderBoard UI

  let leaderboard;
if (!document.getElementById("leaderboard-wrapper")) {
  leaderboard = new Leaderboard(socket);
} else {
  console.log("Leaderboard already initialized.");
}

// START: BaseCamp Initialization for main.js
const baseOperationsTab = new BaseOperationsTab(socket, username);
// END: BaseCamp Initialization for main.js


// Section 2: Update Leaderboard with logged-in user's data
const loggedInUserForLeaderboard = JSON.parse(sessionStorage.getItem("user"));
if (loggedInUserForLeaderboard) {
  socket.emit('update_ranking', {
    username: loggedInUserForLeaderboard.username,
    activityData: {
      resources: loggedInUserForLeaderboard.resources,
      coins: loggedInUserForLeaderboard.resources?.coins || 0,
    }
  });
  socket.emit('get_top_users'); // Fetch the initial leaderboard
}



  const lowPolyGoldenTree = createLowPolyGoldenTree(0, 0);
  scene.add(lowPolyGoldenTree);

  const townHall = new TownHall();
  townHall.addToScene(scene);

  const listener = new THREE.AudioListener();
  camera.add(listener);

//====START====ROVERS=======
  let rovers = []; // Initialize as empty array

socket.emit("getRoverCounts", { username });
socket.on("roverCounts", ({ goldrovers_amount, platinumrovers_amount, ironrovers_amount }) => {
  // Remove existing rovers from the scene
  rovers.forEach(rover => {
    if (rover.group) scene.remove(rover.group); // Ensure rover.group exists
  });
  // Reinitialize rovers with database counts
  rovers = initializeRovers(scene, socket, username, {
    goldrovers_amount,
    platinumrovers_amount,
    ironrovers_amount
  });
  console.log(`Rovers initialized: ${rovers.length} (Gold: ${goldrovers_amount}, Platinum: ${platinumrovers_amount}, Iron: ${ironrovers_amount})`);
});

//====END====ROVERS=======

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const loanManager = new LoanManager(username);

// Auction tab initialization
function initializeAuctionTab(socket) {
    if (!socket) {
      console.error("Socket not provided to auction tab!");
      document.getElementById("bid-error").textContent =
        "Error: Socket not connected!";
      return;
    }
  
    // Ensure socket is connected and ready
    socket.on("connect", () => {
      console.log("Socket connected for auction tab");
    });
  
    // Real-time auction updates (current auction state)
    socket.on("auction_update", (data) => {
      document.getElementById("superseed-amount").textContent =
        data.superseeds || "N/A";
  
      const timeLeft = Math.max(0, data.timeLeft / 1000);
      document.getElementById("countdown").textContent = `${Math.floor(
        timeLeft / 60
      )}m ${Math.floor(timeLeft % 60)}s`;
  
      const bidsList = document.getElementById("bids");
      if (bidsList) {
        bidsList.innerHTML =
          data.bids && data.bids.length
            ? data.bids
                .map((bid) => `<li>${bid.username}: ${bid.amount}</li>`)
                .join("")
            : "<li>No bids yet</li>";
      }
    });
  
    // Handle auction popup messages (e.g., bid success, winner notification)
    socket.on("auction_popup", ({ message, type }) => {
      console.log(`Popup: ${message} (${type})`);
      // Assuming you have a popup element or mechanism; adjust as needed
      alert(`${type.toUpperCase()}: ${message}`); // Temporary alert; replace with your popup logic
    });
  
    // Button click to refresh and preview recent auction results
    const refreshResultsButton = document.getElementById("refresh-results-btn"); // Add this button in HTML
    if (refreshResultsButton) {
      refreshResultsButton.addEventListener("click", () => {
        socket.emit("get_auction_results"); // Request latest results from server
      });
    } else {
      console.warn("Refresh results button not found in DOM");
    }
  
    // Update results list when server responds with recent results
    socket.on("auction_results", (results) => {
      const resultsList = document.getElementById("results");
      if (resultsList) {
        resultsList.innerHTML = results.length
          ? results
              .map(
                (r) =>
                  `<li>${r.date} - Winner: ${r.winner}, Superseeds: ${r.superseeds}, Bid: ${r.winningBid}</li>`
              )
              .join("")
          : "<li>No results yet</li>";
      }
    });
  

    // Attach placeBid event listener
    const bidButton = document.getElementById("bidButton");
    if (bidButton) {
      bidButton.addEventListener("click", placeBid);
    } else {
      console.error("Bid button not found!");
    }
  }

  // Define placeBid function
  function placeBid() {
    const bidAmount = parseInt(document.getElementById("bid-amount").value);
    if (!bidAmount || bidAmount <= 0) {
      document.getElementById("bid-error").textContent =
        "Enter a valid bid amount!";
      return;
    }
    const username = sessionStorage.getItem("user")
      ? JSON.parse(sessionStorage.getItem("user")).username
      : "testuser";
    console.log("Placing bid:", { username, bidAmount });
    socket.emit("place_bid", { username, bidAmount });
    document.getElementById("bid-amount").value = "";
    document.getElementById("bid-error").textContent = "";
  }

  function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    const existingPopup =
      document.getElementById("borrowPopup") ||
      document.getElementById("townHallPopup");
    if (existingPopup && existingPopup.style.display === "block") {
      return;
    }

    const intersectslowPolyGoldenTree = raycaster.intersectObject(
      lowPolyGoldenTree,
      true
    );
    if (intersectslowPolyGoldenTree.length > 0) {
      let borrowPopup = document.getElementById("borrowPopup");
      if (!borrowPopup) {
        fetch("dapp.html")
          .then((response) => response.text())
          .then((data) => {
            document.body.insertAdjacentHTML("beforeend", data);
            borrowPopup = document.getElementById("borrowPopup");
            borrowPopup.style.display = "block";
            initializePopupLogic(loanManager);
            loanManager.updateDisplay();
            loanManager.updateLoanList();

            // Initialize auction tab
            initializeAuctionTab(socket);

            const activeLoans = document.getElementById("activeLoans");
            activeLoans.addEventListener(
              "wheel",
              (e) => {
                e.stopPropagation();
              },
              { passive: false }
            );
          })
          .catch((error) => console.error("Error loading dapp.html:", error));
      } else {
        borrowPopup.style.display = "block";
        initializePopupLogic(loanManager);
        loanManager.updateDisplay();
        loanManager.updateLoanList();
        initializeAuctionTab(socket);
      }
    }

    
  }

  function setupPopupEventListeners(popup, closeButtonId) {
    const closeButton = document.getElementById(closeButtonId);
    if (closeButton) {
      closeButton.removeEventListener("click", closePopupHandler);
      closeButton.addEventListener("click", closePopupHandler);
    } else {
      console.error(
        `Close button with ID ${closeButtonId} not found in popup.`
      );
    }

    function closePopupHandler() {
      popup.style.display = "none";
    }
  }

  window.addEventListener("click", onMouseClick);

  socket.on("updateResources", ({ username: updatedUsername, resources }) => {
    if (updatedUsername === username) {
      resourceUI.resources = resources;
      resourceUI.updateUI();
      loanManager.resources = resources;
      loanManager.updateDisplay();
    }
  });

  // START: Chatbox Initialization for main.js
  // Initialize the chatbox
  initializeChatbox(socket, username);
  // END: Chatbox Initialization for main.js

  function animate(time) {
    requestAnimationFrame(animate);
    rovers.forEach((rover) => rover.update(time));
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
