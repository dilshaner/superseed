// chatbox.js
const chatboxHTML = `
    <div id="chatbox-container" style="position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 1000;">
        <button id="chatbox-toggle" style="
            font-size: 18px; 
            color: #00BCD4; 
            background: linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85)); 
            border: 1px solid #00BCD4; 
            padding: 10px 20px; 
            border-radius: 5px 5px 0 0; 
            cursor: pointer; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            text-shadow: 0 0 5px rgba(0, 188, 212, 0.7); 
            font-family: 'Tomorrow', sans-serif; 
            box-shadow: 0 2px 8px rgba(0, 188, 212, 0.5);
        ">
            CHAT BOX ↓
        </button>
        <div id="chatbox" style="
            display: none; 
            width: 400px; 
            max-height: 0;
            background: linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85)); 
            border: 1px solid #00BCD4; 
            border-top: none; 
            border-radius: 0 0 8px 8px; 
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.5); 
            flex-direction: column; 
            transition: max-height 0.3s ease; 
            overflow: hidden;
        ">
            <div id="chatbox-messages" style="
                flex: 1; 
                overflow-y: auto; 
                padding: 10px; 
                color: #00BCD4; 
                font-family: 'Tomorrow', sans-serif; 
                font-size: 14px; 
                text-shadow: 0 0 3px rgba(0, 188, 212, 0.5);
                min-height: 300px;
            "></div>
            <div style="padding: 10px; border-top: 1px solid #00BCD4;">
                <input id="chatbox-input" type="text" placeholder="Type a message..." style="
                    width: 70%; 
                    padding: 5px; 
                    margin-right: 5px; 
                    background: rgba(0, 0, 0, 0.5); 
                    border: 1px solid #00BCD4; 
                    color: #00BCD4; 
                    border-radius: 4px; 
                    font-family: 'Tomorrow', sans-serif; 
                    text-shadow: 0 0 3px rgba(0, 188, 212, 0.5);
                ">
                <button id="chatbox-send" style="
                    padding: 5px 10px; 
                    background: linear-gradient(135deg, #00BCD4, #007bff); 
                    color: #E0F7FA; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    font-family: 'Tomorrow', sans-serif; 
                    text-transform: uppercase; 
                    letter-spacing: 1.5px; 
                    box-shadow: 0 2px 8px rgba(0, 188, 212, 0.5);
                ">Send</button>
            </div>
        </div>
    </div>
`;

function initializeChatbox(socket, currentUsername) {
    // Add Tomorrow font if not already present
    if (!document.querySelector('link[href*="Tomorrow"]')) {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Tomorrow:wght@400;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    // Inject chatbox HTML
    document.body.insertAdjacentHTML('beforeend', chatboxHTML);

    // Get DOM elements
    const toggleBtn = document.getElementById('chatbox-toggle');
    const chatbox = document.getElementById('chatbox');
    const messagesDiv = document.getElementById('chatbox-messages');
    const input = document.getElementById('chatbox-input');
    const sendBtn = document.getElementById('chatbox-send');

    // Track messages to prevent duplicates
    const messageIds = new Set();
    let isChatOpen = false;

    // Load previous messages
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    storedMessages.forEach(msg => {
        const msgId = createMessageId(msg);
        if (!messageIds.has(msgId)) {
            appendMessage(msg.username, msg.text);
            messageIds.add(msgId);
        }
    });

    // Toggle chatbox
    toggleBtn.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatbox.style.display = 'flex';
            chatbox.style.maxHeight = '400px';
            toggleBtn.textContent = 'CHAT BOX ↑';
        } else {
            chatbox.style.maxHeight = '0';
            setTimeout(() => {
                chatbox.style.display = 'none';
                toggleBtn.textContent = 'CHAT BOX ↓';
            }, 300);
        }
    });

    // Message sending
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    // Socket message handling
    socket.on('chat_message', handleIncomingMessage);

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const timestamp = Date.now();
        const tempId = `temp_${timestamp}`;
        
        // Immediately show the message locally
        appendMessage(currentUsername, text, tempId);
        
        // Emit to server
        socket.emit('chat_message', {
            username: currentUsername,
            text,
            timestamp,
            tempId // Include tempId to identify this message later
        });

        input.value = '';
    }

    function handleIncomingMessage(data) {
        const msgId = createMessageId(data);
        
        // Check if this is our own temp message coming back
        const isOwnTempMessage = data.tempId && document.querySelector(`[data-temp-id="${data.tempId}"]`);
        
        if (!messageIds.has(msgId) && !isOwnTempMessage) {
            messageIds.add(msgId);
            appendMessage(data.username, data.text);
            saveMessage(data);
        }
        
        // If this is our temp message coming back, update it to permanent
        if (isOwnTempMessage) {
            const tempElement = document.querySelector(`[data-temp-id="${data.tempId}"]`);
            if (tempElement) {
                tempElement.removeAttribute('data-temp-id');
                tempElement.removeAttribute('data-temp');
            }
            saveMessage(data);
        }
    }

    function appendMessage(username, text, tempId = null) {
        const messageElement = document.createElement('div');
        
        if (tempId) {
            messageElement.setAttribute('data-temp-id', tempId);
            messageElement.setAttribute('data-temp', 'true');
        }
        
        if (username === currentUsername) {
            messageElement.innerHTML = `<span style="color: #FFD700; font-weight: 600;">&lt;You&gt;</span>: ${text}`;
        } else {
            messageElement.innerHTML = `<span style="color: #00BCD4; font-weight: 600;">&lt;${username}&gt;</span>: ${text}`;
        }
        
        messageElement.style.marginBottom = '10px';
        messageElement.style.wordBreak = 'break-word';
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function saveMessage(data) {
        const messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        const msgId = createMessageId(data);
        
        if (!messages.some(msg => createMessageId(msg) === msgId)) {
            messages.push({
                username: data.username,
                text: data.text,
                timestamp: data.timestamp || Date.now()
            });
            
            // Keep only the last 100 messages
            const recentMessages = messages.slice(-100);
            localStorage.setItem('chatMessages', JSON.stringify(recentMessages));
        }
    }

    function createMessageId(msg) {
        return `${msg.username}_${msg.timestamp}_${msg.text}`.slice(0, 200);
    }
}

export { initializeChatbox };