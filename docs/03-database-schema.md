# Database Schema

Postgres, accessed through Prisma. Written as the target *real* schema now,
even though early phases run on mock data in memory, so the mock service
layer's shapes match the real tables exactly.

**Revision note (v2):** sections through "Reporting" are unchanged from v1.
Everything from "Sites" onward is new, added to support Finance,
Communications, Meetings, Knowledge Center, the expanded Client Portal,
multi-location/multi-business, white-label, marketplace, and global search.

Types are simplified for readability; the actual `schema.prisma` will have
the full Prisma syntax.

## Tenancy & identity

```
Workspace
  id, name, slug, industryProfileKey (fk → IndustryProfile), logoUrl,
  createdAt, plan (free | pro | enterprise — see 12-saas-roadmap.md)

User
  id, email, name, avatarUrl, passwordHash (nullable — magic link users
  have none), createdAt
  — global identity; a User is not workspace-scoped, WorkspaceMember is.

WorkspaceMember
  id, workspaceId (fk), userId (fk), roleId (fk → Role), departmentId (fk,
  nullable), siteId (fk, nullable — see "Sites" below), status (active |
  invited | suspended), joinedAt

IndustryProfile
  key (pk, e.g. "restaurant"), label, terminologyMap (json),
  moduleVisibility (json), customFieldSchemas (json), pipelineStages (json)
```

## Roles & permissions — see [05-roles-and-permissions.md](05-roles-and-permissions.md)

```
Role
  id, workspaceId (fk, nullable — null = system role), name, isSystemRole (bool)

Permission
  id, roleId (fk), module (enum), action (view|create|edit|delete|approve|
  export|manage_settings), scope (all | department | own | shared)
```

## CRM

```
Organization
  id, workspaceId (fk), name, domain, industry, ownerId (fk → User),
  customFields (json), createdAt

Person                                # unifies Lead / Customer / Contact / Client
  id, workspaceId (fk), organizationId (fk, nullable), personType
  (lead | customer | contact | employee | client), firstName, lastName,
  email, phone, stage (fk → pipeline stage, nullable), ownerId (fk → User),
  customFields (json), createdAt
  — a Client-portal login (section below) authenticates as a Person with
  personType "client", not as a User; Users are internal team members.

Deal
  id, workspaceId (fk), personId (fk), organizationId (fk, nullable),
  title, value, stageKey, ownerId (fk → User), expectedCloseDate,
  status (open | won | lost), createdAt
```

## Projects & tasks (relabeled per industry)

```
Project
  id, workspaceId (fk), siteId (fk, nullable), name, description,
  statusKey (fk → industry profile's pipelineStages), organizationId (fk,
  nullable), ownerId (fk → User), startDate, dueDate, customFields (json),
  createdAt

ProjectMilestone                      # NEW — what a client approves
  id, workspaceId (fk), projectId (fk), title, dueDate,
  status (pending | in_progress | approved | rejected),
  approvalRequestId (fk → ApprovalRequest, nullable), createdAt

Task
  id, workspaceId (fk), projectId (fk, nullable), title, description,
  assigneeId (fk → User), status (todo | in_progress | done), dueDate,
  createdAt
```

## People / employee portal

```
Department
  id, workspaceId (fk), name, leadUserId (fk → User, nullable)

Announcement
  id, workspaceId (fk), authorId (fk → User), title, body,
  departmentId (fk, nullable), publishedAt

Document
  id, workspaceId (fk), name, storageKey, mimeType, sizeBytes,
  uploadedById (fk → User, nullable), uploadedByPersonId (fk → Person,
  nullable — set when a client uploads via the Client Portal; exactly one
  of uploadedById / uploadedByPersonId is set), projectId (fk, nullable),
  organizationId (fk, nullable), visibility (internal | shared_with_client),
  createdAt
```

## Notifications, activity, search

```
Notification
  id, workspaceId (fk), userId (fk), type, payload (json),
  readAt (nullable), createdAt

ActivityLogEntry
  id, workspaceId (fk), actorId (fk → User), action, entityType, entityId,
  metadata (json), createdAt

SearchIndexEntry                      # NEW — backs Global Search, see 01-architecture.md §6
  id, workspaceId (fk), entityType, entityId, title, snippet,
  searchVector (tsvector, GIN-indexed), updatedAt
  — upserted/removed by every service on every create/update/delete;
    never populated by a separate batch job
```

## Automation

```
WorkflowDefinition
  id, workspaceId (fk), name, isActive, graph (json), createdById (fk → User), createdAt

WorkflowRun
  id, workflowDefinitionId (fk), triggeredAt, status (running|success|failed), log (json)
```

## Integrations

```
Integration
  id, workspaceId (fk), provider (quickbooks | stripe | slack | email |
  calendar | ...), status (not_connected|connected|error), connectedAt,
  config (json)

ApiKey
  id, workspaceId (fk), label, hashedKey, createdById (fk → User),
  lastUsedAt, revokedAt (nullable)
```

## AI (assistant + per-module capabilities)

```
AiConversation
  id, workspaceId (fk), userId (fk), title, createdAt

AiMessage
  id, conversationId (fk), role (user|assistant), content, createdAt

AiActionLog                           # NEW — every AI capability invocation, any module
  id, workspaceId (fk), capabilityKey (e.g. "crm.summarizeHistory"),
  entityType, entityId, input (json), output (json),
  invokedById (fk → User), createdAt
  — also feeds Global Search's "AI Knowledge" results and the Activity Log
```

## Reporting

```
Report / ReportDefinition             # extended
  id, workspaceId (fk), name, type, parameters (json),
  config (json — columns, filters, groupBy, chartType: the Report
  Builder's saved output), generatedAt, createdById (fk → User)
```

## Sites (multi-location) — NEW

```
Site
  id, workspaceId (fk), name, address, type (office|restaurant|warehouse|
  job_site|clinic|other), customFields (json), createdAt
  — deliberately a different entity from a restaurant's "Location" label
    for Project; see 01-architecture.md §4 for why the collision is
    resolved this way.
```

## Approvals — NEW

```
ApprovalRequest
  id, workspaceId (fk), entityType (project_milestone|purchase_request),
  entityId, requestedById (fk → User, nullable), requestedByPersonId (fk →
  Person, nullable), approverId (fk → User), status (pending|approved|
  rejected), decidedAt, notes, createdAt
```

## Finance — NEW

```
Vendor
  id, workspaceId (fk), name, contactInfo (json), createdAt

Expense
  id, workspaceId (fk), vendorId (fk, nullable), amount, category, date,
  source (manual|quickbooks_sync), createdAt

Invoice
  id, workspaceId (fk), organizationId (fk, nullable), personId (fk,
  nullable — bill-to), amount, status (draft|sent|paid|overdue|void),
  dueDate, source (manual|quickbooks_sync), stripePaymentIntentId
  (nullable), createdAt

Payment
  id, invoiceId (fk), amount, provider (stripe), status, paidAt

PurchaseRequest
  id, workspaceId (fk), requestedById (fk → User), vendorId (fk, nullable),
  amount, justification, approvalRequestId (fk → ApprovalRequest), createdAt

Budget
  id, workspaceId (fk), departmentId (fk, nullable), projectId (fk,
  nullable), period, amount, createdAt
  — "spent" is computed from Expense/Task-linked cost data, not stored
```

## Communications Center — NEW

```
EmailMessage
  id, workspaceId (fk), threadId, fromAddress, toAddresses (json), subject,
  body, personId (fk, nullable), organizationId (fk, nullable), sentAt

ChatChannel
  id, workspaceId (fk), name, departmentId (fk, nullable), isDirect (bool),
  isClientChannel (bool — the Client Portal's "message the team" thread)

ChatMessage
  id, channelId (fk), authorId (fk → User, nullable), authorPersonId (fk →
  Person, nullable — client-sent messages), body, createdAt

CallNote
  id, workspaceId (fk), personId (fk, nullable), organizationId (fk,
  nullable), authorId (fk → User), summary, occurredAt
```

## Meetings — NEW

```
Meeting
  id, workspaceId (fk), title, scheduledAt, attendeeIds (json),
  agenda, calendarEventId (nullable — external calendar sync), createdAt

MeetingActionItem
  id, meetingId (fk), title, assigneeId (fk → User), dueDate,
  status (todo|in_progress|done)

Decision
  id, meetingId (fk), summary, decidedAt
```

## Knowledge Center — NEW

```
KnowledgeArticle
  id, workspaceId (fk), title, body, category (policy|training|process|
  sop|video), videoUrl (nullable), authorId (fk → User), updatedAt
```

## Marketplace — NEW

```
MarketplaceListing
  key (pk), type (module|industry_template|automation_template|ai_agent),
  label, description

WorkspaceInstallation
  workspaceId (fk), listingKey (fk), installedAt, config (json)
```

## White-label — NEW

```
Branding
  workspaceId (fk, unique — one per workspace), logoUrl, faviconUrl,
  primaryColor, customDomain (nullable), domainVerifiedAt (nullable)
```

## Entity-relationship summary

```
Workspace 1───* WorkspaceMember *───1 User
Workspace 1───* Site
Workspace 1───* Organization 1───* Person
Workspace 1───* Project *───1 Organization (optional), *───1 Site (optional)
Project 1───* Task
Project 1───* ProjectMilestone 1───1 ApprovalRequest
Workspace 1───* PurchaseRequest 1───1 ApprovalRequest
Workspace 1───* Invoice 1───* Payment
Workspace 1───* Expense *───1 Vendor
Workspace 1───* ChatChannel 1───* ChatMessage
Workspace 1───* Meeting 1───* MeetingActionItem, 1───* Decision
Workspace 1───* KnowledgeArticle
Workspace 1───1 Branding
Workspace 1───* WorkspaceInstallation *───1 MarketplaceListing
Workspace 1───* SearchIndexEntry  (written by every service above)
Workspace 1───* AiActionLog       (written by every AI capability)
Workspace 1───1 IndustryProfile (by key)
```

Every top-level entity carries `workspaceId` — the multi-tenancy
enforcement point described in [01-architecture.md](01-architecture.md#3-multi-tenancy-how-one-codebase-serves-many-companies).
