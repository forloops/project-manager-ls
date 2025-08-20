/**
 * Capacity Tracker
 * Handles individual and team capacity tracking, sprint capacity allocation,
 * and capacity utilization analytics for the Product Manager LS application.
 */

class CapacityTracker {
    constructor() {
        this.teamManager = window.teamManager;
        this.sprintManager = window.sprintManager;
        
        // Validate dependencies
        if (!this.teamManager) {
            console.warn('CapacityTracker: teamManager not found in window object');
        }
        if (!this.sprintManager) {
            console.warn('CapacityTracker: sprintManager not found in window object');
        }
        if (!window.storageManager) {
            console.error('CapacityTracker: storageManager not found in window object');
        }
        
        // Capacity override storage key
        this.capacityOverridesKey = 'capacityOverrides';
        this.activitiesKey = 'memberActivities';
        this.storage = window.storageManager;
        
        // Load any existing capacity overrides and activities
        this.capacityOverrides = this.loadCapacityOverrides();
        this.memberActivities = this.loadMemberActivities();
        
        // Bind methods
        this.setMemberSprintCapacity = this.setMemberSprintCapacity.bind(this);
        this.calculateTeamCapacity = this.calculateTeamCapacity.bind(this);
        this.addMemberActivity = this.addMemberActivity.bind(this);
        this.updateMemberActivity = this.updateMemberActivity.bind(this);
        this.removeMemberActivity = this.removeMemberActivity.bind(this);
    }

    /**
     * Load capacity overrides from storage
     * @returns {Object} Capacity overrides object
     */
    loadCapacityOverrides() {
        try {
            const overrides = this.storage.getEntities(this.capacityOverridesKey);
            // Convert array to object for easier lookup
            const overrideMap = {};
            overrides.forEach(override => {
                const key = `${override.memberId}_${override.sprintId}`;
                overrideMap[key] = override;
            });
            return overrideMap;
        } catch (error) {
            console.error('Failed to load capacity overrides:', error);
            return {};
        }
    }

    /**
     * Load member activities from storage
     * @returns {Object} Member activities object keyed by member-date
     */
    loadMemberActivities() {
        try {
            const activities = this.storage.getEntities(this.activitiesKey);
            // Convert array to object for easier lookup
            const activityMap = {};
            activities.forEach(activity => {
                const key = `${activity.memberId}_${activity.date}`;
                if (!activityMap[key]) {
                    activityMap[key] = [];
                }
                activityMap[key].push(window.ActivityModel ? new window.ActivityModel(activity) : activity);
            });
            return activityMap;
        } catch (error) {
            console.error('Failed to load member activities:', error);
            return {};
        }
    }

    /**
     * Save member activities to storage
     * @returns {boolean} Success status
     */
    saveMemberActivities() {
        try {
            const activitiesArray = [];
            Object.values(this.memberActivities).forEach(dayActivities => {
                dayActivities.forEach(activity => {
                    activitiesArray.push(activity.toJSON ? activity.toJSON() : activity);
                });
            });
            return this.storage.saveEntities(this.activitiesKey, activitiesArray);
        } catch (error) {
            console.error('Failed to save member activities:', error);
            return false;
        }
    }

    /**
     * Add activity for a team member on a specific date
     * @param {string} memberId - Team member ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {Object} activityData - Activity data
     * @returns {Object} Result object with success status
     */
    addMemberActivity(memberId, date, activityData) {
        try {
            if (!window.ActivityModel) {
                return {
                    success: false,
                    errors: ['ActivityModel not available']
                };
            }

            if (!this.teamManager) {
                return {
                    success: false,
                    errors: ['TeamManager not available']
                };
            }
            
            const member = this.teamManager.getTeamMemberById(memberId);
            if (!member) {
                // Debug: list available team members
                const availableMembers = this.teamManager.getAllTeamMembers ? 
                    this.teamManager.getAllTeamMembers().map(m => m.id).join(', ') : 'Unknown';
                return {
                    success: false,
                    errors: [`Team member '${memberId}' not found. Available members: ${availableMembers}`]
                };
            }

            // Create activity instance
            const activity = new window.ActivityModel({
                ...activityData,
                memberId,
                date
            });

            // Validate activity
            const validation = activity.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check total daily capacity doesn't exceed member's limit
            const existingActivities = this.getMemberDateActivities(memberId, date);
            const totalCapacity = existingActivities.reduce((sum, act) => sum + act.capacity, 0) + activity.capacity;
            
            if (totalCapacity > member.defaultCapacity) {
                return {
                    success: false,
                    errors: [`Total capacity ${totalCapacity} exceeds daily limit ${member.defaultCapacity}`]
                };
            }

            // Add to storage
            const key = `${memberId}_${date}`;
            if (!this.memberActivities[key]) {
                this.memberActivities[key] = [];
            }
            this.memberActivities[key].push(activity);

            if (this.saveMemberActivities()) {
                this.notifyCapacityChange('activityAdded', { memberId, date, activity });
                return {
                    success: true,
                    activity
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save activity']
                };
            }
        } catch (error) {
            console.error('Failed to add member activity:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while adding activity']
            };
        }
    }

    /**
     * Update an existing activity
     * @param {string} activityId - Activity ID
     * @param {Object} updates - Updates to apply
     * @returns {Object} Result object with success status
     */
    updateMemberActivity(activityId, updates) {
        try {
            let foundActivity = null;
            let foundKey = null;

            // Find the activity
            Object.keys(this.memberActivities).forEach(key => {
                const activities = this.memberActivities[key];
                const activityIndex = activities.findIndex(act => act.id === activityId);
                if (activityIndex !== -1) {
                    foundActivity = activities[activityIndex];
                    foundKey = key;
                }
            });

            if (!foundActivity) {
                return {
                    success: false,
                    errors: ['Activity not found']
                };
            }

            // Apply updates
            Object.keys(updates).forEach(key => {
                if (foundActivity.hasOwnProperty(key)) {
                    foundActivity[key] = updates[key];
                }
            });
            foundActivity.updatedAt = new Date().toISOString();

            // Validate updated activity
            const validation = foundActivity.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check capacity limits if capacity was updated
            if (updates.capacity !== undefined) {
                const [memberId, date] = foundKey.split('_');
                const member = this.teamManager.getTeamMemberById(memberId);
                const activities = this.memberActivities[foundKey];
                const totalCapacity = activities.reduce((sum, act) => sum + act.capacity, 0);
                
                if (totalCapacity > member.defaultCapacity) {
                    return {
                        success: false,
                        errors: [`Total capacity ${totalCapacity} exceeds daily limit ${member.defaultCapacity}`]
                    };
                }
            }

            if (this.saveMemberActivities()) {
                const [memberId, date] = foundKey.split('_');
                this.notifyCapacityChange('activityUpdated', { memberId, date, activity: foundActivity });
                return {
                    success: true,
                    activity: foundActivity
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save activity updates']
                };
            }
        } catch (error) {
            console.error('Failed to update member activity:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while updating activity']
            };
        }
    }

    /**
     * Remove an activity
     * @param {string} activityId - Activity ID to remove
     * @returns {Object} Result object with success status
     */
    removeMemberActivity(activityId) {
        try {
            let removed = false;
            let removedFrom = null;

            Object.keys(this.memberActivities).forEach(key => {
                const activities = this.memberActivities[key];
                const activityIndex = activities.findIndex(act => act.id === activityId);
                if (activityIndex !== -1) {
                    activities.splice(activityIndex, 1);
                    removed = true;
                    removedFrom = key;
                    
                    // Clean up empty arrays
                    if (activities.length === 0) {
                        delete this.memberActivities[key];
                    }
                }
            });

            if (!removed) {
                return {
                    success: false,
                    errors: ['Activity not found']
                };
            }

            if (this.saveMemberActivities()) {
                const [memberId, date] = removedFrom.split('_');
                this.notifyCapacityChange('activityRemoved', { memberId, date, activityId });
                return {
                    success: true
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save after removing activity']
                };
            }
        } catch (error) {
            console.error('Failed to remove member activity:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while removing activity']
            };
        }
    }

    /**
     * Get all activities for a member on a specific date
     * @param {string} memberId - Team member ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Array} Array of activities
     */
    getMemberDateActivities(memberId, date) {
        const key = `${memberId}_${date}`;
        return this.memberActivities[key] || [];
    }

    /**
     * Get all activities for a member across all dates
     * @param {string} memberId - Team member ID
     * @returns {Array} Array of activities
     */
    getMemberActivities(memberId) {
        const activities = [];
        Object.keys(this.memberActivities).forEach(key => {
            if (key.startsWith(`${memberId}_`)) {
                activities.push(...this.memberActivities[key]);
            }
        });
        return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Get total capacity for a member on a date (sum of all activities)
     * @param {string} memberId - Team member ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {number} Total capacity from activities
     */
    getMemberDateCapacityFromActivities(memberId, date) {
        const activities = this.getMemberDateActivities(memberId, date);
        return activities.reduce((total, activity) => total + activity.capacity, 0);
    }

    /**
     * Check if a member uses activity-based allocation on a specific date
     * @param {string} memberId - Team member ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {boolean} True if using activity-based allocation
     */
    isUsingActivityBasedAllocation(memberId, date) {
        const activities = this.getMemberDateActivities(memberId, date);
        return activities.length > 0;
    }

    /**
     * Save capacity overrides to storage
     * @returns {boolean} Success status
     */
    saveCapacityOverrides() {
        try {
            const overridesArray = Object.values(this.capacityOverrides);
            return this.storage.saveEntities(this.capacityOverridesKey, overridesArray);
        } catch (error) {
            console.error('Failed to save capacity overrides:', error);
            return false;
        }
    }

    /**
     * Set capacity override for a team member in a specific sprint
     * @param {string} memberId - Team member ID
     * @param {string} sprintId - Sprint ID
     * @param {number} capacity - Override capacity points
     * @param {string} reason - Reason for override
     * @returns {Object} Result object with success status
     */
    setMemberSprintCapacity(memberId, sprintId, capacity, reason = '') {
        try {
            const member = this.teamManager.getTeamMemberById(memberId);
            const sprint = this.sprintManager.getSprintById(sprintId);
            
            if (!member) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }
            
            if (!sprint) {
                return {
                    success: false,
                    errors: ['Sprint not found']
                };
            }

            if (capacity < 0 || capacity > 100) {
                return {
                    success: false,
                    errors: ['Capacity must be between 0 and 100 points']
                };
            }

            const key = `${memberId}_${sprintId}`;
            
            if (capacity === member.defaultCapacity && !reason) {
                // Remove override if setting back to default
                delete this.capacityOverrides[key];
            } else {
                // Set or update override
                this.capacityOverrides[key] = {
                    id: this.generateId(),
                    memberId,
                    sprintId,
                    capacity,
                    reason,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }

            if (this.saveCapacityOverrides()) {
                this.notifyCapacityChange('capacityOverrideSet', { memberId, sprintId, capacity });
                return {
                    success: true,
                    override: this.capacityOverrides[key]
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save capacity override']
                };
            }
        } catch (error) {
            console.error('Failed to set member sprint capacity:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while setting capacity']
            };
        }
    }

    /**
     * Get capacity override for a team member in a specific sprint
     * @param {string} memberId - Team member ID
     * @param {string} sprintId - Sprint ID
     * @returns {Object|null} Capacity override or null if none exists
     */
    getMemberSprintCapacityOverride(memberId, sprintId) {
        const key = `${memberId}_${sprintId}`;
        return this.capacityOverrides[key] || null;
    }

    /**
     * Get effective capacity for a team member in a specific sprint
     * (considering overrides, time off, activities, and default capacity)
     * @param {string} memberId - Team member ID
     * @param {string} sprintId - Sprint ID
     * @returns {Object} Capacity information
     */
    getMemberEffectiveCapacity(memberId, sprintId) {
        try {
            const member = this.teamManager.getTeamMemberById(memberId);
            const sprint = this.sprintManager.getSprintById(sprintId);
            
            if (!member || !sprint) {
                return {
                    effective: 0,
                    default: 0,
                    override: null,
                    timeOffDays: 0,
                    availableDays: 0,
                    totalDays: 0,
                    activities: [],
                    usingActivityAllocation: false
                };
            }

            // Get sprint working days and availability
            const sprintDates = sprint.getSprintDates();
            const workingDays = sprintDates.filter(day => !day.isWeekend);
            const availableDays = workingDays.filter(day => member.isAvailableOnDate(day.date));
            const timeOffDays = workingDays.length - availableDays.length;

            // Check for activity-based allocation
            let usingActivityAllocation = false;
            let totalActivityCapacity = 0;
            const sprintActivities = [];

            workingDays.forEach(day => {
                const activities = this.getMemberDateActivities(memberId, day.date);
                if (activities.length > 0) {
                    usingActivityAllocation = true;
                    activities.forEach(activity => {
                        totalActivityCapacity += activity.capacity;
                        sprintActivities.push(activity);
                    });
                }
            });

            let effectiveCapacity;
            const override = this.getMemberSprintCapacityOverride(memberId, sprintId);

            if (usingActivityAllocation) {
                // Use activity-based capacity (activities already account for availability)
                effectiveCapacity = totalActivityCapacity;
            } else if (override) {
                // Use override capacity adjusted for available days
                const dailyCapacity = override.capacity / workingDays.length;
                effectiveCapacity = dailyCapacity * availableDays.length;
            } else {
                // Use default capacity calculation
                effectiveCapacity = member.getSprintCapacity(sprint);
            }

            return {
                effective: Math.round(effectiveCapacity * 100) / 100,
                default: member.defaultCapacity,
                override: override,
                timeOffDays,
                availableDays: availableDays.length,
                totalDays: workingDays.length,
                activities: sprintActivities,
                usingActivityAllocation
            };
        } catch (error) {
            console.error('Failed to get member effective capacity:', error);
            return {
                effective: 0,
                default: 0,
                override: null,
                timeOffDays: 0,
                availableDays: 0,
                totalDays: 0,
                activities: [],
                usingActivityAllocation: false
            };
        }
    }

    /**
     * Calculate total team capacity for a specific sprint
     * @param {string} sprintId - Sprint ID
     * @returns {Object} Team capacity information
     */
    calculateTeamCapacity(sprintId) {
        try {
            const sprint = this.sprintManager.getSprintById(sprintId);
            if (!sprint) {
                return {
                    totalCapacity: 0,
                    memberCapacities: [],
                    roleBreakdown: {},
                    utilizationPercentage: 0
                };
            }

            const activeMembers = this.teamManager.getActiveTeamMembers();
            const memberCapacities = [];
            const roleBreakdown = {};
            let totalCapacity = 0;

            activeMembers.forEach(member => {
                const capacity = this.getMemberEffectiveCapacity(member.id, sprintId);
                
                memberCapacities.push({
                    memberId: member.id,
                    name: member.name,
                    role: member.role,
                    ...capacity
                });

                totalCapacity += capacity.effective;

                // Role breakdown
                if (!roleBreakdown[member.role]) {
                    roleBreakdown[member.role] = {
                        memberCount: 0,
                        totalCapacity: 0,
                        averageCapacity: 0
                    };
                }
                roleBreakdown[member.role].memberCount++;
                roleBreakdown[member.role].totalCapacity += capacity.effective;
            });

            // Calculate average capacity per role
            Object.keys(roleBreakdown).forEach(role => {
                const roleData = roleBreakdown[role];
                roleData.averageCapacity = roleData.memberCount > 0 ? 
                    Math.round((roleData.totalCapacity / roleData.memberCount) * 100) / 100 : 0;
            });

            // Calculate utilization percentage (compared to maximum possible)
            const maxPossibleCapacity = this.calculateMaxPossibleCapacity(sprintId);
            const utilizationPercentage = maxPossibleCapacity > 0 ? 
                Math.round((totalCapacity / maxPossibleCapacity) * 100) : 0;

            return {
                totalCapacity: Math.round(totalCapacity * 100) / 100,
                memberCapacities,
                roleBreakdown,
                utilizationPercentage,
                maxPossibleCapacity: Math.round(maxPossibleCapacity * 100) / 100
            };
        } catch (error) {
            console.error('Failed to calculate team capacity:', error);
            return {
                totalCapacity: 0,
                memberCapacities: [],
                roleBreakdown: {},
                utilizationPercentage: 0,
                maxPossibleCapacity: 0
            };
        }
    }

    /**
     * Calculate maximum possible capacity for a sprint (no time off, default capacities)
     * @param {string} sprintId - Sprint ID
     * @returns {number} Maximum possible capacity
     */
    calculateMaxPossibleCapacity(sprintId) {
        try {
            const sprint = this.sprintManager.getSprintById(sprintId);
            if (!sprint) return 0;

            const activeMembers = this.teamManager.getActiveTeamMembers();
            const sprintDates = sprint.getSprintDates();
            const workingDays = sprintDates.filter(day => !day.isWeekend).length;

            return activeMembers.reduce((total, member) => {
                const dailyCapacity = member.defaultCapacity / 5; // Assuming 5 working days per week
                return total + (dailyCapacity * workingDays);
            }, 0);
        } catch (error) {
            console.error('Failed to calculate max possible capacity:', error);
            return 0;
        }
    }

    /**
     * Get capacity trend over multiple sprints
     * @param {Array} sprintIds - Array of sprint IDs to analyze
     * @returns {Object} Capacity trend data
     */
    getCapacityTrend(sprintIds) {
        try {
            const trendData = {
                sprints: [],
                averageCapacity: 0,
                capacityVariation: 0,
                peakCapacity: 0,
                lowCapacity: Infinity
            };

            let totalCapacity = 0;
            const capacities = [];

            sprintIds.forEach(sprintId => {
                const sprint = this.sprintManager.getSprintById(sprintId);
                if (sprint) {
                    const capacity = this.calculateTeamCapacity(sprintId);
                    
                    trendData.sprints.push({
                        sprintId,
                        sprintName: sprint.name,
                        startDate: sprint.startDate,
                        endDate: sprint.endDate,
                        capacity: capacity.totalCapacity,
                        utilizationPercentage: capacity.utilizationPercentage
                    });

                    totalCapacity += capacity.totalCapacity;
                    capacities.push(capacity.totalCapacity);
                    
                    if (capacity.totalCapacity > trendData.peakCapacity) {
                        trendData.peakCapacity = capacity.totalCapacity;
                    }
                    if (capacity.totalCapacity < trendData.lowCapacity) {
                        trendData.lowCapacity = capacity.totalCapacity;
                    }
                }
            });

            // Calculate statistics
            if (capacities.length > 0) {
                trendData.averageCapacity = totalCapacity / capacities.length;
                
                // Calculate standard deviation for variation
                const variance = capacities.reduce((acc, capacity) => {
                    return acc + Math.pow(capacity - trendData.averageCapacity, 2);
                }, 0) / capacities.length;
                
                trendData.capacityVariation = Math.sqrt(variance);
            } else {
                trendData.lowCapacity = 0;
            }

            // Round values
            trendData.averageCapacity = Math.round(trendData.averageCapacity * 100) / 100;
            trendData.capacityVariation = Math.round(trendData.capacityVariation * 100) / 100;
            trendData.peakCapacity = Math.round(trendData.peakCapacity * 100) / 100;
            trendData.lowCapacity = Math.round(trendData.lowCapacity * 100) / 100;

            return trendData;
        } catch (error) {
            console.error('Failed to get capacity trend:', error);
            return {
                sprints: [],
                averageCapacity: 0,
                capacityVariation: 0,
                peakCapacity: 0,
                lowCapacity: 0
            };
        }
    }

    /**
     * Get capacity allocation recommendations for a sprint
     * @param {string} sprintId - Sprint ID
     * @returns {Object} Recommendations object
     */
    getCapacityRecommendations(sprintId) {
        try {
            const capacity = this.calculateTeamCapacity(sprintId);
            const recommendations = {
                status: 'normal',
                message: '',
                suggestions: [],
                warnings: []
            };

            // Check overall utilization
            if (capacity.utilizationPercentage < 70) {
                recommendations.status = 'underutilized';
                recommendations.message = 'Team capacity is underutilized';
                recommendations.suggestions.push('Consider taking on additional work or reducing team size');
            } else if (capacity.utilizationPercentage > 95) {
                recommendations.status = 'overallocated';
                recommendations.message = 'Team capacity is overallocated';
                recommendations.warnings.push('High risk of burnout and missed deadlines');
                recommendations.suggestions.push('Consider reducing scope or extending timeline');
            } else if (capacity.utilizationPercentage > 85) {
                recommendations.status = 'high';
                recommendations.message = 'Team capacity is at high utilization';
                recommendations.suggestions.push('Monitor closely for potential bottlenecks');
            }

            // Check for team members with very low capacity
            const lowCapacityMembers = capacity.memberCapacities.filter(member => 
                member.effective < (member.default * 0.3)
            );

            if (lowCapacityMembers.length > 0) {
                recommendations.warnings.push(
                    `${lowCapacityMembers.length} team member(s) have significantly reduced capacity`
                );
                recommendations.suggestions.push('Review time off and capacity overrides');
            }

            // Check for role imbalances
            const roles = Object.keys(capacity.roleBreakdown);
            const totalRoleCapacity = roles.reduce((total, role) => 
                total + capacity.roleBreakdown[role].totalCapacity, 0
            );

            roles.forEach(role => {
                const roleData = capacity.roleBreakdown[role];
                const rolePercentage = totalRoleCapacity > 0 ? 
                    (roleData.totalCapacity / totalRoleCapacity) * 100 : 0;
                
                if (rolePercentage > 50) {
                    recommendations.warnings.push(
                        `${role} represents ${Math.round(rolePercentage)}% of total capacity`
                    );
                }
            });

            return recommendations;
        } catch (error) {
            console.error('Failed to get capacity recommendations:', error);
            return {
                status: 'error',
                message: 'Unable to generate recommendations',
                suggestions: [],
                warnings: ['Failed to analyze capacity data']
            };
        }
    }

    /**
     * Remove capacity override
     * @param {string} memberId - Team member ID
     * @param {string} sprintId - Sprint ID
     * @returns {boolean} Success status
     */
    removeCapacityOverride(memberId, sprintId) {
        try {
            const key = `${memberId}_${sprintId}`;
            if (this.capacityOverrides[key]) {
                delete this.capacityOverrides[key];
                const success = this.saveCapacityOverrides();
                if (success) {
                    this.notifyCapacityChange('capacityOverrideRemoved', { memberId, sprintId });
                }
                return success;
            }
            return true; // No override to remove
        } catch (error) {
            console.error('Failed to remove capacity override:', error);
            return false;
        }
    }

    /**
     * Get all capacity overrides for a sprint
     * @param {string} sprintId - Sprint ID
     * @returns {Array} Array of capacity overrides
     */
    getSprintCapacityOverrides(sprintId) {
        return Object.values(this.capacityOverrides).filter(override => 
            override.sprintId === sprintId
        );
    }

    /**
     * Get all capacity overrides for a team member
     * @param {string} memberId - Team member ID
     * @returns {Array} Array of capacity overrides
     */
    getMemberCapacityOverrides(memberId) {
        return Object.values(this.capacityOverrides).filter(override => 
            override.memberId === memberId
        );
    }

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Notify about capacity changes for UI updates
     * @param {string} action - Action performed
     * @param {Object} data - Change data
     */
    notifyCapacityChange(action, data) {
        window.dispatchEvent(new CustomEvent('capacityChanged', {
            detail: { action, data }
        }));
    }

    /**
     * Export capacity data
     * @returns {string} JSON string of capacity data
     */
    exportCapacityData() {
        try {
            const activitiesArray = [];
            Object.values(this.memberActivities).forEach(dayActivities => {
                dayActivities.forEach(activity => {
                    activitiesArray.push(activity.toJSON ? activity.toJSON() : activity);
                });
            });

            return JSON.stringify({
                capacityOverrides: Object.values(this.capacityOverrides),
                memberActivities: activitiesArray,
                exportedAt: new Date().toISOString(),
                version: '2.0' // Version for activity support
            }, null, 2);
        } catch (error) {
            console.error('Failed to export capacity data:', error);
            return null;
        }
    }

    /**
     * Import capacity data
     * @param {string} jsonData - JSON string of capacity data
     * @returns {Object} Import result
     */
    importCapacityData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.capacityOverrides || !Array.isArray(data.capacityOverrides)) {
                return {
                    success: false,
                    errors: ['Invalid capacity data format']
                };
            }

            // Convert capacity overrides array back to object
            this.capacityOverrides = {};
            data.capacityOverrides.forEach(override => {
                const key = `${override.memberId}_${override.sprintId}`;
                this.capacityOverrides[key] = override;
            });

            // Import activities if available (version 2.0+)
            let activitiesImported = 0;
            if (data.memberActivities && Array.isArray(data.memberActivities)) {
                this.memberActivities = {};
                data.memberActivities.forEach(activityData => {
                    const activity = window.ActivityModel ? new window.ActivityModel(activityData) : activityData;
                    const key = `${activity.memberId}_${activity.date}`;
                    if (!this.memberActivities[key]) {
                        this.memberActivities[key] = [];
                    }
                    this.memberActivities[key].push(activity);
                    activitiesImported++;
                });
            }

            // Save both capacity overrides and activities
            const capacitySaved = this.saveCapacityOverrides();
            const activitiesSaved = data.memberActivities ? this.saveMemberActivities() : true;

            if (capacitySaved && activitiesSaved) {
                return {
                    success: true,
                    imported: {
                        capacityOverrides: data.capacityOverrides.length,
                        activities: activitiesImported,
                        version: data.version || '1.0'
                    }
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save imported capacity data']
                };
            }
        } catch (error) {
            console.error('Failed to import capacity data:', error);
            return {
                success: false,
                errors: ['Invalid JSON format']
            };
        }
    }
}

// Create global instance
window.capacityTracker = new CapacityTracker();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CapacityTracker;
}