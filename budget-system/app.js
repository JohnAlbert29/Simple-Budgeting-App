// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Budget System Loading...');
    
    // Initialize managers
    const budgetManager = new BudgetManager();
    const transactionManager = new TransactionManager(budgetManager);
    const chartManager = new ChartManager();
    const uiManager = new UIManager(budgetManager, transactionManager, chartManager);
    
    // Initialize chart
    try {
        chartManager.initializeChart('spendingChart');
        console.log('📊 Chart initialized');
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
    
    // Initial UI update
    uiManager.updateUI();
    
    // Set today's date as default for filters
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDateFrom')?.value = today;
    document.getElementById('filterDateTo')?.value = today;
    
    // Show welcome message if no budget exists
    if (!budgetManager.activeBudget && budgetManager.archive.length === 0) {
        setTimeout(() => {
            alert('Welcome to Simple Budget System! 🎉\n\nTo get started:\n1. Click "New Budget" to create your first budget\n2. Add expenses as you spend\n3. Add money when you receive extra funds\n4. Track your spending and savings!');
        }, 1000);
    }
    
    // Make managers globally available for debugging
    window.budgetManager = budgetManager;
    window.transactionManager = transactionManager;
    window.uiManager = uiManager;
    window.chartManager = chartManager;
    
    console.log('✅ Budget System Loaded Successfully!');
    
    // Auto-save every minute
    setInterval(() => {
        budgetManager.saveToStorage();
    }, 60000);
    
    // Check for budget expiry every hour
    setInterval(() => {
        if (budgetManager.checkBudgetExpiry()) {
            uiManager.updateUI();
            uiManager.showArchivePrompt();
        }
    }, 3600000);
});