class ChartManager {
    constructor() {
        this.chart = null;
    }

    // Initialize chart
    initializeChart(canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4f46e5', // Transportation
                        '#10b981', // Food
                        '#f59e0b', // LRT
                        '#ec4899', // Drinks
                        '#ef4444'  // Other
                    ],
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
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
                },
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = this.chart.data.labels[index];
                        // You can add click functionality here
                        console.log(`Clicked on: ${label}`);
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
                lrt: 'LRT Fare',
                drinks: 'Drinks'
            };
            return names[cat.name] || cat.name;
        });
        
        const data = categoryBreakdown.map(cat => cat.spent);
        
        // Find index of biggest expense for highlighting
        const biggestIndex = data.length > 0 ? 
            data.indexOf(Math.max(...data)) : -1;
        
        // Update chart data
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        
        // Highlight biggest expense
        if (biggestIndex !== -1) {
            const backgroundColors = [...this.chart.data.datasets[0].backgroundColor];
            // Reset all colors
            backgroundColors.forEach((color, i) => {
                backgroundColors[i] = this.getBaseColor(i);
            });
            // Highlight biggest
            backgroundColors[biggestIndex] = '#ef4444';
            this.chart.data.datasets[0].backgroundColor = backgroundColors;
        }
        
        this.chart.update();
    }

    // Get base color for category index
    getBaseColor(index) {
        const colors = [
            '#4f46e5', // Transportation
            '#10b981', // Food
            '#f59e0b', // LRT
            '#ec4899', // Drinks
            '#6b7280'  // Other
        ];
        return colors[index] || colors[colors.length - 1];
    }

    // Create biggest expense HTML
    createBiggestExpenseHTML(biggestExpense) {
        if (!biggestExpense) {
            return '<p>No expenses yet</p>';
        }
        
        const categoryNames = {
            transportation: 'Transportation',
            food: 'Food',
            lrt: 'LRT Fare',
            drinks: 'Drinks'
        };
        
        const name = categoryNames[biggestExpense.name] || biggestExpense.name;
        const amount = `₱${biggestExpense.spent.toFixed(2)}`;
        const percentage = `${biggestExpense.percentage.toFixed(1)}%`;
        const remaining = `₱${biggestExpense.remaining.toFixed(2)}`;
        
        return `
            <div class="highlight-content">
                <div class="highlight-category">
                    <span class="highlight-icon">${
                        biggestExpense.name === 'transportation' ? '🚗' :
                        biggestExpense.name === 'food' ? '🍔' :
                        biggestExpense.name === 'lrt' ? '🚆' : '🥤'
                    }</span>
                    <span class="highlight-name">${name}</span>
                </div>
                <div class="highlight-amount">${amount}</div>
                <div class="highlight-percentage">${percentage} of total spending</div>
                <div class="highlight-percentage">Remaining: ${remaining}</div>
            </div>
        `;
    }

    // Destroy chart (for cleanup)
    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    // Export chart as image
    exportChartAsImage() {
        if (!this.chart) return null;
        return this.chart.toBase64Image();
    }
}