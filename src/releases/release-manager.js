/**
 * Release Management System
 * Handles CRUD operations for releases, integrates with sprints and work streams,
 * and provides release tracking and readiness analysis for go/no-go decisions.
 */

class ReleaseManager {
    constructor() {
        this.storageKey = 'releases';
        this.eventPrefix = 'release';
    }

    /**
     * Get all releases from storage
     * @returns {Array} Array of release objects
     */
    getAllReleases() {
        try {
            const releases = window.storageManager.getEntities(this.storageKey);
            return releases.map(release => new ReleaseModel(release));
        } catch (error) {
            console.error('Failed to get releases:', error);
            return [];
        }
    }

    /**
     * Get release by ID
     * @param {string} releaseId - Release ID to find
     * @returns {ReleaseModel|null} Release model or null if not found
     */
    getRelease(releaseId) {
        try {
            const release = window.storageManager.findEntity(this.storageKey, releaseId);
            return release ? new ReleaseModel(release) : null;
        } catch (error) {
            console.error('Failed to get release:', error);
            return null;
        }
    }

    /**
     * Create a new release
     * @param {Object} releaseData - Release data
     * @returns {Object} Operation result with success status and errors
     */
    createRelease(releaseData) {
        try {
            // Create release model and validate
            const release = new ReleaseModel(releaseData);
            const validation = release.validate();

            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                    release: null
                };
            }

            // Check for duplicate names
            const existingReleases = this.getAllReleases();
            const duplicateName = existingReleases.find(r => 
                r.name.toLowerCase() === release.name.toLowerCase()
            );

            if (duplicateName) {
                return {
                    success: false,
                    errors: ['A release with this name already exists'],
                    release: null
                };
            }

            // Save to storage
            const saved = window.storageManager.addEntity(this.storageKey, release.toJSON());
            
            if (saved) {
                // Update work stream associations
                this.updateWorkStreamAssociations(release.id, release.workStreams);
                
                // Emit event
                this.emitReleaseEvent('created', release);
                
                return {
                    success: true,
                    errors: [],
                    release: release
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save release to storage'],
                    release: null
                };
            }
        } catch (error) {
            console.error('Failed to create release:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while creating the release'],
                release: null
            };
        }
    }

    /**
     * Update an existing release
     * @param {string} releaseId - Release ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Object} Operation result
     */
    updateRelease(releaseId, updates) {
        try {
            const existingRelease = this.getRelease(releaseId);
            if (!existingRelease) {
                return {
                    success: false,
                    errors: ['Release not found'],
                    release: null
                };
            }

            // Apply updates and validate
            const updatedData = { ...existingRelease.toJSON(), ...updates };
            const release = new ReleaseModel(updatedData);
            const validation = release.validate();

            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors,
                    release: null
                };
            }

            // Check for duplicate names (excluding current release)
            const existingReleases = this.getAllReleases();
            const duplicateName = existingReleases.find(r => 
                r.id !== releaseId && r.name.toLowerCase() === release.name.toLowerCase()
            );

            if (duplicateName) {
                return {
                    success: false,
                    errors: ['A release with this name already exists'],
                    release: null
                };
            }

            // Update storage
            const saved = window.storageManager.updateEntity(this.storageKey, releaseId, release.toJSON());
            
            if (saved) {
                // Update work stream associations if changed
                if (updates.workStreams) {
                    this.updateWorkStreamAssociations(releaseId, release.workStreams, existingRelease.workStreams);
                }
                
                // Emit event
                this.emitReleaseEvent('updated', release);
                
                return {
                    success: true,
                    errors: [],
                    release: release
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to update release in storage'],
                    release: null
                };
            }
        } catch (error) {
            console.error('Failed to update release:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while updating the release'],
                release: null
            };
        }
    }

    /**
     * Delete a release
     * @param {string} releaseId - Release ID to delete
     * @returns {Object} Operation result
     */
    deleteRelease(releaseId) {
        try {
            const release = this.getRelease(releaseId);
            if (!release) {
                return {
                    success: false,
                    errors: ['Release not found'],
                    release: null
                };
            }

            // Remove from storage
            const deleted = window.storageManager.deleteEntity(this.storageKey, releaseId);
            
            if (deleted) {
                // Clean up work stream associations
                this.updateWorkStreamAssociations(releaseId, [], release.workStreams);
                
                // Emit event
                this.emitReleaseEvent('deleted', release);
                
                return {
                    success: true,
                    errors: [],
                    release: release
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to delete release from storage'],
                    release: null
                };
            }
        } catch (error) {
            console.error('Failed to delete release:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while deleting the release'],
                release: null
            };
        }
    }

    /**
     * Get releases by status
     * @param {string} status - Release status to filter by
     * @returns {Array} Array of releases with the specified status
     */
    getReleasesByStatus(status) {
        const releases = this.getAllReleases();
        return releases.filter(release => release.status === status);
    }

    /**
     * Get upcoming releases (releases with future go/no-go dates)
     * @returns {Array} Array of upcoming releases
     */
    getUpcomingReleases() {
        const releases = this.getAllReleases();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return releases.filter(release => {
            const goNoGoDate = new Date(release.goNoGoDate);
            return goNoGoDate >= today && release.status !== 'Released';
        }).sort((a, b) => new Date(a.goNoGoDate) - new Date(b.goNoGoDate));
    }

    /**
     * Get release readiness analysis
     * @param {string} releaseId - Release ID to analyze
     * @returns {Object} Readiness analysis with sprint progress and recommendations
     */
    getReleaseReadiness(releaseId) {
        try {
            const release = this.getRelease(releaseId);
            if (!release) {
                return null;
            }

            // Get associated sprints
            const sprints = window.sprintManager.getAllSprints();
            const relatedSprints = sprints.filter(sprint => release.sprints.includes(sprint.id));
            
            // Calculate sprint completion
            const sprintAnalysis = this.analyzeSprintProgress(relatedSprints);
            
            // Get work stream progress
            const workStreamAnalysis = this.analyzeWorkStreamProgress(release.workStreams, relatedSprints);
            
            // Calculate overall readiness score
            const readinessScore = this.calculateReadinessScore(sprintAnalysis, workStreamAnalysis);
            
            // Generate recommendations
            const recommendations = this.generateReadinessRecommendations(release, sprintAnalysis, workStreamAnalysis);

            return {
                release: release,
                sprints: sprintAnalysis,
                workStreams: workStreamAnalysis,
                readinessScore: readinessScore,
                recommendations: recommendations,
                goNoGoDate: release.goNoGoDate,
                productionDate: release.productionDate,
                daysToGoNoGo: this.getDaysUntilDate(release.goNoGoDate),
                daysToProduction: this.getDaysUntilDate(release.productionDate)
            };
        } catch (error) {
            console.error('Failed to get release readiness:', error);
            return null;
        }
    }

    /**
     * Analyze sprint progress for a release
     * @param {Array} sprints - Array of sprints associated with the release
     * @returns {Object} Sprint analysis
     */
    analyzeSprintProgress(sprints) {
        const total = sprints.length;
        const completed = sprints.filter(sprint => sprint.getCurrentStatus() === 'Completed').length;
        const active = sprints.filter(sprint => sprint.getCurrentStatus() === 'Active').length;
        const upcoming = sprints.filter(sprint => sprint.getCurrentStatus() === 'Upcoming').length;

        return {
            total: total,
            completed: completed,
            active: active,
            upcoming: upcoming,
            completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            sprints: sprints.map(sprint => ({
                id: sprint.id,
                name: sprint.name,
                status: sprint.getCurrentStatus(),
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                type: sprint.type
            }))
        };
    }

    /**
     * Analyze work stream progress across sprints
     * @param {Array} workStreamIds - Array of work stream IDs
     * @param {Array} sprints - Array of sprints to analyze
     * @returns {Object} Work stream analysis
     */
    analyzeWorkStreamProgress(workStreamIds, sprints) {
        if (!window.workStreamManager) {
            return { workStreams: [], coverage: 0 };
        }

        const workStreams = workStreamIds.map(id => {
            const workStream = window.workStreamManager.getWorkStreamById(id);
            if (!workStream) return null;

            const associatedSprints = sprints.filter(sprint => 
                sprint.workStreams && sprint.workStreams.includes(id)
            );

            const completedSprints = associatedSprints.filter(sprint => 
                sprint.getCurrentStatus() === 'Completed'
            );

            return {
                id: workStream.id,
                name: workStream.name,
                color: workStream.color,
                totalSprints: associatedSprints.length,
                completedSprints: completedSprints.length,
                completionPercentage: associatedSprints.length > 0 ? 
                    Math.round((completedSprints.length / associatedSprints.length) * 100) : 0
            };
        }).filter(ws => ws !== null);

        const totalSprintAssociations = workStreams.reduce((sum, ws) => sum + ws.totalSprints, 0);
        const completedSprintAssociations = workStreams.reduce((sum, ws) => sum + ws.completedSprints, 0);

        return {
            workStreams: workStreams,
            coverage: totalSprintAssociations > 0 ? 
                Math.round((completedSprintAssociations / totalSprintAssociations) * 100) : 0
        };
    }

    /**
     * Calculate overall release readiness score
     * @param {Object} sprintAnalysis - Sprint progress analysis
     * @param {Object} workStreamAnalysis - Work stream analysis
     * @returns {number} Readiness score (0-100)
     */
    calculateReadinessScore(sprintAnalysis, workStreamAnalysis) {
        // Weight factors for different aspects
        const sprintWeight = 0.7;
        const workStreamWeight = 0.3;

        const sprintScore = sprintAnalysis.completionPercentage;
        const workStreamScore = workStreamAnalysis.coverage;

        return Math.round((sprintScore * sprintWeight) + (workStreamScore * workStreamWeight));
    }

    /**
     * Generate recommendations for release readiness
     * @param {ReleaseModel} release - Release model
     * @param {Object} sprintAnalysis - Sprint analysis
     * @param {Object} workStreamAnalysis - Work stream analysis
     * @returns {Array} Array of recommendation strings
     */
    generateReadinessRecommendations(release, sprintAnalysis, workStreamAnalysis) {
        const recommendations = [];
        const daysToGoNoGo = this.getDaysUntilDate(release.goNoGoDate);

        // Sprint-based recommendations
        if (sprintAnalysis.completionPercentage < 80 && daysToGoNoGo <= 7) {
            recommendations.push('Consider postponing go/no-go date - sprint completion below 80%');
        }

        if (sprintAnalysis.active > 2) {
            recommendations.push('Multiple active sprints may indicate resource constraints');
        }

        if (sprintAnalysis.upcoming > 0 && daysToGoNoGo <= 14) {
            recommendations.push('Upcoming sprints may not complete before go/no-go date');
        }

        // Work stream recommendations
        const incompleteWorkStreams = workStreamAnalysis.workStreams.filter(ws => ws.completionPercentage < 100);
        if (incompleteWorkStreams.length > 0 && daysToGoNoGo <= 7) {
            recommendations.push(`${incompleteWorkStreams.length} work streams are incomplete`);
        }

        // Timeline recommendations
        if (daysToGoNoGo < 0) {
            recommendations.push('Go/no-go date has passed - update release status');
        } else if (daysToGoNoGo <= 3) {
            recommendations.push('Go/no-go decision needed within 3 days');
        }

        // Default positive recommendation
        if (recommendations.length === 0 && sprintAnalysis.completionPercentage >= 90) {
            recommendations.push('Release appears ready for go/no-go decision');
        }

        return recommendations;
    }

    /**
     * Get days until a specific date
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {number} Days until date (negative if past)
     */
    getDaysUntilDate(dateString) {
        const today = new Date();
        const targetDate = new Date(dateString);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Update work stream associations when release is created/updated/deleted
     * @param {string} releaseId - Release ID
     * @param {Array} newWorkStreams - New work stream IDs
     * @param {Array} oldWorkStreams - Previous work stream IDs (for updates)
     */
    updateWorkStreamAssociations(releaseId, newWorkStreams = [], oldWorkStreams = []) {
        if (!window.workStreamManager) return;

        try {
            // Remove release from old work streams
            oldWorkStreams.forEach(workStreamId => {
                const workStream = window.workStreamManager.getWorkStreamById(workStreamId);
                if (workStream) {
                    const updatedReleases = workStream.releases.filter(id => id !== releaseId);
                    window.workStreamManager.updateWorkStream(workStreamId, { releases: updatedReleases });
                }
            });

            // Add release to new work streams
            newWorkStreams.forEach(workStreamId => {
                const workStream = window.workStreamManager.getWorkStreamById(workStreamId);
                if (workStream && !workStream.releases.includes(releaseId)) {
                    const updatedReleases = [...workStream.releases, releaseId];
                    window.workStreamManager.updateWorkStream(workStreamId, { releases: updatedReleases });
                }
            });
        } catch (error) {
            console.error('Failed to update work stream associations:', error);
        }
    }

    /**
     * Get release statistics for dashboard
     * @returns {Object} Release statistics
     */
    getReleaseStatistics() {
        const releases = this.getAllReleases();
        
        const total = releases.length;
        const planning = releases.filter(r => r.status === 'Planning').length;
        const inProgress = releases.filter(r => r.status === 'In Progress').length;
        const go = releases.filter(r => r.status === 'Go').length;
        const noGo = releases.filter(r => r.status === 'No-Go').length;
        const released = releases.filter(r => r.status === 'Released').length;

        const upcoming = this.getUpcomingReleases().length;
        
        // Calculate average readiness score for active releases
        const activeReleases = releases.filter(r => ['Planning', 'In Progress'].includes(r.status));
        const readinessScores = activeReleases.map(r => this.getReleaseReadiness(r.id)?.readinessScore || 0);
        const averageReadiness = readinessScores.length > 0 ? 
            Math.round(readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length) : 0;

        return {
            total,
            planning,
            inProgress,
            go,
            noGo,
            released,
            upcoming,
            averageReadiness,
            statusDistribution: {
                'Planning': planning,
                'In Progress': inProgress,
                'Go': go,
                'No-Go': noGo,
                'Released': released
            }
        };
    }

    /**
     * Get release timeline data for visualization
     * @returns {Array} Array of timeline entries
     */
    getReleaseTimeline() {
        const releases = this.getAllReleases();
        const timeline = [];

        releases.forEach(release => {
            // Add go/no-go date
            timeline.push({
                type: 'go-no-go',
                date: release.goNoGoDate,
                release: release,
                title: `${release.name} - Go/No-Go Decision`,
                status: release.status
            });

            // Add production date
            timeline.push({
                type: 'production',
                date: release.productionDate,
                release: release,
                title: `${release.name} - Production Release`,
                status: release.status
            });
        });

        // Sort by date
        return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Emit release change events
     * @param {string} action - Action performed (created, updated, deleted)
     * @param {ReleaseModel} release - Release that was affected
     */
    emitReleaseEvent(action, release) {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('releaseChanged', {
                detail: { action, release }
            }));
        }
    }
}

// Create global instance
window.releaseManager = new ReleaseManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReleaseManager;
}