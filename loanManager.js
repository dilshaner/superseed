// loanManager.js
const socket = io('https://superseed-odyssey.dilshaner.com/');

class LoanManager {
    constructor(username) {
        this.username = username;
        this._resources = { gold: 0, platinum: 0, iron: 0, coins: 0 };
        this.activeLoans = [];
        this.exchangeRates = { platinum: 20, gold: 10, iron: 5 };
        this.interestRate = 0.005; // demo (0.1) , 0.005
        this.normalCollateralRatio = 1.5;
        this.superCollateralRatio = 5;
        this.interestPaused = false;
        this.interestPool = 0;
        this.lastInterestUpdate = Date.now();
        this.currentLoanPage = 0;
        this.loansPerPage = 3;
        this.interestInterval = null; // Store interval ID for cleanup
        this.repayInterval = null;   // Store interval ID for cleanup
        this.init();
    }

    get resources() {
        return this._resources;
    }

    set resources(newResources) {
        this._resources = newResources;
    }

    init() {
        // Clear any existing intervals to prevent duplicates
        this.clearIntervals();

        socket.emit('getUserData', { username: this.username });
        // Ensure we don’t stack multiple listeners
        socket.off('userData'); // Remove any previous listeners
        socket.on('userData', (data) => {
            if (data.success) {
                this._resources = data.resources || { gold: 0, platinum: 0, iron: 0, coins: 0 };
                this.activeLoans = data.loans || [];
                this.updateDisplay();
                this.updateLoanList();
            } else {
                console.error('Failed to load user data:', data.message);
            }
        });

        // Set intervals and store their IDs for cleanup
        this.interestInterval = setInterval(() => this.updateInterest(), 1 * 60 * 60 * 1000); // 1 Hour
        this.repayInterval = setInterval(() => this.repaySuperCollateralLoans(), 4 * 60 * 60 * 1000); // 4 Hour
    }

    // Method to clear intervals
    clearIntervals() {
        if (this.interestInterval) {
            clearInterval(this.interestInterval);
            this.interestInterval = null;
        }
        if (this.repayInterval) {
            clearInterval(this.repayInterval);
            this.repayInterval = null;
        }
    }

    calculateCollateralValue(collateral) {
        return (
            (collateral.platinum || 0) * this.exchangeRates.platinum +
            (collateral.gold || 0) * this.exchangeRates.gold +
            (collateral.iron || 0) * this.exchangeRates.iron
        );
    }

    async updateInterest() {
        if (this.interestPaused) return;

        const now = Date.now();
        const timeSinceLastUpdate = (now - this.lastInterestUpdate) / ( 60 * 60 * 1000); // Minutes for testing
        if (timeSinceLastUpdate < 1) return; // Apply every minute

        let totalInterestCollected = 0;

        for (const loan of this.activeLoans) {
            if (!loan.isSuperCollateral) { // Normal loans only accrue interest
                const interest = loan.amount * this.interestRate * timeSinceLastUpdate;
                loan.interestOwed = (loan.interestOwed || 0) + interest;
                totalInterestCollected += interest;

                if (this._resources.coins >= interest) {
                    this._resources.coins -= interest;
                    socket.emit('addToVault', { username: this.username, amount: interest });
                    console.log(`Added ${interest.toFixed(2)} to ${this.username}'s Vault`);
                } else {
                    this.interestPaused = true;
                    alert('Insufficient coins to pay interest! Interest deductions paused.');
                    return;
                }
            }
        }

        this.interestPool += totalInterestCollected;
        this.lastInterestUpdate = now;

        const totalSuperCollateralLoans = this.activeLoans
            .filter(loan => loan.isSuperCollateral && !loan.isFullyPaid)
            .reduce((sum, loan) => sum + loan.amount, 0);

        if (totalSuperCollateralLoans > 0 && this.interestPool > 0) {
            this.activeLoans.forEach(loan => {
                if (loan.isSuperCollateral && !loan.isFullyPaid) {
                    const share = (loan.amount / totalSuperCollateralLoans) * this.interestPool;
                    this._resources.coins += share;
                }
            });
            this.interestPool = 0;
        }

        this.updateServer();
        this.updateLoanList();
    }

    async repaySuperCollateralLoans() {
        const superLoans = this.activeLoans.filter(loan => loan.isSuperCollateral && !loan.isFullyPaid);
        if (superLoans.length === 0) return;

        const vaultBalance = await new Promise((resolve) => {
            socket.emit('getVaultBalance', { username: this.username });
            socket.once('vaultBalance', (data) => resolve(data.balance));
        });

        if (vaultBalance <= 0) return;

        let totalRepaymentNeeded = 0;
        superLoans.forEach(loan => {
            totalRepaymentNeeded += loan.amount + (loan.interestOwed || 0) - (loan.repaidAmount || 0);
        });

        const repaymentAmount = Math.min(vaultBalance, totalRepaymentNeeded);
        if (repaymentAmount <= 0) return;

        await new Promise((resolve, reject) => {
            socket.emit('deductFromVault', { username: this.username, amount: repaymentAmount });
            socket.once('vaultDeductionResponse', (data) => {
                if (data.success) resolve();
                else reject(new Error(data.message));
            });
        });

        let remainingRepayment = repaymentAmount;
        for (const loan of superLoans) {
            if (remainingRepayment <= 0) break;

            const totalOwed = loan.amount + (loan.interestOwed || 0) - (loan.repaidAmount || 0);
            const repaymentShare = Math.min(remainingRepayment, totalOwed);

            loan.repaidAmount = (loan.repaidAmount || 0) + repaymentShare;
            if (loan.repaidAmount >= loan.amount + (loan.interestOwed || 0)) {
                loan.isFullyPaid = true;
            }

            remainingRepayment -= repaymentShare;
        }

        this.updateServer();
        this.updateDisplay();
        this.updateLoanList();

        console.log(`Deducted ${repaymentAmount.toFixed(2)} from ${this.username}'s Vault for super-collateral loans`);
    }

    borrow(collateral, amount, isSuperCollateral) {
        const collateralValue = this.calculateCollateralValue(collateral);
        const requiredCollateral = amount * (isSuperCollateral ? this.superCollateralRatio : this.normalCollateralRatio);

        if (collateralValue < requiredCollateral) {
            alert(`Insufficient collateral! Required: ${requiredCollateral} coins worth, provided: ${collateralValue} coins worth.`);
            return false;
        }

        if (collateral.platinum > this._resources.platinum ||
            collateral.gold > this._resources.gold ||
            collateral.iron > this._resources.iron) {
            alert('You do not have enough resources to pledge as collateral!');
            return false;
        }

        this._resources.platinum -= collateral.platinum;
        this._resources.gold -= collateral.gold;
        this._resources.iron -= collateral.iron;
        this._resources.coins += amount;

        this.activeLoans.push({
            amount,
            interestOwed: 0,
            collateral,
            isSuperCollateral,
            ...(isSuperCollateral ? { repaidAmount: 0, isFullyPaid: false } : {}),
            timestamp: Date.now()
        });

        this.interestPaused = false;
        this.updateServer();
        this.updateDisplay();
        this.updateLoanList();

        return true;
    }

    async repay(loanIndex) {
        const loan = this.activeLoans[loanIndex];
        if (!loan) {
            alert('Invalid loan selected!');
            return;
        }

        if (loan.isSuperCollateral && !loan.isFullyPaid) {
            alert('Super-collateral loans must be fully repaid via automatic Vault deductions before unstaking!');
            return;
        }

        const totalRepayment = loan.amount + (loan.interestOwed || 0);
        if (this._resources.coins < totalRepayment) {
            alert(`Insufficient coins! Need ${totalRepayment.toFixed(2)} coins.`);
            return;
        }

        this._resources.coins -= totalRepayment;
        if (loan.isSuperCollateral) {
            loan.repaidAmount = totalRepayment;
            loan.isFullyPaid = true;
        } else {
            this.activeLoans.splice(loanIndex, 1);
        }

        this.interestPaused = false;
        this.updateServer();
        this.updateDisplay();
        this.updateLoanList();
    }

    unstake(loanIndex) {
        const loan = this.activeLoans[loanIndex];
        if (!loan || !loan.isSuperCollateral || !loan.isFullyPaid) {
            alert('Only fully paid super-collateral loans can be unstaked!');
            return;
        }

        this._resources.platinum += loan.collateral.platinum;
        this._resources.gold += loan.collateral.gold;
        this._resources.iron += loan.collateral.iron;
        this.activeLoans.splice(loanIndex, 1);

        this.updateServer();
        this.updateDisplay();
        this.updateLoanList();
    }

    updateServer() {
        socket.emit('updateUserData', {
            username: this.username,
            resources: this._resources,
            loans: this.activeLoans
        });
    }

    updateDisplay() {
        const borrowPopup = document.getElementById('borrowPopup');
        if (borrowPopup && borrowPopup.style.display === 'block') {
            document.getElementById('availablePlatinum').textContent = this._resources.platinum;
            document.getElementById('availableGold').textContent = this._resources.gold;
            document.getElementById('availableIron').textContent = this._resources.iron;
            document.getElementById('platinumSlider').max = this._resources.platinum;
            document.getElementById('goldSlider').max = this._resources.gold;
            document.getElementById('ironSlider').max = this._resources.iron;
        }
    }

    updateLoanList() {
        const loanList = document.getElementById('loanList');
        const paginationContainer = document.getElementById('loanPagination');
        if (!loanList || !paginationContainer) return;

        loanList.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (this.activeLoans.length === 0) {
            loanList.innerHTML = '<li class="no-loans">No active loans detected.</li>';
            return;
        }

        const start = this.currentLoanPage * this.loansPerPage;
        const end = start + this.loansPerPage;
        const visibleLoans = this.activeLoans.slice(start, end);

        visibleLoans.forEach((loan, index) => {
            const globalIndex = start + index;
            const totalOwed = loan.amount + (loan.interestOwed || 0);
            const repaid = loan.repaidAmount || 0;
            const status = loan.isSuperCollateral
                ? (loan.isFullyPaid ? '100% Paid - Unstake Now' : `${((repaid / totalOwed) * 100).toFixed(2)}% Paid`)
                : '';

            const loanItem = document.createElement('li');
            loanItem.className = 'loan-card';
            loanItem.innerHTML = `
                <div class="loan-card-inner">
                    <input type="radio" name="loanToRepay" value="${globalIndex}" id="loan-${globalIndex}" class="loan-radio">
                    <label for="loan-${globalIndex}" class="loan-label">
                        <span class="loan-id">#${globalIndex + 1}</span>
                        <div class="loan-info">
                            <span class="loan-amount">${loan.amount} <span class="unit">Coins</span></span>
                            <span class="loan-interest">Interest: ${loan.interestOwed ? loan.interestOwed.toFixed(2) : 0} <span class="unit">Coins</span></span>
                            ${loan.isSuperCollateral ? `<span class="loan-repaid">Repaid: ${repaid.toFixed(2)} <span class="unit">Coins</span></span>` : ''}
                            <span class="loan-collateral">
                                Collateral: 
                                <span class="resource platinum">${loan.collateral.platinum} Platinum </span> 
                                <span class="resource gold">${loan.collateral.gold} Gold</span> 
                                <span class="resource iron">${loan.collateral.iron} Iron </span>
                            </span>
                            <span class="loan-status ${loan.isSuperCollateral ? 'super' : 'normal'}">
                                ${loan.isSuperCollateral ? 'Super' : 'Normal'}${loan.isSuperCollateral ? ` - ${status}` : ''}
                            </span>
                        </div>
                    </label>
                </div>
            `;
            loanList.appendChild(loanItem);
        });

        const totalPages = Math.ceil(this.activeLoans.length / this.loansPerPage);
        if (totalPages > 1) {
            paginationContainer.innerHTML = `
                <button id="prevLoanPage" ${this.currentLoanPage === 0 ? 'disabled' : ''}>Prev</button>
                <span>Page ${this.currentLoanPage + 1} of ${totalPages}</span>
                <button id="nextLoanPage" ${this.currentLoanPage === totalPages - 1 ? 'disabled' : ''}>Next</button>
            `;
            document.getElementById('prevLoanPage')?.addEventListener('click', () => {
                if (this.currentLoanPage > 0) {
                    this.currentLoanPage--;
                    this.updateLoanList();
                }
            });
            document.getElementById('nextLoanPage')?.addEventListener('click', () => {
                if (this.currentLoanPage < totalPages - 1) {
                    this.currentLoanPage++;
                    this.updateLoanList();
                }
            });
        }
    }

    // Cleanup method to be called when destroying the instance
    destroy() {
        this.clearIntervals();
        socket.off('userData'); // Remove socket listener
    }
}

function initializePopupLogic(loanManager) {
    const popup = document.getElementById('borrowPopup');
    const platinumSlider = document.getElementById('platinumSlider');
    const goldSlider = document.getElementById('goldSlider');
    const ironSlider = document.getElementById('ironSlider');
    const borrowButton = document.getElementById('borrowButton');
    const repayButton = document.getElementById('repayButton');
    const unstakeButton = document.getElementById('unstakeButton');
    const closeButton = document.getElementById('closeBorrowPopup');

    function updatePreview() {
        const platinumAmount = parseInt(platinumSlider.value);
        const goldAmount = parseInt(goldSlider.value);
        const ironAmount = parseInt(ironSlider.value);

        document.getElementById('platinumPledgeValue').textContent = platinumAmount;
        document.getElementById('goldPledgeValue').textContent = goldAmount;
        document.getElementById('ironPledgeValue').textContent = ironAmount;

        const collateralValue = loanManager.calculateCollateralValue({
            platinum: platinumAmount,
            gold: goldAmount,
            iron: ironAmount
        });

        document.getElementById('totalCollateral').textContent = collateralValue;

        const loanType = document.querySelector('input[name="loanType"]:checked').value;
        const collateralRequirement = loanType === 'normal' ? loanManager.normalCollateralRatio : loanManager.superCollateralRatio;
        const borrowableCoins = Math.floor(collateralValue / collateralRequirement);

        document.getElementById('borrowableAmount').textContent = borrowableCoins;
        document.getElementById('feeInfo').textContent = loanType === 'supercollateral' ? '(No Fee)' : '(1% Hourly Fee)';
    }

    platinumSlider.removeEventListener('input', updatePreview);
    goldSlider.removeEventListener('input', updatePreview);
    ironSlider.removeEventListener('input', updatePreview);
    document.querySelectorAll('input[name="loanType"]').forEach(radio => {
        radio.removeEventListener('change', updatePreview);
    });

    platinumSlider.addEventListener('input', updatePreview);
    goldSlider.addEventListener('input', updatePreview);
    ironSlider.addEventListener('input', updatePreview);
    document.querySelectorAll('input[name="loanType"]').forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    const borrowHandler = () => {
        const platinumAmount = parseInt(platinumSlider.value);
        const goldAmount = parseInt(goldSlider.value);
        const ironAmount = parseInt(ironSlider.value);

        if (platinumAmount + goldAmount + ironAmount === 0) {
            alert('Please pledge some resources!');
            return;
        }

        const loanType = document.querySelector('input[name="loanType"]:checked').value;
        const isSuperCollateral = loanType === 'supercollateral';

        const collateral = {
            platinum: platinumAmount,
            gold: goldAmount,
            iron: ironAmount
        };

        const collateralValue = loanManager.calculateCollateralValue(collateral);
        const borrowableCoins = Math.floor(collateralValue / (isSuperCollateral ? loanManager.superCollateralRatio : loanManager.normalCollateralRatio));

        if (loanManager.borrow(collateral, borrowableCoins, isSuperCollateral)) {
            alert(`Borrowed ${borrowableCoins} coins${isSuperCollateral ? ' (No fee)' : ''}`);
            popup.style.display = 'none';
            platinumSlider.value = 0;
            goldSlider.value = 0;
            ironSlider.value = 0;
            updatePreview();
        }
    };

    const repayHandler = () => {
        const selectedLoan = document.querySelector('input[name="loanToRepay"]:checked');
        if (!selectedLoan) {
            alert('Please select a loan to repay!');
            return;
        }

        const loanIndex = parseInt(selectedLoan.value);
        loanManager.repay(loanIndex);
    };

    const unstakeHandler = () => {
        const selectedLoan = document.querySelector('input[name="loanToRepay"]:checked');
        if (!selectedLoan) {
            alert('Please select a loan to unstake!');
            return;
        }

        const loanIndex = parseInt(selectedLoan.value);
        loanManager.unstake(loanIndex);
    };

    const closeHandler = () => {
        popup.style.display = 'none';
        platinumSlider.value = 0;
        goldSlider.value = 0;
        ironSlider.value = 0;
        updatePreview();
    };

    borrowButton.removeEventListener('click', borrowHandler);
    repayButton.removeEventListener('click', repayHandler);
    unstakeButton?.removeEventListener('click', unstakeHandler);
    closeButton.removeEventListener('click', closeHandler);

    borrowButton.addEventListener('click', borrowHandler);
    repayButton.addEventListener('click', repayHandler);
    unstakeButton?.addEventListener('click', unstakeHandler);
    closeButton.addEventListener('click', closeHandler);

    updatePreview();
}

// Singleton pattern to ensure only one LoanManager instance
let loanManagerInstance = null;

function getLoanManager(username) {
    if (!loanManagerInstance) {
        loanManagerInstance = new LoanManager(username);
    } else {
        // If instance exists, update username and reinitialize if needed
        loanManagerInstance.username = username;
        loanManagerInstance.init();
    }
    return loanManagerInstance;
}

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (loanManagerInstance) {
        loanManagerInstance.destroy();
        loanManagerInstance = null;
    }
});

export { LoanManager, initializePopupLogic, getLoanManager };