# 3Stone One integration launch audit

Updated: 2026-08-04

This file distinguishes working connector code from catalog plans and external approval. A connector is not launch-ready merely because a card exists.

## Connectable paths

| Connector | Connect | Data destination | Refresh/reuse | Disconnect | Remaining external gate |
| --- | --- | --- | --- | --- | --- |
| Microsoft 365 / Teams | OAuth | Outlook Mail, Calendar, Meetings, OneDrive, Knowledge | Refresh-token rotation | Local token removal | Microsoft publisher verification; existing Student users must reconnect for Calendar scope |
| Google Workspace | OAuth, Business only | Calendar, user-authored Gmail send, selected Drive files, Knowledge, Sheets export | Refresh token | Google revoke plus local removal | Google sensitive-scope verification |
| Slack | OAuth | Communications channels/messages and send | Durable bot token | Slack revoke plus local removal | Slack app credentials and installation in the customer's workspace |
| Canvas | School URL plus personal token | Calendar assignments, grades/GPA, Documents, Knowledge | Durable customer token | Local removal | Some schools disable personal API tokens |
| Wild Apricot | Customer API key | CRM contacts | Fresh short-lived API token per sync | Local removal | Customer must create an API key |
| Basecamp | OAuth | Projects | Refresh-token rotation | Local removal | Founder must register the OAuth app and configure credentials |
| OpenAI API | Customer API key | 3Stone AI provider routing | Key reused while connected | Local removal | Customer API billing must be enabled |
| Anthropic API | Customer API key | 3Stone AI provider routing | Key reused while connected | Local removal | Customer API billing must be enabled |

The Integrations page now probes connected Microsoft, Google, Slack, Canvas, Wild Apricot, and Basecamp accounts. A stored token that can no longer read its destination shows as needing attention instead of healthy.

## Not connectable yet

These catalog entries do not have a customer connect/callback/data-sync path in this repository and must not be described as usable tomorrow:

| Connector | Current honest state |
| --- | --- |
| Zoom | Manual HTTPS Zoom links can be attached to a 3Stone meeting; Zoom OAuth is not implemented |
| QuickBooks Online | Planned; Intuit app and accounting sync are not implemented |
| Toast POS | Vendor approval and connector implementation required |
| Square POS | Planned; OAuth and transaction/catalog sync are not implemented |
| Stripe customer data | Planned and separate from 3Stone billing; customer OAuth/read sync is not implemented |
| Calendly | Planned; OAuth/webhook sync is not implemented |
| Dropbox Business | Planned; file picker/OAuth and preview are not implemented |
| Jobber | Planned; OAuth and customer/job sync are not implemented |
| Housecall Pro | Planned; partner access and sync are not implemented |
| ServiceTitan | Vendor approval and connector implementation required |
| HubSpot | Planned; OAuth and CRM sync are not implemented |
| Salesforce | Planned; OAuth and CRM sync are not implemented |
| Mailchimp | Planned; OAuth/API audience sync is not implemented |
| DocuSign | Planned; OAuth and envelope-status sync are not implemented |
| Dropbox Sign | Planned; OAuth and signature-status sync are not implemented |
| Monday.com | Planned; OAuth and board sync are not implemented |
| Asana | Planned; OAuth and project/task sync are not implemented |
| Notion | Planned; OAuth and page/database sync are not implemented |
| Acuity Scheduling | Planned; OAuth and appointment sync are not implemented |
| Paychex Flex | Vendor approval and connector implementation required |
| LinkedIn Jobs | Link tracking only; LinkedIn does not provide a personal application-history connection here |
| Handshake | Institution/vendor approval and connector implementation required |
| 12twenty Law Careers | Institution-issued API access and connector implementation required |

## Launch rule

Only the connectable paths above may show a Connect control. Planned and approval-gated entries may show their destination and blocker, but must remain labeled `Planned — not connectable yet` or `Vendor access required` until callback, API read/write as applicable, refresh/reuse, disconnect, destination population, and failure-state tests all pass.
