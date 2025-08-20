# Product Manager LS - API Documentation

## Overview

This document provides comprehensive API documentation for the Product Manager LS application's data structures, component interfaces, and internal APIs. While the application doesn't expose external APIs, understanding these internal structures is crucial for development, testing, and potential integrations.

## Table of Contents

1. [Data Models](#data-models)
2. [Storage API](#storage-api)
3. [Component Managers](#component-managers)
4. [Event System](#event-system)
5. [Validation](#validation)
6. [Error Handling](#error-handling)
7. [Local Storage Schema](#local-storage-schema)

## Data Models

The application uses class-based models with validation and serialization capabilities.

### SprintModel

Represents a development sprint with capacity planning and timeline management.

#### Constructor

```javascript
new SprintModel(data = {})
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Auto-generated | Unique identifier |
| `name` | string | Yes | Sprint name |
| `startDate` | string | Yes | Start date (YYYY-MM-DD) |
| `endDate` | string | Yes | End date (YYYY-MM-DD) |
| `duration` | number | Yes | Duration in weeks (2 or 3) |
| `type` | string | Yes | Sprint type |
| `capacity` | object | No | Daily capacity allocation |
| `workStreams` | array | No | Associated work stream IDs |
| `teamMembers` | array | No | Assigned team member IDs |
| `status` | string | No | Current status |
| `createdAt` | string | Auto-generated | Creation timestamp |
| `updatedAt` | string | Auto-updated | Last update timestamp |

#### Sprint Types

- `Development` - Regular feature development
- `Non-Functional` - Performance, security, technical debt
- `Release` - Release preparation and deployment
- `Hardening` - Bug fixes and stabilization

#### Methods

##### validate()

Validates sprint data and returns validation result.

```javascript
const result = sprint.validate();
// Returns: { isValid: boolean, errors: string[] }
```

##### static calculateEndDate(startDate, duration)

Calculates end date based on start date and duration.

```javascript
const endDate = SprintModel.calculateEndDate('2024-01-01', 2);
// Returns: '2024-01-14'
```

##### getCurrentStatus()

Returns current sprint status based on dates.

```javascript
const status = sprint.getCurrentStatus();
// Returns: 'Upcoming' | 'Active' | 'Completed'
```

##### getSprintDates()

Returns array of all dates within the sprint.

```javascript
const dates = sprint.getSprintDates();
// Returns: Array<{
//   date: string,
//   dayOfWeek: number,
//   isWeekend: boolean,
//   capacity: number
// }>
```

##### setDayCapacity(date, capacity)

Sets capacity for a specific date.

```javascript
sprint.setDayCapacity('2024-01-01', 8);
```

##### getTotalCapacity()

Returns total capacity points for the sprint.

```javascript
const total = sprint.getTotalCapacity();
// Returns: number
```

### WorkStreamModel

Represents a logical grouping of work with visual categorization.

#### Constructor

```javascript
new WorkStreamModel(data = {})
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Auto-generated | Unique identifier |
| `name` | string | Yes | Work stream name |
| `color` | string | Yes | Hex color code |
| `description` | string | No | Optional description |
| `sprints` | array | No | Associated sprint IDs |
| `releases` | array | No | Associated release IDs |
| `isActive` | boolean | No | Active status (default: true) |
| `createdAt` | string | Auto-generated | Creation timestamp |
| `updatedAt` | string | Auto-updated | Last update timestamp |

#### Methods

##### validate()

Validates work stream data.

```javascript
const result = workStream.validate();
// Returns: { isValid: boolean, errors: string[] }
```

##### addSprint(sprintId)

Adds sprint association.

```javascript
workStream.addSprint('sprint123');
```

##### removeSprint(sprintId)

Removes sprint association.

```javascript
workStream.removeSprint('sprint123');
```

### TeamMemberModel

Represents a team member with capacity and availability tracking.

#### Constructor

```javascript
new TeamMemberModel(data = {})
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Auto-generated | Unique identifier |
| `name` | string | Yes | Team member name |
| `email` | string | No | Email address |
| `role` | string | Yes | Team member role |
| `defaultCapacity` | number | Yes | Story points per sprint |
| `timeOff` | array | No | Time off periods |
| `supportRotation` | object | No | Support assignments |
| `isActive` | boolean | No | Active status (default: true) |
| `createdAt` | string | Auto-generated | Creation timestamp |
| `updatedAt` | string | Auto-updated | Last update timestamp |

#### Team Member Roles

- `Developer`
- `Tester`
- `Business Analyst`
- `Product Owner`
- `Product Manager`
- `Technical Lead`
- `Architect`
- `Production Support`

#### Time Off Object Structure

```javascript
{
  id: string,           // Unique identifier
  startDate: string,    // Start date (YYYY-MM-DD)
  endDate: string,      // End date (YYYY-MM-DD)
  reason: string,       // Optional reason
  createdAt: string     // Creation timestamp
}
```

#### Methods

##### validate()

Validates team member data.

```javascript
const result = teamMember.validate();
// Returns: { isValid: boolean, errors: string[] }
```

##### addTimeOff(startDate, endDate, reason)

Adds time off period.

```javascript
teamMember.addTimeOff('2024-01-01', '2024-01-05', 'Vacation');
```

##### removeTimeOff(timeOffId)

Removes time off period.

```javascript
teamMember.removeTimeOff('timeoff123');
```

##### isAvailableOnDate(date)

Checks availability on specific date.

```javascript
const isAvailable = teamMember.isAvailableOnDate('2024-01-01');
// Returns: boolean
```

##### getSprintCapacity(sprint)

Calculates capacity for specific sprint considering time off.

```javascript
const capacity = teamMember.getSprintCapacity(sprintModel);
// Returns: number
```

### ReleaseModel

Represents a product release with go/no-go decision points.

#### Constructor

```javascript
new ReleaseModel(data = {})
```

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Auto-generated | Unique identifier |
| `name` | string | Yes | Release name |
| `goNoGoDate` | string | Yes | Go/No-Go decision date |
| `productionDate` | string | Yes | Production release date |
| `sprints` | array | No | Associated sprint IDs |
| `workStreams` | array | No | Scope definition |
| `status` | string | No | Release status |
| `description` | string | No | Optional description |
| `createdAt` | string | Auto-generated | Creation timestamp |
| `updatedAt` | string | Auto-updated | Last update timestamp |

#### Release Statuses

- `Planning`
- `In Progress`
- `Go`
- `No-Go`
- `Released`

## Storage API

The StorageManager handles all local storage operations with error handling and data validation.

### StorageManager

#### Methods

##### isStorageAvailable()

Checks if local storage is available.

```javascript
const available = storageManager.isStorageAvailable();
// Returns: boolean
```

##### saveEntities(key, data)

Saves entity array to storage.

```javascript
const success = storageManager.saveEntities('sprints', sprintArray);
// Returns: boolean
```

##### getEntities(key)

Retrieves entity array from storage.

```javascript
const entities = storageManager.getEntities('sprints');
// Returns: Array<Object>
```

##### clearStorage()

Clears all application data.

```javascript
storageManager.clearStorage();
```

##### exportData()

Exports all data as JSON string.

```javascript
const jsonData = storageManager.exportData();
// Returns: string (JSON)
```

##### importData(jsonData)

Imports data from JSON string.

```javascript
const success = storageManager.importData(jsonData);
// Returns: boolean
```

##### getStorageStats()

Returns storage usage statistics.

```javascript
const stats = storageManager.getStorageStats();
// Returns: {
//   used: number,      // Bytes used
//   available: number, // Bytes available
//   percentage: number // Usage percentage
// }
```

## Component Managers

Managers handle business logic and data operations for each component type.

### SprintManager

#### Methods

##### createSprint(data)

Creates new sprint.

```javascript
const result = sprintManager.createSprint({
  name: 'Sprint 2024-1',
  startDate: '2024-01-01',
  duration: 2,
  type: 'Development'
});
// Returns: { success: boolean, sprint?: SprintModel, errors: string[] }
```

##### updateSprint(id, data)

Updates existing sprint.

```javascript
const result = sprintManager.updateSprint('sprint123', {
  name: 'Updated Sprint Name'
});
// Returns: { success: boolean, sprint?: SprintModel, errors: string[] }
```

##### deleteSprint(id)

Deletes sprint.

```javascript
const result = sprintManager.deleteSprint('sprint123');
// Returns: { success: boolean, errors: string[] }
```

##### getAllSprints()

Retrieves all sprints.

```javascript
const sprints = sprintManager.getAllSprints();
// Returns: Array<SprintModel>
```

##### getSprintById(id)

Retrieves specific sprint.

```javascript
const sprint = sprintManager.getSprintById('sprint123');
// Returns: SprintModel | null
```

##### getSprintCalendar(sprintId)

Generates calendar data for sprint.

```javascript
const calendar = sprintManager.getSprintCalendar('sprint123');
// Returns: Array<{
//   date: string,
//   dayNumber: number,
//   isWeekend: boolean,
//   isInSprint: boolean,
//   isSprintStart: boolean,
//   isSprintEnd: boolean,
//   capacity: number
// }>
```

##### getSprintStatistics()

Returns sprint statistics.

```javascript
const stats = sprintManager.getSprintStatistics();
// Returns: {
//   total: number,
//   active: number,
//   completed: number,
//   upcoming: number,
//   typeDistribution: Object
// }
```

### WorkStreamManager

#### Methods

##### createWorkStream(data)

Creates new work stream.

```javascript
const result = workStreamManager.createWorkStream({
  name: 'User Authentication',
  color: '#2563EB',
  description: 'Login and user management'
});
// Returns: { success: boolean, workStream?: WorkStreamModel, errors: string[] }
```

##### updateWorkStream(id, data)

Updates existing work stream.

```javascript
const result = workStreamManager.updateWorkStream('ws123', {
  name: 'Updated Name'
});
// Returns: { success: boolean, workStream?: WorkStreamModel, errors: string[] }
```

##### deleteWorkStream(id)

Deactivates work stream.

```javascript
const result = workStreamManager.deleteWorkStream('ws123');
// Returns: { success: boolean, warning?: string, errors: string[] }
```

##### getAllWorkStreams()

Retrieves all work streams.

```javascript
const workStreams = workStreamManager.getAllWorkStreams();
// Returns: Array<WorkStreamModel>
```

##### getAvailableColors()

Returns available colors with usage status.

```javascript
const colors = workStreamManager.getAvailableColors();
// Returns: Array<{
//   name: string,
//   color: string,
//   isUsed: boolean
// }>
```

##### getNextAvailableColor()

Returns next unused color.

```javascript
const color = workStreamManager.getNextAvailableColor();
// Returns: string (hex color)
```

### TeamManager

#### Methods

##### createTeamMember(data)

Creates new team member.

```javascript
const result = teamManager.createTeamMember({
  name: 'John Doe',
  email: 'john@company.com',
  role: 'Developer',
  defaultCapacity: 8
});
// Returns: { success: boolean, member?: TeamMemberModel, errors: string[] }
```

##### updateTeamMember(id, data)

Updates existing team member.

```javascript
const result = teamManager.updateTeamMember('member123', {
  defaultCapacity: 10
});
// Returns: { success: boolean, member?: TeamMemberModel, errors: string[] }
```

##### deleteTeamMember(id)

Deactivates team member.

```javascript
const result = teamManager.deleteTeamMember('member123');
// Returns: { success: boolean, errors: string[] }
```

##### getAllTeamMembers()

Retrieves all team members.

```javascript
const members = teamManager.getAllTeamMembers();
// Returns: Array<TeamMemberModel>
```

##### addTimeOff(memberId, startDate, endDate, reason)

Adds time off for team member.

```javascript
const result = teamManager.addTimeOff(
  'member123',
  '2024-01-01',
  '2024-01-05',
  'Vacation'
);
// Returns: { success: boolean, errors: string[] }
```

##### removeTimeOff(memberId, timeOffId)

Removes time off period.

```javascript
const result = teamManager.removeTimeOff('member123', 'timeoff123');
// Returns: { success: boolean, errors: string[] }
```

##### getPredefinedRoles()

Returns list of predefined roles.

```javascript
const roles = teamManager.getPredefinedRoles();
// Returns: Array<string>
```

##### getTeamStatistics()

Returns team statistics.

```javascript
const stats = teamManager.getTeamStatistics();
// Returns: {
//   active: number,
//   roleDistribution: Object,
//   averageCapacity: number,
//   totalTimeOff: number
// }
```

### CapacityTracker

#### Methods

##### calculateTeamCapacity(sprintId)

Calculates team capacity for sprint.

```javascript
const capacity = capacityTracker.calculateTeamCapacity('sprint123');
// Returns: {
//   totalCapacity: number,
//   memberCapacities: Array<{
//     memberId: string,
//     memberName: string,
//     capacity: number,
//     adjustedCapacity: number
//   }>,
//   utilizationPercentage: number
// }
```

##### calculateMemberCapacity(memberId, sprintId)

Calculates individual member capacity for sprint.

```javascript
const capacity = capacityTracker.calculateMemberCapacity('member123', 'sprint123');
// Returns: {
//   baseCapacity: number,
//   adjustedCapacity: number,
//   timeOffDays: number,
//   workingDays: number
// }
```

## Event System

The application uses a custom event system for component communication.

### Event Types

#### sprintChanged

Fired when sprint is created, updated, or deleted.

```javascript
window.addEventListener('sprintChanged', (event) => {
  const { action, sprint } = event.detail;
  // action: 'created' | 'updated' | 'deleted'
  // sprint: SprintModel
});
```

#### workStreamChanged

Fired when work stream is created, updated, or deleted.

```javascript
window.addEventListener('workStreamChanged', (event) => {
  const { action, workStream } = event.detail;
  // action: 'created' | 'updated' | 'deleted'
  // workStream: WorkStreamModel
});
```

#### teamChanged

Fired when team member is created, updated, or deleted.

```javascript
window.addEventListener('teamChanged', (event) => {
  const { action, member } = event.detail;
  // action: 'created' | 'updated' | 'deleted'
  // member: TeamMemberModel
});
```

#### capacityChanged

Fired when capacity calculations change.

```javascript
window.addEventListener('capacityChanged', (event) => {
  const { sprintId, capacity } = event.detail;
  // sprintId: string
  // capacity: Object
});
```

#### storageError

Fired when storage operations fail.

```javascript
window.addEventListener('storageError', (event) => {
  const { message, operation } = event.detail;
  // message: string
  // operation: string
});
```

### Event Dispatch

To dispatch custom events:

```javascript
window.dispatchEvent(new CustomEvent('sprintChanged', {
  detail: {
    action: 'created',
    sprint: sprintModel
  }
}));
```

## Validation

All models include comprehensive validation with detailed error reporting.

### Validation Response Format

```javascript
{
  isValid: boolean,    // Overall validation status
  errors: string[]     // Array of error messages
}
```

### Common Validation Rules

#### Required Fields
- All models validate required fields are present and non-empty
- String fields are trimmed before validation

#### Date Validation
- Dates must be in YYYY-MM-DD format
- End dates must be after start dates
- Date ranges must be logical

#### Email Validation
- Uses standard email regex pattern
- Only validates when email is provided (optional fields)

#### Numeric Validation
- Capacity values must be within reasonable ranges (0-40)
- Duration must be 2 or 3 weeks

#### Enum Validation
- Sprint types, team roles, and release statuses validated against predefined lists
- Color codes validated as hex format

## Error Handling

The application implements comprehensive error handling with user-friendly messages.

### Error Types

#### Validation Errors
- Field-level validation failures
- Business rule violations
- Data consistency issues

#### Storage Errors
- Local storage unavailable
- Storage quota exceeded
- Serialization failures

#### Runtime Errors
- Unexpected exceptions
- Component initialization failures
- Event handling errors

### Error Reporting

Errors are reported through multiple channels:

1. **Return Values**: Methods return success/error objects
2. **Events**: Storage errors trigger custom events
3. **Console**: Debug information logged to console
4. **UI Notifications**: User-friendly error messages

### Error Response Format

```javascript
{
  success: boolean,      // Operation success status
  data?: any,           // Result data if successful
  errors: string[],     // Error messages if failed
  warning?: string      // Optional warning message
}
```

## Local Storage Schema

The application stores data in browser Local Storage using the following schema:

### Storage Keys

- `sprints` - Array of sprint objects
- `workStreams` - Array of work stream objects
- `teamMembers` - Array of team member objects
- `releases` - Array of release objects (future use)
- `settings` - Application settings (future use)

### Data Format

All data is stored as JSON strings:

```javascript
// Example storage structure
{
  "sprints": [
    {
      "id": "sprint123",
      "name": "Sprint 2024-1",
      "startDate": "2024-01-01",
      "endDate": "2024-01-14",
      "duration": 2,
      "type": "Development",
      "capacity": {},
      "workStreams": ["ws123"],
      "teamMembers": ["member123"],
      "status": "Planning",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "workStreams": [
    {
      "id": "ws123",
      "name": "User Authentication",
      "color": "#2563EB",
      "description": "Login and user management",
      "sprints": ["sprint123"],
      "releases": [],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "teamMembers": [
    {
      "id": "member123",
      "name": "John Doe",
      "email": "john@company.com",
      "role": "Developer",
      "defaultCapacity": 8,
      "timeOff": [],
      "supportRotation": {},
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Storage Management

#### Automatic Serialization
- Models provide `toJSON()` methods for consistent serialization
- Storage manager handles JSON conversion automatically

#### Data Integrity
- All operations include validation before storage
- Failed operations don't corrupt existing data
- Atomic operations ensure consistency

#### Migration Support
- Models include version information for future migrations
- Import/export supports data transformation
- Backward compatibility maintained

---

This API documentation provides comprehensive coverage of all internal APIs, data structures, and interfaces used in the Product Manager LS application. It serves as a reference for developers working with the codebase and understanding the application's architecture.