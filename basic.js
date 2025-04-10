// basic.js

// Function to create and manage the intro button and popup
export function initializeIntroButton() {
    // Create the button
    const introButton = document.createElement("button");
    introButton.id = "introButton";
    introButton.textContent = "Game Guide";
    Object.assign(introButton.style, {
      position: "fixed", // Fixed position to stay on screen
      top: "50%", // Vertically centered
      left: "0px", // Flat side flush with the left edge
      transform: "translateY(-50%)", // Adjust for true centering vertically
      padding: "10px 20px 10px 10px", // Reduced left padding for flat side
      background: "linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))", // Dark gradient
      color: "#E0F7FA", // Light cyan text
      border: "1px solid #00BCD4", // Cyan border
      borderRadius: "0 50px 50px 0", // Flat left, rounded right (half-circle)
      fontFamily: "'Tomorrow', sans-serif", // Futuristic font
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)", // Glow effect
      transition: "transform 0.3s ease, box-shadow 0.3s ease", // Smooth hover transitions
      textTransform: "uppercase", // Matches AttackButton's style
      letterSpacing: "1.5px", // Spacing for readability
      zIndex: "1000", // Ensure it’s above other elements
      display: "flex", // Flex for alignment
      alignItems: "center",
      gap: "8px", // Space if you add an icon later
      width: "120px", // Fixed width to control the half-circle size
      height: "50px" // Fixed height to ensure circular rounding
    });
  
    // Hover effects
    introButton.addEventListener("mouseenter", () => {
      introButton.style.transform = "translateY(-50%) translateX(5px)"; // Slide right slightly instead of scaling
      introButton.style.boxShadow = "0 6px 20px rgba(0, 188, 212, 0.7), inset 0 0 10px rgba(0, 188, 212, 0.3)"; // Enhanced glow
    });
    introButton.addEventListener("mouseleave", () => {
      introButton.style.transform = "translateY(-50%) translateX(0)"; // Reset position
      introButton.style.boxShadow = "0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)"; // Default glow
    });
  
    // Append button to the body
    document.body.appendChild(introButton);
  
    // Event listener for button click
    introButton.addEventListener("click", showIntroPopup);
    // Append button to the body
    document.body.appendChild(introButton);
  
    // Event listener for button click
    introButton.addEventListener("click", showIntroPopup);
  
    // Function to show the popup
    function showIntroPopup() {
        // Check if popup already exists to avoid duplicates
        if (document.getElementById("introPopup")) return;
      
        // Create popup container
        const popup = document.createElement("div");
        popup.id = "introPopup";
        Object.assign(popup.style, {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))", // Matches AttackButton
          color: "#E0F7FA", // Light cyan text
          padding: "20px",
          border: "1px solid #00BCD4", // Cyan border
          borderRadius: "10px",
          maxWidth: "600px",
          zIndex: "1001", // Above the button
          fontFamily: "'Tomorrow', sans-serif", // Futuristic font
          boxShadow: "0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)", // Glow effect
          lineHeight: "1.7" // Improved readability
        });
      
        // Popup content
        popup.innerHTML = `
          <h2 style="margin-top: 0; text-transform: uppercase; letter-spacing: 2px;">Welcome to Superseed Odyssey!</h2>
          <p style="font-size: 14px; opacity: 0.9; text-align: center;">A game built on Superseed DeFi principles</p>
      
          <h3 style="font-size: 18px; margin: 15px 0 10px;">Story</h3>
          <p style="font-size: 14px;">
            In 4028, Earth faces catastrophic disasters. Humanity’s hope lies on Mars. Your grandfather entrusts you with a priceless Superseed, a key to rebuilding civilization. Your mission begins!
          </p>
      
          <h3 style="font-size: 18px; margin: 15px 0 10px;">How to Play</h3>
          <ul style="text-align: left; font-size: 14px; padding-left: 20px; margin: 0 0 15px;">
            <li><strong>Start Exploring:</strong> You begin with 3 rovers that automatically roam Mars, collecting Gold, Platinum, and Iron. They deliver resources to the Superseed Tree.</li>
            <li><strong>Manage Resources:</strong> Watch your resource count grow as rovers unload. Visit the Loan section to borrow coins using resources as collateral. Choose a Normal Loan or a Supercollateral Loan (auto-repaying).</li>
            <li><strong>Expand Your Base:</strong> Use coins in Base Ops to buy more rovers. More rovers = more resources!</li>
            <li><strong>Defend & Attack:</strong> This is a multiplayer game! Build Guardians to protect your base from other players. Once your army is ready, attack others to steal their resources.</li>
            <li><strong>Bid in Auctions:</strong> Every 4 hour, bid coins for Superseeds in auctions based on Proof-of-Repayment. The highest bidder wins the Superseed!</li>
            <li><strong>Climb the Leaderboard:</strong> Your rank depends on resources, loans, battles, and Superseeds. Owning a Superseed boosts your rank every 24 hours.</li>
            <li><strong>Chat with Players:</strong> Connect with others via the chatbox to strategize or socialize.</li>
          </ul>
      
          <p style="font-size: 14px; margin: 15px 0;">
            <strong>Discover Superseed:</strong> Learn about the first blockchain that repays your debt at <a href="https://docs.superseed.xyz" target="_blank" style="color: #00BCD4; text-decoration: none;">docs.superseed.xyz</a>
          </p>
      
          <p style="font-size: 14px; margin: 15px 0;">
            <strong>Feedback?</strong> Share suggestions or questions! Tweet us at <a href="https://x.com/paradoxrekt/status/1910109917093978331" target="_blank" style="color: #00BCD4; text-decoration: none;">this link</a>
          </p>
      
          <button id="closeIntroPopup" style="
  background: linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85));
  color: #E0F7FA;
  border: 1px solid #00BCD4;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 20px auto 0;
  font-family: 'Tomorrow', sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  box-shadow: 0 4px 15px rgba(0, 188, 212, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: block;
">Close</button>
        `;
  
      // Append popup to body
      document.body.appendChild(popup);
  
      // Add close button event listener
      const closeButton = document.getElementById("closeIntroPopup");
      closeButton.addEventListener("click", () => {
        popup.remove();
      });
  
      // Prevent camera controls while popup is open
      document.addEventListener("mousedown", preventCameraControls, { capture: true });
      document.addEventListener("wheel", preventCameraControls, { capture: true });
  
      function preventCameraControls(e) {
        e.stopPropagation();
        if (popup.contains(e.target) || e.target === closeButton) {
          return;
        }
        e.preventDefault();
      }
  
      // Clean up event listeners when popup is closed
      closeButton.addEventListener("click", () => {
        document.removeEventListener("mousedown", preventCameraControls, { capture: true });
        document.removeEventListener("wheel", preventCameraControls, { capture: true });
      });
    }
  }
