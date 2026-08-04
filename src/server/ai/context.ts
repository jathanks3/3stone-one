import { getAllowedModuleKeys } from "@/lib/editionModules";
import { listAllCalendarEvents } from "@/server/services/calendarService";
import { listProjects } from "@/server/services/projectService";
import { listNotes } from "@/server/services/noteService";
import { listMeetings } from "@/server/services/meetingService";
import { listDocuments } from "@/server/services/documentService";
import { listDeals, listOrganizations, listPeople as listCrmPeople } from "@/server/services/crmService";
import { listTimeOffRequests } from "@/server/services/timeOffService";
import { listGpaCourses } from "@/server/services/gpaService";
import { listJobApplications } from "@/server/services/jobApplicationService";
import { listKnowledgeArticles } from "@/server/services/knowledgeService";
import { listAllGrades } from "@/server/services/gradesService";
import { listCanvasCourseMaterials } from "@/server/services/canvasIntegrationService";
import { listInboxMessages } from "@/server/services/inboxService";
import { listDirectory } from "@/server/services/peopleService";
import { listActivity } from "@/server/services/activityService";
import { db } from "@/server/db";
import { integrationsForEdition } from "@/lib/integrationCatalog";
import { getRecentGoogleDriveFiles } from "@/server/services/googleIntegrationService";
import { listMondayBoards, listMondayItems } from "@/server/services/mondayIntegrationService";
import { listSlackChannels, listSlackMessages } from "@/server/services/slackIntegrationService";
import { listSalesforceAccounts, listSalesforceContacts, listSalesforceOpportunities } from "@/server/services/salesforceIntegrationService";

// Real, current data from this workspace, assembled fresh on every
// message so the assistant can actually answer "what's on my calendar"
// instead of always claiming it has no access. Bounded per section (not
// the whole database) so prompt size/cost stays predictable as a
// workspace's data grows - this is a snapshot for grounding, not a full
// export.
function allowed(keys: Set<string> | null, key: string): boolean {
  return keys === null || keys.has(key);
}

function fmtCalendarDate(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function buildWorkspaceContext(workspaceId: string, editionKey: string, userId: string): Promise<string> {
  const modules = getAllowedModuleKeys(editionKey);
  const sections: string[] = [];
  const now = new Date();
  sections.push(`Today is ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`);
  const integrationOptions = integrationsForEdition(editionKey);
  if (integrationOptions.length) {
    sections.push(
      `Integration options for this edition (respect readiness; never claim an unfinished connector is live):\n${integrationOptions
        .map((item) => `- ${item.name} [${item.readiness}] → ${item.destinations.map((destination) => destination.label).join(", ")}`)
        .join("\n")}`
    );
  }

  const tasks: Promise<void>[] = [];

  if (allowed(modules, "calendar")) {
    tasks.push(
      listAllCalendarEvents(workspaceId).then((events) => {
        const upcoming = events
          .filter((e) => e.date >= now.toISOString().slice(0, 10))
          .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
          .slice(0, 40);
        if (!upcoming.length) return;
        const lines = upcoming.map((e) => {
          const when = e.allDay ? "all day" : fmtTime(e.time);
          const src = e.source === "google" ? " [synced from Google Calendar]" : e.source === "outlook" ? " [synced from Outlook]" : "";
          return `- ${fmtCalendarDate(e.date)}, ${when}: ${e.title}${src}`;
        });
        sections.push(`Upcoming calendar events:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "projects")) {
    tasks.push(
      listProjects(workspaceId).then((projects) => {
        if (!projects.length) return;
        const lines = projects.slice(0, 15).map((p) => {
          const openTasks = p.tasks.filter((t) => t.status !== "done").slice(0, 6);
          const taskLines = openTasks.length
            ? openTasks.map((t) => `    - ${t.title}${t.dueDate ? ` (due ${fmtDate(t.dueDate)})` : ""}`).join("\n")
            : "    - (no open tasks)";
          return `- ${p.name} [${p.statusKey}]${p.dueDate ? `, due ${fmtDate(p.dueDate)}` : ""}\n${taskLines}`;
        });
        sections.push(`Projects and open tasks:\n${lines.join("\n")}`);
      })
    );
    tasks.push(
      Promise.all([listMondayBoards(workspaceId), listMondayItems(workspaceId)]).then(([boards, items]) => {
        if (!boards.length) return;
        sections.push(`Monday.com boards and items (read-only):\n${boards.slice(0, 30).map((board) => {
          const boardItems = items.filter((item) => item.boardId === board.id).slice(0, 20).map((item) => `    - ${item.name}${item.status ? ` [${item.status}]` : ""}${item.dueDate ? ` due ${item.dueDate}` : ""}`).join("\n");
          return `- ${board.name}${board.workspaceName ? ` (${board.workspaceName})` : ""}${boardItems ? `\n${boardItems}` : ""}`;
        }).join("\n")}`);
      }).catch(() => undefined)
    );
  }

  if (allowed(modules, "notes")) {
    tasks.push(
      listNotes(workspaceId).then((notes) => {
        if (!notes.length) return;
        const lines = notes.slice(0, 10).map((n) => `- ${n.title}: ${n.body.slice(0, 140).replace(/\s+/g, " ")}`);
        sections.push(`Notes:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "meetings")) {
    tasks.push(
      listMeetings(workspaceId).then((meetings) => {
        if (!meetings.length) return;
        const relevant = meetings.filter((m) => !m.isPast || m.scheduledAt.getTime() > now.getTime() - 7 * 86_400_000).slice(0, 10);
        if (!relevant.length) return;
        const lines = relevant.map((m) => {
          const openActions = m.actionItems.filter((a) => a.status !== "done").map((a) => a.title);
          return `- ${m.title} — ${fmtDate(m.scheduledAt)}${m.isPast ? " (past)" : ""}${openActions.length ? `; open action items: ${openActions.join(", ")}` : ""}`;
        });
        sections.push(`Meetings:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "documents")) {
    tasks.push(
      Promise.all([listDocuments(workspaceId), listCanvasCourseMaterials(workspaceId).catch(() => []), getRecentGoogleDriveFiles(workspaceId, 20).catch(() => [])]).then(([docs, canvasMaterials, googleDriveFiles]) => {
        const lines: string[] = [];
        if (docs.length) lines.push(...docs.slice(0, 20).map((d) => `- ${d.name} (${d.mimeType}, ${d.sizeBytes} bytes) [workspace upload]`));
        if (canvasMaterials.length) {
          lines.push(
            ...canvasMaterials.slice(0, 20).map((m) => `- ${m.displayName} (${m.courseName}) [from Canvas]`)
          );
        }
        if (googleDriveFiles.length) lines.push(...googleDriveFiles.map((file) => `- ${file.name} (${file.mimeType}) [user-selected Google Drive file]`));
        if (!lines.length) return;
        sections.push(`Documents and course materials available. Metadata is included; if the file body is not present in this snapshot, ask the user to open it or paste the relevant text rather than inventing its contents:\n${lines.join("\n")}`);
      })
    );
  }

  // "emails" (Student edition's old key, still Business's via its
  // unrestricted module list) or "communications" (Workspace/Student's
  // real key as of editionModules.ts's Student conversion) - both read
  // the same Outlook inbox via listInboxMessages below, this
  // just needs either module to actually be reachable for this workspace.
  if (allowed(modules, "emails") || allowed(modules, "communications")) {
    tasks.push(
      listInboxMessages(workspaceId, 8).then((messages) => {
        if (!messages.length) return;
        // Preview text only (same cost profile as Notes/Documents above) -
        // enough for "add that meeting to my calendar" or "save this as a
        // note" to work directly from what's already here. Full body and
        // attachments are one click away on the Emails page itself rather
        // than fetched for every chat message.
        const lines = messages.map((m) => `- "${m.subject}" from ${m.from} (${m.receivedAt}): ${m.preview.slice(0, 140).replace(/\s+/g, " ")}`);
        sections.push(`Recent emails (subject/sender/preview only):\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "grades")) {
    tasks.push(
      listAllGrades(workspaceId, userId).then((grades) => {
        if (!grades.length) return;
        const lines = grades.slice(0, 30).map((g) => `- ${g.courseName}: ${g.currentGrade ?? (g.currentScore !== null ? `${Math.round(g.currentScore)}%` : "not yet computed")}`);
        sections.push(`Grades (from Canvas):\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "crm")) {
    tasks.push(
      Promise.all([listDeals(workspaceId), listOrganizations(workspaceId), listCrmPeople(workspaceId)]).then(([deals, orgs, people]) => {
        if (deals.length) {
          const lines = deals.slice(0, 15).map((d) => `- ${d.title} ($${d.value.toLocaleString()}) [${d.stageKey}]${d.organizationName ? ` — ${d.organizationName}` : ""}`);
          sections.push(`CRM deals:\n${lines.join("\n")}`);
        }
        if (orgs.length || people.length) {
          const orgLines = orgs.slice(0, 10).map((o) => `- ${o.name}`);
          const peopleLines = people.slice(0, 10).map((p) => `- ${p.firstName} ${p.lastName}${p.organizationName ? ` (${p.organizationName})` : ""}`);
          sections.push(
            [orgLines.length ? `CRM organizations:\n${orgLines.join("\n")}` : "", peopleLines.length ? `CRM contacts:\n${peopleLines.join("\n")}` : ""]
              .filter(Boolean)
              .join("\n\n")
          );
        }
      })
    );
    tasks.push(
      Promise.all([listSalesforceAccounts(workspaceId), listSalesforceContacts(workspaceId), listSalesforceOpportunities(workspaceId)]).then(([accounts, contacts, opportunities]) => {
        if (!accounts.length && !contacts.length && !opportunities.length) return;
        sections.push(`Salesforce CRM (read-only):\n${accounts.slice(0, 20).map((row) => `- Account: ${row.Name}`).concat(contacts.slice(0, 20).map((row) => `- Contact: ${row.Name}${row.Account?.Name ? ` at ${row.Account.Name}` : ""}`), opportunities.slice(0, 20).map((row) => `- Opportunity: ${row.Name} [${row.StageName}]${row.Amount != null ? ` $${row.Amount}` : ""}`)).join("\n")}`);
      }).catch(() => undefined)
    );
  }

  if (allowed(modules, "people")) {
    tasks.push(
      listDirectory(workspaceId).then((people) => {
        if (!people.length) return;
        const lines = people.slice(0, 30).map((person) => `- ${person.name} — ${person.roleName}${person.departmentName ? `, ${person.departmentName}` : ""}`);
        sections.push(`People directory:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "activity")) {
    tasks.push(
      listActivity(workspaceId, 20).then((entries) => {
        if (!entries.length) return;
        const lines = entries.map((entry) => `- ${entry.actorName ?? "System"}: ${entry.action} ${entry.entityType} (${fmtDate(entry.createdAt)})`);
        sections.push(`Recent workspace activity:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "integrations")) {
    tasks.push(
      db.integration.findMany({ where: { workspaceId }, orderBy: { provider: "asc" } }).then((integrations) => {
        if (!integrations.length) return;
        const lines = integrations.map((integration) => `- ${integration.provider}: ${integration.status}`);
        sections.push(`Connected app status:\n${lines.join("\n")}`);
      })
    );
    tasks.push(
      listSlackChannels(workspaceId).then(async (channels) => {
        const selected = channels.slice(0, 10);
        const messages = (await Promise.all(selected.map((channel) => listSlackMessages(workspaceId, channel.id).catch(() => [])))).flat().slice(0, 40);
        if (!messages.length) return;
        sections.push(`Recent Slack messages (read-only unless the user explicitly asks to send):\n${messages.map((message) => `- #${selected.find((channel) => channel.id === message.channelId)?.name ?? "channel"} ${message.author}: ${message.body.slice(0, 220).replace(/\\s+/g, " ")}`).join("\n")}`);
      }).catch(() => undefined)
    );
  }

  if (allowed(modules, "time-off")) {
    tasks.push(
      listTimeOffRequests(workspaceId).then((requests) => {
        const relevant = requests.filter((r) => r.status === "pending" || r.endDate.getTime() > now.getTime()).slice(0, 10);
        if (!relevant.length) return;
        const lines = relevant.map((r) => `- ${r.requesterName}: ${r.type} ${fmtDate(r.startDate)}–${fmtDate(r.endDate)} [${r.status}]`);
        sections.push(`Time off requests:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "gpa")) {
    tasks.push(
      listGpaCourses(workspaceId, userId).then((courses) => {
        if (!courses.length) return;
        const lines = courses.slice(0, 30).map((c) => `- ${c.name} (${c.credits} credits): ${c.grade}`);
        sections.push(`GPA / courses:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "job-tracker")) {
    tasks.push(
      listJobApplications(workspaceId, userId).then((apps) => {
        if (!apps.length) return;
        const lines = apps.slice(0, 15).map((a) => `- ${a.company} — ${a.role} [${a.status}]`);
        sections.push(`Internship/job applications:\n${lines.join("\n")}`);
      })
    );
  }

  if (allowed(modules, "knowledge")) {
    tasks.push(
      listKnowledgeArticles(workspaceId).then((articles) => {
        if (!articles.length) return;
        const lines = articles.slice(0, 10).map((a) => `- ${a.title}`);
        sections.push(`Knowledge Center articles:\n${lines.join("\n")}`);
      })
    );
  }

  await Promise.all(tasks);
  return sections.filter(Boolean).join("\n\n");
}
