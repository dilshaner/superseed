//leaderboardServer.js

const { getUserByUsername, getAllUserRankings, updateUserRanking, getTopUsers, getUserRanking } = require('./db/db');

class LeaderboardServer {
  constructor(io) {
    this.io = io;
    this.initialize();
  }

  initialize() {
    // Periodic boost update (every hour, checks for 24-hour elapsed time)
    setInterval(() => {
      this.applySuperseedBoost().catch(err => console.error('Boost update failed:', err));
    }, 60 * 60 * 1000); // Check hourly (DEMO 1 MINUTE SET)
  }

  async updateRanking(username, activityData = {}) {
    try {
      const user = await getUserByUsername(username);
      if (!user) throw new Error(`User ${username} not found`);

      const currentRanking = await this.getUserRanking(username) || {
        resource_score: 0,
        coin_score: 0,
        loan_count: 0,
        bid_count: 0,
        match_score: 0,
        superseed_amount: 0,
        rank_score: 0,
        last_boost_update: 0
      };

      // Extract activity data
      const { resources, coins, loansTaken = 0, loansRepaid = 0, bids = 0, matchesWon = 0, matchesLost = 0 } = activityData;

  // Calculate scores
const resourceScore = 
  (resources && resources.gold ? resources.gold : 0) + 
  (resources && resources.platinum ? resources.platinum : 0) + 
  (resources && resources.iron ? resources.iron : 0);
const coinScore = coins || (user && user.resources && user.resources.coins ? user.resources.coins : 0);
const loanCount = currentRanking.loan_count + loansTaken + loansRepaid;
const bidCount = currentRanking.bid_count + bids;
const matchScore = currentRanking.match_score + (matchesWon - matchesLost);
const superseedAmount = user.superseed_amount || 0;

      // Base score without boost
      const baseScore = resourceScore + coinScore + loanCount * 10 + bidCount * 5 + matchScore;

      // Apply boost if last update was over 24 hours ago
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      let rankScore = baseScore;
      let lastBoostUpdate = currentRanking.last_boost_update;

      if (now - lastBoostUpdate >= oneDay) {
        const boostMultiplier = 1 + (Math.floor(superseedAmount / 10) * 0.01);
        rankScore = baseScore * boostMultiplier;
        lastBoostUpdate = now;
      }

      // Update ranking in DB
      await updateUserRanking(username, {
        resource_score: resourceScore,
        coin_score: coinScore,
        loan_count: loanCount,
        bid_count: bidCount,
        match_score: matchScore,
        superseed_amount: superseedAmount,
        rank_score: rankScore,
        last_boost_update: lastBoostUpdate
      });

      // Broadcast updated leaderboard
      this.broadcastTopUsers();
    } catch (error) {
      console.error(`Error updating ranking for ${username}:`, error.message);
    }
  }

  async applySuperseedBoost() {
    try {
      const rankings = await getAllUserRankings();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; //24 * 60 * 60 * 1000; (One day) (Demo 1 Minute)

      for (const row of rankings) {
        if (now - row.last_boost_update >= oneDay) {
          const baseScore = row.resource_score + row.coin_score + row.loan_count * 10 + row.bid_count * 5 + row.match_score;
          const boostMultiplier = 1 + (Math.floor(row.superseed_amount / 10) * 0.01);
          const newScore = baseScore * boostMultiplier;

          await updateUserRanking(row.username, {
            resource_score: row.resource_score,
            coin_score: row.coin_score,
            loan_count: row.loan_count,
            bid_count: row.bid_count,
            match_score: row.match_score,
            superseed_amount: row.superseed_amount,
            rank_score: newScore,
            last_boost_update: now
          });
        }
      }

      // Broadcast updated leaderboard after boost
      this.broadcastTopUsers();
    } catch (error) {
      console.error('Error applying Superseed boost:', error.message);
    }
  }

  async getUserRanking(username) {
    try {
      const ranking = await getUserRanking(username);
      return ranking;
    } catch (error) {
      console.error(`Error fetching ranking for ${username}:`, error.message);
      return null;
    }
  }

  async getTopUsersWithDetails(limit = 10) {
    try {
      const users = await getTopUsers(limit);
      return users.map((user, index) => {
        const boostMultiplier = Math.floor(user.superseed_amount / 10) * 0.01;
        return {
          rank: index + 1,
          username: user.username,
          score: user.rank_score.toFixed(2),
          boosted: user.superseed_amount >= 10,
          boostAmount: boostMultiplier > 0 ? (boostMultiplier * 100).toFixed(1) + '%' : '0%'
        };
      });
    } catch (error) {
      console.error('Error fetching top users:', error.message);
      return [];
    }
  }

  async broadcastTopUsers() {
    const topUsers = await this.getTopUsersWithDetails();
    this.io.emit('top_users', topUsers);
  }
}

function initializeLeaderboardServer(io) {
  const leaderboardServer = new LeaderboardServer(io);
  return leaderboardServer;
}

module.exports = { initializeLeaderboardServer };