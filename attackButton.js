// attackButton.js
export class AttackButton {
    constructor(socket, username) {
        this.socket = socket;
        this.username = username;
        this.attackInstance = null;
        this.cooldownTime = 1 * 60 * 1000; // 10 minutes in milliseconds
        this.initButton();
        this.checkCooldown(); // Check cooldown on initialization
    }

    // Get cooldown time from cookie
    getCooldownCookie() {
        const name = `attackCooldown_${this.username}=`;
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                return parseInt(c.substring(name.length, c.length));
            }
        }
        return 0;
    }

    // Set cooldown cookie
    setCooldownCookie(expiryTime) {
        const expires = `expires=${new Date(expiryTime).toUTCString()}`;
        document.cookie = `attackCooldown_${this.username}=${expiryTime};${expires};path=/`;
    }

    // Update button state and show countdown
    updateButtonState(remainingTime) {
        if (remainingTime > 0) {
            this.button.disabled = true;
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            this.button.textContent = `Wait ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        } else {
            this.button.disabled = false;
            this.button.innerHTML = `
                Attack 50 
                <img src="Icons/coin.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px #FFCA28);" alt="Coins">
            `;
        }
    }

    // Check and manage cooldown
    checkCooldown() {
        const cooldownEnd = this.getCooldownCookie();
        const now = Date.now();

        if (cooldownEnd > now) {
            const remainingTime = cooldownEnd - now;
            this.updateButtonState(remainingTime);

            // Start countdown
            const countdown = setInterval(() => {
                const timeLeft = this.getCooldownCookie() - Date.now();
                if (timeLeft <= 0) {
                    clearInterval(countdown);
                    this.updateButtonState(0);
                } else {
                    this.updateButtonState(timeLeft);
                }
            }, 1000);
        }
    }

    initButton() {
        this.button = document.createElement('button');
        Object.assign(this.button.style, {
            position: 'absolute',
            bottom: '20px',
            left: '30px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))',
            color: '#E0F7FA',
            border: '1px solid #00BCD4',
            borderRadius: '4px',
            fontFamily: "'Tomorrow', sans-serif",
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });

        this.button.innerHTML = `
            Attack 50 
            <img src="Icons/coin.png" style="width: 24px; height: 24px; filter: drop-shadow(0 0 3px #FFCA28);" alt="Coins">
        `;

        this.button.addEventListener('mouseenter', () => {
            if (!this.button.disabled) {
                this.button.style.transform = 'scale(1.02)';
                this.button.style.boxShadow = '0 6px 20px rgba(0, 188, 212, 0.7), inset 0 0 10px rgba(0, 188, 212, 0.3)';
            }
        });
        this.button.addEventListener('mouseleave', () => {
            if (!this.button.disabled) {
                this.button.style.transform = 'scale(1)';
                this.button.style.boxShadow = '0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)';
            }
        });

        this.button.addEventListener('click', () => {
            if (!this.button.disabled) {
                console.log('Attack button clicked, emitting deduct_attack_fee');
                this.socket.emit('deduct_attack_fee', { username: this.username });
            }
        });

        this.socket.off('attack_fee_result');
        this.socket.on('attack_fee_result', (data) => {
            console.log('Received attack_fee_result:', data);
            if (data.success) {
                // Set cooldown
                const expiryTime = Date.now() + this.cooldownTime;
                this.setCooldownCookie(expiryTime);
                this.checkCooldown();

                // Close any existing attack popup
                if (this.attackInstance) {
                    console.log('Closing existing attack popup');
                    this.attackInstance.closeScene();
                }
                import('./attack.js')
                    .then(({ AttackModule }) => {
                        this.attackInstance = new AttackModule(this.socket, this.username);
                        console.log('Attack module loaded:', this.attackInstance);
                    })
                    .catch(error => {
                        console.error('Failed to load attack.js:', error);
                    });
            } else {
                alert(data.message);
            }
        });

        document.body.appendChild(this.button);
    }
}