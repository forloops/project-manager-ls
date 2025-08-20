/**
 * Main Application Logic for Product Manager LS
 * AlpineJS-based reactive application for sprint management and capacity planning.
 * Handles UI state, user interactions, and data operations.
 */

// Alpine.js application data and methods
function sprintApp() {
    return {
        // Application state
        loading: false,
        currentView: 'sprints',
        sprints: [],
        workStreams: [],
        releases: [],
        availableColors: [],
        teamMembers: [],
        selectedSprintId: '',
        calendarDays: [],
        
        // Enhanced capacity planning state
        capacityViewMode: 'overview',
        heatmapTimeframe: 'current-sprint',
        capacityMetrics: {
            totalCapacity: 0,
            avgUtilization: 0,
            overallocatedDays: 0,
            efficiency: 0,
            bottlenecks: 0,
            capacityTrend: 'Stable'
        },
        forecastData: {
            trend: 'Stable',
            confidence: 85,
            recommendations: []
        },
        bottleneckAnalysis: [],
        
        // Modal state
        showCreateSprintModal: false,
        editingSprintId: null,
        showCreateWorkStreamModal: false,
        editingWorkStreamId: null,
        showCreateReleaseModal: false,
        editingReleaseId: null,
        showReleaseDetailsModal: false,
        selectedReleaseDetails: null,
        showCreateTeamMemberModal: false,
        editingTeamMemberId: null,
        showTimeOffModal: false,
        selectedTeamMemberId: '',
        
        // Form data
        sprintForm: {
            name: '',
            startDate: '',
            endDate: '',
            duration: 2,
            type: 'Development',
            workStreams: []
        },
        
        workStreamForm: {
            name: '',
            description: '',
            color: '#2563EB'
        },
        
        teamMemberForm: {
            name: '',
            email: '',
            role: 'Developer',
            defaultCapacity: 8
        },
        
        releaseForm: {
            name: '',
            description: '',
            goNoGoDate: '',
            productionDate: '',
            status: 'Planning',
            sprints: [],
            workStreams: []
        },
        
        timeOffForm: {
            startDate: '',
            endDate: '',
            reason: ''
        },
        
        // Notification state
        notification: {
            show: false,
            message: '',
            type: 'success'
        },

        // Initialize application
        init() {
            console.log('Product Manager LS - Initializing...');
            
            // Check if storage is available
            if (!window.storageManager.isStorageAvailable()) {
                this.showNotification('Storage not available. Data will not be saved.', 'error');
                return;
            }

            // Load initial data
            this.loadSprints();
            this.loadWorkStreams();
            this.loadReleases();
            this.loadTeamMembers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set default start date to today
            this.sprintForm.startDate = new Date().toISOString().split('T')[0];
            this.calculateEndDate();
            
            // Initialize enhanced capacity planning
            this.initializeCapacityPlanning();
            
            console.log('Application initialized successfully');
        },

        // Set up event listeners for storage events and keyboard shortcuts
        setupEventListeners() {
            // Listen for storage errors
            window.addEventListener('storageError', (event) => {
                this.showNotification(event.detail.message, 'error');
            });

            // Listen for sprint changes
            window.addEventListener('sprintChanged', (event) => {
                this.loadSprints();
                const { action, sprint } = event.detail;
                this.showNotification(`Sprint "${sprint.name}" ${action} successfully!`, 'success');
            });

            // Listen for work stream changes
            window.addEventListener('workStreamChanged', (event) => {
                this.loadWorkStreams();
                const { action, workStream } = event.detail;
                this.showNotification(`Work stream "${workStream.name}" ${action} successfully!`, 'success');
            });

            // Listen for team changes
            window.addEventListener('teamChanged', (event) => {
                this.loadTeamMembers();
                const { action, member } = event.detail;
                this.showNotification(`Team member "${member.name}" ${action} successfully!`, 'success');
            });

            // Listen for release changes
            window.addEventListener('releaseChanged', (event) => {
                this.loadReleases();
                const { action, release } = event.detail;
                this.showNotification(`Release "${release.name}" ${action} successfully!`, 'success');
            });

            // Listen for capacity changes
            window.addEventListener('capacityChanged', (event) => {
                this.loadTeamMembers();
                this.showNotification('Capacity updated successfully!', 'success');
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (event) => {
                // Escape key to close modals
                if (event.key === 'Escape') {
                    this.closeSprintModal();
                    this.closeWorkStreamModal();
                    this.closeReleaseModal();
                    this.closeReleaseDetailsModal();
                    this.closeTeamMemberModal();
                    this.closeTimeOffModal();
                }
                
                // Ctrl/Cmd + N to create new sprint
                if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                    event.preventDefault();
                    this.showCreateSprintModal = true;
                }
            });
        },

        // Load sprints from storage
        loadSprints() {
            try {
                this.loading = true;
                this.sprints = window.sprintManager.getAllSprints();
                console.log(`Loaded ${this.sprints.length} sprints`);
            } catch (error) {
                console.error('Failed to load sprints:', error);
                this.showNotification('Failed to load sprints', 'error');
                this.sprints = [];
            } finally {
                this.loading = false;
            }
        },

        // Load team members from storage
        loadTeamMembers() {
            try {
                this.teamMembers = window.teamManager.getAllTeamMembers();
                console.log(`Loaded ${this.teamMembers.length} team members`);
            } catch (error) {
                console.error('Failed to load team members:', error);
                this.showNotification('Failed to load team members', 'error');
                this.teamMembers = [];
            }
        },

        // Load work streams from storage
        loadWorkStreams() {
            try {
                this.loading = true;
                this.workStreams = window.workStreamManager.getAllWorkStreams();
                this.availableColors = window.workStreamManager.getAvailableColors();
                console.log(`Loaded ${this.workStreams.length} work streams`);
            } catch (error) {
                console.error('Failed to load work streams:', error);
                this.showNotification('Failed to load work streams', 'error');
                this.workStreams = [];
                this.availableColors = [];
            } finally {
                this.loading = false;
            }
        },

        // Load releases from storage
        loadReleases() {
            try {
                this.loading = true;
                this.releases = window.releaseManager.getAllReleases();
                console.log(`Loaded ${this.releases.length} releases`);
            } catch (error) {
                console.error('Failed to load releases:', error);
                this.showNotification('Failed to load releases', 'error');
                this.releases = [];
            } finally {
                this.loading = false;
            }
        },

        // Create or update sprint
        saveSprint() {
            try {
                this.loading = true;
                
                let result;
                if (this.editingSprintId) {
                    result = window.sprintManager.updateSprint(this.editingSprintId, this.sprintForm);
                } else {
                    result = window.sprintManager.createSprint(this.sprintForm);
                }

                if (result.success) {
                    this.closeSprintModal();
                    this.loadSprints();
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to save sprint:', error);
                this.showNotification('Failed to save sprint', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Edit sprint
        editSprint(sprint) {
            this.editingSprintId = sprint.id;
            this.sprintForm = {
                name: sprint.name,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                duration: sprint.duration,
                type: sprint.type,
                workStreams: sprint.workStreams || []
            };
            this.showCreateSprintModal = true;
        },

        // Delete sprint with confirmation
        deleteSprint(sprintId) {
            const sprint = this.sprints.find(s => s.id === sprintId);
            if (!sprint) return;
            
            if (confirm(`Are you sure you want to delete "${sprint.name}"? This action cannot be undone.`)) {
                try {
                    this.loading = true;
                    const result = window.sprintManager.deleteSprint(sprintId);
                    
                    if (result.success) {
                        this.loadSprints();
                        this.showNotification(`Sprint "${sprint.name}" deleted successfully`, 'success');
                    } else {
                        this.showNotification(result.errors.join(', '), 'error');
                    }
                } catch (error) {
                    console.error('Failed to delete sprint:', error);
                    this.showNotification('Failed to delete sprint', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },

        // View sprint calendar
        viewSprintCalendar(sprint) {
            this.selectedSprintId = sprint.id;
            this.currentView = 'calendar';
            this.loadSprintCalendar();
        },

        // Load sprint calendar data
        loadSprintCalendar() {
            if (!this.selectedSprintId) {
                this.calendarDays = [];
                return;
            }
            
            try {
                this.calendarDays = window.sprintManager.getSprintCalendar(this.selectedSprintId);
            } catch (error) {
                console.error('Failed to load sprint calendar:', error);
                this.showNotification('Failed to load sprint calendar', 'error');
                this.calendarDays = [];
            }
        },

        // Calculate end date based on start date and duration
        calculateEndDate() {
            if (this.sprintForm.startDate && this.sprintForm.duration) {
                this.sprintForm.endDate = SprintModel.calculateEndDate(
                    this.sprintForm.startDate, 
                    this.sprintForm.duration
                );
            }
        },

        // Create or update team member
        saveTeamMember() {
            try {
                this.loading = true;
                
                let result;
                if (this.editingTeamMemberId) {
                    result = window.teamManager.updateTeamMember(this.editingTeamMemberId, this.teamMemberForm);
                } else {
                    result = window.teamManager.createTeamMember(this.teamMemberForm);
                }

                if (result.success) {
                    this.closeTeamMemberModal();
                    this.loadTeamMembers();
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to save team member:', error);
                this.showNotification('Failed to save team member', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Edit team member
        editTeamMember(member) {
            this.editingTeamMemberId = member.id;
            this.teamMemberForm = {
                name: member.name,
                email: member.email,
                role: member.role,
                defaultCapacity: member.defaultCapacity
            };
            this.showCreateTeamMemberModal = true;
        },

        // Delete team member with confirmation
        deleteTeamMember(memberId) {
            const member = this.teamMembers.find(m => m.id === memberId);
            if (!member) return;
            
            if (confirm(`Are you sure you want to deactivate "${member.name}"? They can be reactivated later.`)) {
                try {
                    this.loading = true;
                    const result = window.teamManager.deleteTeamMember(memberId);
                    
                    if (result.success) {
                        this.loadTeamMembers();
                        this.showNotification(`Team member "${member.name}" deactivated successfully`, 'success');
                    } else {
                        this.showNotification(result.errors.join(', '), 'error');
                    }
                } catch (error) {
                    console.error('Failed to delete team member:', error);
                    this.showNotification('Failed to delete team member', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },

        // Add time off for team member
        addTimeOff() {
            try {
                this.loading = true;
                const result = window.teamManager.addTimeOff(
                    this.selectedTeamMemberId,
                    this.timeOffForm.startDate,
                    this.timeOffForm.endDate,
                    this.timeOffForm.reason
                );

                if (result.success) {
                    this.closeTimeOffModal();
                    this.loadTeamMembers();
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to add time off:', error);
                this.showNotification('Failed to add time off', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Remove time off
        removeTimeOff(memberId, timeOffId) {
            try {
                this.loading = true;
                const result = window.teamManager.removeTimeOff(memberId, timeOffId);
                
                if (result.success) {
                    this.loadTeamMembers();
                    this.showNotification('Time off removed successfully', 'success');
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to remove time off:', error);
                this.showNotification('Failed to remove time off', 'error');
            } finally {
                this.loading = false;
            }
        },

        // Open time off modal
        openTimeOffModal(memberId) {
            this.selectedTeamMemberId = memberId;
            this.showTimeOffModal = true;
        },

        // Close sprint modal and reset form
        closeSprintModal() {
            this.showCreateSprintModal = false;
            this.editingSprintId = null;
            this.sprintForm = {
                name: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                duration: 2,
                type: 'Development',
                workStreams: []
            };
            this.calculateEndDate();
        },

        // Work Stream Management Methods
        saveWorkStream() {
            try {
                this.loading = true;
                
                let result;
                if (this.editingWorkStreamId) {
                    result = window.workStreamManager.updateWorkStream(this.editingWorkStreamId, this.workStreamForm);
                } else {
                    result = window.workStreamManager.createWorkStream(this.workStreamForm);
                }

                if (result.success) {
                    this.closeWorkStreamModal();
                    this.loadWorkStreams();
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to save work stream:', error);
                this.showNotification('Failed to save work stream', 'error');
            } finally {
                this.loading = false;
            }
        },

        editWorkStream(workStream) {
            this.editingWorkStreamId = workStream.id;
            this.workStreamForm = {
                name: workStream.name,
                description: workStream.description || '',
                color: workStream.color
            };
            this.showCreateWorkStreamModal = true;
        },

        deleteWorkStream(workStreamId) {
            const workStream = this.workStreams.find(ws => ws.id === workStreamId);
            if (!workStream) return;
            
            if (confirm(`Are you sure you want to delete "${workStream.name}"? This action cannot be undone.`)) {
                try {
                    this.loading = true;
                    const result = window.workStreamManager.deleteWorkStream(workStreamId);
                    
                    if (result.success) {
                        this.loadWorkStreams();
                        if (result.warning) {
                            this.showNotification(`${result.warning}`, 'success');
                        } else {
                            this.showNotification(`Work stream "${workStream.name}" deleted successfully`, 'success');
                        }
                    } else {
                        this.showNotification(result.errors.join(', '), 'error');
                    }
                } catch (error) {
                    console.error('Failed to delete work stream:', error);
                    this.showNotification('Failed to delete work stream', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },

        closeWorkStreamModal() {
            this.showCreateWorkStreamModal = false;
            this.editingWorkStreamId = null;
            this.workStreamForm = {
                name: '',
                description: '',
                color: window.workStreamManager ? window.workStreamManager.getNextAvailableColor() : '#2563EB'
            };
            this.loadWorkStreams(); // Refresh available colors
        },

        toggleWorkStreamSelection(workStreamId) {
            const index = this.sprintForm.workStreams.indexOf(workStreamId);
            if (index > -1) {
                this.sprintForm.workStreams.splice(index, 1);
            } else {
                this.sprintForm.workStreams.push(workStreamId);
            }
        },

        getSprintWorkStreams(sprint) {
            if (!sprint.workStreams || !this.workStreams) return [];
            return this.workStreams.filter(ws => 
                sprint.workStreams.includes(ws.id) && ws.isActive
            );
        },

        // Release Management Methods
        saveRelease() {
            try {
                this.loading = true;
                
                let result;
                if (this.editingReleaseId) {
                    result = window.releaseManager.updateRelease(this.editingReleaseId, this.releaseForm);
                } else {
                    result = window.releaseManager.createRelease(this.releaseForm);
                }

                if (result.success) {
                    this.closeReleaseModal();
                    this.loadReleases();
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                }
            } catch (error) {
                console.error('Failed to save release:', error);
                this.showNotification('Failed to save release', 'error');
            } finally {
                this.loading = false;
            }
        },

        editRelease(release) {
            this.editingReleaseId = release.id;
            this.releaseForm = {
                name: release.name,
                description: release.description || '',
                goNoGoDate: release.goNoGoDate,
                productionDate: release.productionDate,
                status: release.status,
                sprints: release.sprints || [],
                workStreams: release.workStreams || []
            };
            this.showCreateReleaseModal = true;
        },

        deleteRelease(releaseId) {
            const release = this.releases.find(r => r.id === releaseId);
            if (!release) return;
            
            if (confirm(`Are you sure you want to delete "${release.name}"? This action cannot be undone.`)) {
                try {
                    this.loading = true;
                    const result = window.releaseManager.deleteRelease(releaseId);
                    
                    if (result.success) {
                        this.loadReleases();
                        this.showNotification(`Release "${release.name}" deleted successfully`, 'success');
                    } else {
                        this.showNotification(result.errors.join(', '), 'error');
                    }
                } catch (error) {
                    console.error('Failed to delete release:', error);
                    this.showNotification('Failed to delete release', 'error');
                } finally {
                    this.loading = false;
                }
            }
        },

        viewReleaseDetails(release) {
            try {
                this.selectedReleaseDetails = window.releaseManager.getReleaseReadiness(release.id);
                this.showReleaseDetailsModal = true;
            } catch (error) {
                console.error('Failed to get release details:', error);
                this.showNotification('Failed to load release details', 'error');
            }
        },

        closeReleaseModal() {
            this.showCreateReleaseModal = false;
            this.editingReleaseId = null;
            this.releaseForm = {
                name: '',
                description: '',
                goNoGoDate: '',
                productionDate: '',
                status: 'Planning',
                sprints: [],
                workStreams: []
            };
        },

        closeReleaseDetailsModal() {
            this.showReleaseDetailsModal = false;
            this.selectedReleaseDetails = null;
        },

        toggleSprintSelection(sprintId) {
            const index = this.releaseForm.sprints.indexOf(sprintId);
            if (index > -1) {
                this.releaseForm.sprints.splice(index, 1);
            } else {
                this.releaseForm.sprints.push(sprintId);
            }
        },

        toggleReleaseWorkStreamSelection(workStreamId) {
            const index = this.releaseForm.workStreams.indexOf(workStreamId);
            if (index > -1) {
                this.releaseForm.workStreams.splice(index, 1);
            } else {
                this.releaseForm.workStreams.push(workStreamId);
            }
        },

        getReleaseWorkStreams(release) {
            if (!release.workStreams || !this.workStreams) return [];
            return this.workStreams.filter(ws => 
                release.workStreams.includes(ws.id) && ws.isActive
            );
        },

        getReleaseReadiness(releaseId) {
            return window.releaseManager.getReleaseReadiness(releaseId);
        },

        getReleaseStatistics() {
            return window.releaseManager ? window.releaseManager.getReleaseStatistics() : {
                total: 0,
                planning: 0,
                inProgress: 0,
                go: 0,
                noGo: 0,
                released: 0,
                upcoming: 0,
                averageReadiness: 0
            };
        },

        // CSS class helpers for releases
        getReleaseStatusClass(status) {
            const classes = {
                'Planning': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
                'Go': 'bg-green-100 text-green-800 border-green-200',
                'No-Go': 'bg-red-100 text-red-800 border-red-200',
                'Released': 'bg-purple-100 text-purple-800 border-purple-200'
            };
            return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
        },

        getReadinessClass(score) {
            if (score >= 90) return 'bg-green-500';
            if (score >= 75) return 'bg-blue-500';
            if (score >= 50) return 'bg-yellow-500';
            return 'bg-red-500';
        },

        getReadinessTextClass(score) {
            if (score >= 90) return 'text-green-600';
            if (score >= 75) return 'text-blue-600';
            if (score >= 50) return 'text-yellow-600';
            return 'text-red-600';
        },

        getSprintStatusClass(status) {
            const classes = {
                'Upcoming': 'bg-gray-100 text-gray-700',
                'Active': 'bg-green-100 text-green-700',
                'Completed': 'bg-blue-100 text-blue-700'
            };
            return classes[status] || 'bg-gray-100 text-gray-700';
        },

        // Close team member modal and reset form
        closeTeamMemberModal() {
            this.showCreateTeamMemberModal = false;
            this.editingTeamMemberId = null;
            this.teamMemberForm = {
                name: '',
                email: '',
                role: 'Developer',
                defaultCapacity: 8
            };
        },

        // Close time off modal and reset form
        closeTimeOffModal() {
            this.showTimeOffModal = false;
            this.selectedTeamMemberId = '';
            this.timeOffForm = {
                startDate: '',
                endDate: '',
                reason: ''
            };
        },

        // Show notification
        showNotification(message, type = 'success') {
            this.notification = {
                show: true,
                message: message,
                type: type
            };
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        },

        // Export all data
        exportData() {
            try {
                const data = window.storageManager.exportData();
                if (data) {
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `product-manager-ls-backup-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('Data exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export data', 'error');
                }
            } catch (error) {
                console.error('Export failed:', error);
                this.showNotification('Export failed', 'error');
            }
        },

        // Import data (could be extended with file input)
        importData(jsonData) {
            try {
                const result = window.storageManager.importData(jsonData);
                if (result) {
                    this.loadSprints();
                    this.showNotification('Data imported successfully', 'success');
                } else {
                    this.showNotification('Failed to import data', 'error');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('Import failed', 'error');
            }
        },

        // Utility functions
        formatDate(dateString) {
            if (!dateString) return '';
            try {
                return new Date(dateString).toLocaleDateString();
            } catch (error) {
                return dateString;
            }
        },

        getSprintStatus(sprint) {
            const now = new Date();
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);

            if (now < start) return 'Upcoming';
            if (now > end) return 'Completed';
            return 'Active';
        },

        getTotalCapacity(sprint) {
            if (!sprint.capacity) return 0;
            return Object.values(sprint.capacity).reduce((total, cap) => total + (cap || 0), 0);
        },

        getMaxCapacity(sprint) {
            // Calculate maximum possible capacity (8 points per working day)
            const sprintDates = this.getSprintWorkingDays(sprint);
            return sprintDates.length * 8;
        },

        getSprintWorkingDays(sprint) {
            const days = [];
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);
            
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dayOfWeek = date.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
                    days.push(new Date(date));
                }
            }
            
            return days;
        },

        getCapacityPercentage(sprint) {
            const total = this.getTotalCapacity(sprint);
            const max = this.getMaxCapacity(sprint);
            return max > 0 ? Math.round((total / max) * 100) : 0;
        },

        getCapacityClass(sprint) {
            const percentage = this.getCapacityPercentage(sprint);
            
            if (percentage <= 75) return 'capacity-normal';
            if (percentage <= 100) return 'capacity-high';
            return 'capacity-over';
        },

        // Filter functions for future use
        filterSprintsByType(type) {
            return this.sprints.filter(sprint => sprint.type === type);
        },

        filterSprintsByStatus(status) {
            return this.sprints.filter(sprint => this.getSprintStatus(sprint) === status);
        },

        // Search functionality
        searchSprints(query) {
            if (!query) return this.sprints;
            
            const lowerQuery = query.toLowerCase();
            return this.sprints.filter(sprint => 
                sprint.name.toLowerCase().includes(lowerQuery) ||
                sprint.type.toLowerCase().includes(lowerQuery)
            );
        },

        // Statistics for dashboard
        getSprintStatistics() {
            return window.sprintManager.getSprintStatistics();
        },

        // Get team statistics
        getTeamStatistics() {
            return window.teamManager.getTeamStatistics();
        },

        // Get work stream statistics
        getWorkStreamStatistics() {
            return window.workStreamManager ? window.workStreamManager.getWorkStreamStatistics() : {
                total: 0,
                active: 0,
                inactive: 0,
                colorsUsed: 0,
                totalAssociations: { sprints: 0, releases: 0 },
                utilizationAnalysis: { mostUsed: null, leastUsed: null, distributionScore: 0 }
            };
        },

        // Get active team members
        getActiveTeamMembers() {
            return this.teamMembers.filter(member => member.isActive);
        },

        // Get team members by role
        getTeamMembersByRole(role) {
            return this.getActiveTeamMembers().filter(member => member.role === role);
        },

        // Get predefined roles for form dropdown
        getPredefinedRoles() {
            return window.teamManager.getPredefinedRoles();
        },

        // Format time off dates
        formatTimeOffPeriod(timeOff) {
            try {
                const start = new Date(timeOff.startDate).toLocaleDateString();
                const end = new Date(timeOff.endDate).toLocaleDateString();
                return `${start} - ${end}`;
            } catch (error) {
                return 'Invalid dates';
            }
        },

        // Check if team member has current time off
        hasCurrentTimeOff(member) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return member.timeOff.some(timeOff => {
                const start = new Date(timeOff.startDate);
                const end = new Date(timeOff.endDate);
                return today >= start && today <= end;
            });
        },

        // Get team capacity for a sprint
        getTeamSprintCapacity(sprintId) {
            if (!window.capacityTracker) return { totalCapacity: 0, memberCount: 0 };
            return window.capacityTracker.calculateTeamCapacity(sprintId);
        },

        // Get capacity utilization percentage
        getCapacityUtilization(sprintId) {
            const capacity = this.getTeamSprintCapacity(sprintId);
            return capacity.utilizationPercentage || 0;
        },

        // Get CSS class for team member role
        getRoleClass(role) {
            return 'role-' + role.toLowerCase().replace(/\s+/g, '-');
        },

        // Assign team members to sprint
        assignTeamToSprint(sprintId, memberIds) {
            try {
                const sprint = this.sprints.find(s => s.id === sprintId);
                if (!sprint) return false;

                sprint.teamMembers = memberIds;
                const result = window.sprintManager.updateSprint(sprintId, { teamMembers: memberIds });
                
                if (result.success) {
                    this.loadSprints();
                    this.showNotification('Team assignments updated successfully', 'success');
                    return true;
                } else {
                    this.showNotification(result.errors.join(', '), 'error');
                    return false;
                }
            } catch (error) {
                console.error('Failed to assign team to sprint:', error);
                this.showNotification('Failed to update team assignments', 'error');
                return false;
            }
        },

        // Get team members assigned to a sprint
        getSprintTeamMembers(sprintId) {
            const sprint = this.sprints.find(s => s.id === sprintId);
            if (!sprint || !sprint.teamMembers) return [];
            
            return this.teamMembers.filter(member => 
                sprint.teamMembers.includes(member.id) && member.isActive
            );
        },

        // Enhanced Capacity Planning Methods
        
        /**
         * Initialize enhanced capacity planning features
         */
        initializeCapacityPlanning() {
            this.updateCapacityMetrics();
            this.generateForecastData();
            this.analyzeBottlenecks();
            this.updateCapacityHeatmap();
        },

        /**
         * Switch capacity planning view mode
         */
        switchCapacityView() {
            if (this.capacityViewMode === 'dashboard') {
                this.initializeCapacityDashboard();
            } else if (this.capacityViewMode === 'planner') {
                this.initializeCapacityPlanner();
            } else if (this.capacityViewMode === 'analytics') {
                this.initializeAdvancedAnalytics();
            }
        },

        /**
         * Initialize capacity dashboard
         */
        initializeCapacityDashboard() {
            setTimeout(() => {
                if (window.capacityDashboardManager) {
                    window.capacityDashboardManager.initializeDashboard('capacityDashboardContainer');
                }
            }, 100);
        },

        /**
         * Initialize capacity planner
         */
        initializeCapacityPlanner() {
            setTimeout(() => {
                if (window.capacityPlannerManager) {
                    const currentSprintId = this.getCurrentSprintId();
                    window.capacityPlannerManager.initializePlanner('capacityPlannerContainer', currentSprintId);
                }
            }, 100);
        },

        /**
         * Initialize advanced analytics charts
         */
        initializeAdvancedAnalytics() {
            setTimeout(() => {
                this.initializeForecastChart();
                this.initializeVelocityChart();
                this.initializeUtilizationChart();
            }, 100);
        },

        /**
         * Initialize forecast chart for analytics
         */
        initializeForecastChart() {
            console.log('ℹ️ Forecast chart initialization - placeholder');
            // TODO: Implement forecast chart using Chart.js
        },

        /**
         * Initialize velocity chart for analytics
         */
        initializeVelocityChart() {
            console.log('ℹ️ Velocity chart initialization - placeholder');
            // TODO: Implement velocity chart using Chart.js
        },

        /**
         * Initialize utilization chart for analytics
         */
        initializeUtilizationChart() {
            console.log('ℹ️ Utilization chart initialization - placeholder');
            // TODO: Implement utilization chart using Chart.js
        },

        /**
         * Update capacity metrics KPIs
         */
        updateCapacityMetrics() {
            try {
                const sprints = this.getSprintsInTimeframe(this.heatmapTimeframe);
                let totalCapacity = 0;
                let totalUtilization = 0;
                let overallocatedDays = 0;
                let bottlenecks = 0;

                sprints.forEach(sprint => {
                    const capacity = this.getTeamSprintCapacity(sprint.id);
                    totalCapacity += capacity.totalCapacity;
                    totalUtilization += capacity.utilizationPercentage;

                    // Count overallocated days (>95% utilization)
                    if (capacity.utilizationPercentage > 95) {
                        overallocatedDays += this.getSprintWorkingDays(sprint).length;
                    }

                    // Count bottlenecks
                    const recommendations = this.getCapacityRecommendations(sprint.id);
                    bottlenecks += recommendations.warnings.length;
                });

                const avgUtilization = sprints.length > 0 ? totalUtilization / sprints.length : 0;
                const efficiency = this.calculateTeamEfficiency(sprints);
                const capacityTrend = this.calculateCapacityTrend();

                this.capacityMetrics = {
                    totalCapacity: Math.round(totalCapacity),
                    avgUtilization: Math.round(avgUtilization),
                    overallocatedDays,
                    efficiency: Math.round(efficiency),
                    bottlenecks,
                    capacityTrend
                };
            } catch (error) {
                console.error('Failed to update capacity metrics:', error);
            }
        },

        /**
         * Generate forecast data for analytics
         */
        generateForecastData() {
            try {
                const historicalSprints = this.sprints
                    .filter(sprint => new Date(sprint.endDate) < new Date())
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

                if (historicalSprints.length < 2) {
                    this.forecastData = {
                        trend: 'Insufficient Data',
                        confidence: 0,
                        recommendations: ['Need more historical sprint data for accurate forecasting']
                    };
                    return;
                }

                const capacities = historicalSprints.map(sprint => 
                    this.getTeamSprintCapacity(sprint.id).totalCapacity);

                const trend = this.calculateTrend(capacities);
                const confidence = this.calculateForecastConfidence(capacities);
                const recommendations = this.generateForecastRecommendations(trend, capacities);

                this.forecastData = {
                    trend,
                    confidence,
                    recommendations
                };
            } catch (error) {
                console.error('Failed to generate forecast data:', error);
            }
        },

        /**
         * Analyze bottlenecks in capacity planning
         */
        analyzeBottlenecks() {
            try {
                this.bottleneckAnalysis = [];
                const sprints = this.getSprintsInTimeframe('current-sprint');

                sprints.forEach(sprint => {
                    const capacity = this.getTeamSprintCapacity(sprint.id);
                    
                    // High utilization bottleneck
                    if (capacity.utilizationPercentage > 95) {
                        this.bottleneckAnalysis.push({
                            type: 'High Utilization',
                            severity: 'high',
                            description: `Sprint ${sprint.name} has ${capacity.utilizationPercentage}% utilization`,
                            impact: 'Risk of burnout and missed deadlines'
                        });
                    }

                    // Team size bottleneck
                    if (capacity.memberCapacities.length < 3) {
                        this.bottleneckAnalysis.push({
                            type: 'Small Team Size',
                            severity: 'medium',
                            description: `Only ${capacity.memberCapacities.length} team members available`,
                            impact: 'Limited capacity and single points of failure'
                        });
                    }

                    // Skill distribution bottleneck
                    const roleDistribution = this.analyzeRoleDistribution(capacity.memberCapacities);
                    if (roleDistribution.imbalanced) {
                        this.bottleneckAnalysis.push({
                            type: 'Skill Imbalance',
                            severity: 'medium',
                            description: roleDistribution.description,
                            impact: 'Potential workflow bottlenecks'
                        });
                    }
                });
            } catch (error) {
                console.error('Failed to analyze bottlenecks:', error);
            }
        },

        /**
         * Update capacity heatmap
         */
        updateCapacityHeatmap() {
            try {
                const container = document.getElementById('capacityHeatmapContainer');
                if (!container) return;

                const sprints = this.getSprintsInTimeframe(this.heatmapTimeframe);
                const teamMembers = this.getActiveTeamMembers();

                if (sprints.length === 0 || teamMembers.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 p-4">No data available for selected timeframe</p>';
                    return;
                }

                let heatmapHTML = `
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50">Team Member</th>
                                    ${sprints.map(sprint => 
                                        `<th class="px-4 py-3 text-center text-sm font-medium text-gray-900 min-w-[120px]">${sprint.name}</th>`
                                    ).join('')}
                                    <th class="px-4 py-3 text-center text-sm font-medium text-gray-900">Average</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                `;

                teamMembers.forEach(member => {
                    const memberCapacities = sprints.map(sprint => {
                        const capacity = this.getMemberCapacityForSprint(member.id, sprint.id);
                        return capacity || 0;
                    });

                    const avgCapacity = memberCapacities.length > 0 ? 
                        memberCapacities.reduce((sum, cap) => sum + cap, 0) / memberCapacities.length : 0;

                    heatmapHTML += `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                <div class="flex items-center space-x-2">
                                    <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                        ${member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div>${member.name}</div>
                                        <div class="text-xs text-gray-500">${member.role}</div>
                                    </div>
                                </div>
                            </td>
                            ${memberCapacities.map(capacity => {
                                const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
                                const colorClass = this.getUtilizationColorClass(utilization);
                                return `<td class="px-4 py-3 text-center text-sm ${colorClass}">${Math.round(capacity * 10) / 10}</td>`;
                            }).join('')}
                            <td class="px-4 py-3 text-center text-sm font-medium">${Math.round(avgCapacity * 10) / 10}</td>
                        </tr>
                    `;
                });

                heatmapHTML += `
                            </tbody>
                        </table>
                    </div>
                `;

                container.innerHTML = heatmapHTML;
            } catch (error) {
                console.error('Failed to update capacity heatmap:', error);
            }
        },

        /**
         * Get sprints in specified timeframe
         */
        getSprintsInTimeframe(timeframe) {
            const now = new Date();
            
            switch (timeframe) {
                case 'current-sprint':
                    return this.sprints.filter(sprint => 
                        new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now
                    );
                case 'next-3-sprints':
                    return this.sprints
                        .filter(sprint => new Date(sprint.startDate) >= now)
                        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                        .slice(0, 3);
                case 'quarter':
                    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
                    return this.sprints.filter(sprint => 
                        new Date(sprint.startDate) >= quarterStart && new Date(sprint.endDate) <= quarterEnd
                    );
                default:
                    return this.sprints.slice(0, 5);
            }
        },

        /**
         * Get available team members for sprint
         */
        getAvailableMembers(sprintId) {
            return this.getActiveTeamMembers().filter(member => {
                // Check if member has significant capacity for the sprint
                const capacity = this.getMemberCapacityForSprint(member.id, sprintId);
                return capacity > 0;
            });
        },

        /**
         * Get member capacity for specific sprint
         */
        getMemberCapacityForSprint(memberId, sprintId) {
            if (!window.capacityTracker) return 0;
            const capacity = window.capacityTracker.getMemberEffectiveCapacity(memberId, sprintId);
            return capacity.effective || 0;
        },

        /**
         * Get utilization color class
         */
        getUtilizationColorClass(utilization) {
            if (utilization >= 95) return 'text-red-600 bg-red-50';
            if (utilization >= 85) return 'text-orange-600 bg-orange-50';
            if (utilization >= 70) return 'text-green-600 bg-green-50';
            return 'text-blue-600 bg-blue-50';
        },

        /**
         * Get capacity bar color class
         */
        getCapacityBarClass(utilization) {
            if (utilization >= 95) return 'bg-red-500';
            if (utilization >= 85) return 'bg-orange-500';
            return 'bg-green-500';
        },

        /**
         * Get member utilization color
         */
        getMemberUtilizationColor(memberId, sprintId) {
            const capacity = this.getMemberCapacityForSprint(memberId, sprintId);
            const member = this.teamMembers.find(m => m.id === memberId);
            if (!member) return 'bg-gray-400';
            
            const utilization = member.defaultCapacity > 0 ? (capacity / member.defaultCapacity) * 100 : 0;
            
            if (utilization >= 95) return 'bg-red-500';
            if (utilization >= 85) return 'bg-orange-500';
            if (utilization >= 70) return 'bg-green-500';
            return 'bg-blue-500';
        },

        /**
         * Get utilization status text
         */
        getUtilizationStatus(utilization) {
            if (utilization >= 95) return 'Over-allocated';
            if (utilization >= 85) return 'High utilization';
            if (utilization >= 70) return 'Optimal';
            return 'Under-utilized';
        },

        /**
         * Get efficiency status text
         */
        getEfficiencyStatus(efficiency) {
            if (efficiency >= 90) return 'Excellent';
            if (efficiency >= 80) return 'Good';
            if (efficiency >= 70) return 'Average';
            return 'Needs improvement';
        },

        /**
         * Get bottleneck color class
         */
        getBottleneckColor(severity) {
            const colors = {
                high: 'bg-red-500',
                medium: 'bg-orange-500',
                low: 'bg-yellow-500'
            };
            return colors[severity] || 'bg-gray-500';
        },

        /**
         * Open capacity optimization modal/panel
         */
        openCapacityOptimization() {
            if (window.capacityPlanner) {
                this.capacityViewMode = 'planner';
                this.switchCapacityView();
            } else {
                this.showNotification('Capacity optimization not available', 'error');
            }
        },

        /**
         * Export capacity data
         */
        exportCapacityData() {
            try {
                if (!window.capacityTracker) {
                    this.showNotification('Capacity tracker not available', 'error');
                    return;
                }

                const capacityData = window.capacityTracker.exportCapacityData();
                if (capacityData) {
                    const blob = new Blob([capacityData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `capacity-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('Capacity data exported successfully', 'success');
                } else {
                    this.showNotification('Failed to export capacity data', 'error');
                }
            } catch (error) {
                console.error('Export failed:', error);
                this.showNotification('Export failed', 'error');
            }
        },

        /**
         * Plan sprint capacity (open planner for specific sprint)
         */
        planSprintCapacity(sprintId) {
            this.selectedSprintId = sprintId;
            this.capacityViewMode = 'planner';
            this.switchCapacityView();
        },

        /**
         * View sprint analytics
         */
        viewSprintAnalytics(sprintId) {
            this.selectedSprintId = sprintId;
            this.capacityViewMode = 'analytics';
            this.switchCapacityView();
        },

        /**
         * Open sprint capacity details
         */
        openSprintCapacityDetails(sprintId) {
            // This could open a detailed modal or navigate to detailed view
            this.planSprintCapacity(sprintId);
        },

        /**
         * Calculate team efficiency for sprints
         */
        calculateTeamEfficiency(sprints) {
            if (sprints.length === 0) return 0;

            let totalEfficiency = 0;
            sprints.forEach(sprint => {
                const capacity = this.getTeamSprintCapacity(sprint.id);
                const utilization = capacity.utilizationPercentage;
                
                // Efficiency peaks around 85% utilization
                let efficiency;
                if (utilization <= 85) {
                    efficiency = utilization;
                } else {
                    efficiency = 85 - (utilization - 85) * 2; // Penalty for over-utilization
                }
                
                totalEfficiency += Math.max(0, efficiency);
            });

            return totalEfficiency / sprints.length;
        },

        /**
         * Calculate capacity trend
         */
        calculateCapacityTrend() {
            const recentSprints = this.sprints
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(-4); // Last 4 sprints

            if (recentSprints.length < 2) return 'Stable';

            const capacities = recentSprints.map(sprint => 
                this.getTeamSprintCapacity(sprint.id).totalCapacity);

            const firstHalf = capacities.slice(0, Math.floor(capacities.length / 2));
            const secondHalf = capacities.slice(Math.floor(capacities.length / 2));

            const firstAvg = firstHalf.reduce((sum, cap) => sum + cap, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, cap) => sum + cap, 0) / secondHalf.length;

            const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

            if (changePercent > 10) return 'Increasing';
            if (changePercent < -10) return 'Decreasing';
            return 'Stable';
        },

        /**
         * Get current sprint ID
         */
        getCurrentSprintId() {
            const now = new Date();
            const currentSprint = this.sprints.find(sprint => 
                new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now
            );
            return currentSprint?.id || null;
        },

        /**
         * Calculate trend from array of values
         */
        calculateTrend(values) {
            if (values.length < 2) return 'Stable';

            const firstHalf = values.slice(0, Math.floor(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));

            const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

            const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

            if (changePercent > 15) return 'Strongly Increasing';
            if (changePercent > 5) return 'Increasing';
            if (changePercent < -15) return 'Strongly Decreasing';
            if (changePercent < -5) return 'Decreasing';
            return 'Stable';
        },

        /**
         * Calculate forecast confidence
         */
        calculateForecastConfidence(values) {
            if (values.length < 2) return 0;

            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const standardDeviation = Math.sqrt(variance);
            const coefficientOfVariation = standardDeviation / mean;

            // Convert coefficient of variation to confidence (inverse relationship)
            const confidence = Math.max(20, Math.min(95, 90 - (coefficientOfVariation * 100)));
            return Math.round(confidence);
        },

        /**
         * Generate forecast recommendations
         */
        generateForecastRecommendations(trend, values) {
            const recommendations = [];

            if (trend.includes('Increasing')) {
                recommendations.push('Consider hiring additional team members to meet growing demand');
                recommendations.push('Review capacity allocation to prevent overutilization');
            } else if (trend.includes('Decreasing')) {
                recommendations.push('Analyze reasons for decreasing capacity trend');
                recommendations.push('Consider cross-training to improve team flexibility');
            }

            if (values.length > 0) {
                const avgCapacity = values.reduce((sum, val) => sum + val, 0) / values.length;
                const teamSize = this.getActiveTeamMembers().length;
                const capacityPerMember = teamSize > 0 ? avgCapacity / teamSize : 0;

                if (capacityPerMember < 6) {
                    recommendations.push('Team members may be under-utilized - consider increasing sprint commitments');
                } else if (capacityPerMember > 12) {
                    recommendations.push('Team members may be over-utilized - consider reducing sprint commitments');
                }
            }

            recommendations.push('Monitor actual vs. forecast performance for continuous improvement');

            return recommendations;
        },

        /**
         * Analyze role distribution for bottlenecks
         */
        analyzeRoleDistribution(memberCapacities) {
            const roleCapacities = {};
            
            memberCapacities.forEach(member => {
                if (!roleCapacities[member.role]) {
                    roleCapacities[member.role] = 0;
                }
                roleCapacities[member.role] += member.effective;
            });

            const totalCapacity = Object.values(roleCapacities).reduce((sum, cap) => sum + cap, 0);
            const roles = Object.keys(roleCapacities);

            // Check for role imbalance (one role > 60% of capacity)
            for (const role of roles) {
                const rolePercentage = (roleCapacities[role] / totalCapacity) * 100;
                if (rolePercentage > 60) {
                    return {
                        imbalanced: true,
                        description: `${role}s represent ${Math.round(rolePercentage)}% of team capacity`
                    };
                }
            }

            return { imbalanced: false };
        },

        /**
         * Get capacity recommendations for sprint
         */
        getCapacityRecommendations(sprintId) {
            if (window.capacityTracker) {
                return window.capacityTracker.getCapacityRecommendations(sprintId);
            }
            return { warnings: [], suggestions: [] };
        },

        // Debug function
        debugInfo() {
            console.log('Application State:', {
                currentView: this.currentView,
                sprintsCount: this.sprints.length,
                workStreamsCount: this.workStreams.length,
                releasesCount: this.releases.length,
                teamMembersCount: this.teamMembers.length,
                selectedSprintId: this.selectedSprintId,
                capacityViewMode: this.capacityViewMode,
                storage: window.storageManager.getStorageStats()
            });
        }
    };
}

// Register Alpine.js component
// Alpine.js will auto-start, no need to manually call start()
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Alpine === 'undefined') {
        console.warn('Alpine.js not loaded');
    } else {
        console.log('✓ Alpine.js loaded and ready');
    }
});

// Service Worker registration for offline functionality
// Service Worker registration (only for HTTP/HTTPS protocols)
if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✓ Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('⚠ Service Worker registration failed:', error);
            });
    });
} else if (location.protocol === 'file:') {
    console.log('ℹ Service Worker not available in file:// protocol - offline functionality provided by local storage');
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sprintApp };
}