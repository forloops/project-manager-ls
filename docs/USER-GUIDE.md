# Product Manager LS - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Sprint Management](#sprint-management)
3. [Work Stream Organization](#work-stream-organization)
4. [Team Management](#team-management)
5. [Capacity Planning](#capacity-planning)
6. [Calendar Views](#calendar-views)
7. [Data Management](#data-management)
8. [Offline Usage](#offline-usage)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### What is Product Manager LS?

Product Manager LS (Local Storage) is an offline-first, browser-based agile project management application designed for product managers, scrum masters, and development teams. It provides comprehensive sprint planning, team capacity management, and work stream organization without requiring a server or internet connection.

### Key Features

- **Sprint Management**: Create and manage 2-3 week development cycles
- **Work Stream Organization**: Color-coded categorization of work areas
- **Team Capacity Planning**: Track individual and team availability
- **Calendar Views**: Visual sprint timeline with daily capacity tracking
- **Offline Operation**: Works completely without internet connection
- **Data Export/Import**: Backup and restore your project data

### System Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Local Storage support (enabled by default in modern browsers)
- Minimum 4MB local storage space (for typical usage)

### Getting Started

1. **Open the Application**: Navigate to the application URL or open `index.html` directly
2. **First Launch**: The application will initialize with empty state
3. **Create Your First Sprint**: Click "Create Sprint" to begin
4. **Add Team Members**: Navigate to "Team Management" to add your team
5. **Set Up Work Streams**: Create color-coded work categories

## Sprint Management

### Creating a Sprint

1. **Access Sprint Creation**:
   - Click "Create Sprint" button in the header
   - Use keyboard shortcut: `Ctrl+N` (or `Cmd+N` on Mac)
   - From empty state: Click "Create Your First Sprint"

2. **Sprint Configuration**:
   - **Sprint Name**: Descriptive name (e.g., "Sprint 2024-1", "Q1 Feature Sprint")
   - **Start Date**: Sprint start date (defaults to today)
   - **Duration**: Choose 2 or 3 weeks
   - **Sprint Type**: Select from predefined types:
     - **Development**: Regular feature development
     - **Non-Functional**: Performance, security, technical debt
     - **Release**: Release preparation and deployment
     - **Hardening**: Bug fixes and stabilization
   - **Work Streams**: Associate relevant work streams
   - **End Date**: Automatically calculated based on start date and duration

3. **Save Sprint**: Click "Create Sprint" to save

### Sprint Types and Usage

#### Development Sprints
- Primary sprint type for feature development
- Typically 2-3 weeks duration
- Focus on delivering user-facing functionality
- Best Practice: Plan for 80% capacity to allow for unknowns

#### Non-Functional Sprints
- Dedicated to technical improvements
- Performance optimization, security updates
- Technical debt reduction
- Infrastructure improvements

#### Release Sprints
- Final preparation for production releases
- Bug fixes, testing, deployment preparation
- Often shorter duration (1-2 weeks)
- Reduced feature development

#### Hardening Sprints
- Stabilization and quality focus
- Bug fixing and testing
- Performance tuning
- Documentation completion

### Managing Existing Sprints

#### Viewing Sprints
- **Sprint Cards**: Overview with key information
- **Status Indicators**: Upcoming, Active, Completed
- **Capacity Visualization**: Color-coded capacity bars
- **Work Stream Tags**: Visual association indicators

#### Editing Sprints
1. Click "Edit" button on sprint card
2. Modify any sprint properties
3. Click "Update Sprint" to save changes

#### Sprint Calendar View
1. Click "View Calendar" on sprint card
2. Or select sprint from Calendar tab dropdown
3. View detailed daily breakdown

#### Deleting Sprints
1. Click "Delete" button on sprint card
2. Confirm deletion in dialog
3. **Warning**: This action cannot be undone

### Sprint Status Management

Sprints automatically update their status based on dates:
- **Upcoming**: Start date is in the future
- **Active**: Current date is between start and end dates
- **Completed**: End date has passed

## Work Stream Organization

### Understanding Work Streams

Work streams are logical groupings of work that help organize development efforts across different functional areas. They provide visual categorization and filtering capabilities.

### Creating Work Streams

1. **Access Creation**: Click "Create Work Stream" button
2. **Configuration**:
   - **Name**: Descriptive work stream name
   - **Description**: Optional detailed description
   - **Color**: Choose from predefined color palette
   - **Preview**: See how it will appear in the interface

3. **Color Selection**:
   - Choose from accessibility-compliant color palette
   - Used colors are marked for reference
   - Colors provide visual distinction across interface

### Work Stream Best Practices

#### Functional Organization
- **User Authentication**: Login, registration, password management
- **Payment Processing**: Billing, subscriptions, transactions
- **Data Management**: Import/export, synchronization
- **User Interface**: Frontend components, styling
- **API Development**: Backend services, integrations

#### Feature-Based Organization
- **Mobile App**: Mobile-specific features
- **Web Platform**: Web application features
- **Admin Tools**: Administrative functionality
- **Reporting**: Analytics and reporting features

#### Technical Organization
- **Infrastructure**: DevOps, deployment, monitoring
- **Security**: Authentication, authorization, compliance
- **Performance**: Optimization, caching, scaling
- **Testing**: Automated testing, quality assurance

### Managing Work Streams

#### Viewing Work Streams
- **Color Legend**: Visual reference for all active streams
- **Association Counts**: Number of linked sprints and releases
- **Creation Dates**: Track when streams were established

#### Editing Work Streams
1. Click edit icon on work stream card
2. Modify name, description, or color
3. Save changes

#### Associating with Sprints
- Select work streams during sprint creation
- Multiple work streams per sprint supported
- Visual tags appear on sprint cards

#### Deactivating Work Streams
1. Click delete icon on work stream card
2. Confirm deactivation
3. Stream becomes inactive but retains associations
4. Can be reactivated if needed

## Team Management

### Team Member Profiles

#### Adding Team Members

1. **Access**: Navigate to "Team Management" tab
2. **Add Member**: Click "Add Team Member" button
3. **Profile Information**:
   - **Name**: Full name (required)
   - **Email**: Contact email (optional)
   - **Role**: Select from predefined roles
   - **Default Capacity**: Story points per sprint (typically 6-12)

#### Predefined Roles

- **Developer**: Software development, coding
- **Tester**: Quality assurance, testing
- **Business Analyst**: Requirements analysis, documentation
- **Product Owner**: Product decisions, backlog management
- **Product Manager**: Strategic planning, roadmap
- **Technical Lead**: Architecture, technical decisions
- **Architect**: System design, technology strategy
- **Production Support**: Operations, maintenance

### Capacity Management

#### Default Capacity Settings
- **Typical Range**: 6-12 points per sprint
- **Considerations**:
  - Experience level
  - Role responsibilities
  - Meeting obligations
  - Support responsibilities

#### Capacity Guidelines by Role

| Role | Typical Capacity | Notes |
|------|------------------|-------|
| Developer | 8-10 points | Full development focus |
| Senior Developer | 6-8 points | Mentoring, code review |
| Technical Lead | 4-6 points | Architecture, planning |
| Tester | 8-10 points | Testing focus |
| Business Analyst | 6-8 points | Requirements, documentation |
| Product Owner | 2-4 points | Mostly planning, decisions |

### Time Off Management

#### Adding Time Off

1. **Access**: Click "Add Time Off" on team member card
2. **Configuration**:
   - **Start Date**: First day of absence
   - **End Date**: Last day of absence
   - **Reason**: Optional description (vacation, conference, etc.)

3. **Impact**: Automatically adjusts capacity calculations

#### Time Off Best Practices

- **Plan Ahead**: Add known time off early
- **Types to Track**:
  - Vacation/Personal time
  - Conferences and training
  - Sick leave (when planned)
  - Company holidays
  - Team building events

#### Managing Time Off

- **Current Status**: "On Leave" indicator for active time off
- **Quick Removal**: Click "✕" to remove time off period
- **Capacity Impact**: Automatic adjustment in sprint planning

### Team Statistics

The team overview provides key metrics:
- **Active Members**: Currently active team members
- **Different Roles**: Diversity of roles in team
- **Average Capacity**: Team capacity baseline
- **Time Off Periods**: Current absence tracking

## Capacity Planning

### Understanding Capacity

Capacity planning helps ensure realistic sprint commitments and prevents team burnout by tracking work allocation against team availability.

### Capacity Calculation

#### Individual Capacity
- Based on team member's default capacity setting
- Adjusted for time off periods
- Considers working days only (excludes weekends)

#### Team Capacity
- Sum of all assigned team members' adjusted capacity
- Accounts for overlapping time off
- Provides sprint-level totals

### Capacity Visualization

#### Color-Coded Indicators

- **Green (Normal)**: 0-75% utilization - healthy capacity
- **Yellow (High)**: 76-100% utilization - approaching limits
- **Red (Over)**: 100%+ utilization - over-allocated

#### Capacity Bars

- Visual representation of utilization percentage
- Appears on sprint cards and capacity view
- Real-time updates as assignments change

### Capacity Planning Best Practices

#### Sprint Planning Guidelines

1. **Target 80% Utilization**: Leave buffer for unknowns
2. **Account for Meetings**: Reduce capacity for high-meeting periods
3. **Consider Sprint Type**: Different types require different approaches
4. **Plan for Support**: Include production support time

#### Red Flags to Watch

- **Consistent Over-allocation**: Team burnout risk
- **Zero Buffer**: No room for emergencies
- **Uneven Distribution**: Some members over-loaded
- **Support Overlap**: Production support during heavy development

### Sprint Capacity Review

Regularly review capacity across sprints:
1. Navigate to "Capacity Planning" tab
2. Review utilization percentages
3. Identify over-allocated sprints
4. Adjust team assignments or sprint scope

## Calendar Views

### Sprint Calendar

The calendar view provides detailed daily breakdown of sprint activity and capacity allocation.

#### Accessing Calendar View

1. **From Sprint Card**: Click "View Calendar" button
2. **From Calendar Tab**: Select sprint from dropdown
3. **Direct Navigation**: Use "Calendar View" tab

#### Calendar Features

#### Daily Layout
- **7-Day Week**: Includes weekends for complete view
- **Sprint Boundaries**: Highlighted start and end dates
- **Capacity Indicators**: Daily capacity allocation
- **Visual Distinction**: Different styling for weekends

#### Calendar Information

- **Day Numbers**: Clear date identification
- **Capacity Points**: Points allocated per day
- **Capacity Bars**: Visual capacity representation
- **Sprint Context**: Days within vs outside sprint

### Calendar Best Practices

#### Sprint Planning

1. **Review Full Timeline**: Check all days including weekends
2. **Identify Holidays**: Account for company holidays
3. **Plan Around Events**: Consider conferences, training
4. **Balance Workload**: Distribute capacity evenly

#### Daily Capacity Management

- **Avoid Overloading**: Watch for red capacity indicators
- **Plan for Meetings**: Reduce capacity on heavy meeting days
- **Consider Context**: Sprint ceremonies, demos, planning

### Calendar Navigation

- **Sprint Selection**: Dropdown to choose different sprints
- **Quick Access**: Direct links from sprint cards
- **Empty States**: Clear messaging when no sprint selected

## Data Management

### Export Functionality

#### Creating Backups

1. **Access Export**: Click "Export Data" button in header
2. **Automatic Download**: JSON file downloads automatically
3. **File Naming**: Includes date for easy identification
4. **Content**: Complete application data backup

#### Export Contents

The export includes:
- All sprint data and configurations
- Team member profiles and time off
- Work stream definitions and associations
- Application settings and preferences

### Import Functionality

#### Restoring Data

While not currently exposed in the UI, the application supports data import through the browser console:

```javascript
// In browser console
const jsonData = '...'; // Your exported JSON
window.sprintApp().importData(jsonData);
```

### Data Backup Best Practices

#### Regular Backups

- **Weekly Exports**: Regular backup schedule
- **Before Major Changes**: Backup before significant updates
- **Multiple Locations**: Store backups in multiple places
- **Version Control**: Keep dated backup files

#### File Management

- **Naming Convention**: Use date-based naming
- **Storage Location**: Consistent backup folder
- **Cloud Storage**: Consider cloud backup storage
- **Team Sharing**: Share backups with team leads

### Data Storage

The application uses browser Local Storage:
- **Automatic Saving**: All changes saved immediately
- **Local Only**: Data never leaves your browser
- **Persistent**: Survives browser restarts
- **Size Limits**: Typically 5-10MB per domain

## Offline Usage

### Progressive Web App (PWA)

Product Manager LS is designed as a Progressive Web App, providing native app-like experience:

#### Installation

1. **Browser Prompt**: Modern browsers offer install prompts
2. **Manual Installation**: Use browser menu "Install App"
3. **Desktop Shortcut**: Creates desktop icon
4. **Standalone Mode**: Runs without browser chrome

#### Offline Capabilities

- **Complete Functionality**: All features work offline
- **Data Persistence**: Local storage maintains data
- **No Server Required**: No internet dependency
- **Background Sync**: Ready for future online features

### Offline Best Practices

#### Usage Patterns

1. **Regular Exports**: Backup data before going offline
2. **Multiple Devices**: Use exports to sync between devices
3. **Team Sharing**: Export/import for team collaboration
4. **Extended Offline**: No limitations on offline duration

#### Data Management

- **Local Changes**: All edits saved to local storage
- **No Conflicts**: Single-user model prevents conflicts
- **Recovery**: Browser data recovery tools available
- **Migration**: Easy data transfer via export/import

### Service Worker

The application includes a service worker for enhanced offline functionality:
- **Caching Strategy**: Caches application resources
- **Offline Loading**: Loads even without network
- **Update Management**: Handles application updates

## Troubleshooting

### Common Issues

#### Data Not Saving

**Symptoms**: Changes don't persist after browser refresh

**Solutions**:
1. Check browser storage settings
2. Ensure Local Storage is enabled
3. Clear browser cache and reload
4. Check available storage space
5. Try incognito/private mode

#### Performance Issues

**Symptoms**: Application runs slowly

**Solutions**:
1. Clear browser cache
2. Close other browser tabs
3. Export data and reimport to reset storage
4. Check for browser extensions interference
5. Update to latest browser version

#### Missing Features

**Symptoms**: Buttons or features not working

**Solutions**:
1. Ensure JavaScript is enabled
2. Check browser console for errors
3. Refresh the page
4. Try different browser
5. Clear browser data and restart

### Browser Compatibility

#### Supported Browsers

- **Chrome**: Version 90 and later
- **Firefox**: Version 88 and later
- **Safari**: Version 14 and later
- **Edge**: Version 90 and later

#### Required Features

- ES6 JavaScript support
- Local Storage API
- CSS Grid and Flexbox
- Service Worker support (for PWA)

### Data Recovery

#### Recovering Lost Data

1. **Browser History**: Check browser's storage recovery
2. **Export Files**: Restore from previous exports
3. **Browser Sync**: Check cloud-synced browser data
4. **Developer Tools**: Access storage through browser dev tools

#### Prevention

- Regular data exports
- Multiple backup locations
- Team data sharing
- Cloud storage for backups

### Debug Information

To access debug information:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Type: `window.sprintApp().debugInfo()`
4. Review application state information

### Getting Help

#### Self-Service Resources

1. **User Guide**: This comprehensive guide
2. **Browser Console**: Check for error messages
3. **Export/Import**: Use for data recovery
4. **Browser Documentation**: Vendor-specific help

#### Reporting Issues

When reporting issues, include:
- Browser name and version
- Operating system
- Steps to reproduce
- Error messages (if any)
- Export file (if data-related)

---

## Quick Reference

### Keyboard Shortcuts

- `Ctrl+N` / `Cmd+N`: Create new sprint
- `Escape`: Close open modals

### Capacity Guidelines

- **Developer**: 8-10 points per sprint
- **Senior/Lead**: 6-8 points per sprint
- **Product Owner**: 2-4 points per sprint
- **Target Utilization**: 80% for healthy capacity

### Color Coding

- **Green**: Normal capacity (0-75%)
- **Yellow**: High capacity (76-100%)
- **Red**: Over capacity (100%+)

### Sprint Duration

- **2 weeks**: Standard development sprints
- **3 weeks**: Complex feature development
- **1 week**: Release/hotfix sprints (custom)

This user guide provides comprehensive coverage of all Product Manager LS features and best practices for agile project management teams.