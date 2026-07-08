# API Architecture

**Revision note (v2):** the REST-style, versioned, envelope-response
approach is unchanged. This revision adds routes for the new modules, plus
three new *kinds* of route this design didn't need before: one shared AI
endpoint, one shared search endpoint, and a separate Person-authenticated
route group for the Client Portal.

## Route groups (additions in bold)

```
/api/v1/crm/...
/api/v1/projects/...
/api/v1/people/...
/api/v1/documents/...
/api/v1/automation/...
/api/v1/integrations/...
/api/v1/workspaces/...
/api/v1/**finance**/overview | invoices | expenses | purchase-requests | budgets
/api/v1/**communications**/inbox | chat | calls
/api/v1/**meetings**
/api/v1/**knowledge**
/api/v1/**analytics**/reports              (Report Builder)
/api/v1/**approvals**                      (generic — see below)
/api/v1/**search**                          (one endpoint, every entity type)
/api/v1/**ai**/run                          (one endpoint, every capability)
/api/v1/**portfolio**/summary
/api/v1/**client-portal**/...                (separate auth, see below)
```

## The shared AI endpoint

```
POST /api/v1/ai/run
{ "capabilityKey": "crm.summarizeHistory", "entityId": "lead_123" }
```

```ts
export async function POST(req: Request) {
  const { user, workspace } = await requireSession(req);
  const { capabilityKey, entityId } = await parseBody(req, RunCapabilitySchema);
  const capability = aiRegistry.get(capabilityKey);
  requirePermission(user, capability.module, 'view');
  const output = await capability.run({ workspaceId: workspace.id, entityId }, ctx);
  await aiActionLogService.record({ workspaceId: workspace.id, capabilityKey, entityId, output, invokedById: user.id });
  return respond({ data: output });
}
```

Every module's "AI button" calls this same route with a different
`capabilityKey` — there is no `/api/v1/crm/ai/summarize` and a separate
`/api/v1/projects/ai/estimate`; adding a sixth module's AI feature later
means registering a new capability, not building a new route.

## The shared search endpoint

```
GET /api/v1/search?q=acme
→ { data: { leads: [...], projects: [...], invoices: [...], meetings: [...], ... } }
```

Queries `SearchIndexEntry` (or the in-memory mock equivalent) once, groups
results by `entityType` in the response — the `<SearchPalette/>` component
makes one request per keystroke (debounced), not eleven.

## The generic approvals endpoint

```
GET  /api/v1/approvals?status=pending          (mine to decide)
POST /api/v1/approvals/:id/decide  { decision: "approved" | "rejected" }
```

One route, regardless of whether the underlying `ApprovalRequest.entityType`
is `project_milestone` or `purchase_request` — the route handler resolves
and updates the underlying entity generically; it doesn't have a
`project-milestones` branch and a `purchase-requests` branch inside it.

## Client Portal: a separate, Person-authenticated route group

Every route above resolves a session to a `User` + `Workspace`. Client
Portal routes resolve a session to a **`Person`** (with `personType:
"client"`) instead — a structurally different identity, not a `User` with
a restricted role. This is deliberate: a client should never accidentally
end up one permission tweak away from seeing internal-only screens, because
the two route groups don't share a session-resolution code path at all.

```
GET  /api/v1/client-portal/projects        (only ones shared with this Person)
GET  /api/v1/client-portal/documents
POST /api/v1/client-portal/documents        (client upload)
GET  /api/v1/client-portal/invoices
POST /api/v1/client-portal/invoices/:id/pay  (Stripe Payment Intent)
GET  /api/v1/client-portal/messages
POST /api/v1/client-portal/messages
```

## Everything else (unchanged from v1)

Versioning from `v1`, the `{ data, error, meta }` envelope, "route handlers
only ever call the service layer," and the API-key bearer-token auth path
for the future public API all carry forward unchanged — see the original
reasoning below.

We chose plain REST-style handlers over tRPC or GraphQL deliberately: this
is a small team, and a REST API is something any future engineer,
contractor, or the founder reading a network tab can understand
immediately. Steps 1 (resolve session), 2 (check permission), and 5 (shape
response) are shared helpers, never copy-pasted per route.
