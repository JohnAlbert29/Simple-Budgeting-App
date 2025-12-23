class UIManager {
    constructor(budgetManager, transactionManager, chartManager) {
        this.budgetManager = budgetManager;
        this.transactionManager = transactionManager;
        this.chartManager = chartManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // New Budget Button
        document.getElementById('newBudgetBtn').addEventListener('click', () => {
            this.showModal('newBudgetModal');
            this.setDefaultDates();
        });

        // Add Expense Button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            if (!this.budgetManager.activeBudget) {
                alert('Please create a budget first!');
                return;
            }
            this.showModal('addExpenseModal');
            this.setDefaultExpenseDate();
        });

        // Add Money Button
        document.getElementById('addMoneyBtn').addEventListener('click', () => {
            if (!this.budgetManager.activeBudget) {
                alert('Please create a budget first!');
                return;
            }
            this.showModal('addMoneyModal');
            this.setDefaultMoneyDate();
        });

        // Create Budget Button
        document.getElementById('createBudgetBtn').addEventListener('click', () => {
            this.createNewBudget();
        });

        // Save Expense Button
        document.getElementById('saveExpenseBtn').addEventListener('click', () => {
            this.addExpense();
        });

        // Save Money Button
        document.getElementById('saveMoneyBtn').addEventListener('click', () => {
            this.addMoney();
        });

        // Daily Date Picker
        document.getElementById('dailyDatePicker').addEventListener('change', (e) => {
            this.showDailySummary(e.target.value);
        });

        // LRT Discount Checkbox
        document.getElementById('applyDiscount').addEventListener('change', (e) => {
            this.toggleDiscountInfo(e.target.checked);
        });

        // Expense amount input for discount calculation
        document.getElementById('expenseAmount').addEventListener('input', (e) => {
            this.calculateDiscount();
        });

        // Category change for LRT discount
        document.getElementById('expenseCategory').addEventListener('change', (e) => {
            this.toggleLRTDiscount(e.target.value === 'lrt');
        });

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });

        // Modal overlay click
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.hideAllModals();
            }
        });

        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.switchScreen(screen);
            });
        });
    }

    showModal(modalId) {
        document.getElementById('modalOverlay').style.display = 'flex';
        document.getElementById(modalId).style.display = 'block';
    }

    hideAllModals() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        
        document.getElementById('startDate').value = today;
        document.getElementById('endDate').value = nextMonthStr;
    }

    setDefaultExpenseDate() {
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }

    setDefaultMoneyDate() {
        document.getElementById('moneyDate').value = new Date().toISOString().split('T')[0];
    }

    toggleLRTDiscount(show) {
        const discountGroup = document.getElementById('lrtDiscountGroup');
        discountGroup.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('applyDiscount').checked = false;
            this.toggleDiscountInfo(false);
        }
    }

    toggleDiscountInfo(show) {
        const discountInfo = document.getElementById('discountInfo');
        discountInfo.style.display = show ? 'block' : 'none';
        if (show) {
            this.calculateDiscount();
        }
    }

    calculateDiscount() {
        const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
        const discounted = amount * 0.5;
        const saved = amount * 0.5;
        
        document.getElementById('discountedAmount').textContent = discounted.toFixed(2);
        document.getElementById('savedAmount').textContent = saved.toFixed(2);
    }

    createNewBudget() {
        const name = document.getElementById('budgetTitle').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const amount = document.getElementById('budgetAmount').value;

        if (!name || !startDate || !endDate || !amount) {
            alert('Please fill in all fields');
            return;
        }

        if (parseFloat(amount) <= 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        this.budgetManager.createBudget(name, startDate, endDate, amount);
        this.hideAllModals();
        this.updateUI();
    }

    addExpense() {
        const amount = document.getElementById('expenseAmount').value;
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value.trim();
        const date = document.getElementById('expenseDate').value;
        const applyDiscount = category === 'lrt' && 
            document.getElementById('applyDiscount').checked;

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!date) {
            alert('Please select a date');
            return;
        }

        this.budgetManager.addExpense(amount, category, description, date, applyDiscount);
        this.hideAllModals();
        this.updateUI();
    }

    addMoney() {
        const amount = document.getElementById('moneyAmount').value;
        const source = document.getElementById('moneySource').value.trim();
        const date = document.getElementById('moneyDate').value;

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        this.budgetManager.addMoney(amount, source);
        this.hideAllModals();
        this.updateUI();
    }

    showDailySummary(date) {
        const dailyData = this.budgetManager.getDailySpending(date);
        const summaryHTML = this.transactionManager.createDailySummary(dailyData);
        
        document.getElementById('dailySummaryTitle').textContent = 
            `Daily Summary - ${this.transactionManager.formatDate(date)}`;
        document.getElementById('dailyDetails').innerHTML = summaryHTML;
        
        this.showModal('dailySummaryModal');
    }

    switchScreen(screen) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screen) {
                btn.classList.add('active');
            }
        });

        // For now, just scroll to sections
        const sections = {
            dashboard: 'currentBudget',
            add: 'addExpenseBtn',
            archive: 'archive-section',
            reports: 'charts-section'
        };

        if (sections[screen]) {
            document.getElementById(sections[screen])?.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    updateUI() {
        // Update budget summary
        if (this.budgetManager.activeBudget) {
            const budget = this.budgetManager.activeBudget;
            const summary = this.budgetManager.getBudgetSummary();
            
            document.getElementById('budgetName').textContent = budget.name;
            document.getElementById('budgetDates').textContent = 
                `${budget.startDate} to ${budget.endDate}`;
            document.getElementById('totalBudget').textContent = 
                this.transactionManager.formatCurrency(summary.totalBudget);
            document.getElementById('totalSpent').textContent = 
                this.transactionManager.formatCurrency(summary.totalSpent);
            document.getElementById('totalRemaining').textContent = 
                this.transactionManager.formatCurrency(summary.remaining);
            
            // Update categories
            this.updateCategories();
            
            // Update chart
            const breakdown = this.budgetManager.getCategoryBreakdown();
            this.chartManager.updateChart(breakdown);
            
            // Update biggest expense
            const biggest = this.budgetManager.getBiggestExpense();
            document.getElementById('biggestExpense').innerHTML = `
                <h3>💰 Biggest Expense</h3>
                ${this.chartManager.createBiggestExpenseHTML(biggest)}
            `;
            
            // Update recent transactions
            this.updateRecentTransactions();
            
            // Update archive
            this.updateArchive();
        } else {
            // Show empty state
            document.getElementById('budgetName').textContent = 'No Active Budget';
            document.getElementById('budgetDates').textContent = '';
            document.getElementById('totalBudget').textContent = '₱0';
            document.getElementById('totalSpent').textContent = '₱0';
            document.getElementById('totalRemaining').textContent = '₱0';
            document.querySelector('.category-summary').innerHTML = 
                '<p>Create a budget to get started!</p>';
        }
    }

    updateCategories() {
        const categorySummary = document.querySelector('.category-summary');
        const breakdown = this.budgetManager.getCategoryBreakdown();
        
        if (breakdown.length === 0) {
            categorySummary.innerHTML = '<p>No categories yet</p>';
            return;
        }
        
        let html = '';
        breakdown.forEach(cat => {
            const icon = cat.name === 'transportation' ? '🚗' : 
                        cat.name === 'food' ? '🍔' : '🚆';
            const name = cat.name === 'transportation' ? 'Transportation' : 
                        cat.name === 'food' ? 'Food' : 'LRT Fare';
            const spent = this.transactionManager.formatCurrency(cat.spent);
            const percentage = `${cat.percentage.toFixed(1)}%`;
            
            const biggest = this.budgetManager.getBiggestExpense();
            const isHighlight = biggest && cat.name === biggest.name;
            
            html += `
                <div class="category-item ${isHighlight ? 'highlight' : ''}">
                    <div class="category-name">
                        <span>${icon}</span>
                        <span>${name}</span>
                    </div>
                    <div>
                        <div class="category-amount">${spent}</div>
                        <div class="category-percentage">${percentage}</div>
                    </div>
                </div>
            `;
        });
        
        categorySummary.innerHTML = html;
    }

    updateRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        const recent = this.budgetManager.getRecentTransactions(5);
        
        if (recent.length === 0) {
            container.innerHTML = '<p>No transactions yet</p>';
            return;
        }
        
        container.innerHTML = '';
        recent.forEach(transaction => {
            const element = this.transactionManager.createTransactionElement(transaction);
            container.appendChild(element);
        });
    }

    updateArchive() {
        const container = document.getElementById('budgetArchive');
        const archive = this.budgetManager.archive.slice(0, 4); // Show last 4
        
        if (archive.length === 0) {
            container.innerHTML = '<p>No archived budgets yet</p>';
            return;
        }
        
        container.innerHTML = '';
        archive.forEach(budget => {
            const div = document.createElement('div');
            div.className = 'archive-item';
            
            const startDate = this.transactionManager.formatDate(budget.startDate);
            const endDate = this.transactionManager.formatDate(budget.endDate || budget.endDate);
            const totalBudget = this.transactionManager.formatCurrency(budget.totalBudget);
            const savings = budget.savings ? 
                this.transactionManager.formatCurrency(budget.savings) : '₱0';
            
            div.innerHTML = `
                <h4>${budget.name}</h4>
                <div class="archive-dates">${startDate} - ${endDate}</div>
                <div class="archive-amount">Saved: ${savings}</div>
            `;
            
            div.addEventListener('click', () => {
                alert(`Budget: ${budget.name}\nPeriod: ${budget.startDate} to ${budget.endDate}\nTotal: ${totalBudget}\nSaved: ${savings}`);
            });
            
            container.appendChild(div);
        });
    }
}