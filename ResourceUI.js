// ResourceUI.js
export class ResourceUI {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username; // Store the logged-in username, passed as a parameter
        this.resources = { gold: 0, platinum: 0, iron: 0, coins: 0 };
        this.initUI();
        this.setupSocketEvents();
    }

    initUI() {
        // Create UI container with enhanced styling
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: '#E0F7FA', // Light cyan for sci-fi feel
            fontFamily: "'Orbitron', sans-serif", // Futuristic font (Google Fonts)
            fontSize: '16px',
            background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))', // Gradient bg
            padding: '20px',
            border: '1px solid #00BCD4', // Cyan border
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)', // Glow effect
            zIndex: '1000',
            transition: 'transform 0.3s ease, opacity 0.3s ease', // Smooth hover/visibility
            maxWidth: '250px', // Constrain width for responsiveness
        });
        document.body.appendChild(this.container);

        // Add subtle hover effect
        this.container.addEventListener('mouseenter', () => {
            this.container.style.transform = 'scale(1.02)';
        });
        this.container.addEventListener('mouseleave', () => {
            this.container.style.transform = 'scale(1)';
        });

        this.updateUI();
    }

    setupSocketEvents() {
        this.socket.on('updateResources', ({ username, resources }) => {
            // Only update if the event is for this user
            if (username === this.username) {
                this.resources = resources;
                this.updateUI();
            }
        });
    }

    updateUI() {
        const gold = Math.floor(this.resources.gold || 0);
        const platinum = Math.floor(this.resources.platinum || 0);
        const iron = Math.floor(this.resources.iron || 0);
        const coins = Math.floor(this.resources.coins || 0);

        // Enhanced UI with icons, animations, and better structure
        this.container.innerHTML = `
            <div style="
                font-size: 18px; 
                color: #00BCD4; 
                margin-bottom: 15px; 
                text-transform: uppercase; 
                letter-spacing: 1.5px;
                text-shadow: 0 0 5px rgba(0, 188, 212, 0.7);
            ">Resource Matrix</div>
            <div style="display: grid; grid-template-columns: 30px 1fr; gap: 10px; align-items: center;">
                <img src="Icons/gold.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px #FFD700);" alt="Gold">
                <span style="transition: color 0.3s ease;">Gold: <span style="color: #FFD700;">${gold}</span></span>
                <img src="Icons/platinum.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px #E0E0E0);" alt="Platinum">
                <span style="transition: color 0.3s ease;">Platinum: <span style="color: #E0E0E0;">${platinum}</span></span>
                <img src="Icons/iron.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px rgb(108, 108, 108));" alt="Iron">
                <span style="transition: color 0.3s ease;">Iron: <span style="color: rgb(80, 79, 79);">${iron}</span></span>
                <img src="Icons/coin.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px #FFCA28);" alt="Coins">
                <span style="transition: color 0.3s ease;">Coins: <span style="color: #FFCA28;">${coins}</span></span>
            </div>
        `;
    }
}