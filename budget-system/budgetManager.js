class BudgetManager {
    constructor() {
        this.activeBudget = null;
        this.archive = [];
        this.loadFromStorage();
        this.checkBudgetExpiry();
    }

    // Create new budget
    createBudget(name, startDate, endDate, totalAmount) {
        // Archive current budget if exists
        if (this.activeBudget) {
            this.archiveCurrentBudget();
        }

        const budget = {
            id: Date.now(),
            name,
            startDate,
            endDate,
            totalBudget: parseFloat(totalAmount),
            addedMoney: 0,
            categories: {
                transportation: { budget: 0, spent: 0 },
                food: { budget: 0, spent: 0 },
                lrt: { budget: 0, spent: 0, trips: 0, saved: 0 },
                drinks: { budget: 0, spent: 0 },
                added_money: { budget: 0, spent: 0 }
            },
            transactions: []
        };

        // Auto-allocate budgets
        this.allocateDefaultBudgets(budget);
        
        this.activeBudget = budget;
        this.saveToStorage();
        return budget;
    }

    allocateDefaultBudgets(budget) {
        const total = budget.totalBudget;
        budget.categories.transportation.budget = total * 0.2; // 20%
        budget.categories.food.budget = total * 0.3; // 30%
        budget.categories.lrt.budget = total * 0.15; // 15%
        budget.categories.drinks.budget = total * 0.1; // 10%
        // Remaining 25% stays as buffer
    }

    // Archive current budget
    archiveCurrentBudget() {
        if (!this.activeBudget) return null;
        
        const endedBudget = {
            ...this.activeBudget,
            endDate: new Date().toISOString().split('T')[0],
            totalSpent: this.getTotalSpent(),
            savings: this.getBudgetSummary().remaining,
            archivedAt: new Date().toISOString()
        };
        
        this.archive.unshift(endedBudget);
        
        // Keep only last 50 archived budgets
        if (this.archive.length > 50) {
            this.archive = this.archive.slice(0, 50);
        }
        
        this.saveToStorage();
        return endedBudget;
    }

    // Add money to budget
    addMoney(amount, source = '') {
        if (!this.activeBudget) return false;
        
        const amountNum = parseFloat(amount);
        this.activeBudget.totalBudget += amountNum;
        this.activeBudget.addedMoney += amountNum;
        
        // Record as transaction
        const transaction = {
            id: Date.now(),
            type: 'income',
            amount: amountNum,
            category: 'added_money',
            description: source || 'Added money',
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now()
        };
        
        this.activeBudget.transactions.push(transaction);
        this.saveToStorage();
        return transaction;
    }

    // Add expense
    addExpense(amount, category, description = '', date, applyDiscount = false) {
        if (!this.activeBudget) return false;
        
        let actualAmount = parseFloat(amount);
        let savedAmount = 0;
        let fullAmount = actualAmount;
        
        // Apply LRT discount
        if (category === 'lrt' && applyDiscount) {
            savedAmount = actualAmount * 0.5;
            actualAmount = actualAmount * 0.5;
            
            // Track LRT savings
            this.activeBudget.categories.lrt.saved += savedAmount;
            this.activeBudget.categories.lrt.trips += 1;
        }
        
        const transaction = {
            id: Date.now(),
            type: 'expense',
            amount: actualAmount,
            fullAmount: fullAmount,
            category,
            description,
            date,
            savedAmount,
            applyDiscount,
            timestamp: Date.now()
        };
        
        this.activeBudget.transactions.push(transaction);
        this.activeBudget.categories[category].spent += actualAmount;
        this.saveToStorage();
        return transaction;
    }

    // Update expense
    updateExpense(transactionId, updates) {
        if (!this.activeBudget) return false;
        
        const transactionIndex = this.activeBudget.transactions
            .findIndex(t => t.id === transactionId);
        
        if (transactionIndex === -1) return false;
        
        const oldTransaction = this.activeBudget.transactions[transactionIndex];
        
        // Remove old amount from category
        this.activeBudget.categories[oldTransaction.category].spent -= oldTransaction.amount;
        
        // Remove LRT savings if applicable
        if (oldTransaction.category === 'lrt' && oldTransaction.savedAmount) {
            this.activeBudget.categories.lrt.saved -= oldTransaction.savedAmount;
            this.activeBudget.categories.lrt.trips -= 1;
        }
        
        // Prepare new transaction
        let actualAmount = parseFloat(updates.amount);
        let savedAmount = 0;
        let fullAmount = actualAmount;
        
        // Apply LRT discount if applicable
        if (updates.category === 'lrt' && updates.applyDiscount) {
            savedAmount = actualAmount * 0.5;
            actualAmount = actualAmount * 0.5;
            
            // Add LRT savings
            this.activeBudget.categories.lrt.saved += savedAmount;
            this.activeBudget.categories.lrt.trips += 1;
        }
        
        // Update transaction
        this.activeBudget.transactions[transactionIndex] = {
            ...oldTransaction,
            amount: actualAmount,
            fullAmount: fullAmount,
            category: updates.category,
            description: updates.description,
            date: updates.date,
            savedAmount,
            applyDiscount: updates.applyDiscount || false,
            updatedAt: Date.now()
        };
        
        // Add new amount to category
        this.activeBudget.categories[updates.category].spent += actualAmount;
        
        this.saveToStorage();
        return this.activeBudget.transactions[transactionIndex];
    }

    // Delete transaction
    deleteTransaction(transactionId) {
        if (!this.activeBudget) return false;
        
        const transactionIndex = this.activeBudget.transactions
            .findIndex(t => t.id === transactionId);
        
        if (transactionIndex === -1) return false;
        
        const transaction = this.activeBudget.transactions[transactionIndex];
        
        // Remove from category spent
        this.activeBudget.categories[transaction.category].spent -= transaction.amount;
        
        // Remove from LRT tracking if applicable
        if (transaction.category === 'lrt' && transaction.savedAmount) {
            this.activeBudget.categories.lrt.saved -= transaction.savedAmount;
            this.activeBudget.categories.lrt.trips -= 1;
        }
        
        // Remove transaction
        this.activeBudget.transactions.splice(transactionIndex, 1);
        this.saveToStorage();
        
        return true;
    }

    // Get total spent
    getTotalSpent() {
        if (!this.activeBudget) return 0;
        
        return Object.values(this.activeBudget.categories)
            .reduce((sum, cat) => sum + cat.spent, 0);
    }

    // Get budget summary
    getBudgetSummary() {
        if (!this.activeBudget) return null;
        
        const totalSpent = this.getTotalSpent();
        const remaining = this.activeBudget.totalBudget - totalSpent;
        
        return {
            totalBudget: this.activeBudget.totalBudget,
            totalSpent,
            remaining,
            addedMoney: this.activeBudget.addedMoney
        };
    }

    // Get category breakdown
    getCategoryBreakdown() {
        if (!this.activeBudget) return [];
        
        const totalSpent = this.getTotalSpent();
        
        return Object.entries(this.activeBudget.categories)
            .filter(([name]) => name !== 'added_money')
            .map(([name, data]) => ({
                name,
                spent: data.spent,
                budget: data.budget,
                remaining: data.budget - data.spent,
                percentage: totalSpent > 0 ? (data.spent / totalSpent * 100) : 0
            }))
            .filter(cat => cat.spent > 0);
    }

    // Get biggest expense
    getBiggestExpense() {
        const categories = this.getCategoryBreakdown();
        if (categories.length === 0) return null;
        
        return categories.reduce((max, cat) => 
            cat.spent > max.spent ? cat : max
        );
    }

    // Get daily spending summary
    getDailySpending(date) {
        if (!this.activeBudget) return { total: 0, transactions: [] };
        
        const dailyTransactions = this.activeBudget.transactions
            .filter(t => t.date === date && t.type === 'expense');
        
        const total = dailyTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        // Get category breakdown for the day
        const categoryBreakdown = {};
        dailyTransactions.forEach(t => {
            categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });
        
        return {
            date,
            total,
            transactions: dailyTransactions.sort((a, b) => b.timestamp - a.timestamp),
            categoryBreakdown
        };
    }

    // Get all transactions with filters
    getAllTransactions(filters = {}) {
        if (!this.activeBudget) return [];
        
        let transactions = [...this.activeBudget.transactions];
        
        // Apply filters
        if (filters.category) {
            transactions = transactions.filter(t => t.category === filters.category);
        }
        
        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.dateFrom) {
            transactions = transactions.filter(t => t.date >= filters.dateFrom);
        }
        
        if (filters.dateTo) {
            transactions = transactions.filter(t => t.date <= filters.dateTo);
        }
        
        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Check if budget has expired
    checkBudgetExpiry() {
        if (!this.activeBudget) return false;
        
        const today = new Date().toISOString().split('T')[0];
        if (today > this.activeBudget.endDate) {
            this.archiveCurrentBudget();
            this.activeBudget = null;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Get archive statistics
    getArchiveStats() {
        const totalSaved = this.archive.reduce((sum, budget) => sum + (budget.savings || 0), 0);
        const totalBudgets = this.archive.length;
        const avgSavings = totalBudgets > 0 ? totalSaved / totalBudgets : 0;
        
        return {
            totalSaved,
            totalBudgets,
            avgSavings
        };
    }

    // Get spending report data
    getSpendingReport() {
        if (!this.activeBudget) return null;
        
        const summary = this.getBudgetSummary();
        const categories = this.getCategoryBreakdown();
        const biggestExpense = this.getBiggestExpense();
        
        return {
            budgetName: this.activeBudget.name,
            period: `${this.activeBudget.startDate} to ${this.activeBudget.endDate}`,
            summary,
            categories,
            biggestExpense,
            transactions: this.getAllTransactions()
        };
    }

    // Storage methods
    saveToStorage() {
        localStorage.setItem('budgetData', JSON.stringify({
            activeBudget: this.activeBudget,
            archive: this.archive,
            version: '1.0'
        }));
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('budgetData');
            if (data) {
                const parsed = JSON.parse(data);
                this.activeBudget = parsed.activeBudget;
                this.archive = parsed.archive || [];
                
                // Initialize missing categories for old data
                if (this.activeBudget && !this.activeBudget.categories.drinks) {
                    this.activeBudget.categories.drinks = { budget: 0, spent: 0 };
                }
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.activeBudget = null;
            this.archive = [];
        }
    }

    // Get recent transactions
    getRecentTransactions(limit = 5) {
        if (!this.activeBudget) return [];
        
        return [...this.activeBudget.transactions]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Export data
    exportData() {
        return JSON.stringify({
            activeBudget: this.activeBudget,
            archive: this.archive,
            exportDate: new Date().toISOString()
        }, null, 2);
    }

    // Import data
    importData(data) {
        try {
            const parsed = JSON.parse(data);
            this.activeBudget = parsed.activeBudget;
            this.archive = parsed.archive || [];
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}