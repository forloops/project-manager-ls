# Technical Specifications: Story Point Management Integration

## Architecture Overview

**System Type**: Offline-first Progressive Web Application  
**Primary Language**: Vanilla JavaScript (ES6+)  
**UI Framework**: AlpineJS 3.x with TailwindCSS  
**Storage**: Browser LocalStorage with JSON serialization  
**Protocol**: File Protocol Compatible (no web server required)  
**Browser Target**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+  

## Data Models

### 1. StoryPointModel

**File**: `/src/models/story-point-model.js`  
**Dependencies**: None  
**Size Estimate**: 400-500 lines  

```javascript
class StoryPointModel {
    constructor(data = {}) {
        // Core identification
        this.id = data.id || this.generateId();
        this.version = data.version || '1.0';
        
        // Story content
        this.title = data.title || '';
        this.description = data.description || '';
        this.acceptanceCriteria = data.acceptanceCriteria || [];
        
        // Estimation data
        this.storyPoints = data.storyPoints || 0;
        this.estimationMethod = data.estimationMethod || 'fibonacci';
        this.estimationHistory = data.estimationHistory || [];
        this.estimationConfidence = data.estimationConfidence || 0;
        
        // Assignment & organization
        this.sprintId = data.sprintId || '';
        this.workStreamId = data.workStreamId || '';
        this.assigneeId = data.assigneeId || '';
        this.reporterId = data.reporterId || '';
        
        // Status & workflow
        this.status = data.status || 'planning';
        this.priority = data.priority || 'medium';
        this.blockers = data.blockers || [];
        this.dependencies = data.dependencies || [];
        
        // Integration points
        this.activities = data.activities || []; // ActivityModel IDs
        this.testCases = data.testCases || [];
        this.linkedIssues = data.linkedIssues || [];
        
        // Effort tracking
        this.actualEffort = data.actualEffort || 0;
        this.remainingEffort = data.remainingEffort || 0;
        this.effortBreakdown = data.effortBreakdown || {};
        
        // Metadata
        this.labels = data.labels || [];
        this.customFields = data.customFields || {};
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    // Validation rules
    validate() {
        const errors = [];
        const warnings = [];
        
        // Required field validation
        if (!this.title || this.title.trim().length === 0) {
            errors.push('Story title is required');
        } else if (this.title.length > 200) {
            warnings.push('Story title is very long (>200 characters)');
        }
        
        // Story point validation
        if (this.storyPoints < 0 || this.storyPoints > 100) {
            errors.push('Story points must be between 0 and 100');
        }
        
        // Status validation
        const validStatuses = ['planning', 'estimation', 'ready', 'development', 'testing', 'review', 'done', 'cancelled'];
        if (!validStatuses.includes(this.status)) {
            errors.push(`Invalid status: ${this.status}`);
        }
        
        // Priority validation
        const validPriorities = ['critical', 'high', 'medium', 'low'];
        if (!validPriorities.includes(this.priority)) {
            errors.push(`Invalid priority: ${this.priority}`);
        }
        
        // Estimation method validation
        const validMethods = ['fibonacci', 'time-based', 'complexity', 't-shirt', 'custom'];
        if (!validMethods.includes(this.estimationMethod)) {
            errors.push(`Invalid estimation method: ${this.estimationMethod}`);
        }
        
        // Business rule validation
        if (this.status === 'ready' && this.storyPoints === 0) {
            warnings.push('Ready stories should have story point estimates');
        }
        
        if (this.assigneeId && this.status === 'planning') {
            warnings.push('Stories in planning phase typically should not be assigned');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: this.calculateQualityScore()
        };
    }
    
    // Story point conversion methods
    convertToHours(conversionRate = 5) {
        return this.storyPoints * conversionRate;
    }
    
    convertToDays(hoursPerDay = 8) {
        return this.convertToHours() / hoursPerDay;
    }
    
    // Activity generation method
    generateActivityTemplates(roleId, sprintType = 'development') {
        const hours = this.convertToHours();
        const templates = this.getActivityTemplatesForRole(roleId, sprintType);
        
        return templates.map(template => ({
            name: `${this.title} - ${template.name}`,
            type: template.type,
            capacity: hours * (template.percentage / 100) / 5, // Convert to story points
            estimatedDuration: hours * (template.percentage / 100),
            priority: this.priority,
            description: `${template.description}\n\nGenerated from story: ${this.title}`,
            storyPointId: this.id
        }));
    }
    
    // Progress tracking
    calculateProgress() {
        if (this.activities.length === 0) {
            return { percentage: 0, status: 'not-started' };
        }
        
        // This would integrate with ActivityModel to get actual progress
        const totalActivities = this.activities.length;
        const completedActivities = this.activities.filter(activityId => {
            // Integration point: get activity status
            const activity = window.activityManager?.getActivity(activityId);
            return activity?.status === 'completed';
        }).length;
        
        const percentage = (completedActivities / totalActivities) * 100;
        
        return {
            percentage: Math.round(percentage),
            completedActivities,
            totalActivities,
            status: this.deriveStatusFromProgress(percentage)
        };
    }
    
    // Utility methods
    generateId() {
        return `story_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    toJSON() {
        return {
            id: this.id,
            version: this.version,
            title: this.title,
            description: this.description,
            acceptanceCriteria: this.acceptanceCriteria,
            storyPoints: this.storyPoints,
            estimationMethod: this.estimationMethod,
            estimationHistory: this.estimationHistory,
            estimationConfidence: this.estimationConfidence,
            sprintId: this.sprintId,
            workStreamId: this.workStreamId,
            assigneeId: this.assigneeId,
            reporterId: this.reporterId,
            status: this.status,
            priority: this.priority,
            blockers: this.blockers,
            dependencies: this.dependencies,
            activities: this.activities,
            testCases: this.testCases,
            linkedIssues: this.linkedIssues,
            actualEffort: this.actualEffort,
            remainingEffort: this.remainingEffort,
            effortBreakdown: this.effortBreakdown,
            labels: this.labels,
            customFields: this.customFields,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    
    static fromJSON(jsonData) {
        return new StoryPointModel(jsonData);
    }
    
    // Static utility methods
    static getEstimationMethods() {
        return {
            fibonacci: { scale: [1, 2, 3, 5, 8, 13, 21, 34], label: 'Fibonacci Sequence' },
            timeBased: { scale: [0.5, 1, 2, 4, 8, 16], label: 'Time-based (days)' },
            complexity: { scale: [1, 2, 3, 4, 5], label: 'Complexity Scale' },
            tShirt: { scale: ['XS', 'S', 'M', 'L', 'XL'], label: 'T-Shirt Sizes' },
            custom: { scale: [], label: 'Custom Scale' }
        };
    }
    
    static getStatusWorkflow() {
        return {
            planning: { next: ['estimation'], canEdit: true, color: '#6B7280' },
            estimation: { next: ['ready', 'planning'], canEdit: true, color: '#F59E0B' },
            ready: { next: ['development', 'estimation'], canEdit: false, color: '#10B981' },
            development: { next: ['testing', 'review'], canEdit: false, color: '#3B82F6' },
            testing: { next: ['review', 'development'], canEdit: false, color: '#8B5CF6' },
            review: { next: ['done', 'development'], canEdit: false, color: '#EC4899' },
            done: { next: [], canEdit: false, color: '#059669' },
            cancelled: { next: ['planning'], canEdit: true, color: '#EF4444' }
        };
    }
}
```

### 2. EstimationSessionModel

**File**: `/src/models/estimation-session-model.js`  
**Dependencies**: StoryPointModel  
**Purpose**: Planning Poker and collaborative estimation  

```javascript
class EstimationSessionModel {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.storyPointId = data.storyPointId || '';
        this.facilitatorId = data.facilitatorId || '';
        this.participants = data.participants || [];
        this.sessionType = data.sessionType || 'planning-poker'; // planning-poker, async-estimation, quick-estimate
        this.estimationMethod = data.estimationMethod || 'fibonacci';
        this.customScale = data.customScale || [];
        
        // Session state
        this.status = data.status || 'created'; // created, active, estimating, discussion, consensus, completed, cancelled
        this.currentRound = data.currentRound || 1;
        this.maxRounds = data.maxRounds || 5;
        
        // Estimation data
        this.estimates = data.estimates || {}; // participantId: { value, timestamp, round }
        this.rounds = data.rounds || [];
        this.consensus = data.consensus || null;
        this.finalEstimate = data.finalEstimate || 0;
        
        // Session configuration
        this.timeoutMinutes = data.timeoutMinutes || 30;
        this.allowReevaluation = data.allowReevaluation !== false;
        this.requireConsensus = data.requireConsensus !== false;
        this.anonymousVoting = data.anonymousVoting || false;
        
        // Analytics
        this.estimationMetrics = data.estimationMetrics || {};
        this.participationMetrics = data.participationMetrics || {};
        
        // Metadata
        this.createdAt = data.createdAt || new Date().toISOString();
        this.startedAt = data.startedAt || null;
        this.completedAt = data.completedAt || null;
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    // Session management methods
    startSession() {
        this.status = 'active';
        this.startedAt = new Date().toISOString();
        this.updatedAt = this.startedAt;
    }
    
    submitEstimate(participantId, estimate) {
        const timestamp = new Date().toISOString();
        
        this.estimates[participantId] = {
            value: estimate,
            timestamp,
            round: this.currentRound,
            isRevision: !!this.estimates[participantId]
        };
        
        this.updatedAt = timestamp;
        
        // Check if all participants have estimated
        if (this.allParticipantsEstimated()) {
            this.status = 'discussion';
            this.analyzeRound();
        }
    }
    
    analyzeRound() {
        const estimates = Object.values(this.estimates)
            .filter(e => e.round === this.currentRound)
            .map(e => e.value);
        
        const analysis = {
            round: this.currentRound,
            estimates: estimates,
            min: Math.min(...estimates),
            max: Math.max(...estimates),
            range: Math.max(...estimates) - Math.min(...estimates),
            median: this.calculateMedian(estimates),
            mode: this.calculateMode(estimates),
            variance: this.calculateVariance(estimates),
            standardDeviation: this.calculateStandardDeviation(estimates),
            consensusLevel: this.calculateConsensusLevel(estimates),
            timestamp: new Date().toISOString()
        };
        
        this.rounds.push(analysis);
        
        // Auto-consensus if within threshold
        if (analysis.consensusLevel > 0.8) {
            this.reachConsensus(analysis.median);
        }
    }
    
    reachConsensus(finalEstimate) {
        this.finalEstimate = finalEstimate;
        this.consensus = {
            value: finalEstimate,
            round: this.currentRound,
            method: 'consensus',
            timestamp: new Date().toISOString()
        };
        this.status = 'completed';
        this.completedAt = new Date().toISOString();
    }
    
    // Utility methods
    allParticipantsEstimated() {
        const currentRoundEstimates = Object.values(this.estimates)
            .filter(e => e.round === this.currentRound);
        return currentRoundEstimates.length === this.participants.length;
    }
    
    calculateConsensusLevel(estimates) {
        if (estimates.length === 0) return 0;
        
        const median = this.calculateMedian(estimates);
        const tolerance = median * 0.2; // 20% tolerance
        
        const consensusEstimates = estimates.filter(e => 
            Math.abs(e - median) <= tolerance
        );
        
        return consensusEstimates.length / estimates.length;
    }
    
    generateId() {
        return `session_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    toJSON() {
        return { /* all properties */ };
    }
    
    static fromJSON(jsonData) {
        return new EstimationSessionModel(jsonData);
    }
}
```

### 3. Enhanced ActivityModel Integration

**File**: `/src/models/activity-model.js` (existing file - enhancements)  
**Current Status**: ✅ 323 lines implemented  
**Required Enhancements**: Story point integration  

```javascript
// Add these properties to existing ActivityModel constructor
class ActivityModel {
    constructor(data = {}) {
        // ... existing properties ...
        
        // Story point integration (NEW)
        this.storyPointId = data.storyPointId || ''; // Link to parent story
        this.storyPointAllocation = data.storyPointAllocation || 0; // Portion of story points
        this.isAutoGenerated = data.isAutoGenerated || false; // Generated from story vs manual
        this.generationRules = data.generationRules || {}; // Template info for regeneration
        
        // Enhanced effort tracking (NEW)
        this.effortCategory = data.effortCategory || 'development'; // development, testing, review, documentation
        this.complexityFactor = data.complexityFactor || 1.0; // Difficulty multiplier
        this.riskLevel = data.riskLevel || 'low'; // low, medium, high
        
        // ... existing properties ...
    }
    
    // NEW: Story point integration methods
    getStoryPointContribution() {
        return {
            storyPointId: this.storyPointId,
            allocation: this.storyPointAllocation,
            actualEffort: this.actualDuration,
            estimatedEffort: this.estimatedDuration,
            efficiency: this.getEfficiency(),
            category: this.effortCategory
        };
    }
    
    updateFromStoryPoint(storyPoint, allocationPercentage) {
        const totalHours = storyPoint.convertToHours();
        const allocatedHours = totalHours * (allocationPercentage / 100);
        
        this.storyPointId = storyPoint.id;
        this.storyPointAllocation = storyPoint.storyPoints * (allocationPercentage / 100);
        this.estimatedDuration = allocatedHours;
        this.capacity = this.storyPointAllocation; // Keep 1:1 for now
        this.workStreamId = storyPoint.workStreamId;
        this.priority = storyPoint.priority;
        this.isAutoGenerated = true;
        this.updatedAt = new Date().toISOString();
    }
    
    // Enhanced validation for story point integration
    validateStoryPointIntegration() {
        const errors = [];
        
        if (this.storyPointId && this.storyPointAllocation <= 0) {
            errors.push('Story point allocation must be positive when linked to story');
        }
        
        if (this.isAutoGenerated && !this.storyPointId) {
            errors.push('Auto-generated activities must be linked to story point');
        }
        
        if (this.storyPointAllocation > 50) {
            errors.push('Single activity should not exceed 50 story points');
        }
        
        return errors;
    }
    
    // ... rest of existing methods ...
}
```

## API Specifications

### 1. StoryPointManager API

**File**: `/src/story-points/story-point-manager.js`  
**Dependencies**: StoryPointModel, ActivityModel, StorageManager  

```javascript
class StoryPointManager {
    constructor() {
        this.storageKey = 'productManagerLS_storyPoints';
        this.storyPoints = new Map();
        this.eventListeners = new Map();
        this.cache = new Map();
        
        // Configuration
        this.config = {
            defaultConversionRate: 5, // hours per story point
            autoSaveEnabled: true,
            cacheTimeout: 300000, // 5 minutes
            maxStoriesPerSprint: 200
        };
        
        this.loadStoryPoints();
        this.setupEventListeners();
    }
    
    // Core CRUD operations
    async createStoryPoint(data) {
        try {
            // Validation
            const story = new StoryPointModel(data);
            const validation = story.validate();
            
            if (!validation.isValid) {
                throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Business rules
            await this.validateBusinessRules(story);
            
            // Storage
            this.storyPoints.set(story.id, story);
            await this.saveToStorage();
            
            // Events
            this.dispatchEvent('storyPointCreated', { storyPoint: story });
            
            // Cache invalidation
            this.invalidateCache('sprintStories', story.sprintId);
            
            return story;
            
        } catch (error) {
            this.handleError('createStoryPoint', error);
            throw error;
        }
    }
    
    async updateStoryPoint(id, updates) {
        try {
            const story = this.storyPoints.get(id);
            if (!story) {
                throw new NotFoundError(`Story point ${id} not found`);
            }
            
            // Create updated version
            const originalData = story.toJSON();
            Object.assign(story, updates, { 
                updatedAt: new Date().toISOString() 
            });
            
            // Validation
            const validation = story.validate();
            if (!validation.isValid) {
                // Rollback
                Object.assign(story, originalData);
                throw new ValidationError(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Save
            await this.saveToStorage();
            
            // Handle cascade updates
            if (updates.storyPoints && updates.storyPoints !== originalData.storyPoints) {
                await this.updateLinkedActivities(id, updates.storyPoints);
            }
            
            // Events
            this.dispatchEvent('storyPointUpdated', { 
                storyPoint: story, 
                changes: updates,
                originalData 
            });
            
            return story;
            
        } catch (error) {
            this.handleError('updateStoryPoint', error);
            throw error;
        }
    }
    
    async deleteStoryPoint(id) {
        try {
            const story = this.storyPoints.get(id);
            if (!story) {
                throw new NotFoundError(`Story point ${id} not found`);
            }
            
            // Cleanup linked activities
            await this.cleanupLinkedActivities(id);
            
            // Remove from storage
            this.storyPoints.delete(id);
            await this.saveToStorage();
            
            // Events
            this.dispatchEvent('storyPointDeleted', { storyPoint: story });
            
            // Cache invalidation
            this.invalidateCache('sprintStories', story.sprintId);
            
            return true;
            
        } catch (error) {
            this.handleError('deleteStoryPoint', error);
            throw error;
        }
    }
    
    // Query methods
    async getStoryPoint(id) {
        const story = this.storyPoints.get(id);
        if (!story) {
            throw new NotFoundError(`Story point ${id} not found`);
        }
        return story;
    }
    
    async getStoryPointsBySprint(sprintId) {
        const cacheKey = `sprintStories_${sprintId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }
        
        const stories = Array.from(this.storyPoints.values())
            .filter(story => story.sprintId === sprintId)
            .sort((a, b) => {
                // Sort by priority, then by creation date
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
        
        // Cache result
        this.cache.set(cacheKey, {
            data: stories,
            timestamp: Date.now()
        });
        
        return stories;
    }
    
    async getStoryPointsByStatus(status) {
        return Array.from(this.storyPoints.values())
            .filter(story => story.status === status);
    }
    
    async getStoryPointsByAssignee(assigneeId) {
        return Array.from(this.storyPoints.values())
            .filter(story => story.assigneeId === assigneeId);
    }
    
    // Auto-allocation integration
    async generateActivitiesFromStoryPoint(storyPointId, memberId, startDate, options = {}) {
        try {
            const story = await this.getStoryPoint(storyPointId);
            const member = await this.getTeamMember(memberId);
            
            // Get activity templates for this role/sprint type
            const templates = await this.getActivityTemplates(
                member.role, 
                story.sprintId,
                options.sprintType || 'development'
            );
            
            // Generate activities based on templates
            const activities = [];
            const totalHours = story.convertToHours(options.conversionRate || this.config.defaultConversionRate);
            
            let currentDate = new Date(startDate);
            let remainingHours = totalHours;
            
            for (const template of templates) {
                const templateHours = totalHours * (template.percentage / 100);
                const templatePoints = templateHours / this.config.defaultConversionRate;
                
                // Create activity based on template
                const activity = new ActivityModel({
                    name: `${story.title} - ${template.name}`,
                    type: template.type,
                    capacity: templatePoints,
                    memberId,
                    date: currentDate.toISOString().split('T')[0],
                    sprintId: story.sprintId,
                    workStreamId: story.workStreamId,
                    description: `Auto-generated from story: ${story.title}`,
                    priority: story.priority,
                    estimatedDuration: templateHours,
                    storyPointId: story.id,
                    storyPointAllocation: templatePoints,
                    isAutoGenerated: true,
                    generationRules: {
                        templateId: template.id,
                        templateVersion: template.version,
                        conversionRate: options.conversionRate || this.config.defaultConversionRate
                    }
                });
                
                activities.push(activity);
                remainingHours -= templateHours;
                
                // Move to next working day if activity exceeds daily capacity
                if (templateHours > member.defaultCapacity * 0.8) {
                    currentDate = this.getNextWorkingDay(currentDate);
                }
            }
            
            // Link activities to story
            story.activities = [...story.activities, ...activities.map(a => a.id)];
            await this.updateStoryPoint(story.id, { activities: story.activities });
            
            // Save activities to activity manager
            if (window.activityManager) {
                for (const activity of activities) {
                    await window.activityManager.saveActivity(activity);
                }
            }
            
            return activities;
            
        } catch (error) {
            this.handleError('generateActivitiesFromStoryPoint', error);
            throw error;
        }
    }
    
    // Estimation methods
    async createEstimationSession(storyPointId, facilitatorId, participants, options = {}) {
        const session = new EstimationSessionModel({
            storyPointId,
            facilitatorId,
            participants,
            sessionType: options.sessionType || 'planning-poker',
            estimationMethod: options.estimationMethod || 'fibonacci',
            timeoutMinutes: options.timeoutMinutes || 30,
            requireConsensus: options.requireConsensus !== false,
            anonymousVoting: options.anonymousVoting || false
        });
        
        // Save session
        const sessionsKey = 'productManagerLS_estimationSessions';
        const sessions = this.loadFromStorage(sessionsKey) || {};
        sessions[session.id] = session.toJSON();
        await this.saveToStorage(sessionsKey, sessions);
        
        this.dispatchEvent('estimationSessionCreated', { session });
        
        return session;
    }
    
    async submitEstimate(sessionId, participantId, estimate) {
        const sessionsKey = 'productManagerLS_estimationSessions';
        const sessions = this.loadFromStorage(sessionsKey) || {};
        
        if (!sessions[sessionId]) {
            throw new NotFoundError(`Estimation session ${sessionId} not found`);
        }
        
        const session = EstimationSessionModel.fromJSON(sessions[sessionId]);
        session.submitEstimate(participantId, estimate);
        
        // Save updated session
        sessions[sessionId] = session.toJSON();
        await this.saveToStorage(sessionsKey, sessions);
        
        this.dispatchEvent('estimateSubmitted', { sessionId, participantId, estimate });
        
        // Check if session is complete
        if (session.status === 'completed') {
            await this.finalizeEstimation(sessionId, session.finalEstimate);
        }
        
        return session;
    }
    
    async finalizeEstimation(sessionId, finalEstimate) {
        const sessionsKey = 'productManagerLS_estimationSessions';
        const sessions = this.loadFromStorage(sessionsKey) || {};
        const session = EstimationSessionModel.fromJSON(sessions[sessionId]);
        
        // Update story point with final estimate
        await this.updateStoryPoint(session.storyPointId, {
            storyPoints: finalEstimate,
            status: 'ready',
            estimationHistory: [
                ...this.storyPoints.get(session.storyPointId).estimationHistory,
                {
                    sessionId,
                    estimate: finalEstimate,
                    method: session.estimationMethod,
                    participants: session.participants,
                    timestamp: new Date().toISOString()
                }
            ]
        });
        
        this.dispatchEvent('estimationFinalized', { sessionId, finalEstimate });
        
        return session;
    }
    
    // Analytics and reporting
    async calculateSprintVelocity(sprintId) {
        const stories = await this.getStoryPointsBySprint(sprintId);
        const completedStories = stories.filter(s => s.status === 'done');
        
        const velocity = completedStories.reduce((sum, story) => sum + story.storyPoints, 0);
        const storiesCompleted = completedStories.length;
        const averageStorySize = storiesCompleted > 0 ? velocity / storiesCompleted : 0;
        
        return {
            totalVelocity: velocity,
            storiesCompleted,
            averageStorySize,
            sprintId,
            calculatedAt: new Date().toISOString()
        };
    }
    
    async calculateTeamVelocityTrend(teamId, sprintCount = 6) {
        const sprints = await this.getRecentSprints(teamId, sprintCount);
        const velocities = [];
        
        for (const sprint of sprints) {
            const velocity = await this.calculateSprintVelocity(sprint.id);
            velocities.push({
                sprintId: sprint.id,
                sprintName: sprint.name,
                velocity: velocity.totalVelocity,
                storiesCompleted: velocity.storiesCompleted,
                sprintEndDate: sprint.endDate
            });
        }
        
        return {
            velocities,
            averageVelocity: velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length,
            trend: this.calculateTrend(velocities.map(v => v.velocity)),
            predictedNext: this.predictNextVelocity(velocities)
        };
    }
    
    // Storage methods
    async loadStoryPoints() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.storyPoints.clear();
                
                Object.entries(parsed).forEach(([id, storyData]) => {
                    const story = StoryPointModel.fromJSON(storyData);
                    this.storyPoints.set(id, story);
                });
            }
        } catch (error) {
            console.error('Failed to load story points:', error);
            this.handleError('loadStoryPoints', error);
        }
    }
    
    async saveToStorage() {
        try {
            const data = {};
            this.storyPoints.forEach((story, id) => {
                data[id] = story.toJSON();
            });
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            if (this.config.autoSaveEnabled) {
                this.dispatchEvent('autoSaved', { timestamp: new Date().toISOString() });
            }
            
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                await this.handleStorageQuotaExceeded();
                // Retry save
                return this.saveToStorage();
            }
            console.error('Failed to save story points:', error);
            this.handleError('saveToStorage', error);
            return false;
        }
    }
    
    // Event system
    addEventListener(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType).add(callback);
    }
    
    removeEventListener(eventType, callback) {
        if (this.eventListeners.has(eventType)) {
            this.eventListeners.get(eventType).delete(callback);
        }
    }
    
    dispatchEvent(eventType, data) {
        if (this.eventListeners.has(eventType)) {
            this.eventListeners.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event listener error for ${eventType}:`, error);
                }
            });
        }
    }
    
    // Error handling
    handleError(operation, error) {
        const errorInfo = {
            operation,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        console.error(`StoryPointManager error in ${operation}:`, errorInfo);
        this.dispatchEvent('error', errorInfo);
    }
}
```

### 2. Planning Poker Manager API

**File**: `/src/story-points/planning-poker-manager.js`  
**Dependencies**: EstimationSessionModel, StoryPointManager  

```javascript
class PlanningPokerManager {
    constructor() {
        this.activeSessions = new Map();
        this.sessionHistory = [];
        this.estimationTemplates = new Map();
        
        this.loadActiveSessions();
        this.loadEstimationTemplates();
    }
    
    // Session lifecycle
    async createSession(config) {
        const session = new EstimationSessionModel({
            storyPointId: config.storyPointId,
            facilitatorId: config.facilitatorId,
            participants: config.participants,
            sessionType: config.sessionType || 'planning-poker',
            estimationMethod: config.estimationMethod || 'fibonacci',
            timeoutMinutes: config.timeoutMinutes || 30,
            requireConsensus: config.requireConsensus !== false
        });
        
        this.activeSessions.set(session.id, session);
        await this.saveActiveSessions();
        
        return session;
    }
    
    async startSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.startSession();
        await this.saveActiveSessions();
        
        return session;
    }
    
    async submitEstimate(sessionId, participantId, estimate) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        session.submitEstimate(participantId, estimate);
        await this.saveActiveSessions();
        
        // Notify other components
        this.notifyEstimateSubmitted(sessionId, participantId, estimate);
        
        return session;
    }
    
    async finalizeSession(sessionId, consensusEstimate = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        const finalEstimate = consensusEstimate || session.calculateRecommendedEstimate();
        session.reachConsensus(finalEstimate);
        
        // Update the story point
        if (window.storyPointManager) {
            await window.storyPointManager.updateStoryPoint(session.storyPointId, {
                storyPoints: finalEstimate,
                status: 'ready'
            });
        }
        
        // Move to history
        this.sessionHistory.push(session.toJSON());
        this.activeSessions.delete(sessionId);
        
        await this.saveActiveSessions();
        
        return session;
    }
    
    // Offline collaboration features
    async exportSessionData(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        return {
            session: session.toJSON(),
            storyPoint: await this.getStoryPointForSession(session),
            exportedAt: new Date().toISOString(),
            format: 'planning-poker-v1'
        };
    }
    
    async importSessionData(sessionData) {
        const session = EstimationSessionModel.fromJSON(sessionData.session);
        this.activeSessions.set(session.id, session);
        await this.saveActiveSessions();
        
        return session;
    }
    
    // Estimation analytics
    calculateEstimationAccuracy(participantId, timeframeDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
        
        const relevantSessions = this.sessionHistory.filter(session => 
            new Date(session.completedAt) >= cutoffDate &&
            session.estimates[participantId]
        );
        
        if (relevantSessions.length === 0) {
            return { accuracy: 0, sessionCount: 0 };
        }
        
        let totalAccuracy = 0;
        
        relevantSessions.forEach(session => {
            const participantEstimate = session.estimates[participantId].value;
            const finalEstimate = session.finalEstimate;
            
            // Calculate accuracy as percentage
            const accuracy = 1 - Math.abs(participantEstimate - finalEstimate) / finalEstimate;
            totalAccuracy += Math.max(0, accuracy);
        });
        
        return {
            accuracy: totalAccuracy / relevantSessions.length,
            sessionCount: relevantSessions.length,
            participantId
        };
    }
    
    generateEstimationInsights(teamId) {
        const teamSessions = this.sessionHistory.filter(session =>
            session.participants.some(p => this.isTeamMember(p, teamId))
        );
        
        return {
            totalSessions: teamSessions.length,
            averageRounds: teamSessions.reduce((sum, s) => sum + s.currentRound, 0) / teamSessions.length,
            consensusRate: teamSessions.filter(s => s.consensus).length / teamSessions.length,
            averageSessionDuration: this.calculateAverageSessionDuration(teamSessions),
            estimationPatterns: this.analyzeEstimationPatterns(teamSessions),
            participationMetrics: this.calculateParticipationMetrics(teamSessions)
        };
    }
}
```

### 3. Auto-Allocation Engine API

**File**: `/src/story-points/auto-allocation-engine.js`  
**Dependencies**: StoryPointManager, ActivityModel, TeamManager  

```javascript
class AutoAllocationEngine {
    constructor() {
        this.allocationStrategies = new Map();
        this.roleTemplates = new Map();
        this.optimizationRules = new Map();
        this.allocationHistory = [];
        
        this.initializeStrategies();
        this.loadRoleTemplates();
    }
    
    // Main allocation method
    async allocateStories(sprintId, options = {}) {
        const context = await this.buildAllocationContext(sprintId, options);
        const strategy = options.strategy || 'balanced';
        
        const allocation = await this.executeStrategy(strategy, context);
        const optimizedAllocation = await this.optimizeAllocation(allocation, context);
        const validation = await this.validateAllocation(optimizedAllocation, context);
        
        if (validation.isValid) {
            await this.applyAllocation(optimizedAllocation);
            this.recordAllocationHistory(optimizedAllocation);
        }
        
        return {
            allocation: optimizedAllocation,
            validation,
            metrics: this.calculateAllocationMetrics(optimizedAllocation),
            recommendations: this.generateRecommendations(optimizedAllocation)
        };
    }
    
    async buildAllocationContext(sprintId, options) {
        const stories = await window.storyPointManager.getStoryPointsBySprint(sprintId);
        const unallocatedStories = stories.filter(s => !s.assigneeId || options.reallocate);
        
        const teamMembers = await this.getAvailableTeamMembers(sprintId);
        const sprintCapacity = await this.calculateSprintCapacity(sprintId, teamMembers);
        const workstreams = await this.getSprintWorkstreams(sprintId);
        
        return {
            sprintId,
            stories: unallocatedStories,
            teamMembers,
            sprintCapacity,
            workstreams,
            constraints: options.constraints || {},
            preferences: options.preferences || {},
            historicalData: await this.getHistoricalAllocationData(teamMembers)
        };
    }
    
    // Allocation strategies
    async executeStrategy(strategyName, context) {
        const strategy = this.allocationStrategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Unknown allocation strategy: ${strategyName}`);
        }
        
        return await strategy.execute(context);
    }
    
    // Balanced allocation strategy
    async balancedAllocation(context) {
        const allocations = [];
        const memberLoads = new Map();
        
        // Initialize member loads
        context.teamMembers.forEach(member => {
            memberLoads.set(member.id, {
                allocated: 0,
                capacity: context.sprintCapacity[member.id] || 0,
                stories: [],
                workstreams: new Set()
            });
        });
        
        // Sort stories by priority and complexity
        const sortedStories = this.sortStoriesForAllocation(context.stories);
        
        for (const story of sortedStories) {
            const bestMember = this.findBestMember(story, memberLoads, context);
            
            if (bestMember) {
                const allocation = {
                    storyId: story.id,
                    memberId: bestMember.id,
                    confidence: this.calculateAllocationConfidence(story, bestMember, context),
                    activities: await this.generateActivitiesForAllocation(story, bestMember),
                    reasoning: this.explainAllocation(story, bestMember, context)
                };
                
                allocations.push(allocation);
                this.updateMemberLoad(memberLoads.get(bestMember.id), story, allocation);
            }
        }
        
        return allocations;
    }
    
    findBestMember(story, memberLoads, context) {
        let bestMember = null;
        let bestScore = -1;
        
        for (const member of context.teamMembers) {
            const load = memberLoads.get(member.id);
            const score = this.calculateMemberStoryFit(story, member, load, context);
            
            if (score > bestScore) {
                bestScore = score;
                bestMember = member;
            }
        }
        
        return bestMember;
    }
    
    calculateMemberStoryFit(story, member, currentLoad, context) {
        const storyHours = story.convertToHours();
        
        // Check capacity constraint
        if (currentLoad.allocated + storyHours > currentLoad.capacity) {
            return -1; // Cannot allocate
        }
        
        let score = 0;
        
        // Skill alignment (40% weight)
        const skillMatch = this.calculateSkillAlignment(story, member);
        score += skillMatch * 0.4;
        
        // Workstream continuity (25% weight)
        const workstreamContinuity = currentLoad.workstreams.has(story.workStreamId) ? 1.0 : 0.5;
        score += workstreamContinuity * 0.25;
        
        // Load balancing (20% weight)
        const utilizationAfter = (currentLoad.allocated + storyHours) / currentLoad.capacity;
        const optimalUtilization = 0.85;
        const loadBalance = 1 - Math.abs(utilizationAfter - optimalUtilization);
        score += loadBalance * 0.2;
        
        // Historical performance (15% weight)
        const historicalPerformance = this.getHistoricalPerformance(member.id, story.workStreamId);
        score += historicalPerformance * 0.15;
        
        return score;
    }
    
    // Activity generation for allocated stories
    async generateActivitiesForAllocation(story, member) {
        const roleTemplate = this.roleTemplates.get(member.role);
        if (!roleTemplate) {
            return this.generateDefaultActivities(story, member);
        }
        
        const totalHours = story.convertToHours();
        const activities = [];
        
        for (const activityTemplate of roleTemplate.activities) {
            const activityHours = totalHours * (activityTemplate.percentage / 100);
            const activityPoints = activityHours / 5; // Convert to story points
            
            const activity = new ActivityModel({
                name: `${story.title} - ${activityTemplate.name}`,
                type: activityTemplate.type,
                capacity: activityPoints,
                memberId: member.id,
                date: this.getNextAvailableDate(member.id),
                sprintId: story.sprintId,
                workStreamId: story.workStreamId,
                description: `Auto-allocated from story: ${story.title}`,
                priority: story.priority,
                estimatedDuration: activityHours,
                storyPointId: story.id,
                storyPointAllocation: activityPoints,
                isAutoGenerated: true,
                generationRules: {
                    templateId: activityTemplate.id,
                    allocationStrategy: 'balanced',
                    allocationTimestamp: new Date().toISOString()
                }
            });
            
            activities.push(activity);
        }
        
        return activities;
    }
    
    // Optimization methods
    async optimizeAllocation(allocation, context) {
        let optimizedAllocation = [...allocation];
        
        // Apply optimization rules
        optimizedAllocation = await this.applyWorkstreamOptimization(optimizedAllocation, context);
        optimizedAllocation = await this.applyLoadBalancingOptimization(optimizedAllocation, context);
        optimizedAllocation = await this.applyDependencyOptimization(optimizedAllocation, context);
        
        return optimizedAllocation;
    }
    
    async applyWorkstreamOptimization(allocation, context) {
        // Group allocations by workstream
        const workstreamGroups = this.groupAllocationsByWorkstream(allocation);
        
        // Optimize each workstream for minimal context switching
        for (const [workstreamId, allocations] of workstreamGroups) {
            const optimized = this.optimizeWorkstreamAllocations(allocations, context);
            // Replace in main allocation
            optimized.forEach(opt => {
                const index = allocation.findIndex(a => a.storyId === opt.storyId);
                if (index >= 0) {
                    allocation[index] = opt;
                }
            });
        }
        
        return allocation;
    }
    
    // Validation
    async validateAllocation(allocation, context) {
        const errors = [];
        const warnings = [];
        
        // Capacity validation
        const memberLoads = this.calculateMemberLoads(allocation);
        memberLoads.forEach((load, memberId) => {
            const capacity = context.sprintCapacity[memberId] || 0;
            if (load.total > capacity) {
                errors.push(`Member ${memberId} over-allocated: ${load.total}h > ${capacity}h`);
            } else if (load.total > capacity * 0.95) {
                warnings.push(`Member ${memberId} near capacity limit: ${load.total}h / ${capacity}h`);
            }
        });
        
        // Skill validation
        allocation.forEach(alloc => {
            const story = context.stories.find(s => s.id === alloc.storyId);
            const member = context.teamMembers.find(m => m.id === alloc.memberId);
            const skillMatch = this.calculateSkillAlignment(story, member);
            
            if (skillMatch < 0.3) {
                warnings.push(`Poor skill match for story ${story.title} → ${member.name}`);
            }
        });
        
        // Dependency validation
        const dependencyIssues = this.validateDependencies(allocation, context);
        errors.push(...dependencyIssues);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: this.calculateAllocationScore(allocation, context)
        };
    }
    
    // Application
    async applyAllocation(allocation) {
        for (const alloc of allocation) {
            // Update story point assignment
            await window.storyPointManager.updateStoryPoint(alloc.storyId, {
                assigneeId: alloc.memberId,
                status: 'ready',
                assignedAt: new Date().toISOString()
            });
            
            // Create activities
            for (const activity of alloc.activities) {
                if (window.activityManager) {
                    await window.activityManager.saveActivity(activity);
                }
            }
        }
    }
}
```

## Storage Schema

### Local Storage Keys

```javascript
// Core story point data
productManagerLS_storyPoints: {
    "story_[timestamp]_[random]": StoryPointModel.toJSON()
}

// Estimation sessions
productManagerLS_estimationSessions: {
    "session_[timestamp]_[random]": EstimationSessionModel.toJSON()
}

// Auto-allocation templates
productManagerLS_allocationTemplates: {
    "template_[role]_[sprintType]": ActivityTemplate[]
}

// Configuration data
productManagerLS_storyPointConfig: {
    defaultConversionRate: 5,
    estimationMethods: {...},
    teamConfigurations: {...}
}

// Analytics cache
productManagerLS_velocityCache: {
    "team_[id]_velocity": VelocityData,
    "sprint_[id]_metrics": SprintMetrics
}
```

### Data Relationships

```
SprintModel (existing)
├── storyPoints: StoryPointModel.id[]
└── estimationConfig: EstimationConfig

StoryPointModel
├── sprintId → SprintModel.id
├── workStreamId → WorkStreamModel.id (existing)
├── assigneeId → TeamMemberModel.id (existing)
├── activities: ActivityModel.id[]
└── estimationHistory: EstimationRecord[]

ActivityModel (enhanced)
├── storyPointId → StoryPointModel.id
├── storyPointAllocation: number
└── isAutoGenerated: boolean

EstimationSessionModel
├── storyPointId → StoryPointModel.id
├── facilitatorId → TeamMemberModel.id
└── participants: TeamMemberModel.id[]
```

## Performance Specifications

### Response Time Targets

| Operation | Target Time | Maximum Time |
|-----------|-------------|--------------|
| Create story point | < 50ms | < 100ms |
| Update story point | < 30ms | < 75ms |
| Load sprint stories | < 100ms | < 200ms |
| Generate activities | < 200ms | < 500ms |
| Planning poker estimate | < 25ms | < 50ms |
| Auto-allocation (10 stories) | < 2s | < 5s |
| Velocity calculation | < 150ms | < 300ms |

### Memory Usage Targets

| Component | Target Memory | Maximum Memory |
|-----------|---------------|----------------|
| StoryPointManager | < 2MB | < 5MB |
| PlanningPokerManager | < 1MB | < 2MB |
| AutoAllocationEngine | < 3MB | < 8MB |
| Total story point system | < 10MB | < 20MB |

### Storage Limits

| Data Type | Typical Size | Maximum Recommended |
|-----------|--------------|-------------------|
| Single story point | 2-5KB | 10KB |
| Estimation session | 3-8KB | 15KB |
| Sprint with 50 stories | 250KB | 500KB |
| Team velocity history (6 months) | 100KB | 200KB |
| Total story point data | 2-5MB | 8MB |

### Browser Compatibility

| Browser | Minimum Version | Tested Version | Notes |
|---------|----------------|----------------|-------|
| Chrome | 90 | 116+ | Primary development target |
| Firefox | 88 | 117+ | Full feature support |
| Safari | 14 | 16+ | Some estimation features limited |
| Edge | 90 | 116+ | Full feature support |

## Integration Points

### Existing System Integration

#### 1. Capacity Planner Integration
**Files**: `/src/capacity/capacity-planner.js`, `/src/capacity/capacity-alpine-component.js`

```javascript
// Event integration in capacity-alpine-component.js
handleActivityCapacityChange(event) {
    const { memberId, date, totalCapacity, activities } = event.detail;
    this.hasUnsavedChanges = true;
    
    // NEW: Update linked story points
    this.updateLinkedStoryPointProgress(activities);
}

async updateLinkedStoryPointProgress(activities) {
    for (const activity of activities) {
        if (activity.storyPointId && window.storyPointManager) {
            await window.storyPointManager.updateActivityProgress(
                activity.storyPointId,
                activity.id,
                {
                    actualDuration: activity.actualDuration,
                    status: activity.status,
                    progress: activity.progress
                }
            );
        }
    }
}
```

#### 2. Sprint Manager Integration
**File**: `/src/sprints/sprint-manager.js`

```javascript
// Enhanced sprint model to include story points
class SprintManager {
    async getSprintSummary(sprintId) {
        const existingSummary = await this.getBasicSprintSummary(sprintId);
        
        // Add story point metrics
        if (window.storyPointManager) {
            const storyPoints = await window.storyPointManager.getStoryPointsBySprint(sprintId);
            const velocity = await window.storyPointManager.calculateSprintVelocity(sprintId);
            
            existingSummary.storyPoints = {
                total: storyPoints.length,
                completed: storyPoints.filter(s => s.status === 'done').length,
                totalPoints: storyPoints.reduce((sum, s) => sum + s.storyPoints, 0),
                completedPoints: velocity.totalVelocity,
                averageStorySize: velocity.averageStorySize
            };
        }
        
        return existingSummary;
    }
}
```

#### 3. Team Manager Integration
**File**: `/src/team/team-manager.js`

```javascript
// Enhanced team member model for skill tracking
class TeamManager {
    async getTeamMemberSkills(memberId) {
        const member = await this.getTeamMember(memberId);
        
        // Analyze historical story assignments for skill inference
        if (window.storyPointManager) {
            const assignedStories = await window.storyPointManager.getStoryPointsByAssignee(memberId);
            const skillAnalysis = this.analyzeSkillsFromStoryHistory(assignedStories);
            
            return {
                ...member.skills,
                inferred: skillAnalysis,
                lastUpdated: new Date().toISOString()
            };
        }
        
        return member.skills || {};
    }
}
```

### Event System Integration

```javascript
// Global event coordination
class StoryPointEventCoordinator {
    constructor() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Story point → Activity sync
        if (window.storyPointManager) {
            window.storyPointManager.addEventListener('storyPointUpdated', (event) => {
                this.syncStoryPointToActivities(event.storyPoint, event.changes);
            });
        }
        
        // Activity → Story point sync
        if (window.activityManager) {
            window.activityManager.addEventListener('activityCompleted', (event) => {
                this.updateStoryPointProgress(event.activity);
            });
        }
        
        // Capacity → Story point sync
        if (window.capacityPlannerManager) {
            window.capacityPlannerManager.addEventListener('capacityChanged', (event) => {
                this.rebalanceStoryPointAllocations(event.changes);
            });
        }
    }
    
    async syncStoryPointToActivities(storyPoint, changes) {
        if (changes.storyPoints && storyPoint.activities.length > 0) {
            // Redistribute capacity across linked activities
            const activities = await this.getLinkedActivities(storyPoint.activities);
            const newTotalHours = storyPoint.convertToHours();
            
            await this.redistributeActivityCapacity(activities, newTotalHours);
        }
    }
}

// Initialize global coordinator
window.storyPointEventCoordinator = new StoryPointEventCoordinator();
```

## Error Handling & Validation

### Custom Error Classes

```javascript
// Story point specific errors
class StoryPointError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'StoryPointError';
        this.code = code;
        this.context = context;
    }
}

class ValidationError extends StoryPointError {
    constructor(message, validationResults = {}) {
        super(message, 'VALIDATION_FAILED', validationResults);
        this.name = 'ValidationError';
    }
}

class AllocationError extends StoryPointError {
    constructor(message, allocationContext = {}) {
        super(message, 'ALLOCATION_FAILED', allocationContext);
        this.name = 'AllocationError';
    }
}

class EstimationError extends StoryPointError {
    constructor(message, sessionContext = {}) {
        super(message, 'ESTIMATION_FAILED', sessionContext);
        this.name = 'EstimationError';
    }
}
```

### Validation Framework

```javascript
// Comprehensive validation system
class StoryPointValidator {
    static validate(storyPoint, context = {}) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            info: []
        };
        
        // Core validation
        this.validateRequired(storyPoint, results);
        this.validateDataTypes(storyPoint, results);
        this.validateBusinessRules(storyPoint, results);
        
        // Context validation
        if (context.sprint) {
            this.validateSprintContext(storyPoint, context.sprint, results);
        }
        
        if (context.team) {
            this.validateTeamContext(storyPoint, context.team, results);
        }
        
        // Set overall validity
        results.isValid = results.errors.length === 0;
        
        return results;
    }
    
    static validateBusinessRules(storyPoint, results) {
        // Story points should not exceed reasonable limits
        if (storyPoint.storyPoints > 21) {
            results.warnings.push('Story exceeds 21 points - consider breaking down');
        }
        
        // Ready stories should have estimates
        if (storyPoint.status === 'ready' && storyPoint.storyPoints === 0) {
            results.errors.push('Ready stories must have story point estimates');
        }
        
        // Assigned stories should be estimated
        if (storyPoint.assigneeId && storyPoint.storyPoints === 0) {
            results.warnings.push('Assigned stories should have estimates');
        }
        
        // Acceptance criteria validation
        if (storyPoint.storyPoints > 8 && storyPoint.acceptanceCriteria.length === 0) {
            results.warnings.push('Large stories should have acceptance criteria');
        }
    }
}
```

This technical specification provides a comprehensive foundation for implementing the story point management system. The modular design ensures maintainability while the detailed API specifications enable precise implementation planning.