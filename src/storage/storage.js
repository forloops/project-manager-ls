/**
 * Local Storage Abstraction Layer
 * Provides a unified interface for browser storage operations with error handling,
 * data validation, and automatic backup functionality for offline applications.
 */

class LocalStorageManager {
    constructor() {
        this.storageKey = 'productManagerLS';
        this.version = '1.0.0';
        this.backupKey = `${this.storageKey}_backup`;
        
        // Initialize storage structure if it doesn't exist
        this.initializeStorage();
    }

    /**
     * Initialize the storage structure with default data
     */
    initializeStorage() {
        try {
            const existingData = this.getData();
            if (!existingData) {
                const defaultData = {
                    version: this.version,
                    lastModified: new Date().toISOString(),
                    sprints: [],
                    workStreams: [],
                    releases: [],
                    teamMembers: [],
                    memberActivities: [],
                    capacityOverrides: [],
                    settings: {
                        defaultSprintDuration: 2,
                        workingDaysPerWeek: 5,
                        defaultCapacityPerDay: 8
                    }
                };
                this.saveData(defaultData);
                console.log('Local storage initialized with default data');
            } else {
                // Migrate existing data to include new fields if missing
                let needsUpdate = false;
                if (!existingData.memberActivities) {
                    existingData.memberActivities = [];
                    needsUpdate = true;
                }
                if (!existingData.capacityOverrides) {
                    existingData.capacityOverrides = [];
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    this.saveData(existingData);
                    console.log('Storage migrated to include activity support');
                }
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            this.handleStorageError(error);
        }
    }

    /**
     * Get all data from local storage
     * @returns {Object|null} The stored data or null if not found
     */
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                // Validate data structure
                if (this.validateDataStructure(parsed)) {
                    return parsed;
                } else {
                    console.warn('Invalid data structure detected, attempting recovery');
                    return this.attemptDataRecovery();
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to get data from storage:', error);
            return this.attemptDataRecovery();
        }
    }

    /**
     * Save data to local storage with automatic backup
     * @param {Object} data - The data to save
     * @returns {boolean} Success status
     */
    saveData(data) {
        try {
            // Add metadata
            data.lastModified = new Date().toISOString();
            data.version = this.version;

            // Validate data before saving
            if (!this.validateDataStructure(data)) {
                throw new Error('Invalid data structure');
            }

            // Create backup of current data before overwriting
            const currentData = this.getData();
            if (currentData) {
                localStorage.setItem(this.backupKey, JSON.stringify(currentData));
            }

            // Save new data
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            console.log('Data saved successfully to local storage');
            return true;
        } catch (error) {
            console.error('Failed to save data to storage:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Get specific entity collection from storage
     * @param {string} entityType - The type of entity (sprints, workStreams, etc.)
     * @returns {Array} Array of entities or empty array
     */
    getEntities(entityType) {
        try {
            const data = this.getData();
            return data && data[entityType] ? data[entityType] : [];
        } catch (error) {
            console.error(`Failed to get ${entityType} from storage:`, error);
            return [];
        }
    }

    /**
     * Save specific entity collection to storage
     * @param {string} entityType - The type of entity
     * @param {Array} entities - Array of entities to save
     * @returns {boolean} Success status
     */
    saveEntities(entityType, entities) {
        try {
            const data = this.getData() || {};
            data[entityType] = entities;
            return this.saveData(data);
        } catch (error) {
            console.error(`Failed to save ${entityType} to storage:`, error);
            return false;
        }
    }

    /**
     * Add a new entity to a collection
     * @param {string} entityType - The type of entity
     * @param {Object} entity - The entity to add
     * @returns {boolean} Success status
     */
    addEntity(entityType, entity) {
        try {
            const entities = this.getEntities(entityType);
            
            // Ensure entity has an ID
            if (!entity.id) {
                entity.id = this.generateId();
            }

            // Add timestamps
            entity.createdAt = new Date().toISOString();
            entity.updatedAt = new Date().toISOString();

            entities.push(entity);
            return this.saveEntities(entityType, entities);
        } catch (error) {
            console.error(`Failed to add ${entityType} entity:`, error);
            return false;
        }
    }

    /**
     * Update an existing entity in a collection
     * @param {string} entityType - The type of entity
     * @param {string} entityId - The ID of the entity to update
     * @param {Object} updates - The updates to apply
     * @returns {boolean} Success status
     */
    updateEntity(entityType, entityId, updates) {
        try {
            const entities = this.getEntities(entityType);
            const index = entities.findIndex(entity => entity.id === entityId);
            
            if (index === -1) {
                throw new Error(`Entity with ID ${entityId} not found`);
            }

            // Apply updates and add timestamp
            entities[index] = { ...entities[index], ...updates };
            entities[index].updatedAt = new Date().toISOString();

            return this.saveEntities(entityType, entities);
        } catch (error) {
            console.error(`Failed to update ${entityType} entity:`, error);
            return false;
        }
    }

    /**
     * Delete an entity from a collection
     * @param {string} entityType - The type of entity
     * @param {string} entityId - The ID of the entity to delete
     * @returns {boolean} Success status
     */
    deleteEntity(entityType, entityId) {
        try {
            const entities = this.getEntities(entityType);
            const filteredEntities = entities.filter(entity => entity.id !== entityId);
            
            if (filteredEntities.length === entities.length) {
                throw new Error(`Entity with ID ${entityId} not found`);
            }

            return this.saveEntities(entityType, filteredEntities);
        } catch (error) {
            console.error(`Failed to delete ${entityType} entity:`, error);
            return false;
        }
    }

    /**
     * Find an entity by ID
     * @param {string} entityType - The type of entity
     * @param {string} entityId - The ID of the entity to find
     * @returns {Object|null} The found entity or null
     */
    findEntity(entityType, entityId) {
        try {
            const entities = this.getEntities(entityType);
            return entities.find(entity => entity.id === entityId) || null;
        } catch (error) {
            console.error(`Failed to find ${entityType} entity:`, error);
            return null;
        }
    }

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        try {
            const data = this.getData();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }

    /**
     * Import data from JSON string
     * @param {string} jsonData - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!this.validateDataStructure(data)) {
                throw new Error('Invalid data structure for import');
            }

            return this.saveData(data);
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Clear all data (with confirmation)
     * @returns {boolean} Success status
     */
    clearData() {
        try {
            // Create final backup before clearing
            const currentData = this.getData();
            if (currentData) {
                localStorage.setItem(`${this.backupKey}_final`, JSON.stringify(currentData));
            }

            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.backupKey);
            
            // Reinitialize with default data
            this.initializeStorage();
            
            console.log('Data cleared and reinitialized');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Validate the structure of stored data
     * @param {Object} data - Data to validate
     * @returns {boolean} Validation result
     */
    validateDataStructure(data) {
        if (!data || typeof data !== 'object') return false;
        
        const requiredFields = ['sprints', 'workStreams', 'releases', 'teamMembers'];
        return requiredFields.every(field => Array.isArray(data[field]));
    }

    /**
     * Attempt to recover data from backup
     * @returns {Object|null} Recovered data or null
     */
    attemptDataRecovery() {
        try {
            console.log('Attempting data recovery from backup...');
            const backupData = localStorage.getItem(this.backupKey);
            
            if (backupData) {
                const parsed = JSON.parse(backupData);
                if (this.validateDataStructure(parsed)) {
                    // Restore from backup
                    localStorage.setItem(this.storageKey, backupData);
                    console.log('Data successfully recovered from backup');
                    return parsed;
                }
            }

            // If backup fails, try final backup
            const finalBackup = localStorage.getItem(`${this.backupKey}_final`);
            if (finalBackup) {
                const parsed = JSON.parse(finalBackup);
                if (this.validateDataStructure(parsed)) {
                    localStorage.setItem(this.storageKey, finalBackup);
                    console.log('Data recovered from final backup');
                    return parsed;
                }
            }

            console.warn('No valid backup found, initializing with defaults');
            this.initializeStorage();
            return this.getData();
        } catch (error) {
            console.error('Data recovery failed:', error);
            return null;
        }
    }

    /**
     * Handle storage errors with user-friendly messages
     * @param {Error} error - The error to handle
     */
    handleStorageError(error) {
        let message = 'Storage operation failed';
        
        if (error.name === 'QuotaExceededError') {
            message = 'Storage quota exceeded. Please clear some data or export for backup.';
        } else if (error.name === 'SecurityError') {
            message = 'Storage access denied. Please check browser security settings.';
        }

        console.error('Storage Error:', message, error);
        
        // Emit custom event for UI handling (only in browser environment)
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('storageError', {
                detail: { message, error }
            }));
        }
    }

    /**
     * Generate a unique ID for entities
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        try {
            const data = this.getData();
            if (!data) return null;

            return {
                totalSprints: data.sprints.length,
                totalWorkStreams: data.workStreams.length,
                totalReleases: data.releases.length,
                totalTeamMembers: data.teamMembers.length,
                dataSize: JSON.stringify(data).length,
                lastModified: data.lastModified,
                version: data.version
            };
        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return null;
        }
    }

    /**
     * Check if storage is available and working
     * @returns {boolean} Storage availability status
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.error('Storage not available:', error);
            return false;
        }
    }
}

// Create global instance
window.storageManager = new LocalStorageManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageManager;
}