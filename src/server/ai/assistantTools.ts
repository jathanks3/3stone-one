import type { AiTool, AiToolExecutor } from "./aiProvider";
import { getAllowedModuleKeys } from "@/lib/editionModules";
import { createNote, deleteNote } from "@/server/services/noteService";
import { createProject, createTask, deleteProject, deleteTask } from "@/server/services/projectService";
import { createCalendarEvent, deleteCalendarEvent } from "@/server/services/calendarService";
import { createGpaCourse, deleteGpaCourse, type DisplayLetterGrade } from "@/server/services/gpaService";
import { createJobApplication, deleteJobApplication } from "@/server/services/jobApplicationService";
import { createTimeOffRequest, deleteTimeOffRequest } from "@/server/services/timeOffService";
import { createOrganization, createPerson, deleteDeal, deleteOrganization, deletePerson } from "@/server/services/crmService";
import { createKnowledgeArticle, deleteKnowledgeArticle } from "@/server/services/knowledgeService";
import { createMeeting, deleteMeeting } from "@/server/services/meetingService";
import { deleteDocument } from "@/server/services/documentService";
import { db } from "@/server/db";
import type { TimeOffType, PersonType, KnowledgeCategory, IndustryTerms } from "@/types";

// The assistant's real creation tools - each maps to one module's already
// real create function (see api/ai/assistant/route.ts, which builds the
// system prompt/context this reasons over). Gated per edition by the
// same getAllowedModuleKeys used to build that context, so a Student
// session is never offered create_time_off_request and so on. This is a
// bounded, real set of tools for the modules that make sense for an
// assistant to write to directly - not Finance/Inventory/People (HR-
// sensitive) or anything a bespoke workflow already exists for - not the
// general AiCapability registry CLAUDE.md still describes as aspirational.
const TOOL_DEFINITIONS: { moduleKey: string; tool: AiTool }[] = [
  {
    moduleKey: "notes",
    tool: {
      name: "create_note",
      description:
        "Save a real note to the user's Notes section. Only call this when the user clearly asks you to save/write/remember something as a note - never for an ordinary conversational reply.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "A short, clear title for the note." },
          body: { type: "string", description: "The note's full content, in the user's own words where possible." },
        },
        required: ["title", "body"],
      },
    },
  },
  {
    moduleKey: "projects",
    tool: {
      name: "create_project",
      description: "Create a real project. Only call this when the user clearly asks you to create/start/add a new project.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", description: "ISO date YYYY-MM-DD, only if the user gave one." },
        },
        required: ["name"],
      },
    },
  },
  {
    moduleKey: "calendar",
    tool: {
      name: "create_calendar_event",
      description: "Add a real event to the user's calendar. Only call this when they clearly ask you to schedule or add something.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string", description: "ISO date YYYY-MM-DD." },
          time: { type: "string", description: "24-hour HH:MM." },
        },
        required: ["title", "date", "time"],
      },
    },
  },
  {
    moduleKey: "gpa",
    tool: {
      name: "create_gpa_course",
      description: "Add a real course and grade to the user's GPA Calculator. Only call this when they clearly give you a course name, credits, and grade.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          credits: { type: "number" },
          grade: { type: "string", enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] },
        },
        required: ["name", "credits", "grade"],
      },
    },
  },
  {
    moduleKey: "job-tracker",
    tool: {
      name: "create_job_application",
      description: "Add a real internship/job application to the user's tracker. Only call this when they clearly ask you to save or track one.",
      input_schema: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          notes: { type: "string" },
        },
        required: ["company", "role"],
      },
    },
  },
  {
    moduleKey: "time-off",
    tool: {
      name: "create_time_off_request",
      description: "Submit a real time-off request for approval. Only call this when the user clearly asks you to request time off.",
      input_schema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["vacation", "sick", "personal"] },
          startDate: { type: "string", description: "ISO date YYYY-MM-DD." },
          endDate: { type: "string", description: "ISO date YYYY-MM-DD." },
          notes: { type: "string" },
        },
        required: ["type", "startDate", "endDate"],
      },
    },
  },
  {
    moduleKey: "crm",
    tool: {
      name: "create_crm_contact",
      description: "Add a real contact to the CRM. Only call this when the user clearly asks you to add or save a new lead, customer, or contact.",
      input_schema: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          personType: { type: "string", enum: ["lead", "customer", "contact"] },
        },
        required: ["firstName", "lastName", "personType"],
      },
    },
  },
  {
    moduleKey: "knowledge",
    tool: {
      name: "create_knowledge_article",
      description: "Save a real article to the Knowledge Center. Only call this when the user clearly asks you to document or save something as a knowledge article.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          category: { type: "string", enum: ["policy", "training", "process", "sop", "video"] },
        },
        required: ["title", "body"],
      },
    },
  },
  {
    moduleKey: "projects",
    tool: {
      name: "create_task",
      description: "Add a task to one exact existing project/assignment. Use only when the user explicitly asks and identifies the parent project/assignment.",
      input_schema: { type: "object", properties: { project: { type: "string" }, title: { type: "string" } }, required: ["project", "title"] },
    },
  },
  {
    moduleKey: "meetings",
    tool: {
      name: "create_meeting",
      description: "Create a native 3Stone meeting. Use only when the user explicitly asks and supplies a title plus date and time.",
      input_schema: {
        type: "object",
        properties: { title: { type: "string" }, scheduledAt: { type: "string", description: "ISO date-time." }, agenda: { type: "string" }, attendees: { type: "array", items: { type: "string" } } },
        required: ["title", "scheduledAt"],
      },
    },
  },
  {
    moduleKey: "crm",
    tool: {
      name: "create_crm_organization",
      description: "Create a real CRM organization/company when the user explicitly asks.",
      input_schema: { type: "object", properties: { name: { type: "string" }, domain: { type: "string" }, industry: { type: "string" } }, required: ["name"] },
    },
  },
  ...[
    ["notes", "delete_note", "Delete one exact local note."],
    ["projects", "delete_project", "Delete one exact local project/assignment and its tasks."],
    ["projects", "delete_task", "Delete one exact local task."],
    ["calendar", "delete_calendar_event", "Delete one exact personal/local calendar event. Never delete Canvas, Google, meeting, task, or project timeline items."],
    ["gpa", "delete_gpa_course", "Delete one exact manually stored GPA course."],
    ["job-tracker", "delete_job_application", "Delete one exact job or internship application owned by this user."],
    ["time-off", "delete_time_off_request", "Withdraw one exact time-off request, subject to normal ownership/manager permissions."],
    ["crm", "delete_crm_contact", "Delete one exact local CRM contact."],
    ["crm", "delete_crm_organization", "Delete one exact local CRM organization."],
    ["crm", "delete_crm_deal", "Delete one exact local CRM deal."],
    ["knowledge", "delete_knowledge_article", "Delete one exact local Knowledge Center article."],
    ["meetings", "delete_meeting", "Delete one exact native 3Stone meeting. Never delete a synced Outlook or Teams meeting."],
    ["documents", "delete_document", "Delete one exact uploaded 3Stone document and its stored file. Never delete provider-owned Canvas, Google Drive, or OneDrive files."],
  ].map(([moduleKey, name, action]) => ({
    moduleKey,
    tool: {
      name,
      description: `${action} Destructive: call only when the user's newest message explicitly says delete/remove and names the exact item. If the target is ambiguous, do not call this tool.`,
      input_schema: { type: "object", properties: { target: { type: "string", description: "Exact visible item name/title." } }, required: ["target"] },
    } satisfies AiTool,
  })),
];

// create_project and create_crm_contact read generic "project"/"customer"
// in their static descriptions above - swapped here for this workspace's
// real terms (Student's Assignment/Contact, etc.) so the tool's own
// description never leaks the wrong word, same rule CLAUDE.md's
// architecture doc applies to every other piece of UI copy.
function describeForTerms(tool: AiTool, terms: IndustryTerms): AiTool {
  if (tool.name === "create_project") {
    return {
      ...tool,
      description: `Create a real ${terms.project.toLowerCase()}. Only call this when the user clearly asks you to create/start/add a new ${terms.project.toLowerCase()}.`,
    };
  }
  if (tool.name === "create_crm_contact") {
    return {
      ...tool,
      description: `Add a real contact to the CRM. Only call this when the user clearly asks you to add or save a new lead, ${terms.customer.toLowerCase()}, or contact.`,
    };
  }
  return tool;
}

export function toolsForEdition(editionKey: string, terms: IndustryTerms): AiTool[] {
  const modules = getAllowedModuleKeys(editionKey);
  return TOOL_DEFINITIONS.filter((def) => modules === null || modules.has(def.moduleKey)).map((def) => describeForTerms(def.tool, terms));
}

export function buildToolExecutor(workspaceId: string, userId: string): AiToolExecutor {
  async function exactTarget<T extends { id: string }>(label: string, target: unknown, rows: T[], nameOf: (row: T) => string): Promise<T> {
    const wanted = typeof target === "string" ? target.trim().toLocaleLowerCase() : "";
    if (!wanted) throw new Error(`${label} name is required.`);
    const matches = rows.filter((row) => nameOf(row).trim().toLocaleLowerCase() === wanted);
    if (matches.length !== 1) throw new Error(matches.length ? `More than one ${label} has that name. Delete it from the feature page.` : `${label} not found.`);
    return matches[0];
  }
  return async (name, input) => {
    switch (name) {
      case "create_note": {
        const title = typeof input.title === "string" && input.title.trim() ? input.title.trim() : "Note from assistant";
        const body = typeof input.body === "string" ? input.body.trim() : "";
        await createNote(workspaceId, userId, title, body);
        return "Saved to Notes.";
      }
      case "create_project": {
        const name = typeof input.name === "string" ? input.name.trim() : "";
        if (!name) return "Failed: a project name is required.";
        await createProject(workspaceId, userId, {
          name,
          description: typeof input.description === "string" ? input.description : undefined,
          dueDate: typeof input.dueDate === "string" ? input.dueDate : undefined,
        });
        return "Project created.";
      }
      case "create_calendar_event": {
        const title = typeof input.title === "string" ? input.title : "";
        const date = typeof input.date === "string" ? input.date : "";
        const time = typeof input.time === "string" ? input.time : "";
        await createCalendarEvent(workspaceId, userId, title, date, time);
        return "Added to Calendar.";
      }
      case "create_gpa_course": {
        const name = typeof input.name === "string" ? input.name : "";
        const credits = typeof input.credits === "number" ? input.credits : Number(input.credits) || 0;
        const grade = (typeof input.grade === "string" ? input.grade : "C") as DisplayLetterGrade;
        await createGpaCourse(workspaceId, userId, name, credits, grade);
        return "Added to GPA Calculator.";
      }
      case "create_job_application": {
        const company = typeof input.company === "string" ? input.company : "";
        const role = typeof input.role === "string" ? input.role : "";
        const notes = typeof input.notes === "string" ? input.notes : "";
        await createJobApplication(workspaceId, userId, company, role, notes);
        return "Added to your Internship & Job Tracker.";
      }
      case "create_time_off_request": {
        const type = (typeof input.type === "string" ? input.type : "vacation") as TimeOffType;
        const startDate = typeof input.startDate === "string" ? input.startDate : "";
        const endDate = typeof input.endDate === "string" ? input.endDate : "";
        const notes = typeof input.notes === "string" ? input.notes : "";
        await createTimeOffRequest(workspaceId, userId, type, startDate, endDate, notes);
        return "Time off request submitted for approval.";
      }
      case "create_crm_contact": {
        const firstName = typeof input.firstName === "string" ? input.firstName : "";
        const lastName = typeof input.lastName === "string" ? input.lastName : "";
        const personType = (typeof input.personType === "string" ? input.personType : "lead") as PersonType;
        await createPerson(workspaceId, userId, {
          firstName,
          lastName,
          email: typeof input.email === "string" ? input.email : undefined,
          personType,
        });
        return "Added to CRM.";
      }
      case "create_knowledge_article": {
        const title = typeof input.title === "string" ? input.title : "";
        const body = typeof input.body === "string" ? input.body : "";
        const category = (typeof input.category === "string" ? input.category : "process") as KnowledgeCategory;
        await createKnowledgeArticle(workspaceId, userId, { title, body, category });
        return "Saved to Knowledge Center.";
      }
      case "create_task": {
        const project = await exactTarget("project", input.project, await db.project.findMany({ where: { workspaceId }, select: { id: true, name: true } }), (row) => row.name);
        await createTask(workspaceId, project.id, userId, typeof input.title === "string" ? input.title : "");
        return `Task added to ${project.name}.`;
      }
      case "create_meeting": {
        await createMeeting(workspaceId, userId, {
          title: typeof input.title === "string" ? input.title : "",
          scheduledAt: typeof input.scheduledAt === "string" ? input.scheduledAt : "",
          agenda: typeof input.agenda === "string" ? input.agenda : "",
          attendees: Array.isArray(input.attendees) ? input.attendees.filter((value): value is string => typeof value === "string") : [],
        });
        return "Meeting created.";
      }
      case "create_crm_organization": {
        await createOrganization(workspaceId, userId, typeof input.name === "string" ? input.name : "", typeof input.domain === "string" ? input.domain : "", typeof input.industry === "string" ? input.industry : "");
        return "Organization added to CRM.";
      }
      case "delete_note": {
        const row = await exactTarget("note", input.target, await db.note.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteNote(workspaceId, row.id, userId); return `Deleted note "${row.title}".`;
      }
      case "delete_project": {
        const row = await exactTarget("project", input.target, await db.project.findMany({ where: { workspaceId }, select: { id: true, name: true } }), (item) => item.name);
        await deleteProject(workspaceId, row.id, userId); return `Deleted project "${row.name}".`;
      }
      case "delete_task": {
        const row = await exactTarget("task", input.target, await db.task.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteTask(workspaceId, row.id, userId); return `Deleted task "${row.title}".`;
      }
      case "delete_calendar_event": {
        const row = await exactTarget("personal calendar event", input.target, await db.calendarEvent.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteCalendarEvent(workspaceId, row.id, userId); return `Deleted personal calendar event "${row.title}".`;
      }
      case "delete_gpa_course": {
        const row = await exactTarget("GPA course", input.target, await db.gpaCourse.findMany({ where: { workspaceId, studentId: userId }, select: { id: true, name: true } }), (item) => item.name);
        await deleteGpaCourse(workspaceId, userId, row.id); return `Deleted GPA course "${row.name}".`;
      }
      case "delete_job_application": {
        const rows = await db.jobApplication.findMany({ where: { workspaceId, studentId: userId }, select: { id: true, company: true, role: true } });
        const row = await exactTarget("job application", input.target, rows, (item) => `${item.company} — ${item.role}`);
        await deleteJobApplication(workspaceId, userId, row.id); return `Deleted application "${row.company} — ${row.role}".`;
      }
      case "delete_time_off_request": {
        const rows = await db.timeOffRequest.findMany({ where: { workspaceId }, select: { id: true, type: true, startDate: true, endDate: true } });
        const row = await exactTarget("time-off request", input.target, rows, (item) => `${item.type} ${item.startDate.toISOString().slice(0, 10)} to ${item.endDate.toISOString().slice(0, 10)}`);
        await deleteTimeOffRequest(workspaceId, userId, row.id); return "Time-off request removed.";
      }
      case "delete_crm_contact": {
        const row = await exactTarget("CRM contact", input.target, await db.person.findMany({ where: { workspaceId }, select: { id: true, firstName: true, lastName: true } }), (item) => `${item.firstName} ${item.lastName}`);
        await deletePerson(workspaceId, row.id, userId); return `Deleted contact "${row.firstName} ${row.lastName}".`;
      }
      case "delete_crm_organization": {
        const row = await exactTarget("CRM organization", input.target, await db.organization.findMany({ where: { workspaceId }, select: { id: true, name: true } }), (item) => item.name);
        await deleteOrganization(workspaceId, row.id, userId); return `Deleted organization "${row.name}".`;
      }
      case "delete_crm_deal": {
        const row = await exactTarget("CRM deal", input.target, await db.deal.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteDeal(workspaceId, row.id, userId); return `Deleted deal "${row.title}".`;
      }
      case "delete_knowledge_article": {
        const row = await exactTarget("knowledge article", input.target, await db.knowledgeArticle.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteKnowledgeArticle(workspaceId, row.id, userId); return `Deleted knowledge article "${row.title}".`;
      }
      case "delete_meeting": {
        const row = await exactTarget("native meeting", input.target, await db.meeting.findMany({ where: { workspaceId }, select: { id: true, title: true } }), (item) => item.title);
        await deleteMeeting(workspaceId, row.id, userId); return `Deleted meeting "${row.title}".`;
      }
      case "delete_document": {
        const row = await exactTarget("uploaded document", input.target, await db.document.findMany({ where: { workspaceId }, select: { id: true, name: true } }), (item) => item.name);
        await deleteDocument(workspaceId, row.id, userId); return `Deleted document "${row.name}".`;
      }
      default:
        return "Unknown tool.";
    }
  };
}
