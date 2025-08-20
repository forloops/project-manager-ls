/**
 * Sprint Manager
 * Handles all sprint-related operations including CRUD operations,
 * capacity planning, and calendar management for the Product Manager LS application.
 */

class SprintManager {
    constructor() {
        this.storageKey = 'sprints';
        this.storage = window.storageManager;
        
        // Initialize with any existing sprints
        this.sprints = this.loadSprints();
        
        // Bind methods to maintain context
        this.createSprint = this.createSprint.bind(this);
        this.updateSprint = this.updateSprint.bind(this);
        this.deleteSprint = this.deleteSprint.bind(this);
    }

    /**
     * Load all sprints from storage
     * @returns {Array} Array of sprint objects
     */
    loadSprints() {
        try {
            const sprintData = this.storage.getEntities(this.storageKey);
            const SprintModel = window.SprintModel || SprintModel;
            return sprintData.map(data => new SprintModel(data));
        } catch (error) {
            console.error('Failed to load sprints:', error);
            return [];
        }
    }

    /**
     * Save sprints to storage
     * @returns {boolean} Success status
     */
    saveSprints() {
        try {
            const sprintData = this.sprints.map(sprint => sprint.toJSON());
            return this.storage.saveEntities(this.storageKey, sprintData);
        } catch (error) {
            console.error('Failed to save sprints:', error);
            return false;
        }
    }

    /**
     * Get all sprints
     * @returns {Array} Array of sprint models
     */
    getAllSprints() {
        return [...this.sprints];
    }

    /**
     * Get sprint by ID
     * @param {string} sprintId - Sprint ID to find
     * @returns {SprintModel|null} Sprint model or null if not found
     */
    getSprintById(sprintId) {
        return this.sprints.find(sprint => sprint.id === sprintId) || null;
    }

    /**
     * Create a new sprint
     * @param {Object} sprintData - Sprint data object
     * @returns {Object} Result object with success status and sprint/errors
     */
    createSprint(sprintData) {
        try {
            // Create sprint model and calculate end date
            const SprintModel = window.SprintModel || SprintModel;
            const sprint = new SprintModel(sprintData);
            
            // Calculate end date if not provided
            if (sprint.startDate && sprint.duration && !sprint.endDate) {
                sprint.endDate = SprintModel.calculateEndDate(sprint.startDate, sprint.duration);
            }
            
            const validation = sprint.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for overlapping sprints
            const overlapping = this.findOverlappingSprints(sprint.startDate, sprint.endDate, sprint.id);
            if (overlapping.length > 0) {
                return {
                    success: false,
                    errors: [`Sprint dates overlap with existing sprint(s): ${overlapping.map(s => s.name).join(', ')}`]
                };
            }

            // Initialize capacity structure
            sprint.capacity = this.initializeSprintCapacity(sprint);

            // Add to sprints array and save
            this.sprints.push(sprint);
            
            if (this.saveSprints()) {
                // Associate with work streams if any
                this.updateWorkStreamAssociations(sprint);
                this.notifySprintChange('created', sprint);
                return {
                    success: true,
                    sprint: sprint
                };
            } else {
                // Remove from array if save failed
                this.sprints.pop();
                return {
                    success: false,
                    errors: ['Failed to save sprint to storage']
                };
            }
        } catch (error) {
            console.error('Failed to create sprint:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while creating the sprint']
            };
        }
    }

    /**
     * Update an existing sprint
     * @param {string} sprintId - Sprint ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Object} Result object with success status and sprint/errors
     */
    updateSprint(sprintId, updates) {
        try {
            const sprintIndex = this.sprints.findIndex(sprint => sprint.id === sprintId);
            
            if (sprintIndex === -1) {
                return {
                    success: false,
                    errors: ['Sprint not found']
                };
            }

            // Create updated sprint model
            const currentSprint = this.sprints[sprintIndex];
            const updatedData = { ...currentSprint.toJSON(), ...updates };
            const SprintModel = window.SprintModel || SprintModel;
            const updatedSprint = new SprintModel(updatedData);
            
            // Validate updated sprint
            const validation = updatedSprint.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for overlapping sprints (excluding current sprint)
            const overlapping = this.findOverlappingSprints(
                updatedSprint.startDate, 
                updatedSprint.endDate, 
                sprintId
            );
            
            if (overlapping.length > 0) {
                return {
                    success: false,
                    errors: [`Sprint dates overlap with existing sprint(s): ${overlapping.map(s => s.name).join(', ')}`]
                };
            }

            // Update capacity if dates changed
            if (currentSprint.startDate !== updatedSprint.startDate || 
                currentSprint.endDate !== updatedSprint.endDate) {
                updatedSprint.capacity = this.updateSprintCapacity(currentSprint.capacity, updatedSprint);
            }

            // Update sprint in array and save
            this.sprints[sprintIndex] = updatedSprint;
            
            if (this.saveSprints()) {
                // Update work stream associations if any
                this.updateWorkStreamAssociations(updatedSprint);
                this.notifySprintChange('updated', updatedSprint);
                return {
                    success: true,
                    sprint: updatedSprint
                };
            } else {
                // Revert changes if save failed
                this.sprints[sprintIndex] = currentSprint;
                return {
                    success: false,
                    errors: ['Failed to save sprint updates to storage']
                };
            }
        } catch (error) {
            console.error('Failed to update sprint:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while updating the sprint']
            };
        }
    }

    /**
     * Delete a sprint
     * @param {string} sprintId - Sprint ID to delete
     * @returns {Object} Result object with success status
     */
    deleteSprint(sprintId) {
        try {
            const sprintIndex = this.sprints.findIndex(sprint => sprint.id === sprintId);
            
            if (sprintIndex === -1) {
                return {
                    success: false,
                    errors: ['Sprint not found']
                };
            }

            const deletedSprint = this.sprints[sprintIndex];
            
            // Remove from array
            this.sprints.splice(sprintIndex, 1);
            
            if (this.saveSprints()) {
                // Remove work stream associations
                this.removeWorkStreamAssociations(deletedSprint);
                this.notifySprintChange('deleted', deletedSprint);
                return {
                    success: true,
                    sprint: deletedSprint
                };
            } else {
                // Restore sprint if save failed
                this.sprints.splice(sprintIndex, 0, deletedSprint);
                return {
                    success: false,
                    errors: ['Failed to delete sprint from storage']
                };
            }
        } catch (error) {
            console.error('Failed to delete sprint:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while deleting the sprint']
            };
        }
    }

    /**
     * Find overlapping sprints
     * @param {string} startDate - Start date to check
     * @param {string} endDate - End date to check
     * @param {string} excludeSprintId - Sprint ID to exclude from check
     * @returns {Array} Array of overlapping sprints
     */
    findOverlappingSprints(startDate, endDate, excludeSprintId = null) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.sprints.filter(sprint => {
            if (excludeSprintId && sprint.id === excludeSprintId) {
                return false;
            }
            
            const sprintStart = new Date(sprint.startDate);
            const sprintEnd = new Date(sprint.endDate);
            
            // Check for any overlap (allowing adjacent sprints)
            // Sprints overlap if: start < sprintEnd AND end > sprintStart
            // This allows one sprint to end on the same day another starts
            return start < sprintEnd && end > sprintStart;
        });
    }

    /**
     * Initialize capacity structure for a new sprint
     * @param {SprintModel} sprint - Sprint to initialize capacity for
     * @returns {Object} Capacity object with default values
     */
    initializeSprintCapacity(sprint) {
        const capacity = {};
        const sprintDates = sprint.getSprintDates();
        
        sprintDates.forEach(day => {
            // Set default capacity for working days
            capacity[day.date] = day.isWeekend ? 0 : 8;
        });
        
        return capacity;
    }

    /**
     * Update sprint capacity when dates change
     * @param {Object} oldCapacity - Previous capacity object
     * @param {SprintModel} updatedSprint - Updated sprint model
     * @returns {Object} Updated capacity object
     */
    updateSprintCapacity(oldCapacity, updatedSprint) {
        const newCapacity = {};
        const sprintDates = updatedSprint.getSprintDates();
        
        sprintDates.forEach(day => {
            // Preserve existing capacity if date exists, otherwise use default
            newCapacity[day.date] = oldCapacity[day.date] !== undefined ? 
                oldCapacity[day.date] : 
                (day.isWeekend ? 0 : 8);
        });
        
        return newCapacity;
    }

    /**
     * Update work stream associations
     * @param {SprintModel} sprint - Sprint to update associations for
     */
    updateWorkStreamAssociations(sprint) {
        try {
            if (window.workStreamManager && sprint.workStreams) {
                sprint.workStreams.forEach(workStreamId => {
                    window.workStreamManager.associateWithSprint(workStreamId, sprint.id);
                });
            }
        } catch (error) {
            console.error('Failed to update work stream associations:', error);
            // Don't fail the sprint operation for work stream association issues
        }
    }

    /**
     * Remove work stream associations
     * @param {SprintModel} sprint - Sprint to remove associations for
     */
    removeWorkStreamAssociations(sprint) {
        try {
            if (window.workStreamManager && sprint.workStreams) {
                sprint.workStreams.forEach(workStreamId => {
                    window.workStreamManager.removeSprintAssociation(workStreamId, sprint.id);
                });
            }
        } catch (error) {
            console.error('Failed to remove work stream associations:', error);
            // Don't fail the sprint operation for work stream association issues
        }
    }

    /**
     * Set capacity for a specific sprint day
     * @param {string} sprintId - Sprint ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} capacity - Capacity points
     * @returns {boolean} Success status
     */
    setSprintDayCapacity(sprintId, date, capacity) {
        try {
            const sprint = this.getSprintById(sprintId);
            if (!sprint) return false;
            
            sprint.setDayCapacity(date, capacity);
            return this.saveSprints();
        } catch (error) {
            console.error('Failed to set sprint day capacity:', error);
            return false;
        }
    }

    /**
     * Get sprint calendar data for visualization
     * @param {string} sprintId - Sprint ID
     * @returns {Array} Array of calendar day objects
     */
    getSprintCalendar(sprintId) {
        try {
            const sprint = this.getSprintById(sprintId);
            if (!sprint) return [];

            const startDate = new Date(sprint.startDate);
            const endDate = new Date(sprint.endDate);
            
            // Get first day of the month containing sprint start
            const calendarStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            
            // Get last day of the month containing sprint end
            const calendarEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            
            const calendarDays = [];
            
            for (let date = new Date(calendarStart); date <= calendarEnd; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0];
                const isInSprint = dateStr >= sprint.startDate && dateStr <= sprint.endDate;
                
                calendarDays.push({
                    date: dateStr,
                    dayNumber: date.getDate(),
                    dayOfWeek: date.getDay(),
                    isWeekend: date.getDay() === 0 || date.getDay() === 6,
                    isInSprint: isInSprint,
                    isSprintStart: dateStr === sprint.startDate,
                    isSprintEnd: dateStr === sprint.endDate,
                    capacity: isInSprint ? (sprint.capacity[dateStr] || 0) : 0
                });
            }
            
            return calendarDays;
        } catch (error) {
            console.error('Failed to get sprint calendar:', error);
            return [];
        }
    }

    /**
     * Get sprints by type
     * @param {string} type - Sprint type to filter by
     * @returns {Array} Array of matching sprints
     */
    getSprintsByType(type) {
        return this.sprints.filter(sprint => sprint.type === type);
    }

    /**
     * Get sprints by status
     * @param {string} status - Status to filter by (Upcoming, Active, Completed)
     * @returns {Array} Array of matching sprints
     */
    getSprintsByStatus(status) {
        return this.sprints.filter(sprint => sprint.getCurrentStatus() === status);
    }

    /**
     * Get sprint statistics
     * @returns {Object} Statistics object
     */
    getSprintStatistics() {
        const stats = {
            total: this.sprints.length,
            upcoming: 0,
            active: 0,
            completed: 0,
            types: {
                'Development': 0,
                'Non-Functional': 0,
                'Release': 0,
                'Hardening': 0
            },
            totalCapacity: 0
        };

        this.sprints.forEach(sprint => {
            const status = sprint.getCurrentStatus();
            stats[status.toLowerCase()]++;
            stats.types[sprint.type]++;
            stats.totalCapacity += sprint.getTotalCapacity();
        });

        return stats;
    }

    /**
     * Notify about sprint changes for UI updates
     * @param {string} action - Action performed (created, updated, deleted)
     * @param {SprintModel} sprint - Sprint that was changed
     */
    notifySprintChange(action, sprint) {
        // Only dispatch events in browser environment
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('sprintChanged', {
                detail: { action, sprint: sprint.toJSON() }
            }));
        }
    }

    /**
     * Export sprints to JSON
     * @returns {string} JSON string of all sprints
     */
    exportSprints() {
        try {
            return JSON.stringify(this.sprints.map(sprint => sprint.toJSON()), null, 2);
        } catch (error) {
            console.error('Failed to export sprints:', error);
            return null;
        }
    }

    /**
     * Import sprints from JSON
     * @param {string} jsonData - JSON string of sprints
     * @returns {Object} Import result
     */
    importSprints(jsonData) {
        try {
            const sprintData = JSON.parse(jsonData);
            
            if (!Array.isArray(sprintData)) {
                return {
                    success: false,
                    errors: ['Invalid data format - expected array of sprints']
                };
            }

            const importedSprints = [];
            const errors = [];

            sprintData.forEach((data, index) => {
                try {
                    const SprintModel = window.SprintModel || SprintModel;
                    const sprint = new SprintModel(data);
                    const validation = sprint.validate();
                    
                    if (validation.isValid) {
                        importedSprints.push(sprint);
                    } else {
                        errors.push(`Sprint ${index + 1}: ${validation.errors.join(', ')}`);
                    }
                } catch (error) {
                    errors.push(`Sprint ${index + 1}: ${error.message}`);
                }
            });

            if (errors.length > 0) {
                return {
                    success: false,
                    errors: errors
                };
            }

            // Replace current sprints with imported ones
            this.sprints = importedSprints;
            
            if (this.saveSprints()) {
                return {
                    success: true,
                    imported: importedSprints.length
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save imported sprints']
                };
            }
        } catch (error) {
            console.error('Failed to import sprints:', error);
            return {
                success: false,
                errors: ['Invalid JSON format']
            };
        }
    }
}

// Create global instance
window.sprintManager = new SprintManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SprintManager;
}