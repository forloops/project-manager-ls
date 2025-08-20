/**
 * Activity Management Modal
 * Provides a modal interface for adding, editing, and managing individual activities
 */
class ActivityModal {
    constructor() {
        this.modal = null;
        this.overlay = null;
        this.currentData = null;
        this.onSaveCallback = null;
        this.isEditing = false;
        
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'activity-modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 hidden items-center justify-center p-4';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'activity-modal bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto';
        
        this.modal.innerHTML = `
            <div class="modal-header p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <h3 class="modal-title text-lg font-semibold text-gray-900">Add Activity</h3>
                    <button class="modal-close text-gray-400 hover:text-gray-600 text-xl font-semibold">&times;</button>
                </div>
            </div>
            
            <div class="modal-body p-6">
                <form class="activity-form space-y-4">
                    <!-- Activity Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Activity Name *</label>
                        <input type="text" 
                               name="name" 
                               class="activity-name w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="e.g., Feature Development, Code Review"
                               required>
                    </div>
                    
                    <!-- Activity Type -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                        <select name="type" 
                                class="activity-type w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required>
                            <option value="">Select activity type...</option>
                        </select>
                    </div>
                    
                    <!-- Capacity -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (Story Points) *</label>
                        <input type="number" 
                               name="capacity" 
                               class="activity-capacity w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               min="0" max="16" step="0.5"
                               placeholder="0.0"
                               required>
                        <div class="capacity-feedback text-xs text-gray-500 mt-1"></div>
                    </div>
                    
                    <!-- Priority -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select name="priority" 
                                class="activity-priority w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="low">Low Priority</option>
                            <option value="medium" selected>Medium Priority</option>
                            <option value="high">High Priority</option>
                        </select>
                    </div>
                    
                    <!-- Work Stream (optional) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Work Stream (Optional)</label>
                        <select name="workStreamId" 
                                class="activity-workstream w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">No work stream assigned</option>
                        </select>
                    </div>
                    
                    <!-- Estimated Duration -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (Hours)</label>
                        <input type="number" 
                               name="estimatedDuration" 
                               class="activity-duration w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               min="0" max="24" step="0.25"
                               placeholder="0.0">
                    </div>
                    
                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea name="description" 
                                  class="activity-description w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows="3"
                                  placeholder="Additional details about this activity..."></textarea>
                    </div>
                    
                    <!-- Validation Messages -->
                    <div class="validation-messages hidden p-3 bg-red-50 border border-red-200 rounded-md">
                        <div class="text-sm text-red-800 font-medium mb-1">Please fix the following errors:</div>
                        <ul class="validation-errors text-sm text-red-700 list-disc list-inside"></ul>
                    </div>
                </form>
            </div>
            
            <div class="modal-footer p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button type="button" 
                        class="modal-cancel px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                </button>
                <button type="button" 
                        class="modal-save px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Save Activity
                </button>
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        this.populateActivityTypes();
        this.populateWorkStreams();
    }

    populateActivityTypes() {
        const typeSelect = this.modal.querySelector('.activity-type');
        const activityTypes = window.ActivityModel ? window.ActivityModel.getActivityTypes() : [
            { value: 'development', label: 'Development', icon: '💻' },
            { value: 'testing', label: 'Testing', icon: '🧪' },
            { value: 'meeting', label: 'Meeting', icon: '👥' },
            { value: 'review', label: 'Code Review', icon: '👁️' },
            { value: 'documentation', label: 'Documentation', icon: '📝' },
            { value: 'support', label: 'Support', icon: '🛠️' },
            { value: 'planning', label: 'Planning', icon: '📊' },
            { value: 'other', label: 'Other', icon: '📋' }
        ];

        activityTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = `${type.icon} ${type.label}`;
            typeSelect.appendChild(option);
        });
    }

    populateWorkStreams() {
        const workStreamSelect = this.modal.querySelector('.activity-workstream');
        
        // Get work streams from the global manager
        if (window.workStreamManager) {
            const workStreams = window.workStreamManager.getActiveWorkStreams();
            workStreams.forEach(workStream => {
                const option = document.createElement('option');
                option.value = workStream.id;
                option.textContent = workStream.name;
                workStreamSelect.appendChild(option);
            });
        }
    }

    bindEvents() {
        // Close modal events
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('.modal-cancel').addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // Save button
        this.modal.querySelector('.modal-save').addEventListener('click', () => this.save());
        
        // Capacity validation
        const capacityInput = this.modal.querySelector('.activity-capacity');
        capacityInput.addEventListener('input', () => this.validateCapacity());
        
        // Form submission
        const form = this.modal.querySelector('.activity-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        
        // Enter key to save
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.save();
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    show(options = {}) {
        this.currentData = options;
        this.onSaveCallback = options.onSave;
        this.isEditing = !!options.activity;
        
        // Update modal title
        const title = this.modal.querySelector('.modal-title');
        title.textContent = this.isEditing ? 'Edit Activity' : 'Add Activity';
        
        // Update save button text
        const saveBtn = this.modal.querySelector('.modal-save');
        saveBtn.textContent = this.isEditing ? 'Update Activity' : 'Save Activity';
        
        // Populate form data
        this.populateForm(options);
        
        // Show modal
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('flex');
        
        // Focus first input
        setTimeout(() => {
            this.modal.querySelector('.activity-name').focus();
        }, 100);
        
        // Validate initial capacity
        this.validateCapacity();
    }

    hide() {
        this.overlay.classList.add('hidden');
        this.overlay.classList.remove('flex');
        this.clearForm();
        this.clearValidation();
    }

    populateForm(options) {
        const form = this.modal.querySelector('.activity-form');
        
        if (options.activity) {
            // Editing existing activity
            const activity = options.activity;
            form.querySelector('[name="name"]').value = activity.name || '';
            form.querySelector('[name="type"]').value = activity.type || 'development';
            form.querySelector('[name="capacity"]').value = activity.capacity || 0;
            form.querySelector('[name="priority"]').value = activity.priority || 'medium';
            form.querySelector('[name="workStreamId"]').value = activity.workStreamId || '';
            form.querySelector('[name="estimatedDuration"]').value = activity.estimatedDuration || 0;
            form.querySelector('[name="description"]').value = activity.description || '';
        } else {
            // Adding new activity
            form.querySelector('[name="type"]').value = options.defaultType || 'development';
            form.querySelector('[name="priority"]').value = 'medium';
            
            // Set default capacity based on available capacity
            if (options.memberId && options.date && window.capacityTracker && window.teamManager) {
                const member = window.teamManager.getTeamMemberById(options.memberId);
                const existingActivities = window.capacityTracker.getMemberDateActivities(options.memberId, options.date);
                const usedCapacity = existingActivities.reduce((total, act) => total + act.capacity, 0);
                const availableCapacity = member ? Math.max(0, member.defaultCapacity - usedCapacity) : 1;
                
                form.querySelector('[name="capacity"]').value = Math.min(availableCapacity, 1);
            }
        }
    }

    clearForm() {
        const form = this.modal.querySelector('.activity-form');
        form.reset();
    }

    validateCapacity() {
        const capacityInput = this.modal.querySelector('.activity-capacity');
        const feedbackDiv = this.modal.querySelector('.capacity-feedback');
        const capacity = parseFloat(capacityInput.value) || 0;
        
        if (this.currentData.memberId && this.currentData.date && window.capacityTracker && window.teamManager) {
            const member = window.teamManager.getTeamMemberById(this.currentData.memberId);
            if (member) {
                const existingActivities = window.capacityTracker.getMemberDateActivities(this.currentData.memberId, this.currentData.date);
                
                // Exclude current activity if editing
                const filteredActivities = this.isEditing ? 
                    existingActivities.filter(act => act.id !== this.currentData.activity?.id) : 
                    existingActivities;
                
                const usedCapacity = filteredActivities.reduce((total, act) => total + act.capacity, 0);
                const totalCapacity = usedCapacity + capacity;
                const availableCapacity = member.defaultCapacity - usedCapacity;
                
                if (capacity > availableCapacity) {
                    feedbackDiv.textContent = `Exceeds available capacity by ${(capacity - availableCapacity).toFixed(1)} points`;
                    feedbackDiv.className = 'text-xs text-red-600 mt-1';
                    capacityInput.classList.add('border-red-300');
                } else if (totalCapacity > member.defaultCapacity * 0.9) {
                    feedbackDiv.textContent = `${availableCapacity.toFixed(1)} points remaining`;
                    feedbackDiv.className = 'text-xs text-orange-600 mt-1';
                    capacityInput.classList.remove('border-red-300');
                } else {
                    feedbackDiv.textContent = `${availableCapacity.toFixed(1)} points remaining`;
                    feedbackDiv.className = 'text-xs text-gray-500 mt-1';
                    capacityInput.classList.remove('border-red-300');
                }
            }
        }
    }

    validateForm() {
        const form = this.modal.querySelector('.activity-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Convert numeric fields
        data.capacity = parseFloat(data.capacity) || 0;
        data.estimatedDuration = parseFloat(data.estimatedDuration) || 0;
        
        // Create activity instance for validation
        const activityData = {
            ...data,
            memberId: this.currentData.memberId,
            date: this.currentData.date,
            sprintId: this.currentData.sprintId || ''
        };
        
        if (window.ActivityModel) {
            const activity = new window.ActivityModel(activityData);
            const validation = activity.validate();
            
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return null;
            }
            
            return activityData;
        } else {
            // Basic validation fallback
            const errors = [];
            if (!data.name?.trim()) errors.push('Activity name is required');
            if (!data.type) errors.push('Activity type is required');
            if (data.capacity <= 0) errors.push('Capacity must be greater than 0');
            
            if (errors.length > 0) {
                this.showValidationErrors(errors);
                return null;
            }
            
            return activityData;
        }
    }

    showValidationErrors(errors) {
        const messagesDiv = this.modal.querySelector('.validation-messages');
        const errorsList = this.modal.querySelector('.validation-errors');
        
        errorsList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
        messagesDiv.classList.remove('hidden');
        
        // Scroll to errors
        messagesDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    clearValidation() {
        const messagesDiv = this.modal.querySelector('.validation-messages');
        messagesDiv.classList.add('hidden');
        
        // Clear input styling
        this.modal.querySelectorAll('input, select, textarea').forEach(input => {
            input.classList.remove('border-red-300');
        });
    }

    save() {
        this.clearValidation();
        
        const activityData = this.validateForm();
        if (!activityData) {
            return; // Validation failed
        }
        
        if (this.onSaveCallback) {
            if (this.isEditing) {
                // Include the activity ID for updates
                activityData.id = this.currentData.activity.id;
            }
            
            this.onSaveCallback(activityData);
        }
        
        this.hide();
    }

    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// Create global instance
window.activityModal = new ActivityModal();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityModal;
}