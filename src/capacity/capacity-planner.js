/**
 * Interactive Capacity Planner
 * Drag-and-drop capacity allocation, daily planning, and team optimization tools.
 * Provides interactive capacity management for product managers.
 */

class CapacityPlanner {
    constructor() {
        this.capacityTracker = window.capacityTracker;
        this.teamManager = window.teamManager;
        this.sprintManager = window.sprintManager;
        
        // Planner state
        this.currentSprintId = null;
        this.selectedDate = null;
        this.draggedElement = null;
        this.capacityData = {};
        this.tempChanges = new Map(); // Track unsaved changes
        
        // UI state
        this.viewMode = 'week'; // week, sprint, custom
        this.selectedMembers = new Set();
        this.showOptimizations = true;
        
        // Optimization settings
        this.optimizationTargets = {
            targetUtilization: 85,
            maxUtilization: 95,
            minUtilization: 60,
            balanceWorkload: true,
            respectTimeOff: true
        };
        
        // Bind methods
        this.initializePlanner = this.initializePlanner.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    /**
     * Initialize the capacity planner
     * @param {string} containerId - Container element ID
     * @param {string} sprintId - Initial sprint ID
     */
    initializePlanner(containerId, sprintId = null) {
        try {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error(`Container ${containerId} not found`);
                return false;
            }

            this.currentSprintId = sprintId || this.getDefaultSprintId();
            this.loadCapacityData();
            this.renderPlanner();
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize capacity planner:', error);
            return false;
        }
    }

    /**
     * Render the capacity planner interface
     */
    renderPlanner() {
        // Store the sprint ID globally so Alpine component can access it
        window._currentPlannerSprintId = this.currentSprintId;
        
        this.container.innerHTML = `
            <div class="capacity-planner" x-data="capacityPlannerComponent()">
                <!-- Planner Header -->
                <div class="planner-header bg-white rounded-lg shadow-md p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-gray-900">Interactive Capacity Planner</h3>
                        <div class="flex items-center space-x-4">
                            <select x-model="currentSprintId" @change="switchSprint()" 
                                    class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="">Select Sprint</option>
                                <template x-for="sprint in availableSprints" :key="sprint.id">
                                    <option :value="sprint.id" x-text="sprint.name"></option>
                                </template>
                            </select>
                            <select x-model="viewMode" @change="switchViewMode()" 
                                    class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                                <option value="week">Weekly View</option>
                                <option value="sprint">Sprint View</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <button @click="saveChanges()" 
                                    :disabled="!hasUnsavedChanges"
                                    :class="hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'"
                                    class="text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="flex items-center space-x-4 text-sm">
                        <button @click="optimizeCapacity()" 
                                class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md">
                            Auto-Optimize
                        </button>
                        <button @click="balanceWorkload()" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md">
                            Balance Team
                        </button>
                        <button @click="resetToDefaults()" 
                                class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md">
                            Reset to Defaults
                        </button>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" x-model="showOptimizations" @change="toggleOptimizations()">
                            <span>Show Optimization Hints</span>
                        </label>
                    </div>
                </div>

                <!-- Capacity Planning Grid -->
                <div class="planning-grid bg-white rounded-lg shadow-md p-6 mb-6">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Daily Capacity Allocation</h4>
                    
                    <!-- Date Header -->
                    <div class="grid grid-cols-8 gap-2 mb-4">
                        <div class="text-sm font-medium text-gray-700 p-2">Team Member</div>
                        <template x-for="date in planningDates" :key="date.dateStr">
                            <div class="text-center text-sm font-medium text-gray-700 p-2 border rounded"
                                 :class="date.isWeekend ? 'bg-gray-100' : 'bg-blue-50'">
                                <div x-text="date.dayName"></div>
                                <div x-text="date.dayNumber" class="text-xs text-gray-500"></div>
                            </div>
                        </template>
                    </div>

                    <!-- Team Member Rows -->
                    <div class="space-y-2">
                        <template x-for="member in planningTeamMembers" :key="member.id">
                            <div class="grid grid-cols-8 gap-2 items-center">
                                <!-- Member Info -->
                                <div class="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                    <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center"
                                         x-text="member.name.charAt(0)"></div>
                                    <div>
                                        <div class="text-sm font-medium" x-text="member.name"></div>
                                        <div class="text-xs text-gray-500" x-text="member.role"></div>
                                    </div>
                                </div>

                                <!-- Enhanced Activity Capacity Cells -->
                                <template x-for="date in planningDates" :key="\`\${member.id}-\${date.dateStr}\`">
                                    <div class="activity-capacity-cell-container"
                                         :data-member-id="member.id"
                                         :data-date="date.dateStr"
                                         @dragover.prevent="handleDragOver"
                                         @drop="handleDrop"
                                         @capacityChanged="handleActivityCapacityChange"
                                         @cellExpanded="handleCellExpansion">
                                        <!-- ActivityCapacityCell will be rendered here by initializeActivityCells -->
                                    </div>
                                </template>
                            </div>
                        </template>
                    </div>

                    <!-- Totals Row -->
                    <div class="grid grid-cols-8 gap-2 mt-4 pt-4 border-t">
                        <div class="text-sm font-medium text-gray-700 p-2">Daily Totals</div>
                        <template x-for="date in planningDates" :key="date.dateStr">
                            <div class="text-center p-2 border rounded bg-gray-50">
                                <div class="text-sm font-medium" x-text="getDailyTotal(date.dateStr)"></div>
                                <div class="text-xs text-gray-500">points</div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Capacity Analytics -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Utilization Chart -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h4 class="text-lg font-medium text-gray-900 mb-4">Team Utilization</h4>
                        <canvas id="utilizationChart" width="400" height="200"></canvas>
                    </div>

                    <!-- Workload Balance -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h4 class="text-lg font-medium text-gray-900 mb-4">Workload Balance</h4>
                        <div id="workloadBalance" class="space-y-3"></div>
                    </div>
                </div>

                <!-- Optimization Panel -->
                <div x-show="showOptimizations" class="optimization-panel bg-white rounded-lg shadow-md p-6">
                    <h4 class="text-lg font-medium text-gray-900 mb-4">Optimization Recommendations</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Optimization Settings -->
                        <div>
                            <h5 class="text-md font-medium text-gray-700 mb-3">Optimization Targets</h5>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm text-gray-600 mb-1">Target Utilization (%)</label>
                                    <input type="range" min="60" max="100" step="5" 
                                           x-model="optimizationTargets.targetUtilization"
                                           @input="updateOptimization()"
                                           class="w-full">
                                    <div class="text-sm text-gray-500" x-text="optimizationTargets.targetUtilization + '%'"></div>
                                </div>
                                <div>
                                    <label class="block text-sm text-gray-600 mb-1">Max Utilization (%)</label>
                                    <input type="range" min="80" max="120" step="5" 
                                           x-model="optimizationTargets.maxUtilization"
                                           @input="updateOptimization()"
                                           class="w-full">
                                    <div class="text-sm text-gray-500" x-text="optimizationTargets.maxUtilization + '%'"></div>
                                </div>
                                <div class="space-y-2">
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" x-model="optimizationTargets.balanceWorkload">
                                        <span class="text-sm text-gray-600">Balance workload across team</span>
                                    </label>
                                    <label class="flex items-center space-x-2">
                                        <input type="checkbox" x-model="optimizationTargets.respectTimeOff">
                                        <span class="text-sm text-gray-600">Respect time off periods</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Optimization Results -->
                        <div>
                            <h5 class="text-md font-medium text-gray-700 mb-3">Recommendations</h5>
                            <div id="optimizationRecommendations" class="space-y-2"></div>
                        </div>
                    </div>
                </div>

                <!-- Drag and Drop Helper -->
                <div x-show="isDragging" 
                     class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                        <span x-text="dragMessage"></span>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize activity capacity cells after rendering
        // Delay to ensure Alpine.js component is fully initialized
        setTimeout(() => {
            this.waitForAlpineAndInitialize();
        }, 300);
    }

    /**
     * Wait for Alpine component to have data, then initialize activity cells
     */
    waitForAlpineAndInitialize() {
        const alpineElement = this.container.querySelector('[x-data="capacityPlannerComponent()"]');
        
        if (!alpineElement) {
            console.error('Alpine element not found');
            return;
        }
        
        // Try to get Alpine component data
        try {
            const alpineData = Alpine.$data(alpineElement);
            
            console.log('Alpine component data:', {
                currentSprintId: alpineData.currentSprintId,
                availableSprints: alpineData.availableSprints.length,
                planningDates: alpineData.planningDates.length,
                planningTeamMembers: alpineData.planningTeamMembers.length
            });
            
            // Check if Alpine component has the data we need
            if (alpineData.planningTeamMembers.length > 0 && alpineData.planningDates.length > 0) {
                console.log('Alpine component has data, initializing activity cells...');
                this.initializeActivityCells();
            } else {
                console.log('Alpine component missing data, retrying in 500ms...');
                setTimeout(() => {
                    this.waitForAlpineAndInitialize();
                }, 500);
            }
        } catch (error) {
            console.error('Error accessing Alpine data:', error);
            // Retry after delay
            setTimeout(() => {
                this.waitForAlpineAndInitialize();
            }, 500);
        }
    }

    /**
     * Initialize ActivityCapacityCell components for each member-date combination
     */
    initializeActivityCells() {
        console.log('Initializing ActivityCapacityCell components...');
        const cellContainers = this.container.querySelectorAll('.activity-capacity-cell-container');
        console.log(`Found ${cellContainers.length} activity cell containers`);
        
        if (cellContainers.length === 0) {
            console.warn('No activity cell containers found. Checking if Alpine component has rendered...');
            // Retry after another short delay if no containers found
            setTimeout(() => {
                const retryContainers = this.container.querySelectorAll('.activity-capacity-cell-container');
                if (retryContainers.length === 0) {
                    console.error('Still no activity cell containers found after retry.');
                } else {
                    console.log(`Retry found ${retryContainers.length} containers, initializing...`);
                    this.initializeActivityCellsFromContainers(retryContainers);
                }
            }, 300);
            return;
        }
        
        this.initializeActivityCellsFromContainers(cellContainers);
    }
    
    /**
     * Initialize ActivityCapacityCell components from provided containers
     */
    initializeActivityCellsFromContainers(cellContainers) {
        cellContainers.forEach(container => {
            const memberId = container.dataset.memberId;
            const date = container.dataset.date;
            
            console.log(`Initializing cell for member ${memberId} on ${date}`);
            
            if (memberId && date) {
                // Create ActivityCapacityCell instance
                const activityCell = new window.ActivityCapacityCell(memberId, date, container);
                
                // Store reference for later access
                container._activityCell = activityCell;
                
                // Set up drag and drop for the activity cell
                this.setupActivityCellDragAndDrop(container, memberId, date);
            }
        });
        
        console.log(`Successfully initialized ${cellContainers.length} ActivityCapacityCell components`);
    }
    
    /**
     * Set up drag and drop for activity capacity cells
     */
    setupActivityCellDragAndDrop(container, memberId, date) {
        const activityCell = container.querySelector('.activity-capacity-cell');
        if (activityCell) {
            activityCell.addEventListener('dragstart', (e) => {
                const capacity = this.getMemberDateCapacity(memberId, date);
                this.draggedElement = { memberId, date, capacity, element: container };
                
                e.dataTransfer.setData('text/plain', JSON.stringify({ memberId, date, capacity }));
                activityCell.classList.add('dragging');
                this.isDragging = true;
            });
            
            activityCell.addEventListener('dragend', () => {
                activityCell.classList.remove('dragging');
                this.clearDragState();
            });
        }
    }
    
    /**
     * Handle activity capacity changes from ActivityCapacityCell components
     */
    handleActivityCapacityChange(event) {
        const { memberId, date, totalCapacity, activities } = event.detail;
        
        // Update temp changes to reflect new total capacity
        const key = `${memberId}-${date}`;
        this.tempChanges.set(key, totalCapacity);
        
        // Update analytics and UI
        this.updateAnalytics();
        this.updateUI();
        
        // Dispatch capacity change event for other components
        window.dispatchEvent(new CustomEvent('capacityChanged', {
            detail: { memberId, date, totalCapacity, activities }
        }));
    }
    
    /**
     * Handle cell expansion changes
     */
    handleCellExpansion(event) {
        const { memberId, date, expanded } = event.detail;
        
        // If this cell expanded, collapse others to save screen space
        if (expanded) {
            const allContainers = this.container.querySelectorAll('.activity-capacity-cell-container');
            allContainers.forEach(container => {
                if (container._activityCell && 
                    (container.dataset.memberId !== memberId || container.dataset.date !== date)) {
                    if (container._activityCell.isExpanded) {
                        container._activityCell.toggleExpanded();
                    }
                }
            });
        }
    }
    
    /**
     * Refresh all activity cells (useful after data changes)
     */
    refreshActivityCells() {
        const containers = this.container.querySelectorAll('.activity-capacity-cell-container');
        containers.forEach(container => {
            if (container._activityCell) {
                container._activityCell.refresh();
            }
        });
    }

    /**
     * Set up event listeners for drag and drop with mobile touch support
     */
    setupEventListeners() {
        // Enhanced drag and drop for capacity cells
        this.container.addEventListener('dragstart', this.handleDragStart);
        this.container.addEventListener('dragover', this.handleDragOver);
        this.container.addEventListener('drop', this.handleDrop);
        this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
        
        // Mobile touch support
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Enhanced visual feedback
        this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 's':
                        event.preventDefault();
                        this.saveChanges();
                        break;
                    case 'z':
                        event.preventDefault();
                        this.undoLastChange();
                        break;
                    case 'o':
                        event.preventDefault();
                        this.optimizeCapacity();
                        break;
                    case 'b':
                        event.preventDefault();
                        this.balanceWorkload();
                        break;
                }
            }
        });

        // Listen for external changes
        window.addEventListener('capacityChanged', () => {
            this.loadCapacityData();
        });

        window.addEventListener('teamChanged', () => {
            this.loadCapacityData();
        });
        
        // Window resize for responsive adjustments
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Handle touch start for mobile drag and drop
     */
    handleTouchStart(event) {
        const cell = event.target.closest('.capacity-cell');
        if (!cell || cell.querySelector('input')?.disabled) return;
        
        event.preventDefault();
        
        const touch = event.touches[0];
        const memberId = cell.dataset.memberId;
        const date = cell.dataset.date;
        const capacity = this.getMemberDateCapacity(memberId, date);
        
        this.touchData = {
            startX: touch.clientX,
            startY: touch.clientY,
            memberId,
            date,
            capacity,
            element: cell,
            isDragging: false
        };
        
        // Add touch feedback
        cell.classList.add('touch-active');
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    /**
     * Handle touch move for mobile drag and drop
     */
    handleTouchMove(event) {
        if (!this.touchData) return;
        
        event.preventDefault();
        
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchData.startX);
        const deltaY = Math.abs(touch.clientY - this.touchData.startY);
        
        // Start dragging if moved enough
        if (!this.touchData.isDragging && (deltaX > 10 || deltaY > 10)) {
            this.touchData.isDragging = true;
            this.touchData.element.classList.add('dragging');
            this.showDragHelper(touch.clientX, touch.clientY);
        }
        
        if (this.touchData.isDragging) {
            this.updateDragHelper(touch.clientX, touch.clientY);
            
            // Find drop target
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const dropTarget = elementBelow?.closest('.capacity-cell');
            
            // Clear previous highlights
            document.querySelectorAll('.capacity-cell').forEach(cell => {
                cell.classList.remove('drop-target');
            });
            
            // Highlight valid drop target
            if (dropTarget && this.isValidTouchDropTarget(dropTarget)) {
                dropTarget.classList.add('drop-target');
            }
        }
    }
    
    /**
     * Handle touch end for mobile drag and drop
     */
    handleTouchEnd(event) {
        if (!this.touchData) return;
        
        event.preventDefault();
        
        if (this.touchData.isDragging) {
            const touch = event.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const dropTarget = elementBelow?.closest('.capacity-cell');
            
            if (dropTarget && this.isValidTouchDropTarget(dropTarget)) {
                const targetMemberId = dropTarget.dataset.memberId;
                const targetDate = dropTarget.dataset.date;
                
                this.reallocateCapacity(
                    this.touchData.memberId,
                    this.touchData.date,
                    targetMemberId,
                    targetDate,
                    this.touchData.capacity
                );
                
                // Success haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
            
            this.hideDragHelper();
        }
        
        // Clean up touch state
        this.clearTouchState();
    }
    
    /**
     * Check if touch drop target is valid
     */
    isValidTouchDropTarget(dropTarget) {
        if (!this.touchData) return false;
        
        const targetMemberId = dropTarget.dataset.memberId;
        const targetDate = dropTarget.dataset.date;
        
        return this.isValidDropTarget(targetMemberId, targetDate);
    }
    
    /**
     * Clear touch interaction state
     */
    clearTouchState() {
        if (this.touchData) {
            this.touchData.element?.classList.remove('touch-active', 'dragging');
        }
        
        document.querySelectorAll('.capacity-cell').forEach(cell => {
            cell.classList.remove('drop-target', 'touch-active');
        });
        
        this.touchData = null;
    }
    
    /**
     * Show drag helper for touch interactions
     */
    showDragHelper(x, y) {
        const helper = document.createElement('div');
        helper.id = 'touch-drag-helper';
        helper.className = 'fixed pointer-events-none z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium';
        helper.style.left = `${x + 10}px`;
        helper.style.top = `${y - 30}px`;
        helper.textContent = `Moving ${this.touchData.capacity} pts`;
        
        document.body.appendChild(helper);
    }
    
    /**
     * Update drag helper position
     */
    updateDragHelper(x, y) {
        const helper = document.getElementById('touch-drag-helper');
        if (helper) {
            helper.style.left = `${x + 10}px`;
            helper.style.top = `${y - 30}px`;
        }
    }
    
    /**
     * Hide drag helper
     */
    hideDragHelper() {
        const helper = document.getElementById('touch-drag-helper');
        if (helper) {
            helper.remove();
        }
    }
    
    /**
     * Handle mouse enter for enhanced visual feedback
     */
    handleMouseEnter(event) {
        const cell = event.target.closest('.capacity-cell');
        if (!cell || cell.querySelector('input')?.disabled) return;
        
        const memberId = cell.dataset.memberId;
        const date = cell.dataset.date;
        const member = this.teamManager.getTeamMemberById(memberId);
        const capacity = this.getMemberDateCapacity(memberId, date);
        
        if (member) {
            const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            
            // Show hover tooltip
            this.showHoverTooltip(event, {
                memberName: member.name,
                capacity: capacity,
                utilization: utilization.toFixed(1),
                date: new Date(date).toLocaleDateString()
            });
        }
    }
    
    /**
     * Handle mouse leave to hide tooltips
     */
    handleMouseLeave(event) {
        const cell = event.target.closest('.capacity-cell');
        if (cell) {
            this.hideHoverTooltip();
        }
    }
    
    /**
     * Show hover tooltip
     */
    showHoverTooltip(event, data) {
        let tooltip = document.getElementById('capacity-hover-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'capacity-hover-tooltip';
            tooltip.className = 'fixed pointer-events-none z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <div class="font-medium">${data.memberName}</div>
            <div>${data.date}</div>
            <div>Capacity: ${data.capacity} pts</div>
            <div>Utilization: ${data.utilization}%</div>
        `;
        
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY - 10}px`;
        tooltip.style.display = 'block';
    }
    
    /**
     * Hide hover tooltip
     */
    hideHoverTooltip() {
        const tooltip = document.getElementById('capacity-hover-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    /**
     * Handle window resize for responsive adjustments
     */
    handleResize() {
        // Update chart dimensions if needed
        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.resize) {
                    chart.resize();
                }
            });
        }
    }

    /**
     * Load capacity data for current sprint
     */
    loadCapacityData() {
        try {
            if (!this.currentSprintId) return;

            const sprint = this.sprintManager.getSprintById(this.currentSprintId);
            if (!sprint) return;

            this.capacityData = {};
            const teamMembers = this.teamManager.getActiveTeamMembers();
            const sprintDates = this.getSprintDates(sprint);

            teamMembers.forEach(member => {
                this.capacityData[member.id] = {};
                sprintDates.forEach(date => {
                    // Check for activity-based capacity first
                    let dailyCapacity = 0;
                    if (window.capacityTracker) {
                        const activities = window.capacityTracker.getMemberDateActivities(member.id, date.dateStr);
                        if (activities && activities.length > 0) {
                            dailyCapacity = activities.reduce((total, activity) => total + activity.capacity, 0);
                        } else {
                            // Fall back to default capacity calculation
                            const capacity = this.capacityTracker.getMemberEffectiveCapacity(member.id, this.currentSprintId);
                            dailyCapacity = this.calculateDailyCapacity(capacity, date, sprint);
                        }
                    } else {
                        // Legacy fallback
                        const capacity = this.capacityTracker.getMemberEffectiveCapacity(member.id, this.currentSprintId);
                        dailyCapacity = this.calculateDailyCapacity(capacity, date, sprint);
                    }
                    
                    this.capacityData[member.id][date.dateStr] = dailyCapacity;
                });
            });

            this.tempChanges.clear();
            this.updateUI();
            
            // Refresh activity cells if they exist
            if (this.container) {
                setTimeout(() => this.refreshActivityCells(), 100);
            }
        } catch (error) {
            console.error('Failed to load capacity data:', error);
        }
    }

    /**
     * Handle drag start for capacity reallocation
     * @param {Event} event - Drag event
     */
    handleDragStart(event) {
        const cell = event.target.closest('.capacity-cell');
        if (!cell) return;

        const memberId = cell.dataset.memberId;
        const date = cell.dataset.date;
        const capacity = this.getMemberDateCapacity(memberId, date);

        this.draggedElement = {
            memberId,
            date,
            capacity,
            element: cell
        };

        event.dataTransfer.setData('text/plain', JSON.stringify({
            memberId,
            date,
            capacity
        }));

        cell.classList.add('dragging');
        this.isDragging = true;
    }

    /**
     * Handle drag over for drop targets
     * @param {Event} event - Drag event
     */
    handleDragOver(event) {
        event.preventDefault();
        const cell = event.target.closest('.capacity-cell');
        if (!cell || !this.draggedElement) return;

        // Check if valid drop target
        const targetMemberId = cell.dataset.memberId;
        const targetDate = cell.dataset.date;
        
        if (this.isValidDropTarget(targetMemberId, targetDate)) {
            cell.classList.add('drop-target');
            event.dataTransfer.dropEffect = 'move';
        } else {
            event.dataTransfer.dropEffect = 'none';
        }
    }

    /**
     * Handle drop for capacity reallocation
     * @param {Event} event - Drop event
     */
    handleDrop(event) {
        event.preventDefault();
        const cell = event.target.closest('.capacity-cell');
        if (!cell || !this.draggedElement) return;

        const targetMemberId = cell.dataset.memberId;
        const targetDate = cell.dataset.date;

        if (this.isValidDropTarget(targetMemberId, targetDate)) {
            this.reallocateCapacity(
                this.draggedElement.memberId,
                this.draggedElement.date,
                targetMemberId,
                targetDate,
                this.draggedElement.capacity
            );
        }

        this.clearDragState();
    }

    /**
     * Handle drag end cleanup
     */
    handleDragEnd() {
        this.clearDragState();
    }

    /**
     * Clear drag state and visual indicators
     */
    clearDragState() {
        document.querySelectorAll('.capacity-cell').forEach(cell => {
            cell.classList.remove('dragging', 'drop-target');
        });
        
        this.draggedElement = null;
        this.isDragging = false;
    }

    /**
     * Check if target is valid for capacity drop
     * @param {string} targetMemberId - Target member ID
     * @param {string} targetDate - Target date
     * @returns {boolean} Whether target is valid
     */
    isValidDropTarget(targetMemberId, targetDate) {
        if (!this.draggedElement) return false;
        
        // Can't drop on same cell
        if (targetMemberId === this.draggedElement.memberId && 
            targetDate === this.draggedElement.date) {
            return false;
        }

        // Check if member is available on target date
        const member = this.teamManager.getTeamMemberById(targetMemberId);
        if (!member || !member.isAvailableOnDate(targetDate)) {
            return false;
        }

        // Check if target date is a weekend
        const date = new Date(targetDate);
        if (date.getDay() === 0 || date.getDay() === 6) {
            return false;
        }

        return true;
    }

    /**
     * Reallocate capacity between team members/dates
     * @param {string} sourceMemberId - Source member ID
     * @param {string} sourceDate - Source date
     * @param {string} targetMemberId - Target member ID
     * @param {string} targetDate - Target date
     * @param {number} capacity - Capacity to move
     */
    reallocateCapacity(sourceMemberId, sourceDate, targetMemberId, targetDate, capacity) {
        try {
            // Move capacity from source to target
            const sourceKey = `${sourceMemberId}-${sourceDate}`;
            const targetKey = `${targetMemberId}-${targetDate}`;

            // Get current values
            const sourceCapacity = this.getMemberDateCapacity(sourceMemberId, sourceDate);
            const targetCapacity = this.getMemberDateCapacity(targetMemberId, targetDate);

            // Calculate new values
            const transferAmount = Math.min(capacity, sourceCapacity);
            const newSourceCapacity = sourceCapacity - transferAmount;
            const newTargetCapacity = targetCapacity + transferAmount;

            // Update temp changes
            this.tempChanges.set(sourceKey, newSourceCapacity);
            this.tempChanges.set(targetKey, newTargetCapacity);

            // Update UI
            this.updateCapacityCell(sourceMemberId, sourceDate, newSourceCapacity);
            this.updateCapacityCell(targetMemberId, targetDate, newTargetCapacity);
            this.updateAnalytics();

            // Show success message
            this.showMessage(`Moved ${transferAmount} points from ${this.getMemberName(sourceMemberId)} to ${this.getMemberName(targetMemberId)}`, 'success');
        } catch (error) {
            console.error('Failed to reallocate capacity:', error);
            this.showMessage('Failed to reallocate capacity', 'error');
        }
    }

    /**
     * Optimize capacity allocation automatically
     */
    optimizeCapacity() {
        try {
            const optimization = this.calculateOptimization();
            if (!optimization.changes.length) {
                this.showMessage('Capacity is already optimized', 'info');
                return;
            }

            // Apply optimization changes
            optimization.changes.forEach(change => {
                const key = `${change.memberId}-${change.date}`;
                this.tempChanges.set(key, change.newCapacity);
                this.updateCapacityCell(change.memberId, change.date, change.newCapacity);
            });

            this.updateAnalytics();
            this.showMessage(`Applied ${optimization.changes.length} optimization changes`, 'success');
        } catch (error) {
            console.error('Failed to optimize capacity:', error);
            this.showMessage('Failed to optimize capacity', 'error');
        }
    }

    /**
     * Calculate optimization recommendations
     * @returns {Object} Optimization data
     */
    calculateOptimization() {
        const changes = [];
        const teamMembers = this.teamManager.getActiveTeamMembers();
        const dates = this.getPlanningDates();

        // Analyze current allocation
        dates.forEach(date => {
            if (date.isWeekend) return;

            const dailyAllocations = [];
            let totalCapacity = 0;

            teamMembers.forEach(member => {
                if (member.isAvailableOnDate(date.dateStr)) {
                    const capacity = this.getMemberDateCapacity(member.id, date.dateStr);
                    const utilization = (capacity / member.defaultCapacity) * 100;
                    
                    dailyAllocations.push({
                        memberId: member.id,
                        capacity,
                        utilization,
                        defaultCapacity: member.defaultCapacity
                    });
                    
                    totalCapacity += capacity;
                }
            });

            // Find optimization opportunities
            const overAllocated = dailyAllocations.filter(a => 
                a.utilization > this.optimizationTargets.maxUtilization);
            const underAllocated = dailyAllocations.filter(a => 
                a.utilization < this.optimizationTargets.minUtilization);

            // Balance workload if enabled
            if (this.optimizationTargets.balanceWorkload && overAllocated.length && underAllocated.length) {
                this.balanceDailyWorkload(overAllocated, underAllocated, date.dateStr, changes);
            }
        });

        return {
            changes,
            summary: this.generateOptimizationSummary(changes)
        };
    }

    /**
     * Balance workload for a specific day
     * @param {Array} overAllocated - Over-allocated members
     * @param {Array} underAllocated - Under-allocated members
     * @param {string} date - Date string
     * @param {Array} changes - Changes array to populate
     */
    balanceDailyWorkload(overAllocated, underAllocated, date, changes) {
        overAllocated.forEach(over => {
            const excessCapacity = over.capacity - (over.defaultCapacity * this.optimizationTargets.targetUtilization / 100);
            
            if (excessCapacity > 0.5) {
                // Find best recipient
                const recipient = underAllocated.find(under => {
                    const targetCapacity = under.defaultCapacity * this.optimizationTargets.targetUtilization / 100;
                    const availableCapacity = targetCapacity - under.capacity;
                    return availableCapacity >= 0.5;
                });

                if (recipient) {
                    const transferAmount = Math.min(
                        excessCapacity,
                        recipient.defaultCapacity * this.optimizationTargets.targetUtilization / 100 - recipient.capacity,
                        2 // Limit transfer to 2 points at a time
                    );

                    if (transferAmount >= 0.5) {
                        changes.push({
                            type: 'reduce',
                            memberId: over.memberId,
                            date,
                            currentCapacity: over.capacity,
                            newCapacity: over.capacity - transferAmount,
                            reason: `Reduce overallocation (${Math.round(over.utilization)}%)`
                        });

                        changes.push({
                            type: 'increase',
                            memberId: recipient.memberId,
                            date,
                            currentCapacity: recipient.capacity,
                            newCapacity: recipient.capacity + transferAmount,
                            reason: `Balance workload from overallocated member`
                        });

                        // Update working data
                        over.capacity -= transferAmount;
                        over.utilization = (over.capacity / over.defaultCapacity) * 100;
                        recipient.capacity += transferAmount;
                        recipient.utilization = (recipient.capacity / recipient.defaultCapacity) * 100;
                    }
                }
            }
        });
    }

    /**
     * Generate optimization summary
     * @param {Array} changes - Optimization changes
     * @returns {Object} Summary data
     */
    generateOptimizationSummary(changes) {
        const summary = {
            totalChanges: changes.length,
            capacityMoved: 0,
            membersAffected: new Set(),
            utilizationImprovement: 0
        };

        changes.forEach(change => {
            summary.membersAffected.add(change.memberId);
            if (change.type === 'reduce') {
                summary.capacityMoved += change.currentCapacity - change.newCapacity;
            }
        });

        summary.membersAffected = summary.membersAffected.size;
        return summary;
    }

    /**
     * Balance team workload evenly
     */
    balanceWorkload() {
        try {
            const dates = this.getPlanningDates().filter(d => !d.isWeekend);
            const teamMembers = this.teamManager.getActiveTeamMembers();
            let totalChanges = 0;

            dates.forEach(date => {
                const availableMembers = teamMembers.filter(member => 
                    member.isAvailableOnDate(date.dateStr));
                
                if (availableMembers.length < 2) return;

                // Calculate total capacity for the day
                const totalCapacity = availableMembers.reduce((sum, member) => 
                    sum + this.getMemberDateCapacity(member.id, date.dateStr), 0);

                // Calculate target per member (weighted by default capacity)
                const totalDefaultCapacity = availableMembers.reduce((sum, member) => 
                    sum + member.defaultCapacity, 0);

                availableMembers.forEach(member => {
                    const memberWeight = member.defaultCapacity / totalDefaultCapacity;
                    const targetCapacity = totalCapacity * memberWeight;
                    const currentCapacity = this.getMemberDateCapacity(member.id, date.dateStr);
                    
                    if (Math.abs(currentCapacity - targetCapacity) > 0.5) {
                        const key = `${member.id}-${date.dateStr}`;
                        this.tempChanges.set(key, Math.round(targetCapacity * 2) / 2); // Round to 0.5
                        this.updateCapacityCell(member.id, date.dateStr, Math.round(targetCapacity * 2) / 2);
                        totalChanges++;
                    }
                });
            });

            this.updateAnalytics();
            this.showMessage(`Balanced workload across team (${totalChanges} changes)`, 'success');
        } catch (error) {
            console.error('Failed to balance workload:', error);
            this.showMessage('Failed to balance workload', 'error');
        }
    }

    /**
     * Reset capacity to default values
     */
    resetToDefaults() {
        try {
            this.tempChanges.clear();
            this.loadCapacityData();
            this.showMessage('Reset to default capacity allocation', 'info');
        } catch (error) {
            console.error('Failed to reset to defaults:', error);
        }
    }

    /**
     * Save all pending changes
     */
    saveChanges() {
        try {
            if (this.tempChanges.size === 0) {
                this.showMessage('No changes to save', 'info');
                return;
            }

            let savedCount = 0;
            
            for (const [key, capacity] of this.tempChanges) {
                const [memberId, date] = key.split('-');
                
                // Set capacity override
                const result = this.capacityTracker.setMemberSprintCapacity(
                    memberId, 
                    this.currentSprintId, 
                    capacity, 
                    'Planner adjustment'
                );
                
                if (result.success) {
                    savedCount++;
                }
            }

            this.tempChanges.clear();
            this.showMessage(`Saved ${savedCount} capacity changes`, 'success');

            // Reload to reflect saved changes
            this.loadCapacityData();
        } catch (error) {
            console.error('Failed to save changes:', error);
            this.showMessage('Failed to save changes', 'error');
        }
    }

    /**
     * Update capacity cell in UI
     * @param {string} memberId - Member ID
     * @param {string} date - Date string
     * @param {number} capacity - New capacity value
     */
    updateCapacityCell(memberId, date, capacity) {
        const input = this.container.querySelector(
            `input[data-member-id="${memberId}"][data-date="${date}"]`
        );
        if (input) {
            input.value = capacity;
            input.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Get member's capacity for specific date
     * @param {string} memberId - Member ID
     * @param {string} date - Date string
     * @returns {number} Capacity value
     */
    getMemberDateCapacity(memberId, date) {
        const key = `${memberId}-${date}`;
        if (this.tempChanges.has(key)) {
            return this.tempChanges.get(key);
        }
        
        // Check if we have activity-based capacity
        if (window.capacityTracker) {
            const activities = window.capacityTracker.getMemberDateActivities(memberId, date);
            if (activities && activities.length > 0) {
                return activities.reduce((total, activity) => total + activity.capacity, 0);
            }
        }
        
        return this.capacityData[memberId]?.[date] || 0;
    }

    /**
     * Get member name by ID
     * @param {string} memberId - Member ID
     * @returns {string} Member name
     */
    getMemberName(memberId) {
        const member = this.teamManager.getTeamMemberById(memberId);
        return member ? member.name : 'Unknown';
    }

    /**
     * Calculate daily capacity for member
     * @param {Object} capacity - Capacity data
     * @param {Object} date - Date object
     * @param {Object} sprint - Sprint object
     * @returns {number} Daily capacity
     */
    calculateDailyCapacity(capacity, date, sprint) {
        if (date.isWeekend) return 0;
        
        const workingDays = this.getSprintWorkingDays(sprint).length;
        return workingDays > 0 ? capacity.effective / workingDays : 0;
    }

    /**
     * Get sprint dates for planning
     * @param {Object} sprint - Sprint object
     * @returns {Array} Array of date objects
     */
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
    }

    /**
     * Get working days in sprint
     * @param {Object} sprint - Sprint object
     * @returns {Array} Working days
     */
    getSprintWorkingDays(sprint) {
        return this.getSprintDates(sprint).filter(date => !date.isWeekend);
    }

    /**
     * Get planning dates based on view mode
     * @returns {Array} Planning dates
     */
    getPlanningDates() {
        if (!this.currentSprintId) return [];
        
        const sprint = this.sprintManager.getSprintById(this.currentSprintId);
        if (!sprint) return [];

        switch (this.viewMode) {
            case 'week':
                // Show current week of sprint
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                return this.getSprintDates(sprint).filter(date => 
                    date.date >= weekStart && date.date <= weekEnd
                );
            
            case 'sprint':
                return this.getSprintDates(sprint);
            
            default:
                return this.getSprintDates(sprint);
        }
    }

    /**
     * Get default sprint ID (current or next active sprint)
     * @returns {string|null} Sprint ID
     */
    getDefaultSprintId() {
        const sprints = this.sprintManager.getAllSprints();
        const now = new Date();
        
        // Find current sprint
        const currentSprint = sprints.find(sprint => 
            new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now
        );
        
        if (currentSprint) return currentSprint.id;
        
        // Find next sprint
        const futureSprints = sprints
            .filter(sprint => new Date(sprint.startDate) > now)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        
        return futureSprints.length > 0 ? futureSprints[0].id : null;
    }

    /**
     * Update analytics and visualizations
     */
    updateAnalytics() {
        this.updateUtilizationChart();
        this.updateWorkloadBalance();
        this.updateOptimizationRecommendations();
    }

    /**
     * Update utilization chart with activity-aware data
     */
    updateUtilizationChart() {
        const ctx = document.getElementById('utilizationChart')?.getContext('2d');
        if (!ctx || !this.currentSprintId) return;
        
        const dates = this.getPlanningDates().filter(d => !d.isWeekend);
        const teamMembers = this.teamManager.getActiveTeamMembers();
        
        // Prepare chart data
        const datasets = teamMembers.map((member, index) => {
            const colors = [
                'rgba(59, 130, 246, 0.8)',   // Blue
                'rgba(16, 185, 129, 0.8)',   // Green  
                'rgba(245, 158, 11, 0.8)',   // Orange
                'rgba(239, 68, 68, 0.8)',    // Red
                'rgba(139, 69, 19, 0.8)',    // Brown
                'rgba(75, 85, 99, 0.8)',     // Gray
                'rgba(167, 139, 250, 0.8)',  // Purple
                'rgba(236, 72, 153, 0.8)'    // Pink
            ];
            
            const data = dates.map(date => {
                // Use activity-aware capacity calculation
                const capacity = this.getMemberDateCapacity(member.id, date.dateStr);
                return member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            });
            
            return {
                label: member.name,
                data: data,
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.8', '1'),
                borderWidth: 2,
                fill: false,
                tension: 0.4
            };
        });
        
        // Create or update chart
        if (this.charts?.utilization) {
            this.charts.utilization.destroy();
        }
        
        this.charts = this.charts || {};
        this.charts.utilization = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => d.dayName + ' ' + d.dayNumber),
                datasets: datasets
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
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                            label: function(context) {
                                const member = teamMembers[context.datasetIndex];
                                const date = dates[context.dataIndex];
                                const capacity = window.capacityPlannerManager.getMemberDateCapacity(member.id, date.dateStr);
                                
                                // Check if this member has activities for this date
                                let tooltip = `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                                
                                if (window.capacityTracker) {
                                    const activities = window.capacityTracker.getMemberDateActivities(member.id, date.dateStr);
                                    if (activities && activities.length > 0) {
                                        tooltip += ` (${activities.length} activities, ${capacity} pts)`;
                                    }
                                }
                                
                                return tooltip;
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
                            text: 'Utilization %'
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
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /**
     * Update workload balance visualization with activity-aware data
     */
    updateWorkloadBalance() {
        const container = document.getElementById('workloadBalance');
        if (!container || !this.currentSprintId) return;
        
        const teamMembers = this.teamManager.getActiveTeamMembers();
        const dates = this.getPlanningDates().filter(d => !d.isWeekend);
        
        let balanceHTML = '';
        
        teamMembers.forEach(member => {
            // Calculate average utilization for member using activity-aware capacity
            const utilizationData = dates.map(date => {
                const capacity = this.getMemberDateCapacity(member.id, date.dateStr);
                return member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            });
            
            // Count total activities across all dates
            let totalActivities = 0;
            let activityTypes = new Set();
            
            if (window.capacityTracker) {
                dates.forEach(date => {
                    const activities = window.capacityTracker.getMemberDateActivities(member.id, date.dateStr);
                    totalActivities += activities.length;
                    activities.forEach(activity => activityTypes.add(activity.type));
                });
            }
            
            const avgUtilization = utilizationData.length > 0 ? 
                utilizationData.reduce((sum, u) => sum + u, 0) / utilizationData.length : 0;
            
            const totalCapacity = utilizationData.reduce((sum, u) => 
                sum + (member.defaultCapacity * u / 100), 0);
            
            // Determine status color
            let statusColor = 'bg-green-100 text-green-800';
            let statusText = 'Optimal';
            
            if (avgUtilization > 95) {
                statusColor = 'bg-red-100 text-red-800';
                statusText = 'Overloaded';
            } else if (avgUtilization > 85) {
                statusColor = 'bg-orange-100 text-orange-800';
                statusText = 'High';
            } else if (avgUtilization < 60) {
                statusColor = 'bg-gray-100 text-gray-800';
                statusText = 'Under-utilized';
            }
            
            balanceHTML += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                            ${member.name.charAt(0)}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${member.name}</div>
                            <div class="text-xs text-gray-500">${member.role}</div>
                            ${totalActivities > 0 ? `
                                <div class="text-xs text-blue-600 mt-1">
                                    ${totalActivities} activities, ${activityTypes.size} types
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-medium text-gray-900">${totalCapacity.toFixed(1)} pts</div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500">${avgUtilization.toFixed(1)}%</span>
                            <span class="px-2 py-1 text-xs rounded-full ${statusColor}">${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = balanceHTML;
    }

    /**
     * Update optimization recommendations with actionable insights
     */
    updateOptimizationRecommendations() {
        const container = document.getElementById('optimizationRecommendations');
        if (!container || !this.currentSprintId) return;
        
        const optimization = this.calculateOptimization();
        
        if (optimization.changes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-green-600 text-2xl mb-2">✓</div>
                    <div class="text-sm text-gray-600">Capacity allocation is optimized</div>
                    <div class="text-xs text-gray-500 mt-1">No adjustments needed</div>
                </div>
            `;
            return;
        }
        
        let recommendationsHTML = `
            <div class="space-y-3">
                <div class="text-sm font-medium text-gray-700 mb-2">
                    ${optimization.changes.length} optimization opportunities found
                </div>
        `;
        
        // Group changes by type
        const reductions = optimization.changes.filter(c => c.type === 'reduce');
        const increases = optimization.changes.filter(c => c.type === 'increase');
        
        if (reductions.length > 0) {
            recommendationsHTML += `
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div class="text-sm font-medium text-orange-800 mb-2">Reduce Over-allocation</div>
                    ${reductions.slice(0, 3).map(change => {
                        const member = this.teamManager.getTeamMemberById(change.memberId);
                        return `
                            <div class="text-xs text-orange-700 flex justify-between items-center">
                                <span>${member?.name} on ${new Date(change.date).toLocaleDateString()}</span>
                                <button onclick="window.capacityPlanner.applyChange('${change.memberId}', '${change.date}', ${change.newCapacity})" 
                                        class="text-orange-600 hover:text-orange-800 font-medium">Apply</button>
                            </div>
                        `;
                    }).join('')}
                    ${reductions.length > 3 ? `<div class="text-xs text-orange-600 mt-1">+${reductions.length - 3} more</div>` : ''}
                </div>
            `;
        }
        
        if (increases.length > 0) {
            recommendationsHTML += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div class="text-sm font-medium text-blue-800 mb-2">Balance Workload</div>
                    ${increases.slice(0, 3).map(change => {
                        const member = this.teamManager.getTeamMemberById(change.memberId);
                        return `
                            <div class="text-xs text-blue-700 flex justify-between items-center">
                                <span>${member?.name} on ${new Date(change.date).toLocaleDateString()}</span>
                                <button onclick="window.capacityPlanner.applyChange('${change.memberId}', '${change.date}', ${change.newCapacity})" 
                                        class="text-blue-600 hover:text-blue-800 font-medium">Apply</button>
                            </div>
                        `;
                    }).join('')}
                    ${increases.length > 3 ? `<div class="text-xs text-blue-600 mt-1">+${increases.length - 3} more</div>` : ''}
                </div>
            `;
        }
        
        recommendationsHTML += `
                <div class="flex space-x-2 pt-2">
                    <button onclick="window.capacityPlanner.optimizeCapacity()" 
                            class="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md">
                        Apply All
                    </button>
                    <button onclick="window.capacityPlanner.showOptimizationDetails()" 
                            class="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md">
                        View Details
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = recommendationsHTML;
    }
    
    /**
     * Apply single optimization change
     */
    applyChange(memberId, date, newCapacity) {
        const key = `${memberId}-${date}`;
        this.tempChanges.set(key, newCapacity);
        this.updateCapacityCell(memberId, date, newCapacity);
        this.updateAnalytics();
        this.updateUI();
        
        this.showMessage(`Applied capacity change for ${this.getMemberName(memberId)}`, 'success');
    }
    
    /**
     * Show detailed optimization analysis
     */
    showOptimizationDetails() {
        // Implementation for detailed optimization modal
        console.log('Show optimization details modal');
    }

    /**
     * Update UI components
     */
    updateUI() {
        // Trigger Alpine.js reactivity (safely)
        try {
            if (window.Alpine && this.container) {
                const xDataElement = this.container.querySelector('[x-data]');
                if (xDataElement && xDataElement._x_dataStack) {
                    const component = Alpine.$data(xDataElement);
                    if (component) {
                        component.hasUnsavedChanges = this.tempChanges.size > 0;
                    }
                }
            }
        } catch (error) {
            console.log('Alpine.js component not ready yet, skipping UI update');
        }
    }

    /**
     * Show user message
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Implementation would show toast/notification
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Create global instance (avoid Alpine.js naming collision)
window.capacityPlannerManager = new CapacityPlanner();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CapacityPlanner;
}