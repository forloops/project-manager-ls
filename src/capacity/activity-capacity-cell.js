/**
 * Activity-Enhanced Capacity Cell Component
 * Provides UI for managing multiple activities within a single capacity cell
 */
class ActivityCapacityCell {
    constructor(memberId, date, container) {
        this.memberId = memberId;
        this.date = date;
        this.container = container;
        this.activities = [];
        this.isExpanded = false;
        this.maxCapacity = 8; // Will be set from member data
        
        this.init();
    }

    init() {
        this.loadActivities();
        this.loadMemberCapacity();
        this.render();
        this.bindEvents();
    }

    loadActivities() {
        if (window.capacityTracker) {
            this.activities = window.capacityTracker.getMemberDateActivities(this.memberId, this.date);
        }
    }

    loadMemberCapacity() {
        if (window.teamManager) {
            const member = window.teamManager.getTeamMemberById(this.memberId);
            if (member) {
                this.maxCapacity = member.defaultCapacity;
            }
        }
    }

    getTotalCapacity() {
        return this.activities.reduce((total, activity) => total + activity.capacity, 0);
    }

    getUtilizationPercentage() {
        return this.maxCapacity > 0 ? (this.getTotalCapacity() / this.maxCapacity) * 100 : 0;
    }

    getUtilizationClass() {
        const utilization = this.getUtilizationPercentage();
        if (utilization > 95) return 'border-red-300 bg-red-50';
        if (utilization > 85) return 'border-orange-300 bg-orange-50';
        if (utilization < 60) return 'border-gray-300 bg-gray-50';
        return 'border-green-300 bg-green-50';
    }

    render() {
        const totalCapacity = this.getTotalCapacity();
        const hasActivities = this.activities.length > 0;
        const utilization = this.getUtilizationPercentage();

        this.container.innerHTML = `
            <div class="activity-capacity-cell relative ${this.getUtilizationClass()} rounded p-2 min-h-[60px] cursor-pointer transition-all duration-200"
                 data-member-id="${this.memberId}" 
                 data-date="${this.date}">
                
                <!-- Header with total capacity -->
                <div class="flex items-center justify-between mb-1">
                    <div class="text-sm font-medium text-gray-700">
                        ${totalCapacity.toFixed(1)}/${this.maxCapacity}
                    </div>
                    <div class="flex items-center space-x-1">
                        ${hasActivities ? `
                            <span class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                ${this.activities.length}
                            </span>
                        ` : ''}
                        <button class="activity-toggle text-xs text-gray-500 hover:text-gray-700">
                            ${this.isExpanded ? '▼' : '▶'}
                        </button>
                    </div>
                </div>

                <!-- Utilization bar -->
                <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div class="h-1.5 rounded-full transition-all duration-300 ${this.getUtilizationBarColor()}" 
                         style="width: ${Math.min(utilization, 100)}%"></div>
                </div>

                <!-- Activities list (collapsed view) -->
                ${!this.isExpanded && hasActivities ? `
                    <div class="activities-summary space-y-1">
                        ${this.activities.slice(0, 2).map(activity => `
                            <div class="flex items-center space-x-2 text-xs">
                                <div class="w-2 h-2 rounded-full" style="background-color: ${activity.getTypeConfig().color}"></div>
                                <span class="truncate flex-1">${activity.getDisplayName(20)}</span>
                                <span class="font-medium">${activity.capacity}</span>
                            </div>
                        `).join('')}
                        ${this.activities.length > 2 ? `
                            <div class="text-xs text-gray-500">+${this.activities.length - 2} more...</div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Activities list (expanded view) -->
                ${this.isExpanded ? `
                    <div class="activities-expanded space-y-2 mt-2">
                        ${this.activities.map(activity => `
                            <div class="activity-item flex items-center space-x-2 p-2 bg-white rounded border text-xs">
                                <div class="w-3 h-3 rounded-full flex-shrink-0" 
                                     style="background-color: ${activity.getTypeConfig().color}"
                                     title="${activity.getTypeConfig().label}"></div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium truncate">${activity.name}</div>
                                    <div class="text-gray-500">${activity.getTypeConfig().label}</div>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <input type="number" 
                                           value="${activity.capacity}" 
                                           min="0" max="16" step="0.5"
                                           class="activity-capacity-input w-12 text-center border rounded px-1 py-0.5"
                                           data-activity-id="${activity.id}">
                                    <button class="delete-activity text-red-500 hover:text-red-700 p-1"
                                            data-activity-id="${activity.id}"
                                            title="Delete activity">×</button>
                                </div>
                            </div>
                        `).join('')}
                        
                        <!-- Add new activity button -->
                        <button class="add-activity w-full p-2 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors">
                            + Add Activity
                        </button>
                    </div>
                ` : ''}

                <!-- Simple input for non-activity mode -->
                ${!hasActivities ? `
                    <div class="simple-capacity-input mt-2">
                        <input type="number" 
                               value="${totalCapacity}" 
                               min="0" max="${this.maxCapacity}" step="0.5"
                               class="total-capacity-input w-full text-center text-sm border rounded px-2 py-1"
                               placeholder="0">
                        <div class="text-xs text-gray-500 mt-1 text-center">
                            <button class="switch-to-activities text-blue-600 hover:text-blue-800">
                                Switch to activities
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Validation warnings -->
                ${utilization > 100 ? `
                    <div class="validation-warning absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" 
                         title="Over capacity!"></div>
                ` : ''}
            </div>
        `;
    }

    getUtilizationBarColor() {
        const utilization = this.getUtilizationPercentage();
        if (utilization > 95) return 'bg-red-500';
        if (utilization > 85) return 'bg-orange-500';
        if (utilization < 60) return 'bg-gray-400';
        return 'bg-green-500';
    }

    bindEvents() {
        const cell = this.container.querySelector('.activity-capacity-cell');
        
        // Toggle expansion
        const toggleBtn = cell.querySelector('.activity-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExpanded();
            });
        }

        // Activity capacity input changes
        const capacityInputs = cell.querySelectorAll('.activity-capacity-input');
        capacityInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateActivityCapacity(e.target.dataset.activityId, parseFloat(e.target.value));
            });
        });

        // Delete activity buttons
        const deleteButtons = cell.querySelectorAll('.delete-activity');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteActivity(button.dataset.activityId);
            });
        });

        // Add activity button
        const addActivityBtn = cell.querySelector('.add-activity');
        if (addActivityBtn) {
            addActivityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAddActivityModal();
            });
        }

        // Switch to activities button
        const switchBtn = cell.querySelector('.switch-to-activities');
        if (switchBtn) {
            switchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchToActivityMode();
            });
        }

        // Total capacity input (simple mode)
        const totalInput = cell.querySelector('.total-capacity-input');
        if (totalInput) {
            totalInput.addEventListener('change', (e) => {
                this.updateSimpleCapacity(parseFloat(e.target.value));
            });
        }

        // Cell click for expansion
        cell.addEventListener('click', (e) => {
            if (!e.target.closest('input, button')) {
                if (this.activities.length > 0) {
                    this.toggleExpanded();
                }
            }
        });
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        this.render();
        this.bindEvents();
        
        // Notify about expansion change
        this.container.dispatchEvent(new CustomEvent('cellExpanded', {
            detail: { memberId: this.memberId, date: this.date, expanded: this.isExpanded }
        }));
    }

    updateActivityCapacity(activityId, newCapacity) {
        if (window.capacityTracker) {
            const result = window.capacityTracker.updateMemberActivity(activityId, { capacity: newCapacity });
            if (result.success) {
                this.loadActivities();
                this.render();
                this.bindEvents();
                this.notifyChange();
            } else {
                alert(`Error updating activity: ${result.errors.join(', ')}`);
                this.render(); // Reset to previous value
                this.bindEvents();
            }
        }
    }

    deleteActivity(activityId) {
        if (window.capacityTracker) {
            const result = window.capacityTracker.removeMemberActivity(activityId);
            if (result.success) {
                this.loadActivities();
                this.render();
                this.bindEvents();
                this.notifyChange();
            } else {
                alert(`Error deleting activity: ${result.errors.join(', ')}`);
            }
        }
    }

    showAddActivityModal() {
        if (window.activityModal) {
            window.activityModal.show({
                memberId: this.memberId,
                date: this.date,
                onSave: (activityData) => {
                    this.addActivity(activityData);
                }
            });
        } else {
            // Fallback: simple prompt for activity
            const name = prompt('Activity name:');
            const capacity = parseFloat(prompt('Capacity (story points):'));
            const type = prompt('Activity type (development/testing/meeting/review/documentation/support/planning/other):') || 'development';
            
            if (name && capacity) {
                this.addActivity({ name, capacity, type });
            }
        }
    }

    addActivity(activityData) {
        if (window.capacityTracker) {
            const result = window.capacityTracker.addMemberActivity(this.memberId, this.date, activityData);
            if (result.success) {
                this.loadActivities();
                this.isExpanded = true;
                this.render();
                this.bindEvents();
                this.notifyChange();
            } else {
                alert(`Error adding activity: ${result.errors.join(', ')}`);
            }
        }
    }

    switchToActivityMode() {
        const currentCapacity = this.getTotalCapacity() || parseFloat(this.container.querySelector('.total-capacity-input')?.value) || 0;
        
        if (currentCapacity > 0) {
            const defaultActivity = {
                name: 'Development Work',
                type: 'development',
                capacity: currentCapacity,
                description: 'Converted from simple capacity allocation'
            };
            
            this.addActivity(defaultActivity);
        } else {
            this.showAddActivityModal();
        }
    }

    updateSimpleCapacity(newCapacity) {
        // For simple mode, we don't create activities, just notify about capacity change
        this.notifyChange();
    }

    notifyChange() {
        this.container.dispatchEvent(new CustomEvent('capacityChanged', {
            detail: { 
                memberId: this.memberId, 
                date: this.date, 
                totalCapacity: this.getTotalCapacity(),
                activities: this.activities
            }
        }));
    }

    refresh() {
        this.loadActivities();
        this.render();
        this.bindEvents();
    }

    destroy() {
        // Clean up event listeners if needed
        this.container.innerHTML = '';
    }
}

// Export for global access
window.ActivityCapacityCell = ActivityCapacityCell;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityCapacityCell;
}