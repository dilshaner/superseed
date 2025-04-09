// attack.js
export class AttackModule {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username;
        this.initAttackScene();
        this.setupSocketListeners();
        this.isAnimating = false; // Track animation state
    }

    initAttackScene() {
        // Remove any existing popup and overlay to prevent duplicates
        const existingPopup = document.querySelector('.attack-popup');
        const existingOverlay = document.querySelector('.attack-overlay');
        if (existingPopup) existingPopup.remove();
        if (existingOverlay) existingOverlay.remove();
    
        // Overlay setup with video background
        this.overlay = document.createElement('div');
        this.overlay.className = 'attack-overlay';
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: '1000',
            display: 'none',
            overflow: 'hidden'
        });
    
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        Object.assign(video.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            transform: 'translate(-50%, -50%)',
            zIndex: '-1',
            opacity: '1'
        });
        const source = document.createElement('source');
        source.setAttribute('src', 'https://media.tenor.com/2LH9uhmoizsAAAPo/swtor-the-old-republic.mp4');
        source.setAttribute('type', 'video/mp4');
        video.appendChild(source);
        this.overlay.appendChild(video);
    
        // Popup setup with attack interface
        this.popup = document.createElement('div');
        this.popup.className = 'attack-popup';
        Object.assign(this.popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.98), rgba(0, 0, 0, 0.9))',
            border: '2px solid #00BCD4',
            borderRadius: '8px',
            color: '#E0F7FA',
            fontFamily: "'Tomorrow', sans-serif",
            zIndex: '1001',
            display: 'none',
            boxShadow: '0 4px 20px rgba(0, 188, 212, 0.6)'
        });
    
        this.popup.innerHTML = `
            <div style="font-size: 24px; color: #00BCD4; text-align: center; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 8px rgba(0, 188, 212, 0.7);">
                Launch Attack
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: #FFD700; text-transform: uppercase; letter-spacing: 1px;">Target: </label>
                <span id="targetDisplay" style="color: #E0F7FA;">Selecting...</span>
            </div>
            <div id="guardianDisplay" style="margin-bottom: 15px; color: #00BCD4;"></div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="attackBtn" style="
                    padding: 8px 20px; 
                    background: linear-gradient(135deg, #dc3545, #a71d2a); 
                    color: #E0F7FA; 
                    border: 1px solid #00BCD4; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-family: 'Tomorrow', sans-serif; 
                    text-transform: uppercase; 
                    letter-spacing: 1.5px; 
                    box-shadow: 0 2px 8px rgba(0, 188, 212, 0.5); 
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                ">
                    Attack
                </button>
                <button id="searchAnotherBtn" style="
                    padding: 8px 20px; 
                    background: linear-gradient(135deg, #00BCD4, #0288D1); 
                    color: #E0F7FA; 
                    border: 1px solid #00BCD4; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-family: 'Tomorrow', sans-serif; 
                    text-transform: uppercase; 
                    letter-spacing: 1.5px; 
                    box-shadow: 0 2px 8px rgba(0, 188, 212, 0.5); 
                    transition: transform 0.3s ease, box-shadow 0.3s ease; 
                    display: flex; 
                    align-items: center; 
                    gap: 5px;
                ">
                    Search Another (50 <img src="Icons/coin.png" style="width: 16px; height: 16px; vertical-align: middle; filter: drop-shadow(0 0 3px #FFCA28);" alt="Coins">)
                </button>
            </div>
            <div id="battleResult" style="margin-top: 15px; text-align: center; display: none; color: #E0F7FA; text-transform: uppercase; letter-spacing: 1px;"></div>
        `;
    
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.popup);
    
        // Button hover effects
        const attackBtn = this.popup.querySelector('#attackBtn');
        const searchBtn = this.popup.querySelector('#searchAnotherBtn');
    
        attackBtn.addEventListener('mouseenter', () => {
            attackBtn.style.transform = 'scale(1.02)';
            attackBtn.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.7), inset 0 0 10px rgba(0, 188, 212, 0.3)';
        });
        attackBtn.addEventListener('mouseleave', () => {
            attackBtn.style.transform = 'scale(1)';
            attackBtn.style.boxShadow = '0 2px 8px rgba(0, 188, 212, 0.5)';
        });
    
        searchBtn.addEventListener('mouseenter', () => {
            searchBtn.style.transform = 'scale(1.02)';
            searchBtn.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.7), inset 0 0 10px rgba(0, 188, 212, 0.3)';
        });
        searchBtn.addEventListener('mouseleave', () => {
            searchBtn.style.transform = 'scale(1)';
            searchBtn.style.boxShadow = '0 2px 8px rgba(0, 188, 212, 0.5)';
        });
    
        // Initialize scene and fetch initial data
        setTimeout(() => {
            this.socket.emit('get_user_guardians', { username: this.username });
            this.socket.emit('get_all_users', { requester: this.username });
            this.openScene();
        }, 100);
    
        this.overlay.addEventListener('click', () => this.closeScene());
        document.getElementById('attackBtn').addEventListener('click', () => this.startAttack());
        document.getElementById('searchAnotherBtn').addEventListener('click', () => this.handleSearchAnother());
    }

    setupSocketListeners() {
        this.socket.on('user_guardians', (data) => {
            if (data.username === this.username) {
                this.displayGuardians(data.guardians);
            }
        });
    
        this.socket.on('all_users', (data) => {
            if (!data) {
                alert('Failed to load targets. Please try again.');
                return;
            }
            if (!data.users || !Array.isArray(data.users)) {
                alert('Failed to load targets. Please try again.');
                return;
            }
            this.users = data.users; // Store users for later use
            this.selectRandomTarget(data.users);
        });
    
        this.socket.on('attack_result', (data) => {
            this.showBattleResult(data);
        });
    
        this.socket.on('search_fee_result', (data) => {
            if (data.success) {
                this.selectRandomTarget(this.users);
            } else {
                alert(data.message);
            }
        });
    
        this.socket.on('updateResources', (data) => {
            if (data.username === this.username) {
                this.userResources = data.resources;
            }
        });
    }

    displayGuardians(guardians) {
        const display = document.getElementById('guardianDisplay');
        display.innerHTML = `
            Your Guardians:<br>
            Aerial Scouts: ${guardians.aerial_scout_amount} (Attack: 45)<br>
            Combat Sentinels: ${guardians.combat_sentinel_amount} (Attack: 70)<br>
            Flare Bombers: ${guardians.flare_bomber_amount} (Attack: 85)
        `;
    }

    selectRandomTarget(users) {
        if (!users || !Array.isArray(users)) {
            alert('Failed to select a target. Please try again.');
            this.closeScene();
            return;
        }
        const filteredUsers = users.filter(user => user.username !== this.username);
        if (filteredUsers.length === 0) {
            alert('No other users available to attack!');
            this.closeScene();
            return;
        }
        const targetDisplay = document.getElementById('targetDisplay');
        let i = 0;
        const scan = setInterval(() => {
            targetDisplay.textContent = filteredUsers[i % filteredUsers.length].username;
            i++;
        }, 200);
        setTimeout(() => {
            clearInterval(scan);
            const randomIndex = Math.floor(Math.random() * filteredUsers.length);
            this.target = filteredUsers[randomIndex].username;
            targetDisplay.textContent = this.target;
        }, 1000);
    }

    handleSearchAnother() {
        if (this.userResources && this.userResources.coins < 50) {
            alert('Not enough coins! Searching for another target costs 50 coins.');
            return;
        }
        this.socket.emit('deduct_search_fee', { username: this.username });
    }

    async startAttack() {
        if (!this.target) {
            alert('No target selected! Please try again.');
            return;
        }
        if (this.userResources && this.userResources.coins < 50) {
            alert('Not enough coins! Attack costs 50 coins.');
            return;
        }

        this.socket.emit('attack_user', { attacker: this.username, target: this.target });
        document.getElementById('battleResult').innerHTML = 'Battle in progress...';
        document.getElementById('battleResult').style.display = 'block';
        await this.animateBattle(); // Wait for animation to finish
    }

    animateBattle() {
        return new Promise((resolve) => {
            const resultDiv = document.getElementById('battleResult');
            resultDiv.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'scale(0.9)';

            const battlePhrases = [
                'Engaging enemy defenses...',
                'Blasters firing at full power...',
                'Shields holding—barely...',
                'Launching orbital strike...',
                'Enemy forces counterattacking...',
            ];
            let frame = 0;

            this.isAnimating = true; // Set flag
            const animation = setInterval(() => {
                frame++;
                const phrase = battlePhrases[frame % battlePhrases.length];
                resultDiv.innerHTML = `<span style="color: #FF5722; text-shadow: 0 0 5px #FF5722;">${phrase}</span>`;
                resultDiv.style.opacity = '1';
                resultDiv.style.transform = 'scale(1)';

                if (frame >= 10) {
                    clearInterval(animation);
                    resultDiv.innerHTML = '<span style="color: #00BCD4; text-shadow: 0 0 5px #00BCD4;">Combat resolved. Awaiting results...</span>';
                    this.isAnimating = false; // Clear flag
                    resolve(); // Resolve promise
                }
            }, 400);
        });
    }

    showBattleResult(data) {
        const resultDiv = document.getElementById('battleResult');
        if (!resultDiv) {
            console.error('battleResult element not found!');
            return;
        }

        const displayResult = () => {
            const isVictory = data.winner === this.username;
            resultDiv.style.display = 'block';
            resultDiv.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'translateY(20px)';

            const title = isVictory
                ? '<span style="color: #00BCD4; font-size: 28px; text-shadow: 0 0 10px #00BCD4;">Glorious Victory!</span>'
                : '<span style="color: #FF5722; font-size: 28px; text-shadow: 0 0 10px #FF5722;">Crushing Defeat!</span>';
            const message = isVictory
                ? `Commander ${this.username}, you’ve obliterated ${this.target}!`
                : `Your forces were annihilated by ${data.winner}. Retreat and regroup!`;

            resultDiv.innerHTML = `
                ${title}<br>
                <span style="font-size: 16px; color: #E0F7FA;">${message}</span><br>
                <span style="color: #FFD700; text-shadow: 0 0 5px #FFD700;">Spoils of War:</span><br>
                <span style="color: #FFD700;">${data.resourcesGained || 0} Total Value</span><br>
                <span style="color: #FFD700;">+${data.resourcesGainedGold || 0} Gold Ore</span><br>
                <span style="color: #E0F7FA;">+${data.resourcesGainedPlatinum || 0} Platinum Alloy</span><br>
                <span style="color: #B0BEC5;">+${data.resourcesGainedIron || 0} Iron Scrap</span><br>
                <span style="color: #FFCA28;">+${data.resourcesGainedCoins || 0} Galactic Credits</span>
            `;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    resultDiv.style.opacity = '1';
                    resultDiv.style.transform = 'translateY(0)';
                }, 100);
            });

            setTimeout(() => {
                resultDiv.style.opacity = '0';
                setTimeout(() => {
                    this.closeScene();
                    resultDiv.style.display = 'none';
                }, 500);
            }, 10000);
        };

        // Wait for animation to finish if it’s still running
        if (this.isAnimating) {
            const checkAnimation = setInterval(() => {
                if (!this.isAnimating) {
                    clearInterval(checkAnimation);
                    displayResult();
                }
            }, 100);
        } else {
            displayResult();
        }
    }

    closeScene() {
        this.popup.style.display = 'none';
        this.overlay.style.display = 'none';
        document.getElementById('battleResult').style.display = 'none';
    }

    openScene() {
        this.popup.style.display = 'block';
        this.overlay.style.display = 'block';
    }
}