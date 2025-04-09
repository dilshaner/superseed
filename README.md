# Superseed Odyssey

![Superseed Odyssey Banner](https://superseed-odyssey.dilshaner.com/Assets/Intro/odyssey.jpeg) <!-- Replace with an actual banner image URL if available -->

## Project Overview

This project is a web-based game built with Three.js and Socket.IO, allowing users to explore a Martian landscape, mine resources, manage loans, participate in auctions, and engage in strategic attacks. The game features a real-time, multiplayer environment with dynamic UI elements and persistent data storage using SQLite.

## Features and Functionality

*   **3D Martian Environment:** A procedurally generated Martian landscape with craters, resources (gold, platinum, iron), and low-poly terrain.
*   **Resource Mining:** Rovers can be deployed to mine resources, which are then collected and displayed in the Resource Matrix.
*   **Loan Management:** A "Superseed Tree Vault" allows users to take out loans using resources as collateral, with different loan types (Normal and Supercollateral).
*   **Auction System:** Users can bid on "Superseeds" in a real-time auction system.
*   **Base Operations:** A base operations tab allows users to deploy rovers and recruit guardians.
*   **Attacks:** Players can attack other players to steal resources.
*   **Leaderboard:**  A leaderboard tracks player progress based on resource scores, coin scores, loan activity, and auction participation. Superseed holdings can boost the players rank.
*   **Real-Time Chat:** A chatbox enables communication between players.
*   **Authentication:** Secure user signup and login functionality.
*   **Resource Matrix:** An on-screen display of the player's resources including Gold, Platinum, Iron and Coins.

## Technology Stack

*   **Frontend:**
    *   Three.js: 3D rendering library.
    *   Socket.IO: Real-time communication.
    *   HTML
    *   CSS
    *   JavaScript

*   **Backend:**
    *   Node.js: JavaScript runtime environment.
    *   Express: Web application framework.
    *   Socket.IO: Real-time communication.
    *   sqlite3: SQLite database for user data persistence.
    *   bcrypt: Password hashing.

## Prerequisites

*   Node.js (v14 or higher)
*   npm (Node Package Manager)
*   A web browser that supports WebGL

## Installation Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/dilshaner/superseed
    cd superseed
    ```

2.  **Install backend dependencies:**

    ```bash
    npm install
    ```

3.  **Run the server:**

    ```bash
    node server.js
    ```

4.  **Open the client in your web browser:** Navigate to `http://localhost:3000/` in your browser.

## Usage Guide

1.  **Access the game:** Open your web browser and go to `http://localhost:3000/`.
2.  **Sign up or log in:** Use the authentication form to create a new account or log in with an existing one.
3.  **Explore the Martian landscape:** Use mouse controls to navigate the 3D environment.
4.  **Mine resources:** The rovers you deploy will mine resources automatically. Their frequency can be modified in the Base Ops tab.
5.  **Manage loans:** Click on the superseed tree to open the superseed tree vault to review you vault balance, amount of superseeds and open the Loan & Repay tab.
6.  **Participate in auctions:** Open the superseed tree vault and choose auction tab, and bid on Superseeds to increase your leaderboard ranking.
7.  **Recruit Guardians:** Open the Base Camp tab to recruit Guardians for base defense and attack.
8.  **Chat with other players:** Use the chatbox at the bottom of the screen to communicate with other players.

## API Documentation

### Socket.IO Events

The game uses Socket.IO for real-time communication between the client and server. Here are some of the key events:

*   **`chat_message`**: Sends and receives chat messages.
    *   Emitted by client: `{ username: string, text: string }`
    *   Emitted by server: `{ username: string, text: string }`
*   **`mineResource`**: Requests mining of a resource.
    *   Emitted by client: `{ username: string, resourceType: string, amount: number }`
    *   Emitted by server: `mineResourceResponse`
*   **`mineResourceResponse`**: Response to a mining request.
    *   Emitted by server: `{ success: boolean, resources: object }`
*   **`getUserData`**: Requests user data.
    *   Emitted by client: `{ username: string }`
    *   Emitted by server: `userData`
*   **`userData`**: User data response.
    *   Emitted by server: `{ success: boolean, resources: object, loans: array, Vault: number }`
*   **`updateUserData`**: Updates user data.
    *   Emitted by client: `{ username: string, resources: object, loans: array }`
    *   Emitted by server: `updateUserDataResponse`
*   **`updateUserDataResponse`**: Response to user data update.
    *   Emitted by server: `{ success: boolean }`
*   **`updateResources`**: Requests an update to the user's resources.
     *   Emitted by client: `{ username: string, resources: object }`
    *   Emitted by server: Updates the client when resource values change and emits `{ username: string, resources: object }` to all clients.
*   **`getVaultBalance`**: Requests a user's Vault balance.
    *   Emitted by client: `{username: string}`
    *   Emitted by server: `vaultBalance`
*   **`vaultBalance`**: The Vault balance of a user.
    *   Emitted by server: `{ balance: number}`
*   **`addToVault`**: Adds to a user's Vault.
     *   Emitted by client: `{ username: string, amount: number }`
*   **`deductFromVault`**: Deducts from a user's Vault.
     *   Emitted by client: `{ username: string, amount: number }`
*   **`get_auction_results`**: Requests recent auction results.
    *   Emitted by client: none
    *   Emitted by server: `auction_results`
*   **`auction_results`**: Returns recent auction results.
    *   Emitted by server: `[{ winner: string, superseeds: number, winningBid: number, date: string }]`
*    **`get_user_guardians`**: Retrieves user's guardian counts.
    *   Emitted by client: `{username: string}`
    *    Emitted by server: `user_guardians`

*   **`user_guardians`**: Emits user's guardian counts.
      *   Emitted by server: `{ username: string, guardians: { aerial_scout_amount: number, combat_sentinel_amount: number, flare_bomber_amount: number } }`
*   **`purchase_guardian`**: Purchase guardians from the Base Camp.
       *   Emitted by client: `{ username: string, guardianType: string, cost: number }`

*   **`purchase_rover`**: Emitted to purchase rovers.
      *   Emitted by client: `{ username: string, roverType: string, cost: number }`

*  **`get_user_rovers`**: Requests rover count for a specific user.
    *    Emitted by client: `{ username: string }`

* **`user_rovers`**: Emitted when a rover count request is resolved
    *   Emitted by server: `{ username: string, rovers: object }`

*   **`deduct_attack_fee`**: Deducts attack fee from user.
       *   Emitted by client: `{ username: string }`

*  **`get_all_users`**: Get list of all users.
       *   Emitted by client: `{ requester: string }`

*   **`attack_user`**: Emitted to attack a user.
        *   Emitted by client: `{ attacker: string, target: string }`

*   **`top_users`**: Leaderboard top 10.
     *   Emitted by server: `[{ rank: number, username: string, score: number, boosted: boolean, boostAmount: string }]`
*  **`deduct_search_fee`**: Deducts the search fee for a new target.
    *  Emitted by client: `{ username: string }`
*  **`update_ranking`**: Update's the leaderboard ranking of player.
     *  Emitted by client: `{ username: string, activityData: object }`

## Contributing Guidelines

Contributions are welcome! To contribute to the project, follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes.
4.  Test your changes thoroughly.
5.  Submit a pull request.

## License Information

License not specified. All rights reserved.

## Contact/Support Information

For support or inquiries, contact [dilshaner@zohomail.com].
