/**
 * Activity Model for Multi-Activity Capacity Allocation
 * Represents individual activities within a person's daily capacity
 */
class ActivityModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.type = data.type || 'development'; // development, testing, meeting, review, documentation, etc.
        this.capacity = data.capacity || 0; // story points/hours for this activity
        this.memberId = data.memberId || '';
        this.date = data.date || ''; // YYYY-MM-DD format
        this.sprintId = data.sprintId || '';
        this.workStreamId = data.workStreamId || ''; // optional work stream association
        this.description = data.description || '';
        this.status = data.status || 'planned'; // planned, in-progress, completed
        this.priority = data.priority || 'medium'; // high, medium, low
        this.estimatedDuration = data.estimatedDuration || 0; // in hours
        this.actualDuration = data.actualDuration || 0; // in hours (for tracking)
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate activity data
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Activity name is required');
        }

        if (!this.memberId || this.memberId.trim().length === 0) {
            errors.push('Member ID is required');
        }

        if (!this.date) {
            errors.push('Activity date is required');
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
            errors.push('Activity date must be in YYYY-MM-DD format');
        }

        if (this.capacity < 0 || this.capacity > 16) {
            errors.push('Capacity must be between 0 and 16 points');
        }

        const validTypes = ['development', 'testing', 'meeting', 'review', 'documentation', 'support', 'planning', 'other'];
        if (!validTypes.includes(this.type)) {
            errors.push('Invalid activity type');
        }

        const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(this.status)) {
            errors.push('Invalid activity status');
        }

        const validPriorities = ['high', 'medium', 'low'];
        if (!validPriorities.includes(this.priority)) {
            errors.push('Invalid activity priority');
        }

        if (this.estimatedDuration < 0 || this.estimatedDuration > 24) {
            errors.push('Estimated duration must be between 0 and 24 hours');
        }

        if (this.actualDuration < 0 || this.actualDuration > 24) {
            errors.push('Actual duration must be between 0 and 24 hours');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get activity type configuration
     * @returns {Object} Type configuration with color and icon
     */
    getTypeConfig() {
        const typeConfigs = {
            development: { color: '#10B981', icon: '💻', label: 'Development' },
            testing: { color: '#F59E0B', icon: '🧪', label: 'Testing' },
            meeting: { color: '#8B5CF6', icon: '👥', label: 'Meeting' },
            review: { color: '#EF4444', icon: '👁️', label: 'Code Review' },
            documentation: { color: '#6B7280', icon: '📝', label: 'Documentation' },
            support: { color: '#EC4899', icon: '🛠️', label: 'Support' },
            planning: { color: '#3B82F6', icon: '📊', label: 'Planning' },
            other: { color: '#64748B', icon: '📋', label: 'Other' }
        };

        return typeConfigs[this.type] || typeConfigs.other;
    }

    /**
     * Get priority configuration
     * @returns {Object} Priority configuration with color and weight
     */
    getPriorityConfig() {
        const priorityConfigs = {
            high: { color: '#DC2626', weight: 3, label: 'High Priority' },
            medium: { color: '#F59E0B', weight: 2, label: 'Medium Priority' },
            low: { color: '#059669', weight: 1, label: 'Low Priority' }
        };

        return priorityConfigs[this.priority] || priorityConfigs.medium;
    }

    /**
     * Get display name for the activity
     * @param {number} maxLength - Maximum length for name truncation (default: 25)
     * @returns {string} Formatted display name
     */
    getDisplayName(maxLength = 25) {
        if (!this.name) {
            return 'Unnamed Activity';
        }
        
        // Truncate long names and add type indicator
        const truncatedName = this.name.length > maxLength 
            ? this.name.substring(0, maxLength) + '...' 
            : this.name;
            
        const typeConfig = this.getTypeConfig();
        return `${typeConfig.icon} ${truncatedName}`;
    }

    /**
     * Calculate activity efficiency (actual vs estimated duration)
     * @returns {number} Efficiency percentage (100 = perfect estimate)
     */
    getEfficiency() {
        if (this.estimatedDuration === 0 || this.actualDuration === 0) {
            return 0;
        }
        
        // Efficiency is better when actual is close to or less than estimated
        if (this.actualDuration <= this.estimatedDuration) {
            return Math.round((this.actualDuration / this.estimatedDuration) * 100);
        } else {
            // Penalty for going over estimate
            const overrun = this.actualDuration - this.estimatedDuration;
            const penalty = Math.min(overrun / this.estimatedDuration, 1) * 50; // Max 50% penalty
            return Math.max(0, Math.round(100 - penalty));
        }
    }

    /**
     * Check if activity conflicts with another activity
     * @param {ActivityModel} otherActivity - Other activity to check against
     * @returns {boolean} True if there's a conflict
     */
    conflictsWith(otherActivity) {
        return this.memberId === otherActivity.memberId && 
               this.date === otherActivity.date &&
               this.id !== otherActivity.id;
    }

    /**
     * Clone activity with optional property overrides
     * @param {Object} overrides - Properties to override in the clone
     * @returns {ActivityModel} Cloned activity
     */
    clone(overrides = {}) {
        const cloneData = {
            ...this.toJSON(),
            ...overrides,
            id: this.generateId(), // Always generate new ID for clone
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return new ActivityModel(cloneData);
    }

    /**
     * Update activity status with timestamp
     * @param {string} newStatus - New status to set
     */
    updateStatus(newStatus) {
        const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Mark activity as completed with actual duration
     * @param {number} actualDuration - Actual duration in hours
     */
    complete(actualDuration = null) {
        this.status = 'completed';
        if (actualDuration !== null) {
            this.actualDuration = actualDuration;
        }
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get display name for activity (truncated if too long)
     * @param {number} maxLength - Maximum length for display
     * @returns {string} Display name
     */
    getDisplayName(maxLength = 30) {
        if (this.name.length <= maxLength) {
            return this.name;
        }
        return this.name.substring(0, maxLength - 3) + '...';
    }

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return `activity_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            capacity: this.capacity,
            memberId: this.memberId,
            date: this.date,
            sprintId: this.sprintId,
            workStreamId: this.workStreamId,
            description: this.description,
            status: this.status,
            priority: this.priority,
            estimatedDuration: this.estimatedDuration,
            actualDuration: this.actualDuration,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create activity from JSON data
     * @param {Object} jsonData - JSON data to create activity from
     * @returns {ActivityModel} Activity instance
     */
    static fromJSON(jsonData) {
        return new ActivityModel(jsonData);
    }

    /**
     * Get available activity types
     * @returns {Array} Array of activity type options
     */
    static getActivityTypes() {
        return [
            { value: 'development', label: 'Development', icon: '💻' },
            { value: 'testing', label: 'Testing', icon: '🧪' },
            { value: 'meeting', label: 'Meeting', icon: '👥' },
            { value: 'review', label: 'Code Review', icon: '👁️' },
            { value: 'documentation', label: 'Documentation', icon: '📝' },
            { value: 'support', label: 'Support', icon: '🛠️' },
            { value: 'planning', label: 'Planning', icon: '📊' },
            { value: 'other', label: 'Other', icon: '📋' }
        ];
    }

    /**
     * Validate multiple activities for the same person/date
     * @param {Array} activities - Array of activities to validate
     * @param {number} maxDailyCapacity - Maximum daily capacity for the person
     * @returns {Object} Validation result
     */
    static validateDailyActivities(activities, maxDailyCapacity) {
        const errors = [];
        const warnings = [];
        
        if (!Array.isArray(activities)) {
            return { isValid: false, errors: ['Activities must be an array'], warnings: [] };
        }

        // Group by member and date
        const groupedActivities = activities.reduce((groups, activity) => {
            const key = `${activity.memberId}_${activity.date}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(activity);
            return groups;
        }, {});

        // Validate each group
        Object.keys(groupedActivities).forEach(key => {
            const dayActivities = groupedActivities[key];
            const totalCapacity = dayActivities.reduce((sum, activity) => sum + activity.capacity, 0);
            
            if (totalCapacity > maxDailyCapacity) {
                errors.push(`Total capacity ${totalCapacity} exceeds daily limit ${maxDailyCapacity} for ${key}`);
            }
            
            if (totalCapacity > maxDailyCapacity * 0.95) {
                warnings.push(`Near capacity limit for ${key}: ${totalCapacity}/${maxDailyCapacity}`);
            }

            // Check for duplicate activity names on same day
            const activityNames = dayActivities.map(a => a.name.toLowerCase());
            const duplicateNames = activityNames.filter((name, index) => activityNames.indexOf(name) !== index);
            if (duplicateNames.length > 0) {
                warnings.push(`Duplicate activity names found for ${key}: ${duplicateNames.join(', ')}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

// Export for global access
window.ActivityModel = ActivityModel;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityModel;
}