// BaseOperationsTab.js
export class BaseOperationsTab {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username;
        this.initializeBaseOperationsTab();
        this.setupSocketListeners();
        this.fetchInitialData();
    }

    initializeBaseOperationsTab() {
        // Add Tomorrow font if not already present
        if (!document.querySelector('link[href*="Tomorrow"]')) {
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family=Tomorrow:wght@400;600;700&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Base Operations Tab HTML with tab selection
        const baseOperationsHTML = `
            <div id="base-operations-container" style="position: fixed; bottom: 10px; right: 40px; z-index: 999;">
                <button id="base-operations-toggle" style="
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
                    BASE OPS
                </button>
                <div id="base-operations-popup" style="
                    display: none;
                    position: fixed;
                    width: 600px;
                    height: 450px;
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
                        margin-bottom: 15px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        text-shadow: 0 0 8px rgba(0, 188, 212, 0.7);
                    ">
                        BASE OPERATIONS
                    </div>
                    <div id="tab-buttons" style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">
                        <button id="rovers-tab-btn" style="
                            padding: 8px 20px;
                            background: linear-gradient(135deg, #00BCD4, #0288D1);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Tomorrow', sans-serif;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">Rovers</button>
                        <button id="guardians-tab-btn" style="
                            padding: 8px 20px;
                            background: rgba(0, 188, 212, 0.2);
                            color: #00BCD4;
                            border: 1px solid #00BCD4;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Tomorrow', sans-serif;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        ">Guardians</button>
                    </div>
                    <div id="rovers-tab" style="display: block;">
                        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
                            <div class="rover-card" style="
                                width: 150px;
                                background: rgba(0, 0, 0, 0.5);
                                border: 1px solid #00BCD4;
                                border-radius: 8px;
                                padding: 15px;
                                box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                            ">
                                <div class="rover-image" style="
                                    height: 120px;
                                    background: url('Icons/gold_rover.webp') center/contain no-repeat;
                                    margin-bottom: 10px;
                                "></div>
                                <div class="rover-name" style="
                                    font-size: 18px;
                                    color: #FFD700;
                                    text-align: center;
                                    margin-bottom: 10px;
                                ">Gold Rover</div>
                                <div class="rover-cost" style="
                                    color: #00BCD4;
                                    margin-bottom: 10px;
                                ">Cost: <span style="color: #FFCA28;">200</span> coins</div>
                                <div class="rover-owned" style="margin-bottom: 15px;">
                                    Owned: <span id="goldRoverAmount">0</span>
                                </div>
                                <button id="buyGoldRover" style="
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
                                ">Deploy</button>
                            </div>
                            <div class="rover-card" style="
                                width: 150px;
                                background: rgba(0, 0, 0, 0.5);
                                border: 1px solid #00BCD4;
                                border-radius: 8px;
                                padding: 15px;
                                box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                            ">
                                <div class="rover-image" style="
                                    height: 120px;
                                    background: url('Icons/iron_rover.webp') center/contain no-repeat;
                                    margin-bottom: 10px;
                                "></div>
                                <div class="rover-name" style="
                                    font-size: 18px;
                                    color: #FFD700;
                                    text-align: center;
                                    margin-bottom: 10px;
                                ">Iron Rover</div>
                                <div class="rover-cost" style="
                                    color: #00BCD4;
                                    margin-bottom: 10px;
                                ">Cost: <span style="color: #FFCA28;">100</span> coins</div>
                                <div class="rover-owned" style="margin-bottom: 15px;">
                                    Owned: <span id="ironRoverAmount">0</span>
                                </div>
                                <button id="buyIronRover" style="
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
                                ">Deploy</button>
                            </div>
                            <div class="rover-card" style="
                                width: 150px;
                                background: rgba(0, 0, 0, 0.5);
                                border: 1px solid #00BCD4;
                                border-radius: 8px;
                                padding: 15px;
                                box-shadow: 0 0 10px rgba(0, 188, 212, 0.3);
                            ">
                                <div class="rover-image" style="
                                    height: 120px;
                                    background: url('Icons/platinum_rover.webp') center/contain no-repeat;
                                    margin-bottom: 10px;
                                "></div>
                                <div class="rover-name" style="
                                    font-size: 18px;
                                    color: #FFD700;
                                    text-align: center;
                                    margin-bottom: 10px;
                                ">Platinum Rover</div>
                                <div class="rover-cost" style="
                                    color: #00BCD4;
                                    margin-bottom: 10px;
                                ">Cost: <span style="color: #FFCA28;">300</span> coins</div>
                                <div class="rover-owned" style="margin-bottom: 15px;">
                                    Owned: <span id="platinumRoverAmount">0</span>
                                </div>
                                <button id="buyPlatinumRover" style="
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
                                ">Deploy</button>
                            </div>
                        </div>
                    </div>
                    <div id="guardians-tab" style="display: none;">
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
                                    background: url('Icons/aerial_scout.webp') center/contain no-repeat;
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
                                    background: url('Icons/combat_sentinel.webp') center/contain no-repeat;
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
                                    background: url('Icons/flare_bomber.webp') center/contain no-repeat;
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
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button id="base-operations-close" style="
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
                <div id="base-operations-overlay" style="
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
        document.body.insertAdjacentHTML('beforeend', baseOperationsHTML);

        // Get DOM elements
        this.toggleBtn = document.getElementById('base-operations-toggle');
        this.popup = document.getElementById('base-operations-popup');
        this.overlay = document.getElementById('base-operations-overlay');
        this.closeBtn = document.getElementById('base-operations-close');
        this.roversTabBtn = document.getElementById('rovers-tab-btn');
        this.guardiansTabBtn = document.getElementById('guardians-tab-btn');
        this.roversTab = document.getElementById('rovers-tab');
        this.guardiansTab = document.getElementById('guardians-tab');
        this.buyGoldRoverBtn = document.getElementById('buyGoldRover');
        this.buyIronRoverBtn = document.getElementById('buyIronRover');
        this.buyPlatinumRoverBtn = document.getElementById('buyPlatinumRover');
        this.buyAerialScoutBtn = document.getElementById('buyAerialScout');
        this.buyCombatSentinelBtn = document.getElementById('buyCombatSentinel');
        this.buyFlareBomberBtn = document.getElementById('buyFlareBomber');

        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleBaseOperationsTab());
        this.closeBtn.addEventListener('click', () => this.toggleBaseOperationsTab(false));
        this.overlay.addEventListener('click', () => this.toggleBaseOperationsTab(false));
        this.roversTabBtn.addEventListener('click', () => this.switchTab('rovers'));
        this.guardiansTabBtn.addEventListener('click', () => this.switchTab('guardians'));
        this.buyGoldRoverBtn.addEventListener('click', () => this.purchaseRover('gold', 200));
        this.buyIronRoverBtn.addEventListener('click', () => this.purchaseRover('iron', 100));
        this.buyPlatinumRoverBtn.addEventListener('click', () => this.purchaseRover('platinum', 300));
        this.buyAerialScoutBtn.addEventListener('click', () => this.purchaseGuardian('aerial_scout', 500));
        this.buyCombatSentinelBtn.addEventListener('click', () => this.purchaseGuardian('combat_sentinel', 600));
        this.buyFlareBomberBtn.addEventListener('click', () => this.purchaseGuardian('flare_bomber', 700));

        // Initial tab state
        this.switchTab('rovers'); // Start with Rovers tab active
    }

    toggleBaseOperationsTab(show = true) {
        if (show) {
            this.popup.style.display = 'block';
            this.overlay.style.display = 'block';
        } else {
            this.popup.style.display = 'none';
            this.overlay.style.display = 'none';
        }
    }

    switchTab(tab) {
        if (tab === 'rovers') {
            this.roversTab.style.display = 'block';
            this.guardiansTab.style.display = 'none';
            this.roversTabBtn.style.background = 'linear-gradient(135deg, #00BCD4, #0288D1)';
            this.roversTabBtn.style.color = 'white';
            this.roversTabBtn.style.border = 'none';
            this.guardiansTabBtn.style.background = 'rgba(0, 188, 212, 0.2)';
            this.guardiansTabBtn.style.color = '#00BCD4';
            this.guardiansTabBtn.style.border = '1px solid #00BCD4';
        } else if (tab === 'guardians') {
            this.roversTab.style.display = 'none';
            this.guardiansTab.style.display = 'block';
            this.guardiansTabBtn.style.background = 'linear-gradient(135deg, #00BCD4, #0288D1)';
            this.guardiansTabBtn.style.color = 'white';
            this.guardiansTabBtn.style.border = 'none';
            this.roversTabBtn.style.background = 'rgba(0, 188, 212, 0.2)';
            this.roversTabBtn.style.color = '#00BCD4';
            this.roversTabBtn.style.border = '1px solid #00BCD4';
        }
    }

    setupSocketListeners() {
        // Rover updates
        this.socket.on('rover_update', (data) => {
            if (data.username === this.username) {
                this.updateRoverCounts(data.rovers);
            }
        });

        // Guardian updates
        this.socket.on('guardian_update', (data) => {
            if (data.username === this.username) {
                this.updateGuardianCounts(data.guardians);
            }
        });

        // Resource updates (to sync coins)
        this.socket.on('updateResources', ({ username, resources }) => {
            if (username === this.username) {
                this.userResources = resources;
            }
        });

        // Purchase errors
        this.socket.on('rover_purchase_error', (data) => {
            if (data.username === this.username) {
                alert(data.message);
            }
        });

        this.socket.on('guardian_purchase_error', (data) => {
            if (data.username === this.username) {
                alert(data.message);
            }
        });

        // Initial data responses
        this.socket.on('user_rovers', (data) => {
            if (data.username === this.username) {
                this.updateRoverCounts(data.rovers);
            }
        });

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
        // Fetch initial rover and guardian amounts and resources
        this.socket.emit('get_user_rovers', { username: this.username });
        this.socket.emit('get_user_guardians', { username: this.username });
        this.socket.emit('get_user_resources', { username: this.username });
    }

    purchaseRover(type, cost) {
        if (this.userResources && this.userResources.coins >= cost) {
            this.socket.emit('purchase_rover', { 
                username: this.username, 
                roverType: type, 
                cost: cost 
            });
            setTimeout(() => this.fetchInitialData(), 100); // Refetch to update UI
        } else {
            alert("Not enough coins!");
        }
    }

    purchaseGuardian(type, cost) {
        if (this.userResources && this.userResources.coins >= cost) {
            this.socket.emit('purchase_guardian', { 
                username: this.username, 
                guardianType: type, 
                cost: cost 
            });
            setTimeout(() => this.fetchInitialData(), 100); // Refetch to update UI
        } else {
            alert("Not enough coins!");
        }
    }

    updateRoverCounts(rovers) {
        document.getElementById('goldRoverAmount').textContent = rovers.goldrovers_amount || 0;
        document.getElementById('ironRoverAmount').textContent = rovers.ironrovers_amount || 0;
        document.getElementById('platinumRoverAmount').textContent = rovers.platinumrovers_amount || 0;
    }

    updateGuardianCounts(guardians) {
        document.getElementById('aerialScoutAmount').textContent = guardians.aerial_scout_amount || 0;
        document.getElementById('combatSentinelAmount').textContent = guardians.combat_sentinel_amount || 0;
        document.getElementById('flareBomberAmount').textContent = guardians.flare_bomber_amount || 0;
    }
}