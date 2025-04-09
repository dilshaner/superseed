// login.js
function createAuthForm() {
    console.log('Creating auth form...');

    // Full-page container
    const fullPageContainer = document.createElement("div");
    fullPageContainer.style.position = "fixed";
    fullPageContainer.style.top = "0";
    fullPageContainer.style.left = "0";
    fullPageContainer.style.width = "100vw";
    fullPageContainer.style.height = "100vh";
    fullPageContainer.style.backgroundImage = "url('Assets/Intro/odyssey.jpeg')"; // Replace with your image path
    fullPageContainer.style.backgroundSize = "cover";
    fullPageContainer.style.backgroundPosition = "center";
    fullPageContainer.style.backgroundRepeat = "no-repeat";
    fullPageContainer.style.overflow = "hidden";
    fullPageContainer.style.zIndex = "0";

    // Authentication container (themed to match dialogBox)
    const authContainer = document.createElement("div");
    authContainer.id = "auth-container";
    authContainer.style.position = "absolute";
    authContainer.style.top = "25%";
    authContainer.style.left = "85%";
    authContainer.style.transform = "translate(-50%, -50%)";
    authContainer.style.color = "#E0F7FA";
    authContainer.style.fontFamily = "'Lexend', sans-serif";
    authContainer.style.fontSize = "16px";
    authContainer.style.background = "linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))";
    authContainer.style.padding = "20px";
    authContainer.style.border = "1px solid #00BCD4";
    authContainer.style.borderRadius = "8px";
    authContainer.style.boxShadow = "0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)";
    authContainer.style.zIndex = "1000";
    authContainer.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    authContainer.style.width = "clamp(300px, 40vw, 350px)";
    authContainer.style.textAlign = "center";

    authContainer.innerHTML = `
        <h1 style="margin-bottom: 20px; font-size: 24px;">Sign Up / Login</h1>
        <form id="auth-form">
            <input type="text" id="username" placeholder="Username" required style="
                width: 80%;
                padding: 10px;
                margin-bottom: 15px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #00BCD4;
                border-radius: 4px;
                color: #E0F7FA;
                font-family: 'Lexend', sans-serif;
                font-size: 16px;
            "><br>
            <input type="password" id="password" placeholder="Password" required style="
                width: 80%;
                padding: 10px;
                margin-bottom: 15px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #00BCD4;
                border-radius: 4px;
                color: #E0F7FA;
                font-family: 'Lexend', sans-serif;
                font-size: 16px;
            "><br>
            <button type="submit" id="signup-btn" style="
                padding: 10px 20px;
                margin: 5px;
                background: linear-gradient(135deg, #00BCD4, #0288D1);
                border: none;
                border-radius: 4px;
                color: #fff;
                font-family: 'Lexend', sans-serif;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">Sign Up</button>
            <button type="submit" id="login-btn" style="
                padding: 10px 20px;
                margin: 5px;
                background: linear-gradient(135deg, #00BCD4, #0288D1);
                border: none;
                border-radius: 4px;
                color: #fff;
                font-family: 'Lexend', sans-serif;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            ">Login</button><br><br>
            <div id="error-message" style="color: #FF6E6E; font-size: 14px;"></div>
            <p style="color: #B0BEC5; font-size: 14px; margin-top: 10px;">Once lost, passwords cannot be recovered.</p>
            <p style="color: #B0BEC5; font-size: 14px; margin-top: 2px;">* Note: Use your Discord username as your game username.</p>
        </form>
    `;

    // Append fullPageContainer to body, then authContainer to fullPageContainer
    document.body.appendChild(fullPageContainer);
    fullPageContainer.appendChild(authContainer);

    const authForm = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    const socket = io('https://superseed-odyssey.dilshaner.com/');

    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            displayErrorMessage('Username and password are required.');
            return;
        }

        const submitter = event.submitter.id;
        const endpoint = submitter === 'signup-btn' ? '/api/auth/signup' : '/api/auth/login';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                if (submitter === 'signup-btn') {
                    displayErrorMessage('Account created successfully. Please log in.', 'green');
                } else {
                    sessionStorage.setItem('user', JSON.stringify(result.user));
                    clearLoginForm(); // Clear the form first
                    loadMainScript(username); // Then load the main script
                }
            } else {
                displayErrorMessage(result.message || 'An error occurred.');
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            displayErrorMessage('An unexpected error occurred.');
        }
    });

    function displayErrorMessage(message, color = 'red') {
        errorMessage.textContent = message;
        errorMessage.style.color = color;
        setTimeout(() => {
            errorMessage.textContent = '';
        }, 5000);
    }

    function clearLoginForm() {
        console.log('Clearing login form...');
        // Remove the entire fullPageContainer instead of just authContainer
        if (fullPageContainer && fullPageContainer.parentNode) {
            fullPageContainer.parentNode.removeChild(fullPageContainer);
        }
    }
}

function loadMainScript(username) {
    console.log('Loading main.js...');

    const mainScript = document.createElement('script');
    mainScript.type = 'module';
    mainScript.src = './main.js'; // Load the script file directly
    mainScript.onload = () => {
        // Ensure initGame is called after the script loads
        import('./main.js').then(module => {
            module.initGame(username);
        }).catch(err => console.error('Error initializing game:', err));
    };
    mainScript.onerror = () => console.error('Failed to load main.js');
    document.body.appendChild(mainScript);
}

createAuthForm();