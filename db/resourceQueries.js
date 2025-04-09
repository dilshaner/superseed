// db/resourceQueries.js
async function deductCoins(playerId, amount) {
    try {
        // Simulate fetching the player's data from the database
        const playerData = await fetchPlayerData(playerId);

        if (playerData.coins < amount) {
            throw new Error('Not enough coins');
        }

        // Deduct coins
        playerData.coins -= amount;

        // Simulate updating the database
        await updatePlayerData(playerId, playerData);

        return playerData.coins; // Return the updated coin balance
    } catch (error) {
        console.error(error.message);
        throw error; // Re-throw the error for handling in main.js
    }
}

// Mock database functions (replace with actual database queries)
async function fetchPlayerData(playerId) {
    // Example database entry
    const mockDatabase = {
        "player1": { platinum: 0, iron: 0, gold: 100, coins: 50 }
    };
    return mockDatabase[playerId];
}

async function updatePlayerData(playerId, newData) {
    // Simulate updating the database
    console.log(`Updated player ${playerId} data:`, newData);
}

export { deductCoins };