// socketRoutes.js

const { db, getUserByUsername, updateUser, createUser, addToVault, deductFromVault, getVaultBalance } = require("../db/db");
const { AuctionSystem } = require("../auction.js");
const { initializeLeaderboardServer } = require('../leaderboardServer.js');

// Global interest pool and singletons
let interestPool = 0;
let auctionSystem = null;
let leaderboardServer = null;

// Global Set to track processed Vault updates (shared across all instances)
const processedVaultUpdates = new Set();

// Flag to ensure setupSocketRoutes is only called once
let isSocketRoutesSetup = false; // Add this line to define the variable

function setupSocketRoutes(io) {
    if (isSocketRoutesSetup) {
        console.log('SocketRoutes: Already initialized, skipping setup');
        return;
    }
    isSocketRoutesSetup = true;

    if (auctionSystem) {
        console.log('SocketRoutes: Reusing existing AuctionSystem instance');
        auctionSystem.io = io;
    } else {
        console.log('SocketRoutes: Initializing new AuctionSystem');
        auctionSystem = new AuctionSystem(io);
        auctionSystem.interestPool = interestPool;
    }

    if (leaderboardServer) {
        console.log('SocketRoutes: Reusing existing LeaderboardServer instance');
        leaderboardServer.io = io;
    } else {
        console.log('SocketRoutes: Initializing new LeaderboardServer');
        leaderboardServer = initializeLeaderboardServer(io);
    }

    const defaultResources = { gold: 0, platinum: 0, iron: 0, coins: 0 };
    const defaultRovers = {
        GoldMiningRover: 0,
        PlatinumMiningRover: 0,
        IronMiningRover: 0,
    };

  io.on("connection", (socket) => {

    const getOrCreateUser = async (username) => {
      let user = await getUserByUsername(username);
      if (!user) {
        const newUser = {
          username,
          resources: { ...defaultResources, coins: 1000 },
          loans: [],
          roverCounts: { ...defaultRovers },
          Vault: 0
        };
        await createUser(newUser.username, "defaultPassword");
        return newUser;
      }
      return user;
    };

    socket.on("getRoverCounts", async ({ username }) => {
      try {
        const user = await getUserByUsername(username);
        if (!user) throw new Error("User not found");
        socket.emit("roverCounts", {
          goldrovers_amount: user.goldrovers_amount || 0,
          platinumrovers_amount: user.platinumrovers_amount || 0,
          ironrovers_amount: user.ironrovers_amount || 0
        });
      } catch (error) {
        console.error("Get rover counts error:", error);
        socket.emit("roverCounts", {
          goldrovers_amount: 0,
          platinumrovers_amount: 0,
          ironrovers_amount: 0,
          error: "Failed to fetch rover counts"
        });
      }
    });

    // Existing socket events
    socket.on("mineResource", async ({ username, resourceType, amount }) => {
      try {
        const user = await getOrCreateUser(username);
        const resources = { ...defaultResources, ...user.resources };

        resources[resourceType] = (resources[resourceType] || 0) + amount;
        await updateUser(username, {
          resources,
          loans: user.loans || [],
          Vault: user.Vault
        });

        socket.emit("mineResourceResponse", { success: true, resources });
        io.emit("updateResources", { username, resources });

        // Update leaderboard ranking after mining
        await leaderboardServer.updateRanking(username, { resources });
      } catch (error) {
        console.error("Mining error:", error);
        socket.emit("mineResourceResponse", {
          success: false,
          message: "Failed to mine resources",
        });
      }
    });

    socket.on("getUserData", async ({ username }) => {
      try {
        const user = await getUserByUsername(username);
        socket.emit("userData", {
          success: true,
          resources: { ...defaultResources, ...user.resources },
          loans: user.loans || [],
          roverCounts: { ...defaultRovers },
          Vault: user.Vault
        });
      } catch (error) {
        console.error("Get user data error:", error);
        socket.emit("userData", {
          success: false,
          message: "Failed to retrieve user data",
        });
      }
    });

    socket.on("updateUserData", async ({ username, resources, loans }) => {
      try {
        const user = await getUserByUsername(username);
        if (!user) throw new Error("User not found");

        await updateUser(username, {
          resources: { ...defaultResources, ...resources },
          loans: loans || [],
          Vault: user.Vault
        });

        socket.emit("updateUserDataResponse", { success: true });
        io.emit("updateResources", {
          username,
          resources: { ...defaultResources, ...resources },
        });

        // Update leaderboard ranking after updating user data
        await leaderboardServer.updateRanking(username, { resources });
      } catch (error) {
        console.error("Update user data error:", error);
        socket.emit("updateUserDataResponse", {
          success: false,
          message: "Failed to update user data",
        });
      }
    });

    socket.on("addToInterestPool", async ({ username, amount }) => {
      interestPool += amount;
      auctionSystem.interestPool = interestPool;
      console.log(
        `Added ${amount.toFixed(
          2
        )} to pool from ${username}. Total: ${interestPool.toFixed(2)}`
      );
    });

    socket.on("updateResources", async ({ username, resources }) => {
      try {
        const user = await getOrCreateUser(username);
        if (!user) throw new Error("User not found");

        const updatedResources = { ...defaultResources, ...resources };
        await updateUser(username, {
          resources: updatedResources,
          loans: user.loans || [],
          Vault: user.Vault
        });

        socket.emit("updateResourcesResponse", {
          success: true,
          resources: updatedResources,
        });
        io.emit("updateResources", { username, resources: updatedResources });

        // Update leaderboard ranking after updating resources
        await leaderboardServer.updateRanking(username, { resources: updatedResources });
      } catch (error) {
        console.error("Resource update error:", error);
        socket.emit("updateResourcesResponse", {
          success: false,
          message: "Failed to update resources",
        });
      }
    });

    socket.on("place_bid", async ({ username, bidAmount }) => {
      await auctionSystem.placeBid(username, bidAmount);
      // Update leaderboard ranking after placing a bid
      await leaderboardServer.updateRanking(username, { bids: 1 });
    });

    socket.on("get_auction_results", () => {
      socket.emit("auction_results", auctionSystem.getRecentResults());
    });

//=====intrestCalculation=======START================

socket.on("addToVault", async ({ username, amount, timestamp }) => {
  try {
      const updateKey = timestamp ? `${username}-${timestamp}` : `${username}-${amount}-${Date.now()}`;
      
      // Check if this update has already been processed globally
      if (processedVaultUpdates.has(updateKey)) {
          console.log(`Duplicate Vault update blocked for ${username}: ${amount}`);
          return;
      }

      // Process the Vault update
      await addToVault(username, amount);
      const user = await getUserByUsername(username);
      socket.emit("vaultUpdate", { success: true, Vault: user.Vault });

      // Mark this update as processed
      processedVaultUpdates.add(updateKey);

      // Clean up after 10 minutes to prevent memory leak
      setTimeout(() => {
          processedVaultUpdates.delete(updateKey);
      }, 10 * 60 * 1000);
  } catch (error) {
      console.error("Add to Vault error:", error);
      socket.emit("vaultUpdate", { success: false, message: error.message });
  }
});
    socket.on("getVaultBalance", async ({ username }) => {
      try {
        const balance = await getVaultBalance(username);
        socket.emit("vaultBalance", { balance });
      } catch (error) {
        console.error("Get Vault balance error:", error);
        socket.emit("vaultBalance", { balance: 0, error: error.message });
      }
    });

    socket.on("deductFromVault", async ({ username, amount }) => {
      try {
        await deductFromVault(username, amount);
        const user = await getUserByUsername(username);
        socket.emit("vaultDeductionResponse", { success: true, Vault: user.Vault });
      } catch (error) {
        console.error("Deduct from Vault error:", error);
        socket.emit("vaultDeductionResponse", { success: false, message: error.message });
      }
    });

  // START: Chat Functionality for socketRoutes.js
    socket.on("chat_message", (data) => {
      // Broadcast the message to all connected clients
      io.emit("chat_message", {
          username: data.username,
          text: data.text
      });
  });
  // END: Chat Functionality for socketRoutes.js

  // START: Base Operations Functionality for socketRoutes.js
socket.on('purchase_guardian', async ({ username, guardianType, cost }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');

      const resources = { ...defaultResources, ...user.resources };
      if (resources.coins < cost) {
          socket.emit('guardian_purchase_error', { username, message: 'Insufficient coins!' });
          return;
      }

      resources.coins -= cost;
      const guardians = {
          aerial_scout_amount: user.aerial_scout_amount || 0,
          combat_sentinel_amount: user.combat_sentinel_amount || 0,
          flare_bomber_amount: user.flare_bomber_amount || 0
      };

      // Increment the specific guardian by 1
      if (guardianType === 'aerial_scout') guardians.aerial_scout_amount += 1;
      else if (guardianType === 'combat_sentinel') guardians.combat_sentinel_amount += 1;
      else if (guardianType === 'flare_bomber') guardians.flare_bomber_amount += 1;
      else throw new Error('Invalid guardian type');

      // Include rover counts to ensure they persist in the update
      const rovers = {
          goldrovers_amount: user.goldrovers_amount || 0,
          platinumrovers_amount: user.platinumrovers_amount || 0,
          ironrovers_amount: user.ironrovers_amount || 0
      };

      console.log('Before update - User:', user);
      console.log('Guardians to update:', guardians);
      console.log('Resources to update:', resources);

      // Update the user in the database, ensuring all fields are included
      await updateUser(username, {
          resources,
          loans: user.loans || [],
          Vault: Number(user.Vault) || 0,
          aerial_scout_amount: guardians.aerial_scout_amount,
          combat_sentinel_amount: guardians.combat_sentinel_amount,
          flare_bomber_amount: guardians.flare_bomber_amount,
          goldrovers_amount: rovers.goldrovers_amount,
          platinumrovers_amount: rovers.platinumrovers_amount,
          ironrovers_amount: rovers.ironrovers_amount
      });

      const updatedUser = await getUserByUsername(username);
      console.log('After update - User:', updatedUser);

      // Emit updates to the client
      socket.emit('guardian_update', { username, guardians });
      io.emit('updateResources', { username, resources });
  } catch (error) {
      console.error('Guardian purchase error:', error.message);
      socket.emit('guardian_purchase_error', { username, message: error.message || 'Failed to purchase guardian' });
  }
});

socket.on('get_user_guardians', async ({ username }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');
      const guardians = {
          aerial_scout_amount: user.aerial_scout_amount || 0,
          combat_sentinel_amount: user.combat_sentinel_amount || 0,
          flare_bomber_amount: user.flare_bomber_amount || 0
      };
      socket.emit('user_guardians', { username, guardians });
  } catch (error) {
      console.error('Get guardians error:', error.message);
      socket.emit('guardian_error', { username, message: error.message || 'Failed to fetch guardians' });
  }
});

socket.on('get_user_resources', async ({ username }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');
      const resources = { ...defaultResources, ...user.resources };
      socket.emit('user_resources', { username, resources });
  } catch (error) {
      console.error('Get resources error:', error.message);
      socket.emit('resource_error', { username, message: error.message || 'Failed to fetch resources' });
  }
});
// END: Base Operations Functionality for socketRoutes.js

// START: Base Operations Functionality for socketRoutes.js (Rovers)

socket.on('purchase_rover', async ({ username, roverType, cost }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');

      const resources = { ...defaultResources, ...user.resources };
      if (resources.coins < cost) {
          socket.emit('rover_purchase_error', { username, message: 'Insufficient coins!' });
          return;
      }

      resources.coins -= cost;
      const rovers = {
          goldrovers_amount: user.goldrovers_amount || 0,
          platinumrovers_amount: user.platinumrovers_amount || 0,
          ironrovers_amount: user.ironrovers_amount || 0
      };

      if (roverType === 'gold') rovers.goldrovers_amount += 1;
      else if (roverType === 'iron') rovers.ironrovers_amount += 1;
      else if (roverType === 'platinum') rovers.platinumrovers_amount += 1;
      else throw new Error('Invalid rover type');

      await updateUser(username, {
          resources,
          loans: user.loans || [],
          Vault: Number(user.Vault) || 0,
          aerial_scout_amount: user.aerial_scout_amount,
          combat_sentinel_amount: user.combat_sentinel_amount,
          flare_bomber_amount: user.flare_bomber_amount,
          goldrovers_amount: rovers.goldrovers_amount,
          platinumrovers_amount: rovers.platinumrovers_amount,
          ironrovers_amount: rovers.ironrovers_amount
      });

      socket.emit('rover_update', { username, rovers });
      io.emit('updateResources', { username, resources });
  } catch (error) {
      console.error('Rover purchase error:', error.message);
      socket.emit('rover_purchase_error', { username, message: error.message || 'Failed to purchase rover' });
  }
});

socket.on('get_user_rovers', async ({ username }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');
      const rovers = {
          goldrovers_amount: user.goldrovers_amount || 0,
          platinumrovers_amount: user.platinumrovers_amount || 0,
          ironrovers_amount: user.ironrovers_amount || 0
      };
      socket.emit('user_rovers', { username, rovers });
  } catch (error) {
      console.error('Get rovers error:', error.message);
      socket.emit('rover_error', { username, message: error.message || 'Failed to fetch rovers' });
  }
});

// END: Base Operations Functionality for socketRoutes.js (Rovers)

// START: Attack Functionality for socketRoutes.js

socket.on('deduct_attack_fee', async ({ username }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');

      const resources = { ...defaultResources, ...user.resources };
      if (resources.coins < 50) {
          socket.emit('attack_fee_result', { success: false, message: 'Insufficient coins to initiate an attack!' });
          return;
      }

      resources.coins -= 50;

      await updateUser(username, {
          resources,
          loans: user.loans || [],
          Vault: Number(user.Vault) || 0,
          aerial_scout_amount: user.aerial_scout_amount,
          combat_sentinel_amount: user.combat_sentinel_amount,
          flare_bomber_amount: user.flare_bomber_amount
      });

      io.emit('updateResources', { username, resources });
      socket.emit('attack_fee_result', { success: true });
  } catch (error) {
      console.error('Attack fee deduction error:', error);
      socket.emit('attack_fee_result', { success: false, message: 'Failed to deduct attack fee' });
  }
});

socket.on('deduct_search_fee', async ({ username }) => {
  try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error('User not found');

      const resources = { ...defaultResources, ...user.resources };
      if (resources.coins < 50) {
          socket.emit('search_fee_result', { success: false, message: 'Insufficient coins to search for another target!' });
          return;
      }

      resources.coins -= 50;

      await updateUser(username, {
          resources,
          loans: user.loans || [],
          Vault: Number(user.Vault) || 0,
          aerial_scout_amount: user.aerial_scout_amount,
          combat_sentinel_amount: user.combat_sentinel_amount,
          flare_bomber_amount: user.flare_bomber_amount
      });

      io.emit('updateResources', { username, resources });
      socket.emit('search_fee_result', { success: true });
  } catch (error) {
      console.error('Search fee deduction error:', error);
      socket.emit('search_fee_result', { success: false, message: 'Failed to deduct search fee' });
  }
});



socket.on('get_all_users', async ({ requester }) => {
  try {
      const users = await new Promise((resolve, reject) => {
          db.all('SELECT username FROM users', [], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
          });
      });
      if (!Array.isArray(users)) {
          console.error('Fetched users is not an array:', users);
          socket.emit('all_users', { users: [] });
          return;
      }
      socket.emit('all_users', { users });
  } catch (error) {
      console.error('Error fetching users:', error);
      socket.emit('all_users', { users: [] }); // Fallback empty array
  }
});



socket.on('attack_user', async ({ attacker, target }) => {
  try {
      const attackerData = await getUserByUsername(attacker);
      const targetData = await getUserByUsername(target);
      if (!attackerData || !targetData) throw new Error('User not found');

      const attackerResources = { ...defaultResources, ...attackerData.resources };
      if (attackerResources.coins < 50) {
          socket.emit('attack_result', { winner: target, message: 'Attack failed: insufficient coins!' });
          return;
      }

      // Guardian stats from GuardiansStats.js
      const guardiansStats = require('../GuardiansStats.js');
      const calculatePower = (user) => {
          return (
              (user.aerial_scout_amount || 0) * guardiansStats.AerialScout.attack +
              (user.combat_sentinel_amount || 0) * guardiansStats.CombatSentinel.attack +
              (user.flare_bomber_amount || 0) * guardiansStats.FlareBomber.attack
          );
      };

      const attackerPower = calculatePower(attackerData);
      const targetPower = calculatePower(targetData);

      // Random factor (50-150% of base power)
      const randomFactor = () => 0.5 + Math.random();
      const attackerScore = attackerPower * randomFactor();
      const targetScore = targetPower * randomFactor();

      const winner = attackerScore > targetScore ? attacker : target;
      const loser = winner === attacker ? target : attacker;

      const loserData = winner === attacker ? targetData : attackerData;
      const winnerData = winner === attacker ? attackerData : targetData;
      const loserResources = { ...defaultResources, ...loserData.resources };
      const winnerResources = { ...defaultResources, ...winnerData.resources };

      // Calculate 10% of loser's resources
      const resourcesLost = {
          gold: Math.floor((loserResources.gold || 0) * 0.1),
          platinum: Math.floor((loserResources.platinum || 0) * 0.1),
          iron: Math.floor((loserResources.iron || 0) * 0.1),
          coins: Math.floor((loserResources.coins || 0) * 0.1)
      };

      // Deduct 10% from loser
      loserResources.gold = Math.max(0, (loserResources.gold || 0) - resourcesLost.gold);
      loserResources.platinum = Math.max(0, (loserResources.platinum || 0) - resourcesLost.platinum);
      loserResources.iron = Math.max(0, (loserResources.iron || 0) - resourcesLost.iron);
      loserResources.coins = Math.max(0, (loserResources.coins || 0) - resourcesLost.coins);

      // Add 10% to winner (after deducting attack cost from attacker)
      winnerResources.gold = (winnerResources.gold || 0) + resourcesLost.gold;
      winnerResources.platinum = (winnerResources.platinum || 0) + resourcesLost.platinum;
      winnerResources.iron = (winnerResources.iron || 0) + resourcesLost.iron;
      winnerResources.coins = (winnerResources.coins || 0) + resourcesLost.coins;

      // Deduct attack cost (50 coins) from attacker, regardless of win/loss
      attackerResources.coins -= 50;

      // Update both users
      if (winner === attacker) {
          // Attacker wins: update attacker with winnerResources, target with loserResources
          await updateUser(attacker, {
              resources: winnerResources,
              loans: attackerData.loans || [],
              Vault: Number(attackerData.Vault) || 0,
              aerial_scout_amount: attackerData.aerial_scout_amount,
              combat_sentinel_amount: attackerData.combat_sentinel_amount,
              flare_bomber_amount: attackerData.flare_bomber_amount
          });
          await updateUser(target, {
              resources: loserResources,
              loans: targetData.loans || [],
              Vault: Number(targetData.Vault) || 0,
              aerial_scout_amount: targetData.aerial_scout_amount,
              combat_sentinel_amount: targetData.combat_sentinel_amount,
              flare_bomber_amount: targetData.flare_bomber_amount
          });
      } else {
          // Target wins: update target with winnerResources, attacker with loserResources
          await updateUser(target, {
              resources: winnerResources,
              loans: targetData.loans || [],
              Vault: Number(targetData.Vault) || 0,
              aerial_scout_amount: targetData.aerial_scout_amount,
              combat_sentinel_amount: targetData.combat_sentinel_amount,
              flare_bomber_amount: targetData.flare_bomber_amount
          });
          await updateUser(attacker, {
              resources: loserResources,
              loans: attackerData.loans || [],
              Vault: Number(attackerData.Vault) || 0,
              aerial_scout_amount: attackerData.aerial_scout_amount,
              combat_sentinel_amount: attackerData.combat_sentinel_amount,
              flare_bomber_amount: attackerData.flare_bomber_amount
          });
      }

      // Calculate total resources gained for display
      const totalResourcesGained = resourcesLost.gold + resourcesLost.platinum + resourcesLost.iron + resourcesLost.coins;
// Emit result to attacker
socket.emit('attack_result', {
  winner,
  loser, // Ensure this is sent
  message: `${winner} has crushed ${loser} in a blaze of interstellar fury!`,
  resourcesGained: winner === attacker ? totalResourcesGained : 0,
  resourcesGainedGold: winner === attacker ? resourcesLost.gold : 0,
  resourcesGainedPlatinum: winner === attacker ? resourcesLost.platinum : 0,
  resourcesGainedIron: winner === attacker ? resourcesLost.iron : 0,
  resourcesGainedCoins: winner === attacker ? resourcesLost.coins : 0
});

// Notify target (if online)
io.to(target).emit('attack_result', {
  winner,
  loser: attacker, // Ensure this is sent
  message: `Incoming transmission: ${attacker} assaulted your base! ${winner === target ? 'Your defenses held strong!' : 'Your outpost lies in ruins!'}`,
  resourcesGained: winner === target ? totalResourcesGained : 0,
  resourcesGainedGold: winner === target ? resourcesLost.gold : 0,
  resourcesGainedPlatinum: winner === target ? resourcesLost.platinum : 0,
  resourcesGainedIron: winner === target ? resourcesLost.iron : 0,
  resourcesGainedCoins: winner === target ? resourcesLost.coins : 0
});

      // Emit updated resources for both users
      io.emit('updateResources', { username: attacker, resources: winner === attacker ? winnerResources : loserResources });
      io.emit('updateResources', { username: target, resources: winner === target ? winnerResources : loserResources });
  } catch (error) {
      console.error('Attack error:', error);
      socket.emit('attack_result', { winner: target, message: 'Attack failed due to an error!' });
  }
});
// END: Attack Functionality for socketRoutes.js    

    // Leaderboard socket events
    socket.on("get_top_users", async () => {
      try {
        const topUsers = await leaderboardServer.getTopUsersWithDetails();
        socket.emit("top_users", topUsers);
      } catch (error) {
        console.error("Error fetching top users:", error.message);
        socket.emit("leaderboard_error", "Failed to load leaderboard");
      }
    });

    socket.on("update_ranking", async ({ username, activityData }) => {
      try {
        await leaderboardServer.updateRanking(username, activityData);
      } catch (error) {
        console.error("Error updating ranking:", error.message);
        socket.emit("leaderboard_error", "Failed to update ranking");
      }
    });

    socket.on("disconnect", () => {
      
    });
  });

  // Existing interest pool distribution
  setInterval(async () => {
    if (interestPool <= 0) return;

    db.all("SELECT * FROM users", [], async (err, allUsers) => {
      if (err) {
        console.error("Error fetching users:", err.message);
        return;
      }

      allUsers.forEach((user) => {
        user.resources = user.resources
          ? JSON.parse(user.resources)
          : { gold: 0, platinum: 0, iron: 0, coins: 0 };
        user.loans = user.resources.loans || [];
      });

      const superUsers = allUsers.filter((user) =>
        user.loans.some((loan) => loan.isSuperCollateral)
      );
      if (superUsers.length === 0) return;

      const totalSuperCollateral = superUsers.reduce((sum, user) => {
        return (
          sum +
          user.loans
            .filter((loan) => loan.isSuperCollateral)
            .reduce((loanSum, loan) => loanSum + loan.amount, 0)
        );
      }, 0);

      for (const user of superUsers) {
        const userSuperCollateral = user.loans
          .filter((loan) => loan.isSuperCollateral)
          .reduce((sum, loan) => sum + loan.amount, 0);
        const share =
          (userSuperCollateral / totalSuperCollateral) * interestPool;

        const updatedResources = { ...defaultResources, ...user.resources };
        updatedResources.coins += share;

        await updateUser(user.username, {
          resources: updatedResources,
          loans: user.loans,
          Vault: user.Vault
        });

        io.emit("interestDistribution", {
          username: user.username,
          amount: share,
          message: `${user.username} received ${share.toFixed(
            2
          )} coins from interest pool`,
        });

        // Update leaderboard ranking after interest distribution
        await leaderboardServer.updateRanking(user.username, { resources: updatedResources });
      }

      interestPool = 0;
      auctionSystem.interestPool = interestPool;
      console.log("Interest pool distributed and reset");
    });
  },  4 * 60 * 60 * 1000); // 4 minutes
}

module.exports = { setupSocketRoutes };