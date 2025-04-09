// BaseCamp.js
export class BaseCamp {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username; // Use username instead of userData
        this.initializeBaseCamp();
        this.setupSocketListeners();
        this.fetchInitialData(); // Fetch initial data from server
    }

    initializeBaseCamp() {
        // Add Tomorrow font if not already present
        if (!document.querySelector('link[href*="Tomorrow"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Tomorrow:wght@400;600;700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Base Camp Button HTML
        const baseCampHTML = `
            <div id="basecamp-container" style="position: fixed; bottom: 10px; right: 40px; z-index: 999;">
                <button id="basecamp-toggle" style="
                    font-size: 18px; 
                    color: #00BCD4; 
                    background: linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85)); 
                    border: 1px solid #00BCD4; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    text-transform: uppercase; 
                    letter-spacing: 1.5px; 
                    text-shadow: 0 0 5px rgba(0, 188, 212, 0.7); 
                    font-family: 'Tomorrow', sans-serif; 
                    box-shadow: 0 2px 8px rgba(0, 188, 212, 0.5);
                ">
                    BASE CAMP
                </button>
                <div id="basecamp-popup" style="
                    display: none;
                    position: fixed;
                    width: 600px;
                    height: 400px;
                    background: linear-gradient(135deg, rgba(10, 25, 47, 0.98), rgba(0, 0, 0, 0.9));
                    border: 2px solid #00BCD4;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 188, 212, 0.6);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 1001;
                    padding: 20px;
                    color: #E0F7FA;
                    font-family: 'Tomorrow', sans-serif;
                    overflow-y: auto;
                ">
                    <div style="
                        font-size: 24px;
                        color: #00BCD4;
                        text-align: center;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        text-shadow: 0 0 8px rgba(0, 188, 212, 0.7);
                    ">
                        GUARDIAN RECRUITMENT
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                        <div class="guardian-card" style="
                            width: 150px;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00BCD4;
                            border-radius: 8px;
                            padding: 15px;
                            box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                        ">
                            <div class="guardian-image" style="
                                height: 120px;
                                background: url('icons/aerial_scout.webp') center/contain no-repeat;
                                margin-bottom: 10px;
                            "></div>
                            <div class="guardian-name" style="
                                font-size: 18px;
                                color: #FFD700;
                                text-align: center;
                                margin-bottom: 10px;
                            ">Aerial Scout</div>
                            <div class="guardian-cost" style="
                                color: #00BCD4;
                                margin-bottom: 10px;
                            ">Cost: <span style="color: #FFCA28;">500</span> coins</div>
                            <div class="guardian-owned" style="margin-bottom: 15px;">
                                Owned: <span id="aerialScoutAmount">0</span>
                            </div>
                            <button id="buyAerialScout" style="
                                width: 100%;
                                padding: 8px;
                                background: linear-gradient(135deg, #28a745, #1b5e20);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-family: 'Tomorrow', sans-serif;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            ">Recruit</button>
                        </div>
                        <div class="guardian-card" style="
                            width: 150px;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00BCD4;
                            border-radius: 8px;
                            padding: 15px;
                            box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                        ">
                            <div class="guardian-image" style="
                                height: 120px;
                                background: url('icons/combat_sentinel.webp') center/contain no-repeat;
                                margin-bottom: 10px;
                            "></div>
                            <div class="guardian-name" style="
                                font-size: 18px;
                                color: #FFD700;
                                text-align: center;
                                margin-bottom: 10px;
                            ">Combat Sentinel</div>
                            <div class="guardian-cost" style="
                                color: #00BCD4;
                                margin-bottom: 10px;
                            ">Cost: <span style="color: #FFCA28;">600</span> coins</div>
                            <div class="guardian-owned" style="margin-bottom: 15px;">
                                Owned: <span id="combatSentinelAmount">0</span>
                            </div>
                            <button id="buyCombatSentinel" style="
                                width: 100%;
                                padding: 8px;
                                background: linear-gradient(135deg, #28a745, #1b5e20);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-family: 'Tomorrow', sans-serif;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            ">Recruit</button>
                        </div>
                        <div class="guardian-card" style="
                            width: 150px;
                            background: rgba(0, 0, 0, 0.5);
                            border: 1px solid #00BCD4;
                            border-radius: 8px;
                            padding: 15px;
                            box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                        ">
                            <div class="guardian-image" style="
                                height: 120px;
                                background: url('icons/flare_bomber.webp')  center/contain no-repeat; 
                                margin-bottom: 10px;
                            "></div>
                            <div class="guardian-name" style="
                                font-size: 18px;
                                color: #FFD700;
                                text-align: center;
                                margin-bottom: 10px;
                            ">Flare Bomber</div>
                            <div class="guardian-cost" style="
                                color: #00BCD4;
                                margin-bottom: 10px;
                            ">Cost: <span style="color: #FFCA28;">700</span> coins</div>
                            <div class="guardian-owned" style="margin-bottom: 15px;">
                                Owned: <span id="flareBomberAmount">0</span>
                            </div>
                            <button id="buyFlareBomber" style="
                                width: 100%;
                                padding: 8px;
                                background: linear-gradient(135deg, #28a745, #1b5e20);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-family: 'Tomorrow', sans-serif;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            ">Recruit</button>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button id="basecamp-close" style="
                            padding: 8px 20px;
                            background: linear-gradient(135deg, #dc3545, #a71d2a);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Tomorrow', sans-serif;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">Close</button>
                    </div>
                </div>
                <div id="basecamp-overlay" style="
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 1000;
                "></div>
            </div>
        `;

        // Inject HTML into the document
        document.body.insertAdjacentHTML('beforeend', baseCampHTML);

        // Get DOM elements
        this.toggleBtn = document.getElementById('basecamp-toggle');
        this.popup = document.getElementById('basecamp-popup');
        this.overlay = document.getElementById('basecamp-overlay');
        this.closeBtn = document.getElementById('basecamp-close');
        this.buyAerialScoutBtn = document.getElementById('buyAerialScout');
        this.buyCombatSentinelBtn = document.getElementById('buyCombatSentinel');
        this.buyFlareBomberBtn = document.getElementById('buyFlareBomber');

        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleBaseCamp());
        this.closeBtn.addEventListener('click', () => this.toggleBaseCamp(false));
        this.overlay.addEventListener('click', () => this.toggleBaseCamp(false));
        this.buyAerialScoutBtn.addEventListener('click', () => this.purchaseGuardian('aerial_scout', 500));
        this.buyCombatSentinelBtn.addEventListener('click', () => this.purchaseGuardian('combat_sentinel', 600));
        this.buyFlareBomberBtn.addEventListener('click', () => this.purchaseGuardian('flare_bomber', 700));
    }

    toggleBaseCamp(show = true) {
        if (show) {
            this.popup.style.display = 'block';
            this.overlay.style.display = 'block';
        } else {
            this.popup.style.display = 'none';
            this.overlay.style.display = 'none';
        }
    }

    setupSocketListeners() {
        // Listen for guardian updates
        this.socket.on('guardian_update', (data) => {
            if (data.username === this.username) {
                this.updateGuardianCounts(data.guardians);
            }
        });
    
        // Listen for resource updates (to sync coins)
        this.socket.on('updateResources', ({ username, resources }) => {
            if (username === this.username) {
                this.userResources = resources;
            }
        });
    
        // Handle purchase errors
        this.socket.on('guardian_purchase_error', (data) => {
            if (data.username === this.username) {
                alert(data.message);
            }
        });
    
        // Handle initial data responses
        this.socket.on('user_guardians', (data) => {
            if (data.username === this.username) {
                this.updateGuardianCounts(data.guardians);
            }
        });
    
        this.socket.on('user_resources', (data) => {
            if (data.username === this.username) {
                this.userResources = data.resources;
            }
        });
    }

    fetchInitialData() {
        // Fetch initial guardian amounts and resources
        this.socket.emit('get_user_guardians', { username: this.username });
        this.socket.emit('get_user_resources', { username: this.username });
    }

    purchaseGuardian(type, cost) {
        if (this.userResources && this.userResources.coins >= cost) {
            this.socket.emit('purchase_guardian', { 
                username: this.username, 
                guardianType: type, 
                cost: cost 
            });
            // Refetch data after purchase to update UI
            setTimeout(() => this.fetchInitialData(), 100); // Small delay to allow server update
        } else {
            alert("Not enough coins!");
        }
    }

    updateGuardianCounts(guardians) {
        document.getElementById('aerialScoutAmount').textContent = guardians.aerial_scout_amount || 0;
        document.getElementById('combatSentinelAmount').textContent = guardians.combat_sentinel_amount || 0;
        document.getElementById('flareBomberAmount').textContent = guardians.flare_bomber_amount || 0;
    }
}