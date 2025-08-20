/**
 * Capacity Dashboard
 * Advanced capacity planning dashboard with visualizations, analytics, and interactive features.
 * Provides comprehensive capacity management tools for product managers.
 */

class CapacityDashboard {
    constructor() {
        this.capacityTracker = window.capacityTracker;
        this.teamManager = window.teamManager;
        this.sprintManager = window.sprintManager;
        
        // Dashboard state
        this.selectedSprintId = null;
        this.selectedDateRange = 'current-sprint';
        this.viewMode = 'overview'; // overview, daily, individual, analytics
        this.charts = {};
        
        // Capacity forecasting data
        this.forecastData = null;
        this.capacityRecommendations = [];
        
        // Interactive state
        this.draggedCapacity = null;
        this.selectedMembers = new Set();
        
        // Bind methods
        this.initializeDashboard = this.initializeDashboard.bind(this);
        this.updateCapacityChart = this.updateCapacityChart.bind(this);
        this.generateCapacityHeatmap = this.generateCapacityHeatmap.bind(this);
    }

    /**
     * Initialize the capacity dashboard
     * @param {string} containerId - Container element ID
     */
    initializeDashboard(containerId) {
        try {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Container ${containerId} not found`);
                return false;
            }

            this.renderDashboard();
            this.initializeCharts();
            this.setupEventListeners();
            this.loadInitialData();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize capacity dashboard:', error);
            return false;
        }
    }

    /**
     * Render the dashboard structure
     */
    renderDashboard() {
        this.container.innerHTML = `
            <div class="capacity-dashboard" x-data="capacityDashboardComponent()">
                <!-- Dashboard Header -->
                <div class="dashboard-header bg-white rounded-lg shadow-md p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">Advanced Capacity Planning</h2>
                        <div class="flex items-center space-x-4">
                            <select x-model="selectedDateRange" @change="updateDashboard()" 
                                    class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="current-sprint">Current Sprint</option>
                                <option value="next-sprint">Next Sprint</option>
                                <option value="current-quarter">Current Quarter</option>
                                <option value="next-quarter">Next Quarter</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <select x-model="viewMode" @change="switchView()" 
                                    class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="overview">Overview</option>
                                <option value="daily">Daily Planning</option>
                                <option value="individual">Individual Analysis</option>
                                <option value="analytics">Advanced Analytics</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Quick Stats -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600" x-text="dashboardStats.totalCapacity"></div>
                            <div class="text-sm text-gray-600">Total Capacity</div>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <div class="text-2xl font-bold text-green-600" x-text="dashboardStats.utilizationRate + '%'"></div>
                            <div class="text-sm text-gray-600">Utilization Rate</div>
                        </div>
                        <div class="text-center p-4 bg-orange-50 rounded-lg">
                            <div class="text-2xl font-bold text-orange-600" x-text="dashboardStats.atRiskDays"></div>
                            <div class="text-sm text-gray-600">At Risk Days</div>
                        </div>
                        <div class="text-center p-4 bg-purple-50 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600" x-text="dashboardStats.efficiency + '%'"></div>
                            <div class="text-sm text-gray-600">Team Efficiency</div>
                        </div>
                    </div>
                </div>

                <!-- Main Dashboard Content -->
                <div class="dashboard-content">
                    <!-- Overview Mode -->
                    <div x-show="viewMode === 'overview'" class="space-y-6">
                        <!-- Capacity Overview Chart -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Capacity Overview</h3>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <canvas id="capacityOverviewChart" width="400" height="200"></canvas>
                                </div>
                                <div>
                                    <canvas id="utilizationTrendChart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Team Capacity Matrix -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Team Capacity Matrix</h3>
                            <div id="capacityHeatmap" class="overflow-auto"></div>
                        </div>

                        <!-- Capacity Recommendations -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Capacity Recommendations</h3>
                            <div id="capacityRecommendations" class="space-y-3"></div>
                        </div>
                    </div>

                    <!-- Daily Planning Mode -->
                    <div x-show="viewMode === 'daily'" class="space-y-6">
                        <!-- Interactive Daily Planner -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Daily Capacity Planner</h3>
                            <div id="dailyCapacityPlanner" class="grid grid-cols-7 gap-2"></div>
                        </div>

                        <!-- Drag & Drop Capacity Allocation -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Capacity Allocation</h3>
                            <div id="capacityAllocation" class="space-y-4"></div>
                        </div>
                    </div>

                    <!-- Individual Analysis Mode -->
                    <div x-show="viewMode === 'individual'" class="space-y-6">
                        <!-- Team Member Selector -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Individual Capacity Analysis</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select x-model="selectedMemberId" @change="updateIndividualAnalysis()" 
                                        class="border border-gray-300 rounded-md px-3 py-2">
                                    <option value="">Select Team Member</option>
                                    <template x-for="member in activeTeamMembers" :key="member.id">
                                        <option :value="member.id" x-text="member.name"></option>
                                    </template>
                                </select>
                                <div class="flex items-center space-x-2">
                                    <label class="text-sm font-medium text-gray-700">Compare:</label>
                                    <input type="checkbox" x-model="showComparison" @change="updateIndividualAnalysis()">
                                </div>
                            </div>
                        </div>

                        <!-- Individual Charts -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white rounded-lg shadow-md p-6">
                                <h4 class="text-md font-medium text-gray-900 mb-3">Capacity Trend</h4>
                                <canvas id="individualCapacityChart" width="400" height="200"></canvas>
                            </div>
                            <div class="bg-white rounded-lg shadow-md p-6">
                                <h4 class="text-md font-medium text-gray-900 mb-3">Workload Distribution</h4>
                                <canvas id="workloadDistributionChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Analytics Mode -->
                    <div x-show="viewMode === 'analytics'" class="space-y-6">
                        <!-- Forecasting -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Capacity Forecasting</h3>
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <canvas id="capacityForecastChart" width="400" height="200"></canvas>
                                </div>
                                <div id="forecastInsights" class="space-y-3"></div>
                            </div>
                        </div>

                        <!-- Bottleneck Analysis -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Bottleneck Analysis</h3>
                            <div id="bottleneckAnalysis" class="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
                        </div>

                        <!-- Performance Metrics -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                            <div id="performanceMetrics" class="space-y-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize Chart.js charts with enhanced interactivity
     */
    initializeCharts() {
        // Capacity Overview Chart with click interactions
        const overviewCtx = document.getElementById('capacityOverviewChart')?.getContext('2d');
        if (overviewCtx) {
            this.charts.overview = new Chart(overviewCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Allocated Capacity',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
                        borderRadius: 4
                    }, {
                        label: 'Available Capacity',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    const total = context.chart.data.datasets.reduce((sum, dataset) => 
                                        sum + (dataset.data[context.dataIndex] || 0), 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} pts (${percentage}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Capacity Points',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const elementIndex = elements[0].index;
                            const sprintName = this.charts.overview.data.labels[elementIndex];
                            this.onSprintChartClick(sprintName);
                        }
                    }
                }
            });
        }

        // Enhanced Utilization Trend Chart with zones
        const trendCtx = document.getElementById('utilizationTrendChart')?.getContext('2d');
        if (trendCtx) {
            this.charts.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Team Utilization',
                        data: [],
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 3,
                        fill: 'start',
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }, {
                        label: 'Target Zone (85%)',
                        data: [],
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }, {
                        label: 'Critical Zone (95%)',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        const value = context.parsed.y;
                                        let status = 'Normal';
                                        if (value > 95) status = 'Critical - Over Capacity';
                                        else if (value > 85) status = 'High - Near Capacity';
                                        else if (value < 60) status = 'Low - Under Utilized';
                                        return [`Utilization: ${value.toFixed(1)}%`, `Status: ${status}`];
                                    }
                                    return context.dataset.label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 120,
                            title: {
                                display: true,
                                text: 'Utilization %',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: function(context) {
                                    if (context.tick.value === 85) return 'rgba(16, 185, 129, 0.3)';
                                    if (context.tick.value === 95) return 'rgba(239, 68, 68, 0.3)';
                                    return 'rgba(0, 0, 0, 0.1)';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Individual Capacity Chart
        const individualCtx = document.getElementById('individualCapacityChart')?.getContext('2d');
        if (individualCtx) {
            this.charts.individual = new Chart(individualCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Individual Capacity',
                        data: [],
                        backgroundColor: 'rgba(139, 69, 19, 0.2)',
                        borderColor: 'rgba(139, 69, 19, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Capacity Forecast Chart
        const forecastCtx = document.getElementById('capacityForecastChart')?.getContext('2d');
        if (forecastCtx) {
            this.charts.forecast = new Chart(forecastCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Historical',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    }, {
                        label: 'Forecast',
                        data: [],
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Capacity Points'
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Set up event listeners for dashboard interactions
     */
    setupEventListeners() {
        // Listen for capacity changes
        window.addEventListener('capacityChanged', () => {
            this.refreshDashboard();
        });

        // Listen for team changes
        window.addEventListener('teamChanged', () => {
            this.refreshDashboard();
        });

        // Listen for sprint changes
        window.addEventListener('sprintChanged', () => {
            this.refreshDashboard();
        });
    }

    /**
     * Load initial dashboard data
     */
    loadInitialData() {
        try {
            this.updateDashboardStats();
            this.updateCapacityChart();
            this.generateCapacityHeatmap();
            this.generateCapacityRecommendations();
        } catch (error) {
            console.error('Failed to load initial dashboard data:', error);
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        try {
            const sprints = this.sprintManager.getAllSprints();
            const activeSprints = sprints.filter(sprint => 
                this.isSprintInDateRange(sprint, this.selectedDateRange)
            );

            let totalCapacity = 0;
            let totalUtilization = 0;
            let atRiskDays = 0;
            let efficiency = 0;

            activeSprints.forEach(sprint => {
                const capacity = this.capacityTracker.calculateTeamCapacity(sprint.id);
                totalCapacity += capacity.totalCapacity;
                totalUtilization += capacity.utilizationPercentage;

                // Calculate at-risk days (over 95% utilization)
                if (capacity.utilizationPercentage > 95) {
                    atRiskDays += this.getSprintWorkingDays(sprint).length;
                }
            });

            // Calculate efficiency based on capacity variance
            efficiency = this.calculateTeamEfficiency(activeSprints);

            this.dashboardStats = {
                totalCapacity: Math.round(totalCapacity),
                utilizationRate: activeSprints.length > 0 ? 
                    Math.round(totalUtilization / activeSprints.length) : 0,
                atRiskDays,
                efficiency: Math.round(efficiency)
            };

            // Update UI if Alpine.js component exists
            if (window.Alpine && this.container) {
                const component = Alpine.$data(this.container.querySelector('[x-data]'));
                if (component) {
                    component.dashboardStats = this.dashboardStats;
                }
            }
        } catch (error) {
            console.error('Failed to update dashboard stats:', error);
        }
    }

    /**
     * Update capacity overview chart
     */
    updateCapacityChart() {
        try {
            if (!this.charts.overview) return;

            const sprints = this.getSprintsInDateRange(this.selectedDateRange);
            const labels = sprints.map(sprint => sprint.name);
            const allocatedData = [];
            const availableData = [];

            sprints.forEach(sprint => {
                const capacity = this.capacityTracker.calculateTeamCapacity(sprint.id);
                allocatedData.push(capacity.totalCapacity);
                availableData.push(capacity.maxPossibleCapacity - capacity.totalCapacity);
            });

            this.charts.overview.data.labels = labels;
            this.charts.overview.data.datasets[0].data = allocatedData;
            this.charts.overview.data.datasets[1].data = availableData;
            this.charts.overview.update();

            // Update utilization trend
            if (this.charts.trend) {
                const utilizationData = sprints.map(sprint => {
                    const capacity = this.capacityTracker.calculateTeamCapacity(sprint.id);
                    return capacity.utilizationPercentage;
                });

                this.charts.trend.data.labels = labels;
                this.charts.trend.data.datasets[0].data = utilizationData;
                this.charts.trend.update();
            }
        } catch (error) {
            console.error('Failed to update capacity chart:', error);
        }
    }

    /**
     * Generate interactive capacity heatmap with Chart.js
     */
    generateCapacityHeatmap() {
        try {
            const heatmapContainer = document.getElementById('capacityHeatmap');
            if (!heatmapContainer) return;

            const sprints = this.getSprintsInDateRange(this.selectedDateRange);
            const teamMembers = this.teamManager.getActiveTeamMembers();

            if (sprints.length === 0 || teamMembers.length === 0) {
                heatmapContainer.innerHTML = '<p class="text-gray-500">No data available for heatmap</p>';
                return;
            }

            // Create canvas for Chart.js heatmap
            heatmapContainer.innerHTML = `
                <div class="heatmap-wrapper">
                    <div class="heatmap-controls mb-4 flex items-center space-x-4">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="showPercentages" checked class="rounded">
                            <span class="text-sm">Show percentages</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="highlightCritical" checked class="rounded">
                            <span class="text-sm">Highlight over-allocation</span>
                        </label>
                        <select id="heatmapView" class="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option value="utilization">Utilization %</option>
                            <option value="capacity">Capacity Points</option>
                            <option value="efficiency">Efficiency Score</option>
                        </select>
                    </div>
                    <div class="heatmap-chart-container relative bg-white rounded-lg border border-gray-200 p-4">
                        <canvas id="capacityHeatmapChart" width="800" height="400"></canvas>
                    </div>
                    <div class="heatmap-legend mt-4">
                        <div class="flex items-center justify-between text-sm text-gray-600">
                            <div class="flex items-center space-x-4">
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 rounded" style="background: rgba(16, 185, 129, 0.8)"></div>
                                    <span>Optimal (60-85%)</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 rounded" style="background: rgba(245, 158, 11, 0.8)"></div>
                                    <span>High (85-95%)</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 rounded" style="background: rgba(239, 68, 68, 0.8)"></div>
                                    <span>Critical (>95%)</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 rounded" style="background: rgba(156, 163, 175, 0.8)"></div>
                                    <span>Under-utilized (<60%)</span>
                                </div>
                            </div>
                            <div class="text-xs">
                                Click cells for detailed breakdown • Hover for member insights
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Initialize interactive heatmap chart
            this.initializeHeatmapChart(sprints, teamMembers);
            this.setupHeatmapControls();
        } catch (error) {
            console.error('Failed to generate capacity heatmap:', error);
        }
    }

    /**
     * Initialize Chart.js heatmap visualization
     */
    initializeHeatmapChart(sprints, teamMembers) {
        const ctx = document.getElementById('capacityHeatmapChart')?.getContext('2d');
        if (!ctx) return;

        // Prepare heatmap data
        const heatmapData = this.prepareHeatmapData(sprints, teamMembers);
        
        this.charts.heatmap = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Capacity Utilization',
                    data: heatmapData,
                    backgroundColor: (context) => {
                        const value = context.parsed.utilization;
                        return this.getHeatmapColorByUtilization(value);
                    },
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2,
                    pointRadius: 20,
                    pointHoverRadius: 25
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        labels: sprints.map(s => s.name),
                        title: {
                            display: true,
                            text: 'Sprints',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { display: false }
                    },
                    y: {
                        type: 'category',
                        labels: teamMembers.map(m => m.name),
                        title: {
                            display: true,
                            text: 'Team Members',
                            font: { size: 12, weight: 'bold' }
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                const point = context[0];
                                return `${point.raw.memberName} - ${point.raw.sprintName}`;
                            },
                            label: function(context) {
                                const data = context.raw;
                                return [
                                    `Capacity: ${data.capacity} points`,
                                    `Utilization: ${data.utilization.toFixed(1)}%`,
                                    `Status: ${data.status}`,
                                    `Role: ${data.role}`
                                ];
                            }
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const point = elements[0];
                        const data = this.charts.heatmap.data.datasets[0].data[point.index];
                        this.onHeatmapCellClick(data);
                    }
                }
            }
        });
    }

    /**
     * Prepare data for heatmap visualization
     */
    prepareHeatmapData(sprints, teamMembers) {
        const data = [];
        
        sprints.forEach((sprint, sprintIndex) => {
            teamMembers.forEach((member, memberIndex) => {
                const memberCapacity = this.capacityTracker.getMemberEffectiveCapacity(member.id, sprint.id);
                const utilization = member.defaultCapacity > 0 ? 
                    (memberCapacity.effective / member.defaultCapacity) * 100 : 0;
                
                let status = 'Normal';
                if (utilization > 95) status = 'Critical';
                else if (utilization > 85) status = 'High';
                else if (utilization < 60) status = 'Under-utilized';
                
                data.push({
                    x: sprintIndex,
                    y: memberIndex,
                    capacity: memberCapacity.effective,
                    utilization: utilization,
                    status: status,
                    memberName: member.name,
                    sprintName: sprint.name,
                    role: member.role,
                    memberId: member.id,
                    sprintId: sprint.id
                });
            });
        });
        
        return data;
    }

    /**
     * Get heatmap color based on utilization percentage
     */
    getHeatmapColorByUtilization(utilization) {
        if (utilization > 95) return 'rgba(239, 68, 68, 0.9)';  // Critical - Red
        if (utilization > 85) return 'rgba(245, 158, 11, 0.9)'; // High - Orange
        if (utilization >= 60) return 'rgba(16, 185, 129, 0.9)'; // Optimal - Green
        return 'rgba(156, 163, 175, 0.9)'; // Under-utilized - Gray
    }

    /**
     * Setup heatmap controls
     */
    setupHeatmapControls() {
        const showPercentages = document.getElementById('showPercentages');
        const highlightCritical = document.getElementById('highlightCritical');
        const heatmapView = document.getElementById('heatmapView');

        if (showPercentages) {
            showPercentages.addEventListener('change', () => {
                this.updateHeatmapDisplay();
            });
        }

        if (highlightCritical) {
            highlightCritical.addEventListener('change', () => {
                this.updateHeatmapDisplay();
            });
        }

        if (heatmapView) {
            heatmapView.addEventListener('change', () => {
                this.updateHeatmapDisplay();
            });
        }
    }

    /**
     * Update heatmap display based on controls
     */
    updateHeatmapDisplay() {
        if (this.charts.heatmap) {
            this.charts.heatmap.update();
        }
    }

    /**
     * Handle heatmap cell click
     */
    onHeatmapCellClick(data) {
        // Show detailed capacity breakdown for member/sprint
        this.showCapacityDetails(data.memberId, data.sprintId);
    }

    /**
     * Handle sprint chart click
     */
    onSprintChartClick(sprintName) {
        // Focus on specific sprint in planner
        console.log(`Clicked on sprint: ${sprintName}`);
        // Could trigger navigation to sprint details
    }

    /**
     * Show detailed capacity breakdown
     */
    showCapacityDetails(memberId, sprintId) {
        // Implementation for detailed capacity modal/panel
        console.log(`Show details for member ${memberId} in sprint ${sprintId}`);
    }

    /**
     * Generate capacity recommendations
     */
    generateCapacityRecommendations() {
        try {
            const recommendationsContainer = document.getElementById('capacityRecommendations');
            if (!recommendationsContainer) return;

            const sprints = this.getSprintsInDateRange(this.selectedDateRange);
            const recommendations = [];

            sprints.forEach(sprint => {
                const sprintRecommendations = this.capacityTracker.getCapacityRecommendations(sprint.id);
                
                if (sprintRecommendations.suggestions.length > 0) {
                    recommendations.push({
                        sprintName: sprint.name,
                        status: sprintRecommendations.status,
                        suggestions: sprintRecommendations.suggestions,
                        warnings: sprintRecommendations.warnings
                    });
                }
            });

            if (recommendations.length === 0) {
                recommendationsContainer.innerHTML = '<p class="text-gray-500">No recommendations at this time</p>';
                return;
            }

            let recommendationsHTML = '';
            recommendations.forEach(rec => {
                const statusColor = this.getRecommendationStatusColor(rec.status);
                
                recommendationsHTML += `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="text-sm font-medium text-gray-900">${rec.sprintName}</span>
                            <span class="px-2 py-1 text-xs rounded ${statusColor}">${rec.status}</span>
                        </div>
                        
                        ${rec.warnings.length > 0 ? `
                            <div class="mb-2">
                                ${rec.warnings.map(warning => 
                                    `<div class="text-sm text-red-600 flex items-center space-x-1">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span>${warning}</span>
                                    </div>`
                                ).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="space-y-1">
                            ${rec.suggestions.map(suggestion => 
                                `<div class="text-sm text-blue-600">• ${suggestion}</div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            });

            recommendationsContainer.innerHTML = recommendationsHTML;
        } catch (error) {
            console.error('Failed to generate capacity recommendations:', error);
        }
    }

    /**
     * Generate capacity forecast
     */
    generateCapacityForecast() {
        try {
            if (!this.charts.forecast) return;

            const historicalSprints = this.sprintManager.getAllSprints()
                .filter(sprint => new Date(sprint.endDate) < new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

            const futureSprints = this.sprintManager.getAllSprints()
                .filter(sprint => new Date(sprint.startDate) > new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 4); // Next 4 sprints

            // Historical data
            const historicalLabels = historicalSprints.map(sprint => sprint.name);
            const historicalData = historicalSprints.map(sprint => {
                const capacity = this.capacityTracker.calculateTeamCapacity(sprint.id);
                return capacity.totalCapacity;
            });

            // Forecast data using linear regression
            const forecastLabels = futureSprints.map(sprint => sprint.name);
            const forecastData = this.calculateCapacityForecast(historicalData, futureSprints.length);

            // Update chart
            this.charts.forecast.data.labels = [...historicalLabels, ...forecastLabels];
            this.charts.forecast.data.datasets[0].data = [...historicalData, ...Array(forecastLabels.length).fill(null)];
            this.charts.forecast.data.datasets[1].data = [...Array(historicalLabels.length).fill(null), ...forecastData];
            this.charts.forecast.update();

            // Generate forecast insights
            this.generateForecastInsights(forecastData, historicalData);
        } catch (error) {
            console.error('Failed to generate capacity forecast:', error);
        }
    }

    /**
     * Calculate capacity forecast using simple linear regression
     * @param {Array} historicalData - Historical capacity data
     * @param {number} periodsToForecast - Number of periods to forecast
     * @returns {Array} Forecast data
     */
    calculateCapacityForecast(historicalData, periodsToForecast) {
        if (historicalData.length < 2) {
            return Array(periodsToForecast).fill(historicalData[0] || 0);
        }

        // Simple linear regression
        const n = historicalData.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y = historicalData;

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate forecast
        const forecast = [];
        for (let i = 0; i < periodsToForecast; i++) {
            const forecastValue = slope * (n + i) + intercept;
            forecast.push(Math.max(0, Math.round(forecastValue)));
        }

        return forecast;
    }

    /**
     * Generate forecast insights
     * @param {Array} forecastData - Forecast data
     * @param {Array} historicalData - Historical data
     */
    generateForecastInsights(forecastData, historicalData) {
        try {
            const insightsContainer = document.getElementById('forecastInsights');
            if (!insightsContainer) return;

            const avgHistorical = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
            const avgForecast = forecastData.reduce((sum, val) => sum + val, 0) / forecastData.length;
            const trend = avgForecast > avgHistorical ? 'increasing' : 'decreasing';
            const trendPercentage = Math.abs(((avgForecast - avgHistorical) / avgHistorical) * 100);

            let insightsHTML = `
                <div class="space-y-3">
                    <div class="p-3 bg-blue-50 border border-blue-200 rounded">
                        <h5 class="text-sm font-medium text-blue-900">Capacity Trend</h5>
                        <p class="text-sm text-blue-700">
                            Team capacity is ${trend} by ${Math.round(trendPercentage)}% 
                            compared to historical average
                        </p>
                    </div>
                    
                    <div class="p-3 bg-green-50 border border-green-200 rounded">
                        <h5 class="text-sm font-medium text-green-900">Forecast Confidence</h5>
                        <p class="text-sm text-green-700">
                            Based on ${historicalData.length} historical sprints, 
                            forecast confidence is ${this.calculateForecastConfidence(historicalData)}%
                        </p>
                    </div>
                    
                    <div class="p-3 bg-orange-50 border border-orange-200 rounded">
                        <h5 class="text-sm font-medium text-orange-900">Recommendations</h5>
                        <ul class="text-sm text-orange-700 space-y-1">
                            ${this.generateForecastRecommendations(trend, trendPercentage).map(rec => 
                                `<li>• ${rec}</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            `;

            insightsContainer.innerHTML = insightsHTML;
        } catch (error) {
            console.error('Failed to generate forecast insights:', error);
        }
    }

    /**
     * Calculate forecast confidence based on data variance
     * @param {Array} historicalData - Historical data
     * @returns {number} Confidence percentage
     */
    calculateForecastConfidence(historicalData) {
        if (historicalData.length < 2) return 50;

        const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
        const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / mean;

        // Convert coefficient of variation to confidence (inverse relationship)
        const confidence = Math.max(20, Math.min(95, 90 - (coefficientOfVariation * 100)));
        return Math.round(confidence);
    }

    /**
     * Generate forecast recommendations
     * @param {string} trend - Trend direction
     * @param {number} trendPercentage - Trend percentage change
     * @returns {Array} Recommendations
     */
    generateForecastRecommendations(trend, trendPercentage) {
        const recommendations = [];

        if (trend === 'increasing' && trendPercentage > 10) {
            recommendations.push('Consider hiring additional team members to meet growing demand');
            recommendations.push('Review capacity allocation to prevent overutilization');
        } else if (trend === 'decreasing' && trendPercentage > 10) {
            recommendations.push('Analyze reasons for decreasing capacity trend');
            recommendations.push('Consider cross-training to improve team flexibility');
        }

        if (trendPercentage < 5) {
            recommendations.push('Capacity appears stable - maintain current team structure');
        }

        recommendations.push('Monitor actual vs. forecast performance for continuous improvement');

        return recommendations;
    }

    /**
     * Utility: Get sprints in date range
     * @param {string} dateRange - Date range identifier
     * @returns {Array} Filtered sprints
     */
    getSprintsInDateRange(dateRange) {
        const allSprints = this.sprintManager.getAllSprints();
        const now = new Date();

        switch (dateRange) {
            case 'current-sprint':
                return allSprints.filter(sprint => 
                    new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now
                );
            case 'next-sprint':
                return allSprints.filter(sprint => 
                    new Date(sprint.startDate) > now
                ).slice(0, 1);
            case 'current-quarter':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
                return allSprints.filter(sprint => 
                    new Date(sprint.startDate) >= quarterStart && new Date(sprint.endDate) <= quarterEnd
                );
            default:
                return allSprints.slice(0, 5); // Last 5 sprints
        }
    }

    /**
     * Utility: Check if sprint is in date range
     * @param {Object} sprint - Sprint object
     * @param {string} dateRange - Date range identifier
     * @returns {boolean} Whether sprint is in range
     */
    isSprintInDateRange(sprint, dateRange) {
        return this.getSprintsInDateRange(dateRange).some(s => s.id === sprint.id);
    }

    /**
     * Utility: Get sprint working days
     * @param {Object} sprint - Sprint object
     * @returns {Array} Working days
     */
    getSprintWorkingDays(sprint) {
        const days = [];
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                days.push(new Date(date));
            }
        }
        
        return days;
    }

    /**
     * Utility: Calculate team efficiency
     * @param {Array} sprints - Sprints to analyze
     * @returns {number} Efficiency percentage
     */
    calculateTeamEfficiency(sprints) {
        if (sprints.length === 0) return 0;

        let totalEfficiency = 0;
        sprints.forEach(sprint => {
            const capacity = this.capacityTracker.calculateTeamCapacity(sprint.id);
            const utilization = capacity.utilizationPercentage;
            
            // Efficiency peaks around 85% utilization
            let efficiency;
            if (utilization <= 85) {
                efficiency = utilization;
            } else {
                efficiency = 85 - (utilization - 85) * 2; // Penalty for over-utilization
            }
            
            totalEfficiency += Math.max(0, efficiency);
        });

        return totalEfficiency / sprints.length;
    }

    /**
     * Utility: Get heatmap color based on intensity
     * @param {number} intensity - Intensity value (0-1)
     * @returns {string} Color value
     */
    getHeatmapColor(intensity) {
        const colors = [
            'rgba(16, 185, 129, 0.1)',  // Light green
            'rgba(16, 185, 129, 0.3)',  // Medium green
            'rgba(245, 158, 11, 0.3)',  // Yellow
            'rgba(245, 158, 11, 0.6)',  // Orange
            'rgba(239, 68, 68, 0.6)',   // Red
        ];

        const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
        return colors[index];
    }

    /**
     * Utility: Get recommendation status color
     * @param {string} status - Recommendation status
     * @returns {string} CSS classes
     */
    getRecommendationStatusColor(status) {
        const colors = {
            'normal': 'bg-green-100 text-green-800',
            'high': 'bg-yellow-100 text-yellow-800',
            'overallocated': 'bg-red-100 text-red-800',
            'underutilized': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Refresh entire dashboard
     */
    refreshDashboard() {
        this.loadInitialData();
    }

    /**
     * Update dashboard for new date range or settings
     */
    updateDashboard() {
        this.updateDashboardStats();
        this.updateCapacityChart();
        this.generateCapacityHeatmap();
        this.generateCapacityRecommendations();
        
        // Update forecast if in analytics mode
        if (this.viewMode === 'analytics') {
            this.generateCapacityForecast();
        }
    }

    /**
     * Switch dashboard view mode
     * @param {string} mode - New view mode
     */
    switchView(mode) {
        this.viewMode = mode;
        
        if (mode === 'analytics') {
            setTimeout(() => {
                this.generateCapacityForecast();
            }, 100);
        }
    }
}

// Create global instance
try {
    console.log('Creating CapacityDashboard instance...');
    // Use a completely different name to avoid Alpine.js auto-registration
    window.capacityDashboardManager = new CapacityDashboard();
    console.log('✓ CapacityDashboard instance created successfully as capacityDashboardManager');
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.capacityDashboardManager)));
    console.log('initializeDashboard method type:', typeof window.capacityDashboardManager.initializeDashboard);
} catch (error) {
    console.error('Failed to create CapacityDashboard instance:', error);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CapacityDashboard;
}