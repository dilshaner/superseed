const { db, getUserByUsername, updateUser, updateSuperseedBalance, addToVault } = require('./db/db');
let instance = null;

class AuctionSystem {
    constructor(io) {
        if (instance) return instance;
        this.io = io;
        this.auctionInterval = 4 * 60 * 60 * 1000; // 4 hours (Set 4 Minutes for testing)
        this.currentAuction = null; // Will be initialized in loadAuctionData
        this.recentResults = [];
        this.intervalId = null;
        // Load existing auction data or initialize new
        this.loadAuctionData().then(() => {
            this.startAuctionCycle();
            instance = this;
        });
    }

    async loadAuctionData() {
        try {
            const currentAuctionRow = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM current_auction LIMIT 1", [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (currentAuctionRow) {
                this.currentAuction = {
                    superseedAmount: currentAuctionRow.superseedAmount,
                    bids: JSON.parse(currentAuctionRow.bids || '[]'),
                    endTime: currentAuctionRow.endTime,
                    isActive: currentAuctionRow.isActive === 1
                };
            } else {
                this.currentAuction = {
                    superseedAmount: this.getRandomSuperseeds(),
                    bids: [],
                    endTime: this.getNextAuctionEndTime(),
                    isActive: false
                };
                await this.saveCurrentAuction();
            }
            const recentResultsRows = await new Promise((resolve, reject) => {
                db.all("SELECT winner, superseeds, winningBid, date FROM auction_results ORDER BY date DESC LIMIT 5", [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            this.recentResults = recentResultsRows.map(row => ({
                winner: row.winner,
                superseeds: row.superseeds,
                winningBid: row.winningBid,
                date: row.date
            }));
            console.log('[Auction] Loaded recent results:', this.recentResults);
        } catch (error) {
            console.error('[Auction] Error loading auction data:', error.message);
            this.currentAuction = {
                superseedAmount: this.getRandomSuperseeds(),
                bids: [],
                endTime: this.getNextAuctionEndTime(),
                isActive: false
            };
            this.recentResults = [];
            await this.saveCurrentAuction();
        }
    }

    async saveCurrentAuction() {
        try {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT OR REPLACE INTO current_auction (id, superseedAmount, bids, endTime, isActive) 
                     VALUES (1, ?, ?, ?, ?)`,
                    [this.currentAuction.superseedAmount, JSON.stringify(this.currentAuction.bids), this.currentAuction.endTime, this.currentAuction.isActive ? 1 : 0],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        } catch (error) {
            console.error('[Auction] Error saving current auction:', error.message);
        }
    }

    async saveRecentResult(result) {
        try {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO auction_results (winner, superseeds, winningBid, date) VALUES (?, ?, ?, ?)`,
                    [result.winner, result.superseeds, result.winningBid, result.date],
                    (err) => {
                        if (err) {
                            console.error('[Auction] Insert Error:', err.stack); // Enhanced error logging
                            reject(err);
                        } else resolve();
                    }
                );
            });
            await new Promise((resolve, reject) => {
                db.run(
                    `DELETE FROM auction_results WHERE date NOT IN (
                        SELECT date FROM auction_results ORDER BY date DESC LIMIT 5
                    )`,
                    (err) => {
                        if (err) {
                            console.error('[Auction] Delete Error:', err.stack); // Enhanced error logging
                            reject(err);
                        } else resolve();
                    }
                );
            });
            const recentResultsRows = await new Promise((resolve, reject) => {
                db.all("SELECT winner, superseeds, winningBid, date FROM auction_results ORDER BY date DESC LIMIT 5", [], (err, rows) => {
                    if (err) {
                        console.error('[Auction] Select Error:', err.stack); // Enhanced error logging
                        reject(err);
                    } else resolve(rows);
                });
            });
            this.recentResults = recentResultsRows.map(row => ({
                winner: row.winner,
                superseeds: row.superseeds,
                winningBid: row.winningBid,
                date: row.date
            }));
            console.log('[Auction] Saved and updated recent results:', this.recentResults);
        } catch (error) {
            console.error('[Auction] SaveRecentResult Failed:', error.stack); // Full stack trace for debugging
        }
    }

    getRandomSuperseeds() {
        return Math.floor(Math.random() * 6) + 5; // 5-10
    }

    getNextAuctionEndTime() {
        return Date.now() + this.auctionInterval;
    }

    startAuctionCycle() {
        if (this.intervalId) return;
        this.currentAuction.isActive = true;
        this.saveCurrentAuction(); // Persist initial state
        this.intervalId = setInterval(async () => {
            // Added logging to debug timing
            if (Date.now() >= this.currentAuction.endTime) {
                console.log('[Auction] Ending auction');
                await this.endAuction();
                this.currentAuction = {
                    superseedAmount: this.getRandomSuperseeds(),
                    bids: [],
                    endTime: this.getNextAuctionEndTime(),
                    isActive: true
                };
                await this.saveCurrentAuction();
                console.log(`[Auction] New Round | Ends at: ${new Date(this.currentAuction.endTime).toLocaleString()}`);
            }
            this.io.emit('auction_update', {
                superseeds: this.currentAuction.superseedAmount,
                timeLeft: Math.max(0, this.currentAuction.endTime - Date.now()),
                bids: this.currentAuction.bids.map(bid => ({
                    username: bid.username,
                    amount: bid.bidAmount
                }))
            });
        }, 1000);
    }

    stopAuctionCycle() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.currentAuction.isActive = false;
            this.saveCurrentAuction();
            console.log('[Auction] Manually Stopped');
        }
    }

    async placeBid(username, bidAmount) {
        const hasPlacedBid = this.currentAuction.bids.some(bid => bid.username === username);
        if (hasPlacedBid) {
            this.showPopup(username, 'You have already placed a bid. Only one bid is allowed.', 'error');
            return false;
        }

        if (typeof bidAmount !== 'number' || bidAmount <= 0) {
            this.showPopup(username, 'Bid must be a positive number', 'error');
            return false;
        }

        const fee = 50;
        const totalCost = bidAmount + fee;

        try {
            const user = await getUserByUsername(username);
            if (!user.resources) user.resources = { coins: 0 };
            if (user.resources.coins < totalCost) {
                throw new Error(`You need ${totalCost} coins (${bidAmount} + ${fee} fee)`);
            }

            user.resources.coins -= totalCost;
            await updateUser(username, {
                resources: user.resources,
                Vault: user.Vault || 0
            });

            this.currentAuction.bids.push({
                username,
                bidAmount,
                fee,
                totalCost,
                timestamp: Date.now()
            });

            await this.saveCurrentAuction();

            this.showPopup(username, `Bid placed: ${bidAmount} (+${fee} fee)`, 'success');

            this.io.emit('auction_update', {
                superseeds: this.currentAuction.superseedAmount,
                timeLeft: Math.max(0, this.currentAuction.endTime - Date.now()),
                bids: this.currentAuction.bids.map(bid => ({
                    username: bid.username,
                    amount: bid.bidAmount
                }))
            });

            this.notifyUserUpdate(username, user.resources, user.Vault || 0);

            return true;
        } catch (error) {
            this.showPopup(username, error.message, 'error');
            return false;
        }
    }

    async endAuction() {
        console.log('[Auction] Starting endAuction'); // Added logging
        this.currentAuction.isActive = false;

        // Prepare result regardless of bids
        let result;
        if (this.currentAuction.bids.length === 0) {
            console.log('[Auction] No bids case'); // Added logging
            result = {
                winner: 'No bids',
                superseeds: this.currentAuction.superseedAmount,
                winningBid: 0,
                date: new Date().toLocaleString()
            };
            this.recentResults.unshift(result);
        } else {
            const winner = [...this.currentAuction.bids].sort((a, b) => b.bidAmount - a.bidAmount)[0];
            result = {
                winner: winner.username,
                superseeds: this.currentAuction.superseedAmount,
                winningBid: winner.bidAmount,
                date: new Date().toLocaleString()
            };
            this.recentResults.unshift(result);
            if (this.recentResults.length > 5) this.recentResults.pop();

            // Process winner and refunds in try-catch
            try {
                console.log('[Auction] Processing winner:', winner.username); // Added logging
                await updateSuperseedBalance(winner.username, this.currentAuction.superseedAmount);
                await addToVault(winner.username, winner.totalCost);
                const winnerUser = await getUserByUsername(winner.username);
                this.showPopup(winner.username, `You won ${this.currentAuction.superseedAmount} Superseeds!`, 'success');
                this.notifyUserUpdate(winner.username, winnerUser.resources, winnerUser.Vault || 0);

                for (const bid of this.currentAuction.bids) {
                    if (bid.username !== winner.username) {
                        const user = await getUserByUsername(bid.username);
                        user.resources.coins += bid.bidAmount;
                        await addToVault(bid.username, bid.fee);
                        await updateUser(bid.username, {
                            resources: user.resources,
                            Vault: (user.Vault || 0) + bid.fee
                        });
                        this.showPopup(bid.username, `Refunded: ${bid.bidAmount} coins (${bid.fee} fee kept)`, 'info');
                        this.notifyUserUpdate(bid.username, user.resources, user.Vault || 0);
                    }
                }
            } catch (error) {
                console.error('[Auction] Processing Error:', error.stack); // Enhanced error logging
                this.io.emit('auction_error', 'Failed to process winner or refunds');
            }
        }

        // Save result outside try-catch to ensure it’s always recorded
        console.log('[Auction] Saving result:', result); // Added logging
        await this.saveRecentResult(result);
        console.log('[Auction] Result saved'); // Added logging
        this.io.emit('auction_result', result);
        console.log(`[Auction] Ended: ${result.winner} won ${result.superseeds} for ${result.winningBid}`);
    }

    showPopup(username, message, type = 'info') {
        const socket = this.io.sockets.sockets.get(username);
        if (socket) {
            socket.emit('auction_popup', { message, type });
        }
    }

    notifyUserUpdate(username, resources, vault) {
        const socket = this.io.sockets.sockets.get(username);
        if (socket) {
            socket.emit('user_update', {
                resources,
                Vault: vault
            });
        }
    }

    getRecentResults() {
        return this.recentResults;
    }
}

module.exports = { AuctionSystem };