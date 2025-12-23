class ChartManager {
    constructor() {
        this.chart = null;
    }

    // Initialize chart
    initializeChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4f46e5', // Transportation
                        '#10b981', // Food
                        '#f59e0b', // LRT
                        '#ef4444'  // Other
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₱${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Update chart with data
    updateChart(categoryBreakdown) {
        if (!this.chart) return;
        
        const labels = categoryBreakdown.map(cat => {
            const names = {
                transportation: 'Transportation',
                food: 'Food',
                lrt: 'LRT Fare'
            };
            return names[cat.name] || cat.name;
        });
        
        const data = categoryBreakdown.map(cat => cat.spent);
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    // Create biggest expense HTML
    createBiggestExpenseHTML(biggestExpense) {
        if (!biggestExpense) {
            return '<p>No expenses yet</p>';
        }
        
        const categoryNames = {
            transportation: 'Transportation',
            food: 'Food',
            lrt: 'LRT Fare'
        };
        
        const name = categoryNames[biggestExpense.name] || biggestExpense.name;
        const amount = `₱${biggestExpense.spent.toFixed(2)}`;
        const percentage = `${biggestExpense.percentage.toFixed(1)}%`;
        
        return `
            <div class="highlight-content">
                <div class="highlight-category">
                    <span class="highlight-icon">${
                        biggestExpense.name === 'transportation' ? '🚗' :
                        biggestExpense.name === 'food' ? '🍔' : '🚆'
                    }</span>
                    <span class="highlight-name">${name}</span>
                </div>
                <div class="highlight-amount">${amount}</div>
                <div class="highlight-percentage">${percentage} of total spending</div>
            </div>
        `;
    }
}