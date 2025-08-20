/**
 * Work Stream Manager
 * Handles all work stream-related operations including CRUD operations,
 * color management, and integration with sprints and releases for the Product Manager LS application.
 */

class WorkStreamManager {
    constructor() {
        this.storageKey = 'workStreams';
        this.storage = window.storageManager;
        
        // Predefined color palette with accessibility compliance (WCAG 2.1 AA)
        this.colorPalette = [
            { name: 'Blue', color: '#2563EB', lightVariant: '#DBEAFE', darkVariant: '#1D4ED8' },
            { name: 'Green', color: '#059669', lightVariant: '#D1FAE5', darkVariant: '#047857' },
            { name: 'Purple', color: '#7C3AED', lightVariant: '#EDE9FE', darkVariant: '#6D28D9' },
            { name: 'Orange', color: '#EA580C', lightVariant: '#FED7AA', darkVariant: '#C2410C' },
            { name: 'Red', color: '#DC2626', lightVariant: '#FEE2E2', darkVariant: '#B91C1C' },
            { name: 'Teal', color: '#0D9488', lightVariant: '#CCFBF1', darkVariant: '#0F766E' },
            { name: 'Pink', color: '#DB2777', lightVariant: '#FCE7F3', darkVariant: '#BE185D' },
            { name: 'Amber', color: '#D97706', lightVariant: '#FEF3C7', darkVariant: '#B45309' },
            { name: 'Indigo', color: '#4F46E5', lightVariant: '#E0E7FF', darkVariant: '#4338CA' },
            { name: 'Lime', color: '#65A30D', lightVariant: '#ECFCCB', darkVariant: '#4D7C0F' },
            { name: 'Cyan', color: '#0891B2', lightVariant: '#CFFAFE', darkVariant: '#0E7490' },
            { name: 'Rose', color: '#E11D48', lightVariant: '#FFE4E6', darkVariant: '#BE123C' }
        ];
        
        // Initialize with any existing work streams
        this.workStreams = this.loadWorkStreams();
        
        // Bind methods to maintain context
        this.createWorkStream = this.createWorkStream.bind(this);
        this.updateWorkStream = this.updateWorkStream.bind(this);
        this.deleteWorkStream = this.deleteWorkStream.bind(this);
    }

    /**
     * Load all work streams from storage
     * @returns {Array} Array of work stream objects
     */
    loadWorkStreams() {
        try {
            const workStreamData = this.storage.getEntities(this.storageKey);
            return workStreamData.map(data => new WorkStreamModel(data));
        } catch (error) {
            console.error('Failed to load work streams:', error);
            return [];
        }
    }

    /**
     * Save work streams to storage
     * @returns {boolean} Success status
     */
    saveWorkStreams() {
        try {
            const workStreamData = this.workStreams.map(workStream => workStream.toJSON());
            return this.storage.saveEntities(this.storageKey, workStreamData);
        } catch (error) {
            console.error('Failed to save work streams:', error);
            return false;
        }
    }

    /**
     * Get all work streams
     * @returns {Array} Array of work stream models
     */
    getAllWorkStreams() {
        return [...this.workStreams];
    }

    /**
     * Get active work streams only
     * @returns {Array} Array of active work stream models
     */
    getActiveWorkStreams() {
        return this.workStreams.filter(workStream => workStream.isActive);
    }

    /**
     * Get work stream by ID
     * @param {string} workStreamId - Work stream ID to find
     * @returns {WorkStreamModel|null} Work stream model or null if not found
     */
    getWorkStreamById(workStreamId) {
        return this.workStreams.find(workStream => workStream.id === workStreamId) || null;
    }

    /**
     * Create a new work stream
     * @param {Object} workStreamData - Work stream data object
     * @returns {Object} Result object with success status and workStream/errors
     */
    createWorkStream(workStreamData) {
        try {
            // Auto-assign color if not provided
            if (!workStreamData.color) {
                workStreamData.color = this.getNextAvailableColor();
            }

            // Create work stream model and validate
            const workStream = new WorkStreamModel(workStreamData);
            const validation = workStream.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for duplicate names
            const existingWorkStream = this.workStreams.find(ws => 
                ws.name.toLowerCase() === workStream.name.toLowerCase() && ws.isActive
            );
            
            if (existingWorkStream) {
                return {
                    success: false,
                    errors: ['A work stream with this name already exists']
                };
            }

            // Add to work streams array and save
            this.workStreams.push(workStream);
            
            if (this.saveWorkStreams()) {
                this.notifyWorkStreamChange('created', workStream);
                return {
                    success: true,
                    workStream: workStream
                };
            } else {
                // Remove from array if save failed
                this.workStreams.pop();
                return {
                    success: false,
                    errors: ['Failed to save work stream to storage']
                };
            }
        } catch (error) {
            console.error('Failed to create work stream:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while creating the work stream']
            };
        }
    }

    /**
     * Update an existing work stream
     * @param {string} workStreamId - Work stream ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Object} Result object with success status and workStream/errors
     */
    updateWorkStream(workStreamId, updates) {
        try {
            const workStreamIndex = this.workStreams.findIndex(ws => ws.id === workStreamId);
            
            if (workStreamIndex === -1) {
                return {
                    success: false,
                    errors: ['Work stream not found']
                };
            }

            // Create updated work stream model
            const currentWorkStream = this.workStreams[workStreamIndex];
            const updatedData = { ...currentWorkStream.toJSON(), ...updates };
            const updatedWorkStream = new WorkStreamModel(updatedData);
            
            // Validate updated work stream
            const validation = updatedWorkStream.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for duplicate names (excluding current work stream)
            const duplicateWorkStream = this.workStreams.find(ws => 
                ws.id !== workStreamId &&
                ws.name.toLowerCase() === updatedWorkStream.name.toLowerCase() && 
                ws.isActive
            );
            
            if (duplicateWorkStream) {
                return {
                    success: false,
                    errors: ['A work stream with this name already exists']
                };
            }

            // Update work stream in array and save
            this.workStreams[workStreamIndex] = updatedWorkStream;
            
            if (this.saveWorkStreams()) {
                this.notifyWorkStreamChange('updated', updatedWorkStream);
                return {
                    success: true,
                    workStream: updatedWorkStream
                };
            } else {
                // Revert changes if save failed
                this.workStreams[workStreamIndex] = currentWorkStream;
                return {
                    success: false,
                    errors: ['Failed to save work stream updates to storage']
                };
            }
        } catch (error) {
            console.error('Failed to update work stream:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while updating the work stream']
            };
        }
    }

    /**
     * Delete a work stream (soft delete - marks as inactive)
     * @param {string} workStreamId - Work stream ID to delete
     * @returns {Object} Result object with success status
     */
    deleteWorkStream(workStreamId) {
        try {
            const workStreamIndex = this.workStreams.findIndex(ws => ws.id === workStreamId);
            
            if (workStreamIndex === -1) {
                return {
                    success: false,
                    errors: ['Work stream not found']
                };
            }

            const workStream = this.workStreams[workStreamIndex];
            
            // Check if work stream is associated with any sprints or releases
            const associatedSprints = this.getAssociatedSprints(workStreamId);
            const associatedReleases = this.getAssociatedReleases(workStreamId);
            
            if (associatedSprints.length > 0 || associatedReleases.length > 0) {
                // Soft delete - mark as inactive
                workStream.isActive = false;
                workStream.updatedAt = new Date().toISOString();
                
                if (this.saveWorkStreams()) {
                    this.notifyWorkStreamChange('deactivated', workStream);
                    return {
                        success: true,
                        workStream: workStream,
                        warning: 'Work stream deactivated due to existing associations'
                    };
                } else {
                    return {
                        success: false,
                        errors: ['Failed to deactivate work stream']
                    };
                }
            } else {
                // Hard delete - remove completely
                this.workStreams.splice(workStreamIndex, 1);
                
                if (this.saveWorkStreams()) {
                    this.notifyWorkStreamChange('deleted', workStream);
                    return {
                        success: true,
                        workStream: workStream
                    };
                } else {
                    // Restore work stream if save failed
                    this.workStreams.splice(workStreamIndex, 0, workStream);
                    return {
                        success: false,
                        errors: ['Failed to delete work stream from storage']
                    };
                }
            }
        } catch (error) {
            console.error('Failed to delete work stream:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while deleting the work stream']
            };
        }
    }

    /**
     * Get the next available color from the palette
     * @returns {string} Hex color code
     */
    getNextAvailableColor() {
        const usedColors = this.workStreams
            .filter(ws => ws.isActive)
            .map(ws => ws.color);
        
        // Find first unused color
        const availableColor = this.colorPalette.find(colorObj => 
            !usedColors.includes(colorObj.color)
        );
        
        // If all colors are used, cycle back to the first one
        return availableColor ? availableColor.color : this.colorPalette[0].color;
    }

    /**
     * Get available colors for selection
     * @returns {Array} Array of available color objects
     */
    getAvailableColors() {
        const usedColors = this.workStreams
            .filter(ws => ws.isActive)
            .map(ws => ws.color);
        
        return this.colorPalette.map(colorObj => ({
            ...colorObj,
            isUsed: usedColors.includes(colorObj.color)
        }));
    }

    /**
     * Get color information for a work stream
     * @param {string} workStreamId - Work stream ID
     * @returns {Object|null} Color information object
     */
    getWorkStreamColorInfo(workStreamId) {
        const workStream = this.getWorkStreamById(workStreamId);
        if (!workStream) return null;
        
        const colorInfo = this.colorPalette.find(colorObj => 
            colorObj.color === workStream.color
        );
        
        return colorInfo || {
            name: 'Custom',
            color: workStream.color,
            lightVariant: workStream.color + '33', // Add transparency
            darkVariant: workStream.color
        };
    }

    /**
     * Associate work stream with a sprint
     * @param {string} workStreamId - Work stream ID
     * @param {string} sprintId - Sprint ID
     * @returns {boolean} Success status
     */
    associateWithSprint(workStreamId, sprintId) {
        try {
            const workStream = this.getWorkStreamById(workStreamId);
            if (!workStream) return false;
            
            workStream.addSprint(sprintId);
            return this.saveWorkStreams();
        } catch (error) {
            console.error('Failed to associate work stream with sprint:', error);
            return false;
        }
    }

    /**
     * Remove work stream association with a sprint
     * @param {string} workStreamId - Work stream ID
     * @param {string} sprintId - Sprint ID
     * @returns {boolean} Success status
     */
    removeSprintAssociation(workStreamId, sprintId) {
        try {
            const workStream = this.getWorkStreamById(workStreamId);
            if (!workStream) return false;
            
            workStream.removeSprint(sprintId);
            return this.saveWorkStreams();
        } catch (error) {
            console.error('Failed to remove work stream sprint association:', error);
            return false;
        }
    }

    /**
     * Get work streams associated with a sprint
     * @param {string} sprintId - Sprint ID
     * @returns {Array} Array of associated work streams
     */
    getWorkStreamsBySprint(sprintId) {
        return this.workStreams.filter(workStream => 
            workStream.sprints.includes(sprintId)
        );
    }

    /**
     * Get associated sprints for a work stream (requires access to sprint manager)
     * @param {string} workStreamId - Work stream ID
     * @returns {Array} Array of associated sprint IDs
     */
    getAssociatedSprints(workStreamId) {
        const workStream = this.getWorkStreamById(workStreamId);
        return workStream ? workStream.sprints : [];
    }

    /**
     * Get associated releases for a work stream (placeholder for future release manager)
     * @param {string} workStreamId - Work stream ID
     * @returns {Array} Array of associated release IDs
     */
    getAssociatedReleases(workStreamId) {
        const workStream = this.getWorkStreamById(workStreamId);
        return workStream ? workStream.releases : [];
    }

    /**
     * Get work stream statistics
     * @returns {Object} Statistics object
     */
    getWorkStreamStatistics() {
        const activeWorkStreams = this.getActiveWorkStreams();
        const stats = {
            total: this.workStreams.length,
            active: activeWorkStreams.length,
            inactive: this.workStreams.length - activeWorkStreams.length,
            colorsUsed: new Set(activeWorkStreams.map(ws => ws.color)).size,
            totalAssociations: {
                sprints: activeWorkStreams.reduce((total, ws) => total + ws.sprints.length, 0),
                releases: activeWorkStreams.reduce((total, ws) => total + ws.releases.length, 0)
            },
            utilizationAnalysis: this.getWorkStreamUtilization(activeWorkStreams)
        };

        return stats;
    }

    /**
     * Get work stream utilization analysis
     * @param {Array} workStreams - Work streams to analyze
     * @returns {Object} Utilization analysis
     */
    getWorkStreamUtilization(workStreams) {
        const analysis = {
            mostUsed: null,
            leastUsed: null,
            averageAssociations: 0,
            distributionScore: 0
        };

        if (workStreams.length === 0) return analysis;

        // Calculate sprint associations per work stream
        const associations = workStreams.map(ws => ({
            workStream: ws,
            sprintCount: ws.sprints.length,
            releaseCount: ws.releases.length,
            totalAssociations: ws.sprints.length + ws.releases.length
        }));

        // Sort by total associations
        associations.sort((a, b) => b.totalAssociations - a.totalAssociations);

        analysis.mostUsed = associations[0];
        analysis.leastUsed = associations[associations.length - 1];
        analysis.averageAssociations = associations.reduce((sum, a) => sum + a.totalAssociations, 0) / associations.length;

        // Calculate distribution score (0-100, higher = more even distribution)
        if (associations.length > 1) {
            const variance = associations.reduce((sum, a) => {
                return sum + Math.pow(a.totalAssociations - analysis.averageAssociations, 2);
            }, 0) / associations.length;
            
            const standardDeviation = Math.sqrt(variance);
            // Convert to 0-100 scale where lower variance = higher score
            analysis.distributionScore = Math.max(0, 100 - (standardDeviation * 10));
        } else {
            analysis.distributionScore = 100;
        }

        return analysis;
    }

    /**
     * Notify about work stream changes for UI updates
     * @param {string} action - Action performed (created, updated, deleted, deactivated)
     * @param {WorkStreamModel} workStream - Work stream that was changed
     */
    notifyWorkStreamChange(action, workStream) {
        window.dispatchEvent(new CustomEvent('workStreamChanged', {
            detail: { action, workStream: workStream.toJSON() }
        }));
    }

    /**
     * Export work streams to JSON
     * @returns {string} JSON string of all work streams
     */
    exportWorkStreams() {
        try {
            return JSON.stringify(this.workStreams.map(ws => ws.toJSON()), null, 2);
        } catch (error) {
            console.error('Failed to export work streams:', error);
            return null;
        }
    }

    /**
     * Import work streams from JSON
     * @param {string} jsonData - JSON string of work streams
     * @returns {Object} Import result
     */
    importWorkStreams(jsonData) {
        try {
            const workStreamData = JSON.parse(jsonData);
            
            if (!Array.isArray(workStreamData)) {
                return {
                    success: false,
                    errors: ['Invalid data format - expected array of work streams']
                };
            }

            const importedWorkStreams = [];
            const errors = [];

            workStreamData.forEach((data, index) => {
                try {
                    const workStream = new WorkStreamModel(data);
                    const validation = workStream.validate();
                    
                    if (validation.isValid) {
                        importedWorkStreams.push(workStream);
                    } else {
                        errors.push(`Work Stream ${index + 1}: ${validation.errors.join(', ')}`);
                    }
                } catch (error) {
                    errors.push(`Work Stream ${index + 1}: ${error.message}`);
                }
            });

            if (errors.length > 0) {
                return {
                    success: false,
                    errors: errors
                };
            }

            // Replace current work streams with imported ones
            this.workStreams = importedWorkStreams;
            
            if (this.saveWorkStreams()) {
                return {
                    success: true,
                    imported: importedWorkStreams.length
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save imported work streams']
                };
            }
        } catch (error) {
            console.error('Failed to import work streams:', error);
            return {
                success: false,
                errors: ['Invalid JSON format']
            };
        }
    }

    /**
     * Validate color format
     * @param {string} color - Color to validate
     * @returns {boolean} Validation result
     */
    isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    /**
     * Get contrast ratio information for accessibility
     * @param {string} backgroundColor - Background color hex
     * @param {string} textColor - Text color hex (default: white)
     * @returns {Object} Contrast information
     */
    getContrastInfo(backgroundColor, textColor = '#FFFFFF') {
        // This is a simplified contrast calculation
        // In a production app, you might want to use a more sophisticated library
        const getLuminance = (color) => {
            const rgb = parseInt(color.slice(1), 16);
            const r = ((rgb >> 16) & 0xff) / 255;
            const g = ((rgb >> 8) & 0xff) / 255;
            const b = (rgb & 0xff) / 255;
            return 0.299 * r + 0.587 * g + 0.114 * b;
        };

        const bgLuminance = getLuminance(backgroundColor);
        const textLuminance = getLuminance(textColor);
        const contrast = Math.abs(bgLuminance - textLuminance);

        return {
            contrast: contrast,
            isAccessible: contrast > 0.5, // Simplified accessibility check
            recommendation: contrast > 0.5 ? 'Good contrast' : 'Poor contrast - consider different colors'
        };
    }
}

// Create global instance
window.workStreamManager = new WorkStreamManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkStreamManager;
}