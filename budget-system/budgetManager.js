class BudgetManager {
    constructor() {
        this.activeBudget = null;
        this.archive = [];
        this.loadFromStorage();
    }

    // Create new budget
    createBudget(name, startDate, endDate, totalAmount) {
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
                lrt: { budget: 0, spent: 0, trips: 0, saved: 0 }
            },
            transactions: []
        };

        // Auto-allocate budgets (can be customized)
        this.allocateDefaultBudgets(budget);
        
        this.activeBudget = budget;
        this.saveToStorage();
        return budget;
    }

    allocateDefaultBudgets(budget) {
        const total = budget.totalBudget;
        budget.categories.transportation.budget = total * 0.2; // 20%
        budget.categories.food.budget = total * 0.4; // 40%
        budget.categories.lrt.budget = total * 0.1; // 10%
        // Remaining 30% stays as buffer
    }

    // Add money to budget
    addMoney(amount, source = '') {
        if (!this.activeBudget) return false;
        
        this.activeBudget.totalBudget += parseFloat(amount);
        this.activeBudget.addedMoney += parseFloat(amount);
        
        // Record as transaction
        const transaction = {
            id: Date.now(),
            type: 'income',
            amount: parseFloat(amount),
            category: 'added_money',
            description: source || 'Added money',
            date: new Date().toISOString().split('T')[0]
        };
        
        this.activeBudget.transactions.push(transaction);
        this.saveToStorage();
        return true;
    }

    // Add expense
    addExpense(amount, category, description = '', date, applyDiscount = false) {
        if (!this.activeBudget) return false;
        
        let actualAmount = parseFloat(amount);
        let savedAmount = 0;
        
        // Apply LRT discount
        if (category === 'lrt' && applyDiscount) {
            savedAmount = actualAmount;
            actualAmount = actualAmount * 0.5;
            
            // Track LRT savings
            this.activeBudget.categories.lrt.saved += savedAmount;
            this.activeBudget.categories.lrt.trips += 1;
        }
        
        const transaction = {
            id: Date.now(),
            type: 'expense',
            amount: actualAmount,
            fullAmount: parseFloat(amount),
            category,
            description,
            date,
            savedAmount,
            applyDiscount
        };
        
        this.activeBudget.transactions.push(transaction);
        this.activeBudget.categories[category].spent += actualAmount;
        this.saveToStorage();
        return transaction;
    }

    // Get budget summary
    getBudgetSummary() {
        if (!this.activeBudget) return null;
        
        const totalSpent = Object.values(this.activeBudget.categories)
            .reduce((sum, cat) => sum + cat.spent, 0);
        
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
        
        const totalSpent = Object.values(this.activeBudget.categories)
            .reduce((sum, cat) => sum + cat.spent, 0);
        
        return Object.entries(this.activeBudget.categories).map(([name, data]) => ({
            name,
            spent: data.spent,
            budget: data.budget,
            remaining: data.budget - data.spent,
            percentage: totalSpent > 0 ? (data.spent / totalSpent * 100) : 0
        }));
    }

    // Get biggest expense
    getBiggestExpense() {
        if (!this.activeBudget) return null;
        
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
        
        return {
            date,
            total,
            transactions: dailyTransactions,
            categoryBreakdown: this.getCategoryBreakdownForDate(date)
        };
    }

    getCategoryBreakdownForDate(date) {
        if (!this.activeBudget) return {};
        
        const dailyTransactions = this.activeBudget.transactions
            .filter(t => t.date === date && t.type === 'expense');
        
        const breakdown = {};
        dailyTransactions.forEach(t => {
            breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        });
        
        return breakdown;
    }

    // End current budget and archive it
    endCurrentBudget() {
        if (!this.activeBudget) return null;
        
        const endedBudget = {
            ...this.activeBudget,
            endDate: new Date().toISOString().split('T')[0],
            savings: this.getBudgetSummary().remaining
        };
        
        this.archive.unshift(endedBudget);
        this.activeBudget = null;
        this.saveToStorage();
        
        return endedBudget;
    }

    // Check if budget has ended
    checkBudgetEnd() {
        if (!this.activeBudget) return false;
        
        const today = new Date().toISOString().split('T')[0];
        return today > this.activeBudget.endDate;
    }

    // Storage methods
    saveToStorage() {
        localStorage.setItem('budgetData', JSON.stringify({
            activeBudget: this.activeBudget,
            archive: this.archive
        }));
    }

    loadFromStorage() {
        const data = localStorage.getItem('budgetData');
        if (data) {
            const parsed = JSON.parse(data);
            this.activeBudget = parsed.activeBudget;
            this.archive = parsed.archive || [];
        }
    }

    // Get recent transactions
    getRecentTransactions(limit = 5) {
        if (!this.activeBudget) return [];
        
        return [...this.activeBudget.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
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
}