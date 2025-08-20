# Stakeholder Feedback & Feature Requests

## High Priority Enhancement: Multi-Activity Capacity Allocation

**Date**: 2025-08-19  
**Source**: Stakeholder testing feedback  
**Priority**: High  
**Status**: Documented for next development cycle  

### Current State
- Each person has a single capacity value per day
- No ability to break down daily capacity into multiple activities
- Limited visibility into what specific work someone is doing each day

### Required Enhancement: Per-Person Activity Mapping

**User Story**: As a Product Manager, I want to allocate multiple activities to a person during a sprint so that I can track specific work assignments and ensure realistic daily planning.

**Detailed Requirements**:

1. **Multiple Activities Per Day Per Person**
   - Allow assigning 1 or more activities to each team member per day
   - Each activity should have its own capacity allocation (story points/hours)
   - Total daily activities should not exceed person's daily capacity limit

2. **Activity Management**
   - Create, edit, delete activities for specific person/date combinations
   - Activity types: Development, Testing, Meetings, Code Review, Documentation, etc.
   - Color-coded activity types for visual distinction

3. **Enhanced UI Requirements**
   - Expandable capacity cells to show activity breakdown
   - Modal or inline editing for adding multiple activities
   - Visual indicators showing activity distribution
   - Daily activity summary view per person

4. **Data Structure Changes Needed**
   ```javascript
   // Current: capacity per person per day
   capacityData: {
     "person-date": 6.0  // total story points
   }
   
   // Enhanced: activities per person per day
   capacityData: {
     "person-date": {
       totalCapacity: 6.0,
       activities: [
         { id: "act1", name: "Feature Development", type: "development", capacity: 4.0 },
         { id: "act2", name: "Code Review", type: "review", capacity: 1.0 },
         { id: "act3", name: "Sprint Planning", type: "meeting", capacity: 1.0 }
       ]
     }
   }
   ```

5. **Integration Points**
   - Maintain backward compatibility with existing capacity tracking
   - Update capacity analytics to include activity-level insights
   - Enhance reporting to show activity distribution across team
   - Update drag-and-drop to handle activity-level reallocation

### Implementation Approach

**Phase 1: Data Layer Enhancement**
- Extend CapacityTracker to support activity-based allocation
- Add Activity model with validation and business logic
- Update storage layer to handle nested activity data
- Maintain migration path from simple to activity-based allocation

**Phase 2: UI Enhancement**
- Add activity management modal/interface
- Enhance capacity cells to show activity breakdown
- Implement activity-level drag-and-drop
- Add activity filtering and reporting views

**Phase 3: Analytics Integration**
- Activity utilization analysis
- Team activity balance recommendations
- Work type distribution insights
- Capacity optimization considering activity types

### Technical Considerations

**Data Storage**:
- Extend existing local storage models
- Ensure JSON export/import includes activity data
- Version data structures for Azure Boards compatibility

**Performance**:
- Optimize rendering for cells with multiple activities
- Lazy load activity details for large datasets
- Cache activity calculations for dashboard performance

**UX Design**:
- Progressive disclosure (simple → detailed activity view)
- Mobile-friendly activity management
- Keyboard shortcuts for power users
- Bulk activity operations

### Success Metrics

**User Adoption**:
- 80% of teams use activity-level planning within 4 weeks
- Average 3-4 activities per person per day
- Reduction in capacity over-allocation incidents

**Productivity Impact**:
- Improved sprint planning accuracy
- Better workload visibility and balance
- Enhanced team communication about daily priorities

### Related Features to Consider

**Work Stream Integration**:
- Link activities to specific work streams
- Show work stream distribution at activity level
- Cross-work stream dependency tracking

**Time Tracking Integration**:
- Actual vs. planned activity time tracking
- Velocity calculations at activity type level
- Learning insights for future planning

**Team Collaboration**:
- Activity comments and status updates
- Cross-team activity dependencies
- Shared activity templates

---

## Implementation Notes for Developers

**Quick Start When Resuming**:
1. Review current CapacityTracker class in `src/team/capacity-tracker.js`
2. Examine capacity cell rendering in `src/capacity/capacity-planner.js` lines 150-180
3. Check Alpine.js component methods in `src/capacity/capacity-alpine-component.js`
4. Start with Activity model creation in `src/models/activity-model.js`

**Key Files to Modify**:
- `src/team/capacity-tracker.js` - Core capacity logic
- `src/capacity/capacity-planner.js` - UI rendering and interaction
- `src/capacity/capacity-alpine-component.js` - Alpine.js reactivity
- `src/storage/models.js` - Data models and validation

**Testing Strategy**:
- Unit tests for activity allocation logic
- Integration tests for UI interactions
- Performance tests with 50+ activities per sprint
- Offline functionality validation

This enhancement will significantly improve the practical utility of the capacity planning feature and address real-world project management needs identified by stakeholders.