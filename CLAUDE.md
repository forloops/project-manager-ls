# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Product Manager LS is an offline-first, browser-based agile project management application that runs entirely in the browser using local storage. No web server or backend required.

## Technology Stack

- **Frontend**: AlpineJS for reactive components
- **Styling**: TailwindCSS via CDN
- **Charts**: Chart.js for analytics
- **Storage**: Browser Local Storage/IndexedDB
- **Architecture**: Progressive Web App (PWA)
- **No Build Tools**: Pure HTML/CSS/JavaScript - runs directly in browser

## Development Commands

```bash
# Start local development server (choose one)
python -m http.server 8000
npx serve .
php -S localhost:8000

# Open in browser
open http://localhost:8000
```

## Architecture

### Core Modules

1. **Sprint Management** (`src/sprints/`)
   - Sprint CRUD operations with 2-3 week cycles
   - Calendar views and timeline visualization
   - Capacity planning and allocation

2. **Work Streams** (`src/workstreams/`)
   - Color-coded categorization system
   - Filtering and grouping capabilities
   - Cross-sprint tracking

3. **Release Management** (`src/releases/`)
   - Go/no-go decision framework
   - Sprint-to-release mapping
   - Timeline and dependency tracking

4. **Team Management** (`src/team/`)
   - Member profiles with skillsets
   - Capacity and allocation tracking
   - Support rotation scheduling

### Data Layer

- **Storage Strategy**: All data stored in browser Local Storage as JSON
- **Data Models**: Sprints, WorkStreams, Releases, TeamMembers
- **Relationships**: Many-to-many between sprints and work streams
- **Versioning**: Include version field for future Azure Boards integration
- **Import/Export**: JSON format for data portability

### Key Implementation Patterns

1. **Offline-First**: All functionality must work without internet
2. **Component Structure**: AlpineJS components for each major feature
3. **State Management**: Local Storage with event-based updates
4. **Responsive Design**: Mobile-first with TailwindCSS utilities
5. **Accessibility**: WCAG 2.1 AA compliance required

## Development Workflow

### Multi-Agent System

The project uses specialized Claude agents for parallel development:

- **business-analyst**: Analyze requirements and identify gaps
- **engineer**: Implement features and functionality  
- **tester**: Test offline functionality and edge cases
- **smart-doc-generator**: Create and maintain documentation

### Sprint Plan

- **Sprint 1**: Core Sprint Management (Critical Path) ✅ COMPLETE
- **Sprint 2**: Work Streams + Team Management (Parallel) ✅ COMPLETE
- **Sprint 3**: Release Management + Testing ✅ COMPLETE
- **Sprint 4**: Polish, PWA, and Integration ✅ COMPLETE

### CURRENT STATUS: PRODUCTION READY
- All 4 sprints completed successfully
- Advanced capacity planning with visual dashboards implemented
- 100% test pass rate across all modules
- Stakeholders actively testing and providing feedback

## Testing Approach

```bash
# Manual testing checklist
- [x] Offline functionality (disconnect network)
- [x] Data persistence (refresh page)
- [x] Local storage limits (large datasets)
- [x] Cross-browser compatibility
- [x] Mobile responsiveness
- [x] Keyboard navigation
```

## File Structure

```
/
├── index.html           # Main application entry
├── src/
│   ├── sprints/        # Sprint management ✅
│   ├── workstreams/    # Work stream features ✅
│   ├── releases/       # Release management ✅
│   ├── team/           # Team features ✅
│   ├── capacity/       # Advanced capacity planning ✅
│   ├── common/         # Shared utilities ✅
│   └── storage/        # Local storage layer ✅
├── styles/             # Custom CSS
├── assets/             # Images and icons
├── docs/              # Generated documentation ✅
├── STAKEHOLDER-FEEDBACK.md  # Current enhancement requests
└── manifest.json       # PWA configuration ✅
```

## Critical Requirements

1. **Must work completely offline** - No API calls or external dependencies ✅
2. **Browser-only** - No Node.js, npm, or build tools required ✅
3. **Local Storage** - All data persisted in browser storage ✅
4. **Direct file access** - Should run from file:// protocol ✅
5. **PWA capable** - Installable as desktop/mobile app ✅

## Common Tasks

### Adding a New Feature
1. Create component file in appropriate module directory
2. Use AlpineJS for reactivity
3. Implement local storage persistence
4. Add to main navigation
5. Test offline functionality

### Working with Data
1. All data operations through storage layer
2. Use JSON.stringify/parse for serialization
3. Implement versioning for future migrations
4. Handle storage quota exceeded errors

### Styling Components
1. Use TailwindCSS utility classes
2. Follow mobile-first responsive design
3. Maintain consistent color scheme for work streams
4. Ensure WCAG 2.1 AA contrast ratios

## Known Architecture Decisions

### Naming Conventions for Global Objects
- **Class Instances**: Use `Manager` suffix to avoid Alpine.js collisions
  - `window.capacityDashboardManager` (not `window.capacityDashboard`)
  - `window.capacityPlannerManager` (not `window.capacityPlanner`)
- **Alpine Components**: Use `Component` suffix for manual references
  - `window.capacityDashboardComponent`
  - `window.capacityPlannerComponent`

### Alpine.js Integration
- Alpine auto-registers global functions, causing naming collisions
- Use `x-data="componentNameComponent()"` in templates
- Access manager instances via `window.[name]Manager` in component methods

## Current Enhancement Requests

### High Priority: Multi-Activity Capacity Allocation
**Status**: Documented in STAKEHOLDER-FEEDBACK.md  
**Description**: Allow multiple activities per person per day for detailed capacity planning  
**Impact**: Critical for real-world adoption  
**Implementation**: Requires data model extension and UI enhancement  

See `STAKEHOLDER-FEEDBACK.md` for complete specification and implementation plan.

## Important Implementation Notes

1. **Always maintain offline-first architecture**
2. **Test on mobile devices and various screen sizes**
3. **Validate data integrity across browser sessions**
4. **Follow existing patterns for new features**
5. **Document any breaking changes**

## Performance Benchmarks

- **Sprint Operations**: < 50ms average
- **Capacity Calculations**: 12.4ms average for 50+ sprints
- **Chart Rendering**: < 2 seconds for complex visualizations
- **Local Storage**: < 100ms read/write operations
- **Application Load**: < 2 seconds on modern devices

## Browser Compatibility

- **Primary**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: ES6+, Local Storage, Service Workers, AlpineJS 3.x
- **Fallbacks**: Graceful degradation for older browsers

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.