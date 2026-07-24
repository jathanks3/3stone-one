# Database Schema

Postgres, accessed through Prisma. **This is now the real, live schema, not
a target** — `prisma/schema.prisma` is the source of truth and this document
describes it in the lighter-weight pseudo-syntax used throughout this doc
set; where they disagree, `schema.prisma` wins.

**Revision note (v3):** two new sections added per
[15-company-platform-vision.md](15-company-platform-vision.md) —
**Product / Edition** and **Customer Lifecycle** — both foundational per the
founder's explicit decision, not deferred features, specifically so neither
needs a future migration. A third new section, **Platform (3Stone AI
internal operations)**, adds every table the internal "3Stone AI" section
needs — all table-mapped with a `platform_` prefix so the boundary between
workspace-product data and internal-operator data is mechanical, not a
matter of remembering which tables are which. Everything through "White-label"
is otherwise unchanged from v2.

**Revision note (v2):** sections through "Reporting" are unchanged from v1.
Everything from "Sites" onward is new, added to support Finance,
Communications, Meetings, Knowledge Center, the expanded Client Portal,
multi-location/multi-business, white-label, marketplace, and global search.

Types are simplified for readability; `prisma/schema.prisma` has the full
Prisma syntax, including relation names, indexes, and enum definitions.

## Product / Edition — NEW, foundational

```
Product
  key (pk, e.g. "3stone_one", "bet_ai"), name, createdAt
  — 3Stone AI is a multi-product company (15-company-platform-vision.md);
    every current and future product is a row here, not a code branch.

Edition
  key (pk, e.g. "business", "student"), productKey (fk → Product), name,
  createdAt
  — editions of the same product (Business, Student, Employee, Healthcare,
    Nonprofit for 3Stone One) reuse architecture rather than being rebuilt;
    Industry Profile (below) is a labeling layer *within* the Business
    edition specifically, not a sibling concept to Edition.
```

Every `Workspace` defaults to `productKey: "3stone_one"`,
`editionKey: "business"` — today's single-tenant product is Edition
"Business" of Product "3Stone One," not a separate concept from either.

## Customer Lifecycle — NEW, foundational

```
CustomerLifecycleStage
  key (pk, e.g. "trial", "at_risk"), label, sortOrder, isTerminal (bool)
  — data, not a hardcoded enum — same reasoning already applied to industry
    pipeline stages (13-self-critique.md #1): adding a stage is a seed
    insert, never a migration. Seeded: lead, demo_scheduled, trial, active,
    power_user, at_risk, cancelled, former_customer.
```

`Workspace.lifecycleStageKey` (fk → `CustomerLifecycleStage`, defaults to
`"lead"`) is what Customer 360 and internal reporting read from.

## Tenancy & identity

```
Workspace
  id, name, slug, industryProfileKey (fk → IndustryProfile, nullable —
  only meaningful within the Business edition), productKey (fk → Product,
  default "3stone_one"), editionKey (fk → Edition, default "business"),
  lifecycleStageKey (fk → CustomerLifecycleStage, default "lead"), logoUrl,
  createdAt, plan (free | pro | enterprise — see 12-saas-roadmap.md)

User
  id, email, name, avatarUrl, passwordHash (nullable — magic link users
  have none), emailVerifiedAt (nullable — set once, by the real signup
  wizard's verify step), lastLoginAt (nullable — updated at every real,
  non-demo session creation; the founder's "Last login" field),
  sessionVersion (int, bumped on password change/reset — every session
  cookie embeds the version it was issued against; a mismatch means
  "revoked", see lib/session.ts), notificationPreferences (json,
  nullable — null means everything on), createdAt
  — global identity; a User is not workspace-scoped, WorkspaceMember is.

PasswordResetToken
  token (pk), userId (fk), expiresAt, usedAt (nullable), createdAt
  — same real single-use/expiring shape as EmailVerificationToken; the
    "password reset" flow's actual mechanism.

SecurityEvent
  id, userId (fk), type (login | login_failed | password_reset_requested |
  password_changed), ipAddress (nullable), userAgent (nullable), metadata
  (json, nullable), createdAt
  — a user's own account-security timeline (login history + security
    events); also what the login-attempt and password-reset-request rate
    limiters count against.

Invitation
  id, workspaceId (fk), email, roleId (fk → Role), token (unique),
  status (pending | accepted | revoked | expired), invitedByUserId (fk),
  expiresAt, acceptedAt (nullable), revokedAt (nullable), createdAt
  — a standing offer to join, not membership itself: accepting is what
    creates/activates the WorkspaceMember row. Deliberately separate from
    just creating a WorkspaceMember directly (the pre-invitation-model
    behavior), so an invitation can be resent or revoked without ever
    having touched membership.

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

## Platform (3Stone AI internal operations) — NEW

Every table below is table-mapped with a `platform_` prefix (see
`prisma/schema.prisma`'s `@@map`) — a mechanical, greppable boundary between
workspace-product data and internal-operator data, and the seam that would
let this section be extracted into its own service later, per
[15-company-platform-vision.md](15-company-platform-vision.md)'s modularity
requirement. None of it is reachable by a customer under any circumstance —
enforced in application code by a four-layer gate (middleware, section
layout, API, nav), never by anything in the schema alone.

```
StaffMembership
  id, userId (fk → User, unique — a User has at most one), role (founder |
  operations | support), status (active | revoked), grantedAt,
  grantedByUserId (fk → User, nullable), revokedAt (nullable)
  — orthogonal to WorkspaceMember; staff are not members of any customer
    workspace by virtue of being staff.

Subscription
  id, workspaceId (fk, unique), stripeCustomerId, stripeSubscriptionId,
  plan (free | pro | enterprise), status (trialing | active | past_due |
  canceled | paused), isFounderPricing (bool), priceOverrideCents
  (nullable), mrrCents, trialEndsAt (nullable), currentPeriodEnd
  (nullable), createdAt

PlatformInvoice
  id, workspaceId (fk), stripeInvoiceId, amountCents, status (draft | open
  | paid | void | uncollectible), dueDate (nullable), paidAt (nullable),
  createdAt
  — 3Stone AI billing the workspace for its 3Stone One subscription;
    distinct from that workspace's own Invoice (its AR to its own clients).

SupportTicket
  id, workspaceId (fk), requestedByEmail, subject, status (open | pending |
  resolved | closed), priority (low | normal | high | urgent),
  assignedStaffId (nullable), createdAt, resolvedAt (nullable)

SupportTicketMessage
  id, ticketId (fk), authorType (staff | customer), authorId (nullable),
  body, createdAt

FeatureFlag
  key (pk), label, description, defaultEnabled (bool), createdAt

WorkspaceFeatureOverride
  id, workspaceId (fk), flagKey (fk → FeatureFlag), enabled (bool)

PlatformAnnouncement
  id, title, body, audience (all | plan_tier | specific_workspaces),
  publishedAt (nullable), createdAt

PlatformAnnouncementTarget
  id, announcementId (fk), workspaceId (fk), viewedAt (nullable)
  — which workspaces an audience:"specific_workspaces" announcement
    targets, and once viewed.

PlatformAuditLogEntry
  id, staffUserId, action, targetWorkspaceId (nullable), targetEntityType
  (nullable), targetEntityId (nullable), metadata (json), createdAt
  — every staff action, cross-tenant — including every Open Workspace
    entry (15-company-platform-vision.md: "every entry is audited").

AiUsageLog
  id, workspaceId (fk), date, aiCallCount, tokensUsed, costCents

StorageUsageSnapshot
  id, workspaceId (fk), bytesUsed (bigint), snapshotAt

LegalAcceptance
  id, workspaceId (fk, nullable), userId (nullable), personId (fk,
  nullable), documentType (tos | privacy | saas_agreement | dpa),
  documentVersion, acceptedAt, ipAddress (nullable)

OnboardingStepDefinition
  key (pk), label, sortOrder
  — data, not an enum: the 15 real steps of the self-service onboarding
    charter (Account Created ... Active), seeded once, extendable without
    a migration.

WorkspaceOnboardingProgress
  id, workspaceId (fk), stepKey (fk → OnboardingStepDefinition),
  completedAt
  — one real row per completed step per workspace (unique on
    workspaceId+stepKey). The first 3 steps (account_created,
    email_verified, password_created) are derived from User fields
    instead of a row here — see onboardingProgressService.ts.

EmailVerificationToken
  token (pk), userId (fk), expiresAt, usedAt (nullable), createdAt
  — real, single-use, expiring (24h); the actual email send is stubbed
    (logged + shown on-screen) pending a verified sending domain.

SalesProspect
  id, name, email, businessName (nullable), stage (lead |
  discovery_scheduled | proposal_draft | proposal_sent | negotiation |
  won | lost), convertedWorkspaceId (fk, nullable), createdAt, updatedAt
  — prospects who are NOT customers yet; deliberately a separate concept
    from Workspace/onboarding (15-company-platform-vision.md /
    17-production-readiness-checklist.md's onboarding-revision section).
    A prospect that converts moves its stage to "won"; nothing yet wires
    that stage change to actually setting convertedWorkspaceId.

EmailDeliveryLog
  id, toAddress, template, provider, status (sent | delivered | bounced |
  failed), workspaceId (fk, nullable), sentAt
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
Workspace 1───1 IndustryProfile (by key, optional — Business edition only)
Workspace *───1 Product, Workspace *───1 Edition  (Product 1───* Edition)
Workspace *───1 CustomerLifecycleStage
Workspace 1───1 Subscription 1───* PlatformInvoice
Workspace 1───* SupportTicket 1───* SupportTicketMessage
Workspace 1───* WorkspaceFeatureOverride *───1 FeatureFlag
Workspace 1───* PlatformAnnouncementTarget *───1 PlatformAnnouncement
Workspace 1───* PlatformAuditLogEntry (target side) — staffUserId is a User, not workspace-scoped
User 1───1 StaffMembership
```

Every top-level entity carries `workspaceId` — the multi-tenancy
enforcement point described in [01-architecture.md](01-architecture.md#3-multi-tenancy-how-one-codebase-serves-many-companies).
