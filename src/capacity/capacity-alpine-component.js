/**
 * Enhanced Capacity Planning Alpine.js Component
 * Provides reactive data and methods for the advanced capacity planning features.
 */

// Enhanced capacity planning Alpine.js component
function capacityDashboard() {
    return {
        // Dashboard state
        selectedDateRange: 'current-sprint',
        viewMode: 'overview',
        selectedMemberId: '',
        showComparison: false,
        showOptimizations: false,
        isDragging: false,
        dragMessage: '',
        hasUnsavedChanges: false,
        
        // Data
        dashboardStats: {
            totalCapacity: 0,
            utilizationRate: 0,
            atRiskDays: 0,
            efficiency: 0
        },
        activeTeamMembers: [],
        planningDates: [],
        planningTeamMembers: [],
        optimizationTargets: {
            targetUtilization: 85,
            maxUtilization: 95,
            balanceWorkload: true,
            respectTimeOff: true
        },
        availableSprints: [],
        currentSprintId: '',

        // Initialize component
        init() {
            this.loadData();
            this.updateDashboard();
        },

        // Load data from main app
        loadData() {
            if (window.sprintApp) {
                const app = Alpine.$data(document.querySelector('[x-data="sprintApp()"]'));
                if (app) {
                    this.activeTeamMembers = app.getActiveTeamMembers();
                    this.availableSprints = app.sprints;
                    this.currentSprintId = app.getCurrentSprintId();
                }
            }
        },

        // Update dashboard data
        updateDashboard() {
            this.updateDashboardStats();
            this.loadPlanningData();
        },

        // Update dashboard statistics
        updateDashboardStats() {
            if (!window.capacityTracker || !this.availableSprints.length) {
                return;
            }

            const sprints = this.getSprintsInDateRange();
            let totalCapacity = 0;
            let totalUtilization = 0;
            let atRiskDays = 0;

            sprints.forEach(sprint => {
                const capacity = window.capacityTracker.calculateTeamCapacity(sprint.id);
                totalCapacity += capacity.totalCapacity;
                totalUtilization += capacity.utilizationPercentage;

                if (capacity.utilizationPercentage > 95) {
                    atRiskDays += this.getSprintWorkingDays(sprint).length;
                }
            });

            const utilizationRate = sprints.length > 0 ? totalUtilization / sprints.length : 0;
            const efficiency = this.calculateEfficiency(sprints);

            this.dashboardStats = {
                totalCapacity: Math.round(totalCapacity),
                utilizationRate: Math.round(utilizationRate),
                atRiskDays,
                efficiency: Math.round(efficiency)
            };
        },

        // Load planning data for interactive planner
        loadPlanningData() {
            if (!this.currentSprintId) return;

            const sprint = this.availableSprints.find(s => s.id === this.currentSprintId);
            if (!sprint) return;

            this.planningDates = this.getSprintDates(sprint);
            this.planningTeamMembers = this.activeTeamMembers.filter(member => {
                const capacity = this.getMemberDateCapacity(member.id, this.currentSprintId);
                return capacity > 0;
            });
        },

        // Get sprints in selected date range
        getSprintsInDateRange() {
            const now = new Date();
            
            switch (this.selectedDateRange) {
                case 'current-sprint':
                    return this.availableSprints.filter(sprint => 
                        new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now
                    );
                case 'next-sprint':
                    return this.availableSprints
                        .filter(sprint => new Date(sprint.startDate) > now)
                        .slice(0, 1);
                case 'current-quarter':
                    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
                    return this.availableSprints.filter(sprint => 
                        new Date(sprint.startDate) >= quarterStart && new Date(sprint.endDate) <= quarterEnd
                    );
                default:
                    return this.availableSprints.slice(0, 5);
            }
        },

        // Get sprint dates for planning
        getSprintDates(sprint) {
            const dates = [];
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                dates.push({
                    date: new Date(date),
                    dateStr: date.toISOString().split('T')[0],
                    dayName: date.toLocaleDateString('en', { weekday: 'short' }),
                    dayNumber: date.getDate(),
                    isWeekend: date.getDay() === 0 || date.getDay() === 6
                });
            }
            
            return dates;
        },

        // Get working days in sprint
        getSprintWorkingDays(sprint) {
            return this.getSprintDates(sprint).filter(date => !date.isWeekend);
        },

        // Switch sprint for planning
        switchSprint() {
            this.loadPlanningData();
            this.hasUnsavedChanges = false;
        },

        // Switch view mode
        switchViewMode() {
            this.loadPlanningData();
        },

        // Get member capacity for specific date (supports activity-based allocation)
        getMemberDateCapacity(memberId, date) {
            if (window.capacityPlannerManager) {
                return window.capacityPlannerManager.getMemberDateCapacity(memberId, date);
            }
            
            // Fallback to basic calculation
            if (!window.capacityTracker) return 0;
            const capacity = window.capacityTracker.getMemberEffectiveCapacity(memberId, this.currentSprintId);
            
            // Calculate daily capacity based on sprint length
            const sprint = this.availableSprints.find(s => s.id === this.currentSprintId);
            if (!sprint) return 0;
            
            const workingDays = this.getSprintWorkingDays(sprint).length;
            return workingDays > 0 ? capacity.effective / workingDays : 0;
        },

        // Update capacity for member/date (legacy support)
        updateCapacity(memberId, date, value) {
            // Mark as changed for save tracking
            this.hasUnsavedChanges = true;
            
            // Update temporary storage or call capacity tracker
            if (window.capacityPlannerManager) {
                const key = `${memberId}-${date}`;
                window.capacityPlannerManager.tempChanges.set(key, parseFloat(value) || 0);
                window.capacityPlannerManager.updateAnalytics();
            }
        },

        // Mark capacity as changed
        markChanged(memberId, date) {
            this.hasUnsavedChanges = true;
        },

        // Get capacity cell CSS class
        getCapacityCellClass(member, date) {
            let classes = 'capacity-cell relative border rounded p-2 min-h-[60px]';
            
            if (date.isWeekend) {
                classes += ' bg-gray-100';
            } else if (!member.isAvailableOnDate(date.dateStr)) {
                classes += ' bg-red-50 border-red-200';
            } else {
                const capacity = this.getMemberDateCapacity(member.id, date.dateStr);
                const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
                
                if (utilization > 95) {
                    classes += ' border-red-300 bg-red-50';
                } else if (utilization > 85) {
                    classes += ' border-orange-300 bg-orange-50';
                } else {
                    classes += ' border-green-300 bg-green-50';
                }
            }
            
            return classes;
        },

        // Get daily total capacity
        getDailyTotal(date) {
            let total = 0;
            this.planningTeamMembers.forEach(member => {
                if (!date.isWeekend && member.isAvailableOnDate && member.isAvailableOnDate(date)) {
                    total += this.getMemberDateCapacity(member.id, date);
                }
            });
            return Math.round(total * 10) / 10;
        },

        // Get optimization hint for member/date
        getOptimizationHint(memberId, date) {
            const capacity = this.getMemberDateCapacity(memberId, date);
            const member = this.activeTeamMembers.find(m => m.id === memberId);
            if (!member) return '';
            
            const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            
            if (utilization > this.optimizationTargets.maxUtilization) {
                return 'Over-allocated: Consider reducing capacity';
            } else if (utilization < 60) {
                return 'Under-utilized: Consider increasing capacity';
            }
            
            return '';
        },

        // Get optimization hint CSS class
        getOptimizationHintClass(memberId, date) {
            const hint = this.getOptimizationHint(memberId, date);
            if (hint.includes('Over-allocated')) return 'bg-red-500';
            if (hint.includes('Under-utilized')) return 'bg-blue-500';
            return 'bg-yellow-500';
        },

        // Save all changes
        saveChanges() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.saveChanges();
                this.hasUnsavedChanges = false;
            }
        },

        // Optimize capacity automatically
        optimizeCapacity() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.optimizeCapacity();
                this.hasUnsavedChanges = true;
            }
        },

        // Balance workload across team
        balanceWorkload() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.balanceWorkload();
                this.hasUnsavedChanges = true;
            }
        },

        // Reset to default values
        resetToDefaults() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.resetToDefaults();
                this.hasUnsavedChanges = false;
            }
        },

        // Toggle optimization display
        toggleOptimizations() {
            // Refresh display with new optimization settings
            this.loadPlanningData();
        },

        // Update optimization settings
        updateOptimization() {
            this.loadPlanningData();
        },

        // Individual analysis methods
        updateIndividualAnalysis() {
            if (!this.selectedMemberId) return;
            
            // Update individual capacity chart
            if (window.capacityDashboard) {
                window.capacityDashboard.updateIndividualAnalysis(this.selectedMemberId, this.showComparison);
            }
        },

        // Calculate efficiency
        calculateEfficiency(sprints) {
            if (sprints.length === 0) return 0;

            let totalEfficiency = 0;
            sprints.forEach(sprint => {
                if (!window.capacityTracker) return;
                
                const capacity = window.capacityTracker.calculateTeamCapacity(sprint.id);
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
        },

        // Handle activity capacity changes from ActivityCapacityCell components
        handleActivityCapacityChange(event) {
            const { memberId, date, totalCapacity, activities } = event.detail;
            this.hasUnsavedChanges = true;
            
            // Update dashboard stats if needed
            this.updateDashboard();
        },
        
        // Handle cell expansion changes
        handleCellExpansion(event) {
            const { memberId, date, expanded } = event.detail;
            // Could trigger UI adjustments if needed
        },
        
        // Handle drag and drop events
        handleDragOver(event) {
            event.preventDefault();
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.handleDragOver(event);
            }
        },

        handleDrop(event) {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.handleDrop(event);
                this.hasUnsavedChanges = true;
            }
        }
    };
}

// Enhanced capacity planner Alpine.js component
function capacityPlanner() {
    return {
        // Planner state
        currentSprintId: '',
        viewMode: 'week',
        selectedMembers: new Set(),
        hasUnsavedChanges: false,
        isDragging: false,
        dragMessage: '',
        showOptimizations: true,
        
        // Data
        availableSprints: [],
        planningDates: [],
        planningTeamMembers: [],
        optimizationTargets: {
            targetUtilization: 85,
            maxUtilization: 95,
            minUtilization: 60,
            balanceWorkload: true,
            respectTimeOff: true
        },

        // Initialize
        init() {
            // Delay initialization to ensure managers are available
            setTimeout(() => {
                this.loadData();
                this.updatePlanner();
            }, 100);
        },

        // Load data from main app and managers
        loadData() {
            // Try to get data from main app first
            if (window.sprintApp) {
                const app = Alpine.$data(document.querySelector('[x-data="sprintApp()"]'));
                if (app) {
                    this.availableSprints = app.sprints;
                    this.currentSprintId = app.getCurrentSprintId() || (app.sprints[0]?.id || '');
                }
            }
            
            // Fallback: load directly from managers if main app data is empty
            if (this.availableSprints.length === 0 && window.sprintManager) {
                this.availableSprints = window.sprintManager.getAllSprints();
                this.currentSprintId = this.availableSprints[0]?.id || '';
            }
            
            // Override with globally set sprint ID if available (from planner initialization)
            if (window._currentPlannerSprintId) {
                this.currentSprintId = window._currentPlannerSprintId;
                console.log(`Alpine component using planner sprint ID: ${this.currentSprintId}`);
            }
        },

        // Update planner
        updatePlanner() {
            this.loadPlanningData();
            this.generateOptimizationRecommendations();
        },

        // Load planning data
        loadPlanningData() {
            console.log(`Loading planning data for sprint: ${this.currentSprintId}`);
            console.log(`Available sprints: ${this.availableSprints.length}`);
            
            if (!this.currentSprintId) {
                console.warn('No current sprint ID available');
                return;
            }

            const sprint = this.availableSprints.find(s => s.id === this.currentSprintId);
            if (!sprint) {
                console.warn(`Sprint with ID ${this.currentSprintId} not found in available sprints`);
                return;
            }

            this.planningDates = this.getSprintDates(sprint);
            console.log(`Generated ${this.planningDates.length} planning dates`);
            
            if (window.teamManager) {
                this.planningTeamMembers = window.teamManager.getActiveTeamMembers();
                console.log(`Loaded ${this.planningTeamMembers.length} team members`);
            } else {
                console.error('teamManager not available');
            }
        },

        // Get sprint dates
        getSprintDates(sprint) {
            console.log(`Generating dates for sprint: ${sprint.name}, startDate: ${sprint.startDate}, endDate: ${sprint.endDate}, viewMode: ${this.viewMode}`);
            
            const dates = [];
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            
            console.log(`Sprint date range: ${start.toISOString()} to ${end.toISOString()}`);
            
            // Always show full sprint for now to ensure dates are generated
            // TODO: Implement week view properly later
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                dates.push(this.createDateObject(date));
            }
            
            console.log(`Generated ${dates.length} dates for sprint planning`);
            return dates;
        },

        // Create date object
        createDateObject(date) {
            return {
                date: new Date(date),
                dateStr: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en', { weekday: 'short' }),
                dayNumber: date.getDate(),
                isWeekend: date.getDay() === 0 || date.getDay() === 6
            };
        },

        // Switch sprint
        switchSprint() {
            this.hasUnsavedChanges = false;
            this.updatePlanner();
            
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.currentSprintId = this.currentSprintId;
                window.capacityPlannerManager.loadCapacityData();
            }
        },

        // Switch view mode
        switchViewMode() {
            this.updatePlanner();
        },

        // Get member capacity for date
        getMemberDateCapacity(memberId, dateStr) {
            if (window.capacityPlannerManager) {
                return window.capacityPlannerManager.getMemberDateCapacity(memberId, dateStr);
            }
            return 0;
        },

        // Update capacity
        updateCapacity(memberId, dateStr, value) {
            this.hasUnsavedChanges = true;
            if (window.capacityPlannerManager) {
                const key = `${memberId}-${dateStr}`;
                window.capacityPlannerManager.tempChanges.set(key, parseFloat(value) || 0);
            }
        },

        // Mark as changed
        markChanged(memberId, dateStr) {
            this.hasUnsavedChanges = true;
        },

        // Get capacity cell class
        getCapacityCellClass(member, date) {
            let classes = 'capacity-cell relative border rounded p-2 min-h-[60px] transition-colors';
            
            if (date.isWeekend) {
                classes += ' bg-gray-100 cursor-not-allowed';
            } else if (member.isAvailableOnDate && !member.isAvailableOnDate(date.dateStr)) {
                classes += ' bg-red-50 border-red-200';
            } else {
                const capacity = this.getMemberDateCapacity(member.id, date.dateStr);
                const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
                
                if (utilization > 95) {
                    classes += ' border-red-300 bg-red-50';
                } else if (utilization > 85) {
                    classes += ' border-orange-300 bg-orange-50';
                } else {
                    classes += ' border-green-300 bg-green-50';
                }
                
                classes += ' cursor-pointer hover:shadow-md';
            }
            
            return classes;
        },

        // Get daily total
        getDailyTotal(dateStr) {
            let total = 0;
            this.planningTeamMembers.forEach(member => {
                if (member.isAvailableOnDate && member.isAvailableOnDate(dateStr)) {
                    total += this.getMemberDateCapacity(member.id, dateStr);
                }
            });
            return Math.round(total * 10) / 10;
        },

        // Get optimization hint
        getOptimizationHint(memberId, dateStr) {
            const capacity = this.getMemberDateCapacity(memberId, dateStr);
            const member = this.planningTeamMembers.find(m => m.id === memberId);
            if (!member) return '';
            
            const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            
            if (utilization > this.optimizationTargets.maxUtilization) {
                return 'Over-allocated - consider reducing';
            } else if (utilization < this.optimizationTargets.minUtilization) {
                return 'Under-utilized - consider increasing';
            }
            
            return '';
        },

        // Get optimization hint class
        getOptimizationHintClass(memberId, dateStr) {
            const hint = this.getOptimizationHint(memberId, dateStr);
            if (hint.includes('Over-allocated')) return 'bg-red-500';
            if (hint.includes('Under-utilized')) return 'bg-blue-500';
            return 'bg-yellow-500';
        },

        // Handle activity capacity changes from ActivityCapacityCell components
        handleActivityCapacityChange(event) {
            const { memberId, date, totalCapacity, activities } = event.detail;
            this.hasUnsavedChanges = true;
        },
        
        // Handle cell expansion changes
        handleCellExpansion(event) {
            const { memberId, date, expanded } = event.detail;
            // Could trigger UI adjustments if needed
        },
        
        // Save changes
        saveChanges() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.saveChanges();
                this.hasUnsavedChanges = false;
            }
        },

        // Optimize capacity
        optimizeCapacity() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.optimizeCapacity();
                this.hasUnsavedChanges = true;
            }
        },

        // Balance workload
        balanceWorkload() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.balanceWorkload();
                this.hasUnsavedChanges = true;
            }
        },

        // Reset to defaults
        resetToDefaults() {
            if (window.capacityPlannerManager) {
                window.capacityPlannerManager.resetToDefaults();
                this.hasUnsavedChanges = false;
            }
        },

        // Toggle optimizations
        toggleOptimizations() {
            this.updatePlanner();
        },

        // Update optimization
        updateOptimization() {
            this.generateOptimizationRecommendations();
        },

        // Generate optimization recommendations
        generateOptimizationRecommendations() {
            const container = document.getElementById('optimizationRecommendations');
            if (!container) return;

            const recommendations = [];
            
            if (this.currentSprintId && window.capacityTracker) {
                const sprintRecommendations = window.capacityTracker.getCapacityRecommendations(this.currentSprintId);
                recommendations.push(...sprintRecommendations.suggestions);
            }

            if (recommendations.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">No optimization recommendations at this time</p>';
                return;
            }

            container.innerHTML = recommendations.map(rec => 
                `<div class="text-sm text-blue-600 bg-blue-50 p-2 rounded">• ${rec}</div>`
            ).join('');
        },

        // Drag and drop handlers
        handleDragOver(event) {
            event.preventDefault();
        },

        handleDrop(event) {
            event.preventDefault();
            this.hasUnsavedChanges = true;
        }
    };
}

// Make components available globally (avoid name collision with dashboard class)
window.capacityDashboardComponent = capacityDashboard;
window.capacityPlannerComponent = capacityPlanner;