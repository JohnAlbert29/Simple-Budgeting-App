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

    // Create transaction HTML element
    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
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
        `;
        
        // Add click to delete (for demo purposes)
        div.addEventListener('click', (e) => {
            if (e.target.className !== 'transaction-amount' && 
                !e.target.closest('.transaction-amount')) {
                if (confirm('Delete this transaction?')) {
                    if (this.budgetManager.deleteTransaction(transaction.id)) {
                        div.remove();
                    }
                }
            }
        });
        
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
        
        html += `
            </div>
            <div class="daily-transactions">
                <h4>Transactions:</h4>
        `;
        
        dailyData.transactions.forEach(transaction => {
            html += `
                <div class="daily-transaction">
                    <span>${this.getCategoryIcon(transaction.category)} ${transaction.description || ''}</span>
                    <span class="negative">-${this.formatCurrency(transaction.amount)}</span>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
}