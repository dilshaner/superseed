//db/db.js

const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

// Resolve the absolute path to the database file
const dbPath = path.resolve(__dirname, "users.db");

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the SQLite database at:", dbPath);
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {
    // Users table 
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        resources TEXT,
        Vault INTEGER REAL DEFAULT 0,             -- Per-user Vault for fees, interest, etc.
        balance REAL DEFAULT 0,                   -- For bidding
        superseed_amount INTEGER DEFAULT 0,       -- For Superseed Auction System
        aerial_scout_amount INTEGER DEFAULT 0,    -- Amount of Aerial Scouts
        combat_sentinel_amount INTEGER DEFAULT 0, -- Amount of Combat Sentinels
        flare_bomber_amount INTEGER DEFAULT 0,    -- Amount of Flare Bombers
        goldrovers_amount INTEGER DEFAULT 1,      -- Amount of Gold Mining Rovers
        platinumrovers_amount INTEGER DEFAULT 1,  -- Amount of Platinum Mining Rovers
        ironrovers_amount INTEGER DEFAULT 1       -- Amount of Iron Mining Rovers
      )
      `,
      (err) => {
        if (err) console.error("Error creating users table:", err.message);
        else console.log("Users table created or already exists.");
      }
    );
    
    // Add columns to existing tables if they don’t already exist
    db.run("ALTER TABLE users ADD COLUMN aerial_scout_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding aerial_scout_amount:", err.message);
    });
    db.run("ALTER TABLE users ADD COLUMN combat_sentinel_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding combat_sentinel_amount:", err.message);
    });
    db.run("ALTER TABLE users ADD COLUMN flare_bomber_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding flare_bomber_amount:", err.message);
    });

    db.run("ALTER TABLE users ADD COLUMN goldrovers_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding goldrovers_amount:", err.message);
    });
    db.run("ALTER TABLE users ADD COLUMN platinumrovers_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding platinumrovers_amount:", err.message);
    });
    db.run("ALTER TABLE users ADD COLUMN ironrovers_amount INTEGER DEFAULT 0", (err) => {
      if (err && !err.message.includes("duplicate column")) console.error("Error adding ironrovers_amount:", err.message);
    });

    // Current auction table 
    db.run(
      `
      CREATE TABLE IF NOT EXISTS current_auction (
        id INTEGER PRIMARY KEY,
        superseedAmount INTEGER,
        bids TEXT, -- JSON string of bids array
        endTime INTEGER,
        isActive INTEGER -- 0 or 1
      )
    `,
      (err) => {
        if (err)
          console.error("Error creating current_auction table:", err.message);
        else console.log("Current_auction table created or already exists.");
      }
    );

    // Auction results table 
    db.run(
      `
      CREATE TABLE IF NOT EXISTS auction_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        winner TEXT,
        superseeds INTEGER,
        winningBid INTEGER,
        date TEXT
      )
    `,
      (err) => {
        if (err)
          console.error("Error creating auction_results table:", err.message);
        else console.log("Auction_results table created or already exists.");
      }
    );

    // New user_rankings table for leaderboard (no logic here, just storage)
    db.run(
      `
      CREATE TABLE IF NOT EXISTS user_rankings (
        username TEXT PRIMARY KEY,
        resource_score REAL DEFAULT 0,    -- Score from resource finding (gold, platinum, iron)
        coin_score REAL DEFAULT 0,        -- Score from coins
        loan_count INTEGER DEFAULT 0,     -- Number of loans taken/repaid
        bid_count INTEGER DEFAULT 0,      -- Number of auction bids
        match_score REAL DEFAULT 0,       -- Placeholder for match win/loss
        superseed_amount INTEGER DEFAULT 0, -- Superseeds held
        rank_score REAL DEFAULT 0,        -- Final calculated score
        last_boost_update INTEGER DEFAULT 0 -- Timestamp of last boost
      )
    `,
      (err) => {
        if (err)
          console.error("Error creating user_rankings table:", err.message);
        else console.log("User_rankings table created or already exists.");
      }
    );
  });
}

// SQLite-compatible database functions (unchanged)
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else {
        if (row) {
          row.resources = row.resources
            ? JSON.parse(row.resources)
            : { gold: 0, platinum: 0, iron: 0, coins: 0 };
          row.loans = row.resources.loans || [];
          delete row.resources.loans;
          // Ensure rover counts are included even if null
          row.goldrovers_amount = row.goldrovers_amount || 0;
          row.platinumrovers_amount = row.platinumrovers_amount || 0;
          row.ironrovers_amount = row.ironrovers_amount || 0;
        }
        resolve(row);
      }
    });
  });
}

function updateUser(
  username,
  { resources, loans, Vault, balance, superseed_amount, aerial_scout_amount, combat_sentinel_amount, flare_bomber_amount, goldrovers_amount, platinumrovers_amount, ironrovers_amount }
) {
  return new Promise((resolve, reject) => {
    const dataToStore = { ...resources, loans };
    db.get(
      "SELECT Vault, balance, superseed_amount, aerial_scout_amount, combat_sentinel_amount, flare_bomber_amount, goldrovers_amount, platinumrovers_amount, ironrovers_amount FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else {
          const params = [
            JSON.stringify(dataToStore),
            Vault !== undefined ? Vault : row.Vault,
            balance !== undefined ? balance : row.balance,
            superseed_amount !== undefined ? superseed_amount : row.superseed_amount,
            aerial_scout_amount !== undefined ? aerial_scout_amount : row.aerial_scout_amount,
            combat_sentinel_amount !== undefined ? combat_sentinel_amount : row.combat_sentinel_amount,
            flare_bomber_amount !== undefined ? flare_bomber_amount : row.flare_bomber_amount,
            goldrovers_amount !== undefined ? goldrovers_amount : row.goldrovers_amount,
            platinumrovers_amount !== undefined ? platinumrovers_amount : row.platinumrovers_amount,
            ironrovers_amount !== undefined ? ironrovers_amount : row.ironrovers_amount,
            username,
          ];
          db.run(
            "UPDATE users SET resources = ?, Vault = ?, balance = ?, superseed_amount = ?, aerial_scout_amount = ?, combat_sentinel_amount = ?, flare_bomber_amount = ?, goldrovers_amount = ?, platinumrovers_amount = ?, ironrovers_amount = ? WHERE username = ?",
            params,
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        }
      }
    );
  });
}

function createUser(username, password) {
  return new Promise((resolve, reject) => {
    const defaultResources = {
      gold: 0,
      platinum: 0,
      iron: 0,
      coins: 0,
      loans: [],
    };
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) reject(err);
      else {
        db.run(
          "INSERT INTO users (username, password, resources, Vault, balance, superseed_amount) VALUES (?, ?, ?, ?, ?, ?)",
          [username, hashedPassword, JSON.stringify(defaultResources), 0, 0, 0],
          function (err) {
            if (err) reject(err);
            else
              resolve({
                username,
                resources: defaultResources,
                loans: [],
                Vault: 0,
                balance: 0,
                superseed_amount: 0,
              });
          }
        );
      }
    });
  });
}

function verifyPassword(password, hashedPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Vault functions (unchanged)
function addToVault(username, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET Vault = Vault + ? WHERE username = ?",
      [amount, username],
      (err) => {
        if (err) reject(err);
        else {
          console.log(`Added ${amount} to ${username}'s Vault`);
          resolve();
        }
      }
    );
  });
}

function deductFromVault(username, amount) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT Vault FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else if (!row || row.Vault < amount)
          reject(new Error(`Insufficient Vault balance for ${username}`));
        else {
          db.run(
            "UPDATE users SET Vault = Vault - ? WHERE username = ?",
            [amount, username],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`Deducted ${amount} from ${username}'s Vault`);
                resolve();
              }
            }
          );
        }
      }
    );
  });
}

function getVaultBalance(username) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT Vault FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.Vault : 0);
      }
    );
  });
}

function updateSuperseedBalance(username, superseedAmount) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET superseed_amount = superseed_amount + ? WHERE username = ?",
      [superseedAmount, username],
      (err) => {
        if (err) reject(err);
        else {
          console.log(
            `Updated ${username}'s Superseed balance by ${superseedAmount}`
          );
          resolve();
        }
      }
    );
  });
}

function deductBalance(username, bidAmount) {
  return new Promise((resolve, reject) => {
    const totalCost = bidAmount * 1.1; // Bid + 10% fee
    db.get(
      "SELECT balance FROM users WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else if (!row || row.balance < totalCost)
          reject(new Error("Insufficient balance"));
        else {
          db.run(
            "UPDATE users SET balance = balance - ? WHERE username = ?",
            [totalCost, username],
            (err) => {
              if (err) reject(err);
              else {
                addToVault(username, bidAmount * 0.1); // Add 10% fee to Vault
                resolve(totalCost);
              }
            }
          );
        }
      }
    );
  });
}

function refundBid(username, bidAmount) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET balance = balance + ? WHERE username = ?",
      [bidAmount, username],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// New leaderboard database functions (basic CRUD, no logic)
function updateUserRanking(username, rankingData) {
  return new Promise((resolve, reject) => {
    const {
      resource_score = 0,
      coin_score = 0,
      loan_count = 0,
      bid_count = 0,
      match_score = 0,
      superseed_amount = 0,
      rank_score = 0,
      last_boost_update = 0,
    } = rankingData;
    db.run(
      `INSERT OR REPLACE INTO user_rankings (username, resource_score, coin_score, loan_count, bid_count, match_score, superseed_amount, rank_score, last_boost_update)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(username) DO UPDATE SET
         resource_score = ?,
         coin_score = ?,
         loan_count = ?,
         bid_count = ?,
         match_score = ?,
         superseed_amount = ?,
         rank_score = ?,
         last_boost_update = ?`,
      [
        username,
        resource_score,
        coin_score,
        loan_count,
        bid_count,
        match_score,
        superseed_amount,
        rank_score,
        last_boost_update,
        resource_score,
        coin_score,
        loan_count,
        bid_count,
        match_score,
        superseed_amount,
        rank_score,
        last_boost_update,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function getUserRanking(username) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM user_rankings WHERE username = ?",
      [username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

function getTopUsers(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT username, resource_score, coin_score, loan_count, bid_count, match_score, superseed_amount, rank_score FROM user_rankings ORDER BY rank_score DESC LIMIT ?",
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getAllUserRankings() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM user_rankings", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  getUserByUsername,
  updateUser,
  createUser,
  verifyPassword,
  updateSuperseedBalance,
  deductBalance,
  refundBid,
  addToVault,
  deductFromVault,
  getVaultBalance,
  updateUserRanking,
  getUserRanking,
  getTopUsers,
  getAllUserRankings,
};