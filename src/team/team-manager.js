/**
 * Team Manager
 * Handles all team member operations including CRUD operations, capacity tracking,
 * and team management for the Product Manager LS application.
 */

class TeamManager {
    constructor() {
        this.storageKey = 'teamMembers';
        this.storage = window.storageManager;
        
        // Predefined roles
        this.predefinedRoles = [
            'Developer',
            'Tester', 
            'Business Analyst',
            'Product Owner',
            'Product Manager',
            'Technical Lead',
            'Architect',
            'Production Support'
        ];
        
        // Initialize with any existing team members
        this.teamMembers = this.loadTeamMembers();
        
        // Bind methods to maintain context
        this.createTeamMember = this.createTeamMember.bind(this);
        this.updateTeamMember = this.updateTeamMember.bind(this);
        this.deleteTeamMember = this.deleteTeamMember.bind(this);
    }

    /**
     * Load all team members from storage
     * @returns {Array} Array of team member objects
     */
    loadTeamMembers() {
        try {
            const teamData = this.storage.getEntities(this.storageKey);
            return teamData.map(data => new TeamMemberModel(data));
        } catch (error) {
            console.error('Failed to load team members:', error);
            return [];
        }
    }

    /**
     * Save team members to storage
     * @returns {boolean} Success status
     */
    saveTeamMembers() {
        try {
            const teamData = this.teamMembers.map(member => member.toJSON());
            return this.storage.saveEntities(this.storageKey, teamData);
        } catch (error) {
            console.error('Failed to save team members:', error);
            return false;
        }
    }

    /**
     * Get all team members
     * @returns {Array} Array of team member models
     */
    getAllTeamMembers() {
        return [...this.teamMembers];
    }

    /**
     * Get active team members only
     * @returns {Array} Array of active team member models
     */
    getActiveTeamMembers() {
        return this.teamMembers.filter(member => member.isActive);
    }

    /**
     * Get team member by ID
     * @param {string} memberId - Team member ID to find
     * @returns {TeamMemberModel|null} Team member model or null if not found
     */
    getTeamMemberById(memberId) {
        return this.teamMembers.find(member => member.id === memberId) || null;
    }

    /**
     * Get team members by role
     * @param {string} role - Role to filter by
     * @returns {Array} Array of team members with the specified role
     */
    getTeamMembersByRole(role) {
        return this.teamMembers.filter(member => member.role === role && member.isActive);
    }

    /**
     * Create a new team member
     * @param {Object} memberData - Team member data object
     * @returns {Object} Result object with success status and member/errors
     */
    createTeamMember(memberData) {
        try {
            // Create team member model and validate
            const member = new TeamMemberModel(memberData);
            const validation = member.validate();
            
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for duplicate email
            if (member.email && this.findByEmail(member.email)) {
                return {
                    success: false,
                    errors: ['A team member with this email already exists']
                };
            }

            // Add to team members array and save
            this.teamMembers.push(member);
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('memberAdded', member);
                return {
                    success: true,
                    member: member
                };
            } else {
                // Remove from array if save failed
                this.teamMembers.pop();
                return {
                    success: false,
                    errors: ['Failed to save team member to storage']
                };
            }
        } catch (error) {
            console.error('Failed to create team member:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while creating the team member']
            };
        }
    }

    /**
     * Update an existing team member
     * @param {string} memberId - Team member ID to update
     * @param {Object} updates - Updates to apply
     * @returns {Object} Result object with success status and member/errors
     */
    updateTeamMember(memberId, updates) {
        try {
            const memberIndex = this.teamMembers.findIndex(member => member.id === memberId);
            
            if (memberIndex === -1) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }

            // Create updated team member model
            const currentMember = this.teamMembers[memberIndex];
            const updatedData = { ...currentMember.toJSON(), ...updates };
            const updatedMember = new TeamMemberModel(updatedData);
            
            // Validate updated member
            const validation = updatedMember.validate();
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check for duplicate email (excluding current member)
            if (updatedMember.email && updatedMember.email !== currentMember.email) {
                const existingMember = this.findByEmail(updatedMember.email);
                if (existingMember && existingMember.id !== memberId) {
                    return {
                        success: false,
                        errors: ['A team member with this email already exists']
                    };
                }
            }

            // Update member in array and save
            this.teamMembers[memberIndex] = updatedMember;
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('memberUpdated', updatedMember);
                return {
                    success: true,
                    member: updatedMember
                };
            } else {
                // Revert changes if save failed
                this.teamMembers[memberIndex] = currentMember;
                return {
                    success: false,
                    errors: ['Failed to save team member updates to storage']
                };
            }
        } catch (error) {
            console.error('Failed to update team member:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while updating the team member']
            };
        }
    }

    /**
     * Delete a team member (soft delete by setting isActive to false)
     * @param {string} memberId - Team member ID to delete
     * @returns {Object} Result object with success status
     */
    deleteTeamMember(memberId) {
        try {
            const memberIndex = this.teamMembers.findIndex(member => member.id === memberId);
            
            if (memberIndex === -1) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }

            const member = this.teamMembers[memberIndex];
            
            // Soft delete by setting isActive to false
            member.isActive = false;
            member.updatedAt = new Date().toISOString();
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('memberDeactivated', member);
                return {
                    success: true,
                    member: member
                };
            } else {
                // Revert changes if save failed
                member.isActive = true;
                return {
                    success: false,
                    errors: ['Failed to deactivate team member in storage']
                };
            }
        } catch (error) {
            console.error('Failed to delete team member:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while deleting the team member']
            };
        }
    }

    /**
     * Reactivate a deactivated team member
     * @param {string} memberId - Team member ID to reactivate
     * @returns {Object} Result object with success status
     */
    reactivateTeamMember(memberId) {
        try {
            const member = this.getTeamMemberById(memberId);
            
            if (!member) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }

            member.isActive = true;
            member.updatedAt = new Date().toISOString();
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('memberReactivated', member);
                return {
                    success: true,
                    member: member
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to reactivate team member in storage']
                };
            }
        } catch (error) {
            console.error('Failed to reactivate team member:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while reactivating the team member']
            };
        }
    }

    /**
     * Find team member by email
     * @param {string} email - Email to search for
     * @returns {TeamMemberModel|null} Team member or null if not found
     */
    findByEmail(email) {
        return this.teamMembers.find(member => 
            member.email && member.email.toLowerCase() === email.toLowerCase()
        ) || null;
    }

    /**
     * Add time off for a team member
     * @param {string} memberId - Team member ID
     * @param {string} startDate - Start date of time off
     * @param {string} endDate - End date of time off
     * @param {string} reason - Reason for time off
     * @returns {Object} Result object with success status
     */
    addTimeOff(memberId, startDate, endDate, reason = '') {
        try {
            const member = this.getTeamMemberById(memberId);
            
            if (!member) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }

            // Validate dates
            if (new Date(startDate) >= new Date(endDate)) {
                return {
                    success: false,
                    errors: ['End date must be after start date']
                };
            }

            member.addTimeOff(startDate, endDate, reason);
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('timeOffAdded', member);
                return {
                    success: true,
                    member: member
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save time off to storage']
                };
            }
        } catch (error) {
            console.error('Failed to add time off:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while adding time off']
            };
        }
    }

    /**
     * Remove time off for a team member
     * @param {string} memberId - Team member ID
     * @param {string} timeOffId - Time off ID to remove
     * @returns {Object} Result object with success status
     */
    removeTimeOff(memberId, timeOffId) {
        try {
            const member = this.getTeamMemberById(memberId);
            
            if (!member) {
                return {
                    success: false,
                    errors: ['Team member not found']
                };
            }

            member.removeTimeOff(timeOffId);
            
            if (this.saveTeamMembers()) {
                this.notifyTeamChange('timeOffRemoved', member);
                return {
                    success: true,
                    member: member
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to remove time off from storage']
                };
            }
        } catch (error) {
            console.error('Failed to remove time off:', error);
            return {
                success: false,
                errors: ['An unexpected error occurred while removing time off']
            };
        }
    }

    /**
     * Get team capacity for a specific sprint
     * @param {SprintModel} sprint - Sprint to calculate capacity for
     * @returns {Object} Team capacity information
     */
    getTeamSprintCapacity(sprint) {
        try {
            const activeMembers = this.getActiveTeamMembers();
            let totalCapacity = 0;
            let availableMembers = [];
            
            activeMembers.forEach(member => {
                const memberCapacity = member.getSprintCapacity(sprint);
                totalCapacity += memberCapacity;
                
                if (memberCapacity > 0) {
                    availableMembers.push({
                        id: member.id,
                        name: member.name,
                        role: member.role,
                        capacity: memberCapacity,
                        defaultCapacity: member.defaultCapacity
                    });
                }
            });

            return {
                totalCapacity,
                memberCount: activeMembers.length,
                availableMembers,
                averageCapacity: activeMembers.length > 0 ? totalCapacity / activeMembers.length : 0
            };
        } catch (error) {
            console.error('Failed to calculate team sprint capacity:', error);
            return {
                totalCapacity: 0,
                memberCount: 0,
                availableMembers: [],
                averageCapacity: 0
            };
        }
    }

    /**
     * Get team members who are available on a specific date
     * @param {string} date - Date to check (YYYY-MM-DD)
     * @returns {Array} Array of available team members
     */
    getAvailableMembersOnDate(date) {
        return this.getActiveTeamMembers().filter(member => 
            member.isAvailableOnDate(date)
        );
    }

    /**
     * Get team statistics
     * @returns {Object} Team statistics object
     */
    getTeamStatistics() {
        const allMembers = this.teamMembers;
        const activeMembers = this.getActiveTeamMembers();
        
        const roleDistribution = {};
        this.predefinedRoles.forEach(role => {
            roleDistribution[role] = activeMembers.filter(member => member.role === role).length;
        });

        const totalTimeOff = activeMembers.reduce((total, member) => 
            total + member.timeOff.length, 0
        );

        const averageCapacity = activeMembers.length > 0 ? 
            activeMembers.reduce((total, member) => total + member.defaultCapacity, 0) / activeMembers.length : 0;

        // Enhanced analytics
        const capacityAnalysis = this.getCapacityAnalysis(activeMembers);
        const teamBalance = this.getTeamBalanceAnalysis(roleDistribution);

        return {
            total: allMembers.length,
            active: activeMembers.length,
            inactive: allMembers.length - activeMembers.length,
            roleDistribution,
            totalTimeOff,
            averageCapacity: Math.round(averageCapacity * 100) / 100,
            capacityAnalysis,
            teamBalance
        };
    }

    /**
     * Get capacity analysis for the team
     * @param {Array} activeMembers - Active team members
     * @returns {Object} Capacity analysis
     */
    getCapacityAnalysis(activeMembers) {
        if (activeMembers.length === 0) {
            return {
                totalCapacity: 0,
                highCapacityMembers: 0,
                lowCapacityMembers: 0,
                capacityVariation: 0,
                recommendations: []
            };
        }

        const capacities = activeMembers.map(member => member.defaultCapacity);
        const totalCapacity = capacities.reduce((sum, cap) => sum + cap, 0);
        const averageCapacity = totalCapacity / capacities.length;

        // Calculate standard deviation
        const variance = capacities.reduce((sum, cap) => 
            sum + Math.pow(cap - averageCapacity, 2), 0) / capacities.length;
        const standardDeviation = Math.sqrt(variance);

        const highCapacityMembers = activeMembers.filter(member => 
            member.defaultCapacity > averageCapacity + standardDeviation).length;
        const lowCapacityMembers = activeMembers.filter(member => 
            member.defaultCapacity < averageCapacity - standardDeviation).length;

        const recommendations = [];
        if (standardDeviation > 3) {
            recommendations.push('High capacity variation detected - consider balancing workload allocation');
        }
        if (lowCapacityMembers > activeMembers.length * 0.3) {
            recommendations.push('Many team members have below-average capacity - review training needs');
        }
        if (highCapacityMembers < activeMembers.length * 0.1) {
            recommendations.push('Consider identifying and developing high-capacity team members');
        }

        return {
            totalCapacity: Math.round(totalCapacity),
            highCapacityMembers,
            lowCapacityMembers,
            capacityVariation: Math.round(standardDeviation * 100) / 100,
            recommendations
        };
    }

    /**
     * Get team balance analysis
     * @param {Object} roleDistribution - Role distribution data
     * @returns {Object} Team balance analysis
     */
    getTeamBalanceAnalysis(roleDistribution) {
        const totalMembers = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
        
        if (totalMembers === 0) {
            return {
                balanceScore: 0,
                risks: [],
                strengths: [],
                recommendations: []
            };
        }

        const rolePercentages = {};
        const risks = [];
        const strengths = [];
        const recommendations = [];

        // Calculate role percentages and identify risks/strengths
        Object.entries(roleDistribution).forEach(([role, count]) => {
            const percentage = (count / totalMembers) * 100;
            rolePercentages[role] = Math.round(percentage);

            if (count === 0) {
                risks.push(`No ${role}s in the team`);
                recommendations.push(`Consider adding a ${role} to the team`);
            } else if (percentage > 60) {
                risks.push(`${role}s represent ${percentage}% of the team (overrepresented)`);
                recommendations.push(`Consider diversifying roles or splitting ${role} responsibilities`);
            } else if (percentage >= 20 && percentage <= 40) {
                strengths.push(`Good representation of ${role}s (${percentage}%)`);
            }
        });

        // Calculate balance score (0-100, higher is better)
        const idealPercentage = 100 / Object.keys(roleDistribution).length;
        const deviations = Object.values(rolePercentages).map(percentage => 
            Math.abs(percentage - idealPercentage));
        const averageDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
        const balanceScore = Math.max(0, 100 - (averageDeviation * 2));

        return {
            balanceScore: Math.round(balanceScore),
            rolePercentages,
            risks,
            strengths,
            recommendations
        };
    }

    /**
     * Get predefined roles
     * @returns {Array} Array of predefined role strings
     */
    getPredefinedRoles() {
        return [...this.predefinedRoles];
    }

    /**
     * Add a custom role to the predefined roles
     * @param {string} role - Role name to add
     * @returns {boolean} Success status
     */
    addCustomRole(role) {
        if (!role || typeof role !== 'string') return false;
        
        const trimmedRole = role.trim();
        if (trimmedRole.length === 0) return false;
        
        if (!this.predefinedRoles.includes(trimmedRole)) {
            this.predefinedRoles.push(trimmedRole);
            return true;
        }
        
        return false; // Role already exists
    }

    /**
     * Notify about team changes for UI updates
     * @param {string} action - Action performed
     * @param {TeamMemberModel} member - Team member that was changed
     */
    notifyTeamChange(action, member) {
        window.dispatchEvent(new CustomEvent('teamChanged', {
            detail: { action, member: member.toJSON() }
        }));
    }

    /**
     * Export team members to JSON
     * @returns {string} JSON string of all team members
     */
    exportTeamMembers() {
        try {
            return JSON.stringify(this.teamMembers.map(member => member.toJSON()), null, 2);
        } catch (error) {
            console.error('Failed to export team members:', error);
            return null;
        }
    }

    /**
     * Import team members from JSON
     * @param {string} jsonData - JSON string of team members
     * @returns {Object} Import result
     */
    importTeamMembers(jsonData) {
        try {
            const memberData = JSON.parse(jsonData);
            
            if (!Array.isArray(memberData)) {
                return {
                    success: false,
                    errors: ['Invalid data format - expected array of team members']
                };
            }

            const importedMembers = [];
            const errors = [];

            memberData.forEach((data, index) => {
                try {
                    const member = new TeamMemberModel(data);
                    const validation = member.validate();
                    
                    if (validation.isValid) {
                        importedMembers.push(member);
                    } else {
                        errors.push(`Team member ${index + 1}: ${validation.errors.join(', ')}`);
                    }
                } catch (error) {
                    errors.push(`Team member ${index + 1}: ${error.message}`);
                }
            });

            if (errors.length > 0) {
                return {
                    success: false,
                    errors: errors
                };
            }

            // Replace current team members with imported ones
            this.teamMembers = importedMembers;
            
            if (this.saveTeamMembers()) {
                return {
                    success: true,
                    imported: importedMembers.length
                };
            } else {
                return {
                    success: false,
                    errors: ['Failed to save imported team members']
                };
            }
        } catch (error) {
            console.error('Failed to import team members:', error);
            return {
                success: false,
                errors: ['Invalid JSON format']
            };
        }
    }
}

// Create global instance
window.teamManager = new TeamManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamManager;
}