class TransactionManager {
    constructor(budgetManager) {
        this.budgetManager = budgetManager;
    }

    // Format currency
    formatCurrency(amount) {
        return `₱${parseFloat(amount).toFixed(2)}`;
    }

    // Get category icon
    getCategoryIcon(category) {
        const icons = {
            transportation: '🚗',
            food: '🍔',
            lrt: '🚆',
            drinks: '🥤',
            added_money: '💰'
        };
        return icons[category] || '📝';
    }

    // Get category name
    getCategoryName(category) {
        const names = {
            transportation: 'Transportation',
            food: 'Food',
            lrt: 'LRT Fare',
            drinks: 'Drinks',
            added_money: 'Added Money'
        };
        return names[category] || category;
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Format date for input
    formatDateForInput(dateString) {
        return dateString;
    }

    // Create transaction HTML element
    createTransactionElement(transaction, showActions = false) {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        div.dataset.id = transaction.id;
        
        const isExpense = transaction.type === 'expense';
        const icon = this.getCategoryIcon(transaction.category);
        const amount = this.formatCurrency(transaction.amount);
        const date = this.formatDate(transaction.date);
        
        // Special handling for LRT with discount
        let description = transaction.description || this.getCategoryName(transaction.category);
        if (transaction.category === 'lrt' && transaction.savedAmount > 0) {
            description += ` (Saved ${this.formatCurrency(transaction.savedAmount)})`;
        }
        
        div.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-details">
                    <h4>${description}</h4>
                    <span class="transaction-date">${date}</span>
                </div>
            </div>
            <div class="transaction-amount ${isExpense ? 'negative' : 'positive'}">
                ${isExpense ? '-' : '+'}${amount}
            </div>
            ${showActions ? `
                <div class="transaction-actions">
                    <button class="edit-btn" data-id="${transaction.id}">✏️</button>
                    <button class="delete-btn" data-id="${transaction.id}">🗑️</button>
                </div>
            ` : ''}
        `;
        
        return div;
    }

    // Create daily summary HTML
    createDailySummary(dailyData) {
        if (dailyData.transactions.length === 0) {
            return '<p>No expenses for this day.</p>';
        }
        
        let html = `
            <div class="daily-total">
                <h4>Total Spent: ${this.formatCurrency(dailyData.total)}</h4>
            </div>
        `;
        
        if (Object.keys(dailyData.categoryBreakdown).length > 0) {
            html += `
                <div class="daily-categories">
                    <h4>By Category:</h4>
            `;
            
            Object.entries(dailyData.categoryBreakdown).forEach(([category, amount]) => {
                html += `
                    <div class="daily-category">
                        <span>${this.getCategoryIcon(category)} ${this.getCategoryName(category)}</span>
                        <span>${this.formatCurrency(amount)}</span>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += `
            <div class="daily-transactions">
                <h4>Transactions (${dailyData.transactions.length}):</h4>
        `;
        
        dailyData.transactions.forEach(transaction => {
            const icon = this.getCategoryIcon(transaction.category);
            const description = transaction.description || this.getCategoryName(transaction.category);
            
            html += `
                <div class="daily-transaction">
                    <span>${icon} ${description}</span>
                    <span class="negative">-${this.formatCurrency(transaction.amount)}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    // Create archive item HTML
    createArchiveItem(budget) {
        const div = document.createElement('div');
        div.className = 'archive-item';
        div.dataset.id = budget.id;
        
        const startDate = this.formatDate(budget.startDate);
        const endDate = budget.endDate ? this.formatDate(budget.endDate) : 'Present';
        const totalBudget = this.formatCurrency(budget.totalBudget);
        const totalSpent = this.formatCurrency(budget.totalSpent || 0);
        const savings = budget.savings ? this.formatCurrency(budget.savings) : this.formatCurrency(0);
        
        div.innerHTML = `
            <h4>${budget.name}</h4>
            <div class="archive-dates">${startDate} - ${endDate}</div>
            <div class="archive-stats">
                <div>Budget: ${totalBudget}</div>
                <div>Spent: ${totalSpent}</div>
                <div class="archive-amount">Saved: ${savings}</div>
            </div>
        `;
        
        return div;
    }

    // Create report HTML
    createReportHTML(reportData, reportType) {
        let html = `<div class="print-report">`;
        
        switch (reportType) {
            case 'spending':
                html += this.createSpendingReport(reportData);
                break;
            case 'savings':
                html += this.createSavingsReport(reportData);
                break;
            case 'category':
                html += this.createCategoryReport(reportData);
                break;
            case 'full':
                html += this.createFullReport(reportData);
                break;
            default:
                html += '<p>Select a report type</p>';
        }
        
        html += '</div>';
        return html;
    }

    createSpendingReport(reportData) {
        return `
            <div class="print-header">
                <h2>${reportData.budgetName}</h2>
                <p>${reportData.period}</p>
            </div>
            <div class="print-stats">
                <div class="print-stat">
                    <h4>Total Budget</h4>
                    <p>${this.formatCurrency(reportData.summary.totalBudget)}</p>
                </div>
                <div class="print-stat">
                    <h4>Total Spent</h4>
                    <p>${this.formatCurrency(reportData.summary.totalSpent)}</p>
                </div>
                <div class="print-stat">
                    <h4>Remaining</h4>
                    <p>${this.formatCurrency(reportData.summary.remaining)}</p>
                </div>
                <div class="print-stat">
                    <h4>Added Money</h4>
                    <p>${this.formatCurrency(reportData.summary.addedMoney)}</p>
                </div>
            </div>
            <div class="print-categories">
                <h3>Category Breakdown</h3>
                ${reportData.categories.map(cat => `
                    <div class="print-category">
                        <span>${this.getCategoryName(cat.name)}</span>
                        <span>${this.formatCurrency(cat.spent)} (${cat.percentage.toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
            ${reportData.biggestExpense ? `
                <div class="print-stat">
                    <h4>Biggest Expense</h4>
                    <p>${this.getCategoryName(reportData.biggestExpense.name)}: ${this.formatCurrency(reportData.biggestExpense.spent)}</p>
                </div>
            ` : ''}
        `;
    }

    createSavingsReport(reportData) {
        const savingsRate = ((reportData.summary.remaining / reportData.summary.totalBudget) * 100).toFixed(1);
        const lrtSavings = reportData.categories.find(cat => cat.name === 'lrt')?.saved || 0;
        
        return `
            <div class="print-header">
                <h2>Savings Report</h2>
                <p>${reportData.period}</p>
            </div>
            <div class="print-stats">
                <div class="print-stat">
                    <h4>Total Savings</h4>
                    <p>${this.formatCurrency(reportData.summary.remaining)}</p>
                </div>
                <div class="print-stat">
                    <h4>Savings Rate</h4>
                    <p>${savingsRate}%</p>
                </div>
                <div class="print-stat">
                    <h4>LRT Discount Savings</h4>
                    <p>${this.formatCurrency(lrtSavings)}</p>
                </div>
            </div>
        `;
    }

    createCategoryReport(reportData) {
        return `
            <div class="print-header">
                <h2>Category Report</h2>
                <p>${reportData.period}</p>
            </div>
            <div class="print-categories">
                <h3>Spending by Category</h3>
                ${reportData.categories.map(cat => `
                    <div class="print-category">
                        <span>${this.getCategoryName(cat.name)}</span>
                        <span>${this.formatCurrency(cat.spent)}</span>
                        <span>${cat.percentage.toFixed(1)}%</span>
                        <span>Remaining: ${this.formatCurrency(cat.remaining)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createFullReport(reportData) {
        return `
            <div class="print-header">
                <h2>Complete Budget Report</h2>
                <p>${reportData.period}</p>
            </div>
            <div class="print-stats">
                <div class="print-stat">
                    <h4>Total Budget</h4>
                    <p>${this.formatCurrency(reportData.summary.totalBudget)}</p>
                </div>
                <div class="print-stat">
                    <h4>Total Spent</h4>
                    <p>${this.formatCurrency(reportData.summary.totalSpent)}</p>
                </div>
                <div class="print-stat">
                    <h4>Remaining</h4>
                    <p>${this.formatCurrency(reportData.summary.remaining)}</p>
                </div>
            </div>
            <div class="print-categories">
                <h3>Category Breakdown</h3>
                ${reportData.categories.map(cat => `
                    <div class="print-category">
                        <span>${this.getCategoryName(cat.name)}</span>
                        <span>${this.formatCurrency(cat.spent)} (${cat.percentage.toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
            <div class="print-transactions">
                <h3>All Transactions</h3>
                ${reportData.transactions.map(t => `
                    <div class="print-transaction">
                        <span>${this.formatDate(t.date)}</span>
                        <span>${this.getCategoryName(t.category)}</span>
                        <span>${t.description || ''}</span>
                        <span class="${t.type === 'expense' ? 'negative' : 'positive'}">
                            ${t.type === 'expense' ? '-' : '+'}${this.formatCurrency(t.amount)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}