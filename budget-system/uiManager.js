class UIManager {
    constructor(budgetManager, transactionManager, chartManager) {
        this.budgetManager = budgetManager;
        this.transactionManager = transactionManager;
        this.chartManager = chartManager;
        this.currentScreen = 'dashboard';
        this.initializeEventListeners();
        this.setupDailyDatePicker();
        this.checkForNewDay();
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
            this.resetExpenseForm();
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

        // View All Transactions Button
        document.getElementById('viewAllTransactionsBtn').addEventListener('click', () => {
            this.switchScreen('transactions');
            this.loadAllTransactions();
        });

        // View Archive Button
        document.getElementById('viewArchiveBtn').addEventListener('click', () => {
            this.switchScreen('archive');
            this.loadFullArchive();
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

        // Update Expense Button
        document.getElementById('updateExpenseBtn').addEventListener('click', () => {
            this.updateExpense();
        });

        // Delete Expense Button
        document.getElementById('deleteExpenseBtn').addEventListener('click', () => {
            this.deleteExpense();
        });

        // Confirm Archive Button
        document.getElementById('confirmArchiveBtn').addEventListener('click', () => {
            this.archiveCurrentBudget();
        });

        // Cancel Archive Button
        document.getElementById('cancelArchiveBtn').addEventListener('click', () => {
            this.hideAllModals();
        });

        // Print Button
        document.getElementById('printBtn').addEventListener('click', () => {
            this.printReport();
        });

        // Download PDF Button
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            this.downloadPDF();
        });

        // Daily Date Picker
        document.getElementById('dailyDatePicker').addEventListener('change', (e) => {
            this.showDailySummary(e.target.value);
        });

        // LRT Discount Checkbox
        document.getElementById('applyDiscount').addEventListener('change', (e) => {
            this.toggleDiscountInfo(e.target.checked);
            this.calculateDiscount();
        });

        // Edit LRT Discount Checkbox
        document.getElementById('editApplyDiscount').addEventListener('change', (e) => {
            this.toggleEditDiscountInfo(e.target.checked);
            this.calculateEditDiscount();
        });

        // Expense amount input for discount calculation
        document.getElementById('expenseAmount').addEventListener('input', () => {
            this.calculateDiscount();
        });

        // Edit expense amount input
        document.getElementById('editExpenseAmount').addEventListener('input', () => {
            this.calculateEditDiscount();
        });

        // Category change for LRT discount
        document.getElementById('expenseCategory').addEventListener('change', (e) => {
            this.toggleLRTDiscount(e.target.value === 'lrt');
        });

        // Edit category change for LRT discount
        document.getElementById('editExpenseCategory').addEventListener('change', (e) => {
            this.toggleEditLRTDiscount(e.target.value === 'lrt');
        });

        // Filter transactions
        document.getElementById('filterCategory').addEventListener('change', () => {
            this.loadAllTransactions();
        });

        document.getElementById('filterDateFrom').addEventListener('change', () => {
            this.loadAllTransactions();
        });

        document.getElementById('filterDateTo').addEventListener('change', () => {
            this.loadAllTransactions();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Report buttons
        document.querySelectorAll('.report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.report;
                this.generateReport(reportType);
            });
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
                if (screen === 'add') {
                    if (!this.budgetManager.activeBudget) {
                        alert('Please create a budget first!');
                        return;
                    }
                    this.showModal('addExpenseModal');
                } else {
                    this.switchScreen(screen);
                }
            });
        });

        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetScreen = e.currentTarget.dataset.target;
                this.switchScreen(targetScreen);
            });
        });

        // Daily summary click
        document.getElementById('dailySummary').addEventListener('click', () => {
            const selectedDate = document.getElementById('dailyDatePicker').value;
            if (selectedDate) {
                this.showDailySummaryModal(selectedDate);
            }
        });

        // Biggest expense click
        document.getElementById('biggestExpense').addEventListener('click', () => {
            const biggest = this.budgetManager.getBiggestExpense();
            if (biggest) {
                this.generateReport('category');
                this.switchScreen('reports');
            }
        });

        // Archive item clicks (delegated)
        document.addEventListener('click', (e) => {
            // Edit transaction
            if (e.target.closest('.edit-btn')) {
                const transactionId = parseInt(e.target.closest('.edit-btn').dataset.id);
                this.editTransaction(transactionId);
            }
            
            // Delete transaction
            if (e.target.closest('.delete-btn')) {
                const transactionId = parseInt(e.target.closest('.delete-btn').dataset.id);
                this.confirmDeleteTransaction(transactionId);
            }
            
            // Archive item click
            if (e.target.closest('.archive-item')) {
                const archiveItem = e.target.closest('.archive-item');
                const budgetId = parseInt(archiveItem.dataset.id);
                this.viewArchiveBudget(budgetId);
            }
        });

        // Category items click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-item')) {
                const categoryItem = e.target.closest('.category-item');
                const categoryName = categoryItem.querySelector('.category-name span:nth-child(2)').textContent.toLowerCase();
                this.filterByCategory(categoryName);
            }
        });
    }

    setupDailyDatePicker() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dailyDatePicker').value = today;
        this.showDailySummary(today);
    }

    checkForNewDay() {
        const lastCheck = localStorage.getItem('lastDailyCheck') || today;
        const today = new Date().toISOString().split('T')[0];
        
        if (lastCheck !== today) {
            localStorage.setItem('lastDailyCheck', today);
            // Reset daily picker to today
            this.setupDailyDatePicker();
        }
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
        
        // Set budget amount based on last budget if available
        if (this.budgetManager.archive.length > 0) {
            const lastBudget = this.budgetManager.archive[0];
            document.getElementById('budgetAmount').value = lastBudget.totalBudget;
        }
    }

    setDefaultExpenseDate() {
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }

    setDefaultMoneyDate() {
        document.getElementById('moneyDate').value = new Date().toISOString().split('T')[0];
    }

    resetExpenseForm() {
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseDescription').value = '';
        document.getElementById('applyDiscount').checked = false;
        this.toggleDiscountInfo(false);
        this.toggleLRTDiscount(false);
    }

    toggleLRTDiscount(show) {
        const discountGroup = document.getElementById('lrtDiscountGroup');
        discountGroup.style.display = show ? 'block' : 'none';
        if (!show) {
            document.getElementById('applyDiscount').checked = false;
            this.toggleDiscountInfo(false);
        }
    }

    toggleEditLRTDiscount(show) {
        const discountGroup = document.getElementById('editLrtDiscountGroup');
        discountGroup.style.display = show ? 'block' : 'none';
    }

    toggleDiscountInfo(show) {
        const discountInfo = document.getElementById('discountInfo');
        discountInfo.style.display = show ? 'block' : 'none';
        if (show) {
            this.calculateDiscount();
        }
    }

    toggleEditDiscountInfo(show) {
        const discountInfo = document.getElementById('editDiscountInfo');
        discountInfo.style.display = show ? 'block' : 'none';
        if (show) {
            this.calculateEditDiscount();
        }
    }

    calculateDiscount() {
        const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
        const discounted = amount * 0.5;
        const saved = amount * 0.5;
        
        document.getElementById('discountedAmount').textContent = discounted.toFixed(2);
        document.getElementById('savedAmount').textContent = saved.toFixed(2);
    }

    calculateEditDiscount() {
        const amount = parseFloat(document.getElementById('editExpenseAmount').value) || 0;
        const discounted = amount * 0.5;
        const saved = amount * 0.5;
        
        document.getElementById('editDiscountedAmount').textContent = discounted.toFixed(2);
        document.getElementById('editSavedAmount').textContent = saved.toFixed(2);
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

        if (new Date(endDate) <= new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }

        this.budgetManager.createBudget(name, startDate, endDate, amount);
        this.hideAllModals();
        this.updateUI();
        
        // Show success message
        alert(`Budget "${name}" created successfully!\nPeriod: ${startDate} to ${endDate}\nTotal: ₱${parseFloat(amount).toFixed(2)}`);
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

        const transaction = this.budgetManager.addExpense(amount, category, description, date, applyDiscount);
        if (transaction) {
            this.hideAllModals();
            this.updateUI();
            
            // Update daily summary if date is today
            const today = new Date().toISOString().split('T')[0];
            if (date === today) {
                this.showDailySummary(today);
            }
        }
    }

    addMoney() {
        const amount = document.getElementById('moneyAmount').value;
        const source = document.getElementById('moneySource').value.trim();
        const date = document.getElementById('moneyDate').value;

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const transaction = this.budgetManager.addMoney(amount, source);
        if (transaction) {
            this.hideAllModals();
            this.updateUI();
            alert(`Successfully added ₱${parseFloat(amount).toFixed(2)} to your budget!`);
        }
    }

    editTransaction(transactionId) {
        if (!this.budgetManager.activeBudget) return;
        
        const transaction = this.budgetManager.activeBudget.transactions
            .find(t => t.id === transactionId);
        
        if (!transaction) return;
        
        // Fill edit form
        document.getElementById('editTransactionId').value = transactionId;
        document.getElementById('editExpenseAmount').value = transaction.fullAmount || transaction.amount;
        document.getElementById('editExpenseCategory').value = transaction.category;
        document.getElementById('editExpenseDescription').value = transaction.description || '';
        document.getElementById('editExpenseDate').value = transaction.date;
        
        // Handle LRT discount
        if (transaction.category === 'lrt') {
            this.toggleEditLRTDiscount(true);
            document.getElementById('editApplyDiscount').checked = transaction.applyDiscount || false;
            this.toggleEditDiscountInfo(transaction.applyDiscount || false);
            if (transaction.applyDiscount) {
                this.calculateEditDiscount();
            }
        } else {
            this.toggleEditLRTDiscount(false);
            document.getElementById('editApplyDiscount').checked = false;
            this.toggleEditDiscountInfo(false);
        }
        
        this.showModal('editExpenseModal');
    }

    updateExpense() {
        const transactionId = parseInt(document.getElementById('editTransactionId').value);
        const amount = document.getElementById('editExpenseAmount').value;
        const category = document.getElementById('editExpenseCategory').value;
        const description = document.getElementById('editExpenseDescription').value.trim();
        const date = document.getElementById('editExpenseDate').value;
        const applyDiscount = category === 'lrt' && 
            document.getElementById('editApplyDiscount').checked;

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!date) {
            alert('Please select a date');
            return;
        }

        const updates = {
            amount,
            category,
            description,
            date,
            applyDiscount
        };

        const transaction = this.budgetManager.updateExpense(transactionId, updates);
        if (transaction) {
            this.hideAllModals();
            this.updateUI();
            alert('Expense updated successfully!');
        }
    }

    confirmDeleteTransaction(transactionId) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.deleteTransaction(transactionId);
        }
    }

    deleteTransaction(transactionId) {
        if (this.budgetManager.deleteTransaction(transactionId)) {
            this.updateUI();
            alert('Transaction deleted successfully!');
        }
    }

    archiveCurrentBudget() {
        const archivedBudget = this.budgetManager.archiveCurrentBudget();
        if (archivedBudget) {
            this.hideAllModals();
            this.updateUI();
            alert(`Budget "${archivedBudget.name}" has been archived.\nTotal Saved: ₱${archivedBudget.savings?.toFixed(2) || '0.00'}`);
        }
    }

    showDailySummary(date) {
        const dailyData = this.budgetManager.getDailySpending(date);
        const summaryHTML = this.transactionManager.createDailySummary(dailyData);
        
        document.getElementById('dailySummary').innerHTML = summaryHTML || 
            '<p>No expenses for this day.</p>';
    }

    showDailySummaryModal(date) {
        const dailyData = this.budgetManager.getDailySpending(date);
        const summaryHTML = this.transactionManager.createDailySummary(dailyData);
        
        document.getElementById('printContent').innerHTML = `
            <div class="print-report">
                <div class="print-header">
                    <h2>Daily Spending Report</h2>
                    <p>${this.transactionManager.formatDate(date)}</p>
                </div>
                ${summaryHTML}
            </div>
        `;
        
        this.showModal('printReportModal');
    }

    switchScreen(screen) {
        // Update current screen
        this.currentScreen = screen;
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screen);
        });
        
        // Show/hide screens
        document.querySelectorAll('.screen').forEach(screenEl => {
            screenEl.classList.toggle('active', screenEl.id === `${screen}Screen`);
        });
        
        // Update content for specific screens
        switch(screen) {
            case 'transactions':
                this.loadAllTransactions();
                break;
            case 'archive':
                this.loadFullArchive();
                break;
            case 'reports':
                document.getElementById('reportContent').innerHTML = 
                    '<p>Select a report to generate</p>';
                break;
            case 'dashboard':
                this.updateUI();
                break;
        }
    }

    loadAllTransactions() {
        const container = document.getElementById('allTransactions');
        if (!container) return;
        
        // Get filter values
        const category = document.getElementById('filterCategory').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        const filters = {};
        if (category) filters.category = category;
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;
        
        const transactions = this.budgetManager.getAllTransactions(filters);
        
        if (transactions.length === 0) {
            container.innerHTML = '<p>No transactions found</p>';
            return;
        }
        
        container.innerHTML = '';
        transactions.forEach(transaction => {
            const element = this.transactionManager.createTransactionElement(transaction, true);
            container.appendChild(element);
        });
    }

    loadFullArchive() {
        const container = document.getElementById('fullArchive');
        if (!container) return;
        
        const archive = this.budgetManager.archive;
        
        if (archive.length === 0) {
            container.innerHTML = '<p>No archived budgets yet</p>';
            return;
        }
        
        container.innerHTML = '';
        archive.forEach(budget => {
            const element = this.transactionManager.createArchiveItem(budget);
            container.appendChild(element);
        });
        
        // Add archive stats
        const stats = this.budgetManager.getArchiveStats();
        if (stats.totalBudgets > 0) {
            const statsDiv = document.createElement('div');
            statsDiv.className = 'archive-stats-summary';
            statsDiv.innerHTML = `
                <h3>Archive Summary</h3>
                <p>Total Budgets: ${stats.totalBudgets}</p>
                <p>Total Saved: ${this.transactionManager.formatCurrency(stats.totalSaved)}</p>
                <p>Average Savings: ${this.transactionManager.formatCurrency(stats.avgSavings)}</p>
            `;
            container.insertBefore(statsDiv, container.firstChild);
        }
    }

    viewArchiveBudget(budgetId) {
        const budget = this.budgetManager.archive.find(b => b.id === budgetId);
        if (!budget) return;
        
        // Create report data
        const reportData = {
            budgetName: budget.name,
            period: `${budget.startDate} to ${budget.endDate || 'Present'}`,
            summary: {
                totalBudget: budget.totalBudget,
                totalSpent: budget.totalSpent || 0,
                remaining: budget.savings || 0,
                addedMoney: budget.addedMoney || 0
            },
            categories: Object.entries(budget.categories)
                .filter(([name]) => name !== 'added_money')
                .map(([name, data]) => ({
                    name,
                    spent: data.spent || 0,
                    budget: data.budget || 0,
                    remaining: (data.budget || 0) - (data.spent || 0),
                    percentage: (budget.totalSpent || 0) > 0 ? 
                        ((data.spent || 0) / (budget.totalSpent || 0) * 100) : 0
                }))
                .filter(cat => cat.spent > 0),
            transactions: budget.transactions || []
        };
        
        // Show in print modal
        const reportHTML = this.transactionManager.createReportHTML(reportData, 'full');
        document.getElementById('printContent').innerHTML = reportHTML;
        this.showModal('printReportModal');
    }

    generateReport(reportType) {
        if (!this.budgetManager.activeBudget) {
            alert('Please create a budget first!');
            return;
        }
        
        const reportData = this.budgetManager.getSpendingReport();
        if (!reportData) {
            alert('No data available for report');
            return;
        }
        
        const reportHTML = this.transactionManager.createReportHTML(reportData, reportType);
        document.getElementById('reportContent').innerHTML = reportHTML;
        
        // Store for printing
        this.currentReport = { reportData, reportType };
    }

    printReport() {
        if (!this.currentReport) {
            alert('No report generated yet');
            return;
        }
        
        const reportHTML = this.transactionManager.createReportHTML(
            this.currentReport.reportData, 
            this.currentReport.reportType
        );
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Budget Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .print-header { text-align: center; margin-bottom: 30px; }
                        .print-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
                        .print-stat { background: #f5f5f5; padding: 15px; border-radius: 8px; }
                        .print-category { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .negative { color: red; }
                        .positive { color: green; }
                        @media print {
                            .no-print { display: none; }
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${reportHTML}
                    <div class="no-print" style="margin-top: 20px; text-align: center;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Print Report
                        </button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    downloadPDF() {
        alert('PDF download functionality would require a server-side component or specialized library.\n\nFor now, you can:\n1. Print the report (Ctrl+P)\n2. Save as PDF from print dialog');
    }

    clearFilters() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';
        this.loadAllTransactions();
    }

    filterByCategory(categoryName) {
        // Map category name to value
        const categoryMap = {
            'transportation': 'transportation',
            'food': 'food',
            'lrt fare': 'lrt',
            'drinks': 'drinks'
        };
        
        const categoryValue = categoryMap[categoryName.toLowerCase()];
        if (categoryValue) {
            this.switchScreen('transactions');
            document.getElementById('filterCategory').value = categoryValue;
            this.loadAllTransactions();
        }
    }

    updateUI() {
        // Update budget summary
        if (this.budgetManager.activeBudget) {
            const budget = this.budgetManager.activeBudget;
            const summary = this.budgetManager.getBudgetSummary();
            
            document.getElementById('budgetName').textContent = budget.name;
            document.getElementById('budgetDates').textContent = 
                `${this.transactionManager.formatDate(budget.startDate)} - ${this.transactionManager.formatDate(budget.endDate)}`;
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
            
            // Update archive preview
            this.updateArchivePreview();
            
            // Check if budget should be archived
            if (this.budgetManager.checkBudgetExpiry()) {
                setTimeout(() => {
                    this.showArchivePrompt();
                }, 1000);
            }
        } else {
            // Show empty state
            document.getElementById('budgetName').textContent = 'No Active Budget';
            document.getElementById('budgetDates').textContent = '';
            document.getElementById('totalBudget').textContent = '₱0.00';
            document.getElementById('totalSpent').textContent = '₱0.00';
            document.getElementById('totalRemaining').textContent = '₱0.00';
            document.querySelector('.category-summary').innerHTML = 
                '<p>Create a budget to get started!</p>';
            document.getElementById('recentTransactions').innerHTML = 
                '<p>No transactions yet</p>';
            document.getElementById('budgetArchive').innerHTML = 
                '<p>No archived budgets yet</p>';
        }
    }

    updateCategories() {
        const categorySummary = document.querySelector('.category-summary');
        const breakdown = this.budgetManager.getCategoryBreakdown();
        
        if (breakdown.length === 0) {
            categorySummary.innerHTML = '<p>No expenses yet</p>';
            return;
        }
        
        let html = '';
        breakdown.forEach(cat => {
            const icon = cat.name === 'transportation' ? '🚗' : 
                        cat.name === 'food' ? '🍔' : 
                        cat.name === 'lrt' ? '🚆' : '🥤';
            const name = this.transactionManager.getCategoryName(cat.name);
            const spent = this.transactionManager.formatCurrency(cat.spent);
            const percentage = `${cat.percentage.toFixed(1)}%`;
            const remaining = this.transactionManager.formatCurrency(cat.remaining);
            
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
                        <div class="category-percentage">${percentage} • Remaining: ${remaining}</div>
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

    updateArchivePreview() {
        const container = document.getElementById('budgetArchive');
        const archive = this.budgetManager.archive.slice(0, 3); // Show last 3
        
        if (archive.length === 0) {
            container.innerHTML = '<p>No archived budgets yet</p>';
            return;
        }
        
        container.innerHTML = '';
        archive.forEach(budget => {
            const element = this.transactionManager.createArchiveItem(budget);
            container.appendChild(element);
        });
    }

    showArchivePrompt() {
        document.getElementById('archiveMessage').textContent = 
            'Your current budget period has ended. Would you like to archive it and create a new one?';
        this.showModal('archiveBudgetModal');
    }
}