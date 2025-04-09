//leaderboard.js

export class Leaderboard {
  constructor(socket) {
    this.socket = socket;
    this.topUsers = [];
    this.loggedInUserData = null; // To store logged-in user's rank, score, etc.
    this.initUI();
    this.setupSocketEvents();
  }

  initUI() {
    // Create leaderboard wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'leaderboard-wrapper';
    Object.assign(this.wrapper.style, {
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: '100',
    });

    // Create logged-in user info section
    this.userInfo = document.createElement('div');
    Object.assign(this.userInfo.style, {
      background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))',
      border: '1px solid #00BCD4',
      borderRadius: '8px',
      padding: '10px',
      color: '#E0F7FA',
      fontFamily: "'Tomorrow', sans-serif",
      marginBottom: '5px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    });
    this.wrapper.appendChild(this.userInfo);

    // Create toggle button for top 10 list
    this.toggleButton = document.createElement('button');
    Object.assign(this.toggleButton.style, {
      padding: '8px 16px',
      background: 'linear-gradient(135deg, #00BCD4, #007bff)',
      border: 'none',
      color: '#E0F7FA',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: '600',
      fontSize: '14px',
      textTransform: 'uppercase',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      width: '100%',
    });
    this.toggleButton.textContent = 'Top 10 Leaderboard ▼';
    this.wrapper.appendChild(this.toggleButton);

    // Create leaderboard container for top 10 list
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      display: 'none', // Hidden by default
      background: 'linear-gradient(135deg, rgba(10, 25, 47, 0.95), rgba(0, 0, 0, 0.85))',
      border: '1px solid #00BCD4',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0, 188, 212, 0.5), inset 0 0 8px rgba(0, 188, 212, 0.2)',
      padding: '10px',
      width: '300px',
      maxHeight: '400px',
      overflowY: 'auto',
      color: '#E0F7FA',
      fontFamily: "'Tomorrow', sans-serif",
      transition: 'opacity 0.3s ease',
      marginTop: '5px',
    });
    this.wrapper.appendChild(this.container);

    // Toggle visibility on click
    this.toggleButton.addEventListener('click', () => {
      const isVisible = this.container.style.display === 'block';
      this.container.style.display = isVisible ? 'none' : 'block';
      this.toggleButton.textContent = `Top 10 Leaderboard ${isVisible ? '▼' : '▲'}`;
      if (!isVisible) {
        this.socket.emit('get_top_users'); // Fetch leaderboard when opened
      }
    });

    // Hover effect for toggle button
    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.transform = 'translateY(-2px)';
      this.toggleButton.style.boxShadow = '0 4px 15px rgba(0, 188, 212, 0.5)';
    });
    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.transform = 'translateY(0)';
      this.toggleButton.style.boxShadow = 'none';
    });

    document.body.appendChild(this.wrapper);
    this.updateUI();
  }

  setupSocketEvents() {
    this.socket.on('top_users', (users) => {
      this.topUsers = users;
      // Find the logged-in user's data in the top users list
      const loggedInUser = JSON.parse(sessionStorage.getItem('user')) || { username: '' };
      this.loggedInUserData = this.topUsers.find(user => user.username === loggedInUser.username) || {
        rank: 'N/A',
        score: '0',
        username: loggedInUser.username || 'Guest',
      };
      this.updateUI();
    });

    this.socket.on('leaderboard_error', (message) => {
      console.error('Leaderboard error:', message);
      this.topUsers = [];
      this.loggedInUserData = null;
      this.updateUI();
    });
  }

  // Helper function to format scores (e.g., 1000 = 1K, 1000000 = 1M, 1000000000 = 1B)
  formatScore(score) {
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return '0';
    if (numScore >= 1_000_000_000) {
      return (numScore / 1_000_000_000).toFixed(1) + 'B';
    } else if (numScore >= 1_000_000) {
      return (numScore / 1_000_000).toFixed(1) + 'M';
    } else if (numScore >= 1_000) {
      return (numScore / 1_000).toFixed(1) + 'K';
    }
    return numScore.toFixed(0);
  }

  updateUI() {
    // Get logged-in user from sessionStorage
    const loggedInUser = JSON.parse(sessionStorage.getItem('user')) || { username: '' };

    // Update logged-in user info
    this.userInfo.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span style="font-size: 14px; color: #FFD700; font-weight: 600;">
          ${this.loggedInUserData ? this.loggedInUserData.rank : 'N/A'}
        </span>
        <span style="font-size: 14px; flex: 1; margin-left: 10px;">
          ${loggedInUser.username || 'Guest'}
        </span>
        <span style="font-size: 14px; color: #FFD700;">
          ${this.loggedInUserData ? this.formatScore(this.loggedInUserData.score) : '0'}
        </span>
      </div>
    `;

    // Update top 10 leaderboard list
    this.container.innerHTML = `
      <div style="
        font-size: 18px; 
        color: #00BCD4; 
        margin-bottom: 15px; 
        text-transform: uppercase; 
        letter-spacing: 1.5px;
        text-shadow: 0 0 5px rgba(0, 188, 212, 0.7);
        text-align: center;
      ">Top 10 Leaderboard</div>
      <ul style="
        list-style: none;
        padding: 0;
        margin: 0;
      ">
        ${this.topUsers.length ? this.topUsers.map(user => `
          <li style="
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background: ${user.username === loggedInUser.username ? 'rgba(0, 188, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
            border-bottom: 1px solid rgba(0, 188, 212, 0.3);
            font-size: 14px;
            font-weight: ${user.username === loggedInUser.username ? '600' : '400'};
          ">
            <span style="color: #FFD700; font-weight: 600;">${user.rank}</span>
            <span style="flex: 1; margin-left: 10px;">${user.username}</span>
            <span style="color: #FFD700;">${this.formatScore(user.score)}</span>
            <span style="margin-left: 10px; color: #00BCD4;">${user.boosted ? 'Boosted' : 'Not Boosted'}</span>
            <span style="margin-left: 5px; color: #FFD700;">${user.boosted ? user.boostAmount : ''}</span>
          </li>
        `).join('') : `
          <li style="
            padding: 5px 10px;
            font-size: 14px;
            text-align: center;
          ">No rankings yet</li>
        `}
      </ul>
    `;
  }
}