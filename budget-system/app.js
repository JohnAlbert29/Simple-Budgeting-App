// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    const budgetManager = new BudgetManager();
    const transactionManager = new TransactionManager(budgetManager);
    const chartManager = new ChartManager();
    const uiManager = new UIManager(budgetManager, transactionManager, chartManager);
    
    // Initialize chart
    chartManager.initializeChart('spendingChart');
    
    // Check if budget has ended
    if (budgetManager.activeBudget && budgetManager.checkBudgetEnd()) {
        if (confirm('Your current budget period has ended. Archive it and create a new one?')) {
            budgetManager.endCurrentBudget();
        }
    }
    
    // Initial UI update
    uiManager.updateUI();
    
    // Set today's date as default for daily picker
    document.getElementById('dailyDatePicker').value = 
        new Date().toISOString().split('T')[0];
    
    // Check if we need to show daily summary for today
    const today = new Date().toISOString().split('T')[0];
    const dailyData = budgetManager.getDailySpending(today);
    if (dailyData.transactions.length > 0) {
        const summaryHTML = transactionManager.createDailySummary(dailyData);
        document.getElementById('dailySummary').innerHTML = summaryHTML;
    } else {
        document.getElementById('dailySummary').innerHTML = 
            '<p>No expenses recorded for today.</p>';
    }
    
    // Make managers globally available for debugging
    window.budgetManager = budgetManager;
    window.transactionManager = transactionManager;
    window.uiManager = uiManager;
    
    console.log('Budget System Loaded!');
});