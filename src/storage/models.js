/**
 * Data Models for Product Manager LS
 * Defines the structure and validation for all data entities used in the application.
 * Includes Sprint, WorkStream, Release, and TeamMember models with validation.
 */

/**
 * Sprint Model
 * Represents a development sprint with capacity planning and timeline management
 */
class SprintModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.startDate = data.startDate || '';
        this.endDate = data.endDate || '';
        this.duration = parseInt(data.duration) || 2; // 2 or 3 weeks
        this.type = data.type || 'Development'; // Development, Non-Functional, Release, Hardening
        this.capacity = data.capacity || {}; // daily capacity allocation
        this.workStreams = data.workStreams || []; // associated work stream IDs
        this.teamMembers = data.teamMembers || []; // assigned team member IDs
        this.status = data.status || 'Planning'; // Planning, Active, Completed
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validate sprint data
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Sprint name is required');
        }

        if (!this.startDate) {
            errors.push('Start date is required');
        }

        if (!this.endDate) {
            errors.push('End date is required');
        }

        if (this.startDate && this.endDate && new Date(this.startDate) >= new Date(this.endDate)) {
            errors.push('End date must be after start date');
        }

        if (![2, 3].includes(this.duration)) {
            errors.push('Duration must be 2 or 3 weeks');
        }

        const validTypes = ['Development', 'Non-Functional', 'Release', 'Hardening'];
        if (!validTypes.includes(this.type)) {
            errors.push('Invalid sprint type');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate end date based on start date and duration
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {number} duration - Duration in weeks
     * @returns {string} End date in YYYY-MM-DD format
     */
    static calculateEndDate(startDate, duration) {
        if (!startDate || !duration) return '';
        
        const start = new Date(startDate);
        const daysToAdd = (duration * 7) - 1; // -1 to make it inclusive
        start.setDate(start.getDate() + daysToAdd);
        
        return start.toISOString().split('T')[0];
    }

    /**
     * Get sprint status based on dates
     * @returns {string} Current status
     */
    getCurrentStatus() {
        const now = new Date();
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);

        if (now < start) return 'Upcoming';
        if (now > end) return 'Completed';
        return 'Active';
    }

    /**
     * Get all dates within the sprint
     * @returns {Array} Array of date objects with sprint information
     */
    getSprintDates() {
        const dates = [];
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            dates.push({
                date: dateStr,
                dayOfWeek: date.getDay(),
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                capacity: this.capacity[dateStr] || 0
            });
        }
        
        return dates;
    }

    /**
     * Set capacity for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} capacity - Capacity points for the date
     */
    setDayCapacity(date, capacity) {
        if (!this.capacity) this.capacity = {};
        this.capacity[date] = capacity;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get total capacity for the sprint
     * @returns {number} Total capacity points
     */
    getTotalCapacity() {
        return Object.values(this.capacity).reduce((total, cap) => total + (cap || 0), 0);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
            duration: this.duration,
            type: this.type,
            capacity: this.capacity,
            workStreams: this.workStreams,
            teamMembers: this.teamMembers,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * WorkStream Model
 * Represents a logical grouping of work with visual categorization
 */
class WorkStreamModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.color = data.color || '#3B82F6'; // Default blue
        this.description = data.description || '';
        this.sprints = data.sprints || []; // associated sprint IDs
        this.releases = data.releases || []; // associated release IDs
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Work stream name is required');
        }

        if (!this.color || !/^#[0-9A-F]{6}$/i.test(this.color)) {
            errors.push('Valid color code is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Add sprint association
     * @param {string} sprintId - Sprint ID to associate
     */
    addSprint(sprintId) {
        if (!this.sprints.includes(sprintId)) {
            this.sprints.push(sprintId);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove sprint association
     * @param {string} sprintId - Sprint ID to remove
     */
    removeSprint(sprintId) {
        this.sprints = this.sprints.filter(id => id !== sprintId);
        this.updatedAt = new Date().toISOString();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            description: this.description,
            sprints: this.sprints,
            releases: this.releases,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Release Model
 * Represents a product release with go/no-go decision points
 */
class ReleaseModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.goNoGoDate = data.goNoGoDate || '';
        this.productionDate = data.productionDate || '';
        this.sprints = data.sprints || []; // associated sprint IDs
        this.workStreams = data.workStreams || []; // scope definition
        this.status = data.status || 'Planning'; // Planning, In Progress, Go, No-Go, Released
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Release name is required');
        }

        if (!this.goNoGoDate) {
            errors.push('Go/No-Go date is required');
        }

        if (!this.productionDate) {
            errors.push('Production date is required');
        }

        if (this.goNoGoDate && this.productionDate && 
            new Date(this.goNoGoDate) >= new Date(this.productionDate)) {
            errors.push('Production date must be after Go/No-Go date');
        }

        const validStatuses = ['Planning', 'In Progress', 'Go', 'No-Go', 'Released'];
        if (!validStatuses.includes(this.status)) {
            errors.push('Invalid release status');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get release readiness based on associated sprints
     * @param {Array} sprints - Array of all sprints
     * @returns {Object} Readiness information
     */
    getReadiness(sprints) {
        const relatedSprints = sprints.filter(sprint => this.sprints.includes(sprint.id));
        const completedSprints = relatedSprints.filter(sprint => sprint.getCurrentStatus() === 'Completed');
        
        return {
            totalSprints: relatedSprints.length,
            completedSprints: completedSprints.length,
            percentage: relatedSprints.length > 0 ? 
                Math.round((completedSprints.length / relatedSprints.length) * 100) : 0
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            goNoGoDate: this.goNoGoDate,
            productionDate: this.productionDate,
            sprints: this.sprints,
            workStreams: this.workStreams,
            status: this.status,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * TeamMember Model
 * Represents a team member with capacity and availability tracking
 */
class TeamMemberModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.email = data.email || '';
        this.role = data.role || 'Developer'; // Developer, Tester, BA, PO, PM, TL, Architect, Support
        this.defaultCapacity = data.defaultCapacity || 8; // story points per sprint
        this.timeOff = data.timeOff || []; // date ranges for unavailability
        this.supportRotation = data.supportRotation || {}; // primary/secondary assignments
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Team member name is required');
        }

        if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            errors.push('Valid email address is required');
        }

        const validRoles = ['Developer', 'Tester', 'Business Analyst', 'Product Owner', 'Product Manager', 'Technical Lead', 'Architect', 'Production Support'];
        if (!validRoles.includes(this.role)) {
            errors.push('Invalid team member role');
        }

        if (this.defaultCapacity < 0 || this.defaultCapacity > 40) {
            errors.push('Default capacity must be between 0 and 40 points');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Add time off period
     * @param {string} startDate - Start date of time off
     * @param {string} endDate - End date of time off
     * @param {string} reason - Reason for time off
     */
    addTimeOff(startDate, endDate, reason = '') {
        this.timeOff.push({
            id: this.generateId(),
            startDate,
            endDate,
            reason,
            createdAt: new Date().toISOString()
        });
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Remove time off period
     * @param {string} timeOffId - ID of time off period to remove
     */
    removeTimeOff(timeOffId) {
        this.timeOff = this.timeOff.filter(timeOff => timeOff.id !== timeOffId);
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Check if team member is available on a specific date
     * @param {string} date - Date to check (YYYY-MM-DD)
     * @returns {boolean} Availability status
     */
    isAvailableOnDate(date) {
        const checkDate = new Date(date);
        return !this.timeOff.some(timeOff => {
            const start = new Date(timeOff.startDate);
            const end = new Date(timeOff.endDate);
            return checkDate >= start && checkDate <= end;
        });
    }

    /**
     * Get capacity for a specific sprint considering time off
     * @param {SprintModel} sprint - Sprint to calculate capacity for
     * @returns {number} Adjusted capacity
     */
    getSprintCapacity(sprint) {
        const sprintDates = sprint.getSprintDates();
        const workingDays = sprintDates.filter(day => 
            !day.isWeekend && this.isAvailableOnDate(day.date)
        );
        
        return workingDays.length * (this.defaultCapacity / 5); // Assuming 5 working days per week
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            role: this.role,
            defaultCapacity: this.defaultCapacity,
            timeOff: this.timeOff,
            supportRotation: this.supportRotation,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Activity Model
 * Represents individual activities within a person's daily capacity
 */
class ActivityModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.type = data.type || 'development';
        this.capacity = data.capacity || 0;
        this.memberId = data.memberId || '';
        this.date = data.date || '';
        this.sprintId = data.sprintId || '';
        this.workStreamId = data.workStreamId || '';
        this.description = data.description || '';
        this.status = data.status || 'planned';
        this.priority = data.priority || 'medium';
        this.estimatedDuration = data.estimatedDuration || 0;
        this.actualDuration = data.actualDuration || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

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

    generateId() {
        return `activity_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;
    }

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
}

/**
 * Model Factory
 * Creates model instances from plain data objects
 */
class ModelFactory {
    static createSprint(data) {
        return new SprintModel(data);
    }

    static createWorkStream(data) {
        return new WorkStreamModel(data);
    }

    static createRelease(data) {
        return new ReleaseModel(data);
    }

    static createTeamMember(data) {
        return new TeamMemberModel(data);
    }

    static createActivity(data) {
        return new ActivityModel(data);
    }

    /**
     * Create model instance based on type
     * @param {string} type - Model type
     * @param {Object} data - Data to create model with
     * @returns {Object} Model instance
     */
    static create(type, data) {
        switch (type) {
            case 'sprint':
                return this.createSprint(data);
            case 'workStream':
                return this.createWorkStream(data);
            case 'release':
                return this.createRelease(data);
            case 'teamMember':
                return this.createTeamMember(data);
            case 'activity':
                return this.createActivity(data);
            default:
                throw new Error(`Unknown model type: ${type}`);
        }
    }

    /**
     * Validate data for a specific model type
     * @param {string} type - Model type
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result
     */
    static validate(type, data) {
        const model = this.create(type, data);
        return model.validate();
    }
}

// Export models for global access
window.SprintModel = SprintModel;
window.WorkStreamModel = WorkStreamModel;
window.ReleaseModel = ReleaseModel;
window.TeamMemberModel = TeamMemberModel;
window.ActivityModel = ActivityModel;
window.ModelFactory = ModelFactory;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SprintModel,
        WorkStreamModel,
        ReleaseModel,
        TeamMemberModel,
        ActivityModel,
        ModelFactory
    };
}