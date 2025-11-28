# Product Requirements Document (PRD) for User Assignment and Management Feature

## Executive Summary
The User Assignment and Management feature will enhance AI-Kanban by allowing users to assign and manage team members responsible for executing specific cards within a project. This feature aims to facilitate task delegation, improve accountability, and enhance team collaboration, ultimately leading to more efficient project completion.

## Background & Context

- **Current State**: Currently, AI-Kanban allows users to create and manage project cards but lacks the ability to assign specific team members to these cards, making it difficult to track accountability and ownership of tasks.
- **Problem Statement**: Without a way to assign team members to cards, project management lacks clarity in task delegation, potentially leading to inefficiencies and missed deadlines.
- **Business Value**: By enabling task assignment, AI-Kanban will improve team accountability and collaboration, leading to more efficient project management and higher user satisfaction.
- **User Personas**: 
  - Project Managers: Need to delegate tasks and track accountability.
  - Team Members: Need clarity on their responsibilities within projects.

## Goals & Non-Goals

### Goals
1. Enable users to assign team members to specific cards within a project.
2. Provide a clear display of assigned team members on each card.
3. Allow users to update or remove assignments easily.

### Non-Goals
- Implementing role-based access control for assignments.
- Redesigning the existing authentication mechanism.

## Requirements

### Functional Requirements

#### Core Features
1. **Team Member Assignment**
   - Description: Allow users to assign a team member to a card.
   - User Story: As a project manager, I want to assign a team member to a card, so that I can track who is responsible for each task.
   - Acceptance Criteria:
     - [ ] Users can view a list of team members available for assignment within a card.
     - [ ] Users can assign a team member to a card and save the assignment.

2. **Display Assigned Team Member**
   - Description: Display the assigned team member's name on the card.
   - User Story: As a team member, I want to see who is responsible for a card, so that I know whom to contact for updates.
   - Acceptance Criteria:
     - [ ] The card displays the assigned team member's name prominently.

3. **Update and Remove Assignment**
   - Description: Allow users to update or remove an assignment.
   - User Story: As a project manager, I want to update or remove a team member assignment, so that I can reflect changes in responsibility.
   - Acceptance Criteria:
     - [ ] Users can update or remove an assignment and the changes are reflected immediately.

#### Edge Cases & Error Handling
- If no team members are available, the system should inform the user and prevent assignment.
- If the assignment fails due to a network issue, the system should alert the user and allow a retry.

### Non-Functional Requirements
- **Performance**: Real-time updates should occur within 2 seconds of an assignment change.
- **Scalability**: Support up to 100 concurrent users making assignment changes.
- **Security**: Utilize existing authentication mechanisms to verify team member identities.
- **Accessibility**: Ensure the user interface is navigable via keyboard and screen readers.
- **Browser/Device Support**: Support the latest versions of Chrome, Firefox, and Safari.

## Technical Design

### Architecture Overview
The feature will integrate both frontend and backend components, with the frontend handling user interactions and the backend managing data persistence and real-time updates.

### Components & Responsibilities

#### Frontend
- **AIAssistant.tsx**: Handle user interactions for assigning team members.
- **Card.tsx**: Display assigned team member's name.
- **State Management**: Use Context API to manage and propagate state changes.

#### Backend
- **Board Routes**: Add endpoints for managing assignments.
- **AIService**: Ensure real-time updates using WebSockets or Supabase's real-time features.

#### Data Layer
- **Database Changes**:
```sql
ALTER TABLE cards ADD COLUMN assigned_user_id UUID;
```
- **Data Migration Strategy**: Update existing cards with `NULL` for `assigned_user_id`.
- **Caching Strategy**: Cache user lists to minimize database queries.

### Technology Stack
- **New Dependencies**: None required.
- **Infrastructure**: Utilize existing Supabase infrastructure for real-time capabilities.

### Integration Points
- **Supabase**: For real-time updates and user authentication.
- **OpenAI API**: No direct integration required for this feature.

### Data Flow
1. User selects a card and assigns a team member.
2. Frontend sends a request to the backend to update the assignment.
3. Backend updates the database and triggers a real-time update.
4. All connected clients receive the update and refresh the card display.

## Implementation Plan

### Phase 1: Backend Development
- [ ] Create database migration script to add `assigned_user_id` column.
- [ ] Implement API endpoints for assignment management.
- **Deliverable**: Backend supports user assignments.

### Phase 2: Frontend Development
- [ ] Update UI to include assignment inside the card.
- **Deliverable**: Frontend card select and displays users.

### Phase 3: Frontend Development
- [ ] Implement UI to add/update/delete users.
- **Deliverable**: Frontend to manage users.


## Project folder structure
```
├── README.md
├── backend
│   ├── package-lock.json
│   ├── package.json
│   ├── scripts
│   │   └── database
│   │       ├── README.md
│   │       ├── add_prd_templates_rls.sql
│   │       ├── create_card_messages_table.sql
│   │       ├── create_cards_table.sql
│   │       ├── create_columns_table.sql
│   │       ├── create_profiles_table.sql
│   │       ├── create_projects_table.sql
│   │       ├── create_prp_templates_table.sql
│   │       ├── create_user_settings_table.sql
│   │       ├── migrate_prp_to_prd.sql
│   │       └── update_for_ai.sql
│   ├── src
│   │   ├── config
│   │   │   └── supabase.ts
│   │   ├── index.ts
│   │   ├── middleware
│   │   │   └── ensureAuth.ts
│   │   ├── routes
│   │   │   ├── ai.ts
│   │   │   ├── board.ts
│   │   │   ├── prdTemplates.ts
│   │   │   ├── projects.ts
│   │   │   └── settings.ts
│   │   ├── services
│   │   │   └── ai
│   │   │       ├── AIServiceFactory.ts
│   │   │       ├── AnthropicService.ts
│   │   │       ├── BaseAIService.ts
│   │   │       ├── GeminiService.ts
│   │   │       ├── OpenAIService.ts
│   │   │       └── types.ts
│   │   ├── types
│   │   │   └── express.d.ts
│   │   └── utils
│   │       └── obfuscate.ts
│   └── tsconfig.json
├── frontend
│   ├── components.json
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── AIAssistant.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CardModal.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MarkdownViewer.tsx
│   │   │   ├── PRDTemplateManager.tsx
│   │   │   ├── ProjectModal.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Toast.tsx
│   │   ├── config
│   │   │   └── supabase.ts
│   │   ├── contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks
│   │   │   └── useAuth.ts
│   │   ├── index.css
│   │   ├── lib
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── Board.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── PRDTemplates.tsx
│   │   │   ├── ProjectDetails.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Settings.tsx
│   │   └── types
│   │       ├── board.ts
│   │       └── project.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── package-lock.json
└── package.json
```