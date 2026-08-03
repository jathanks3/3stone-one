import type { AiTool, AiToolExecutor } from "./aiProvider";
import { getAllowedModuleKeys } from "@/lib/editionModules";
import { createNote } from "@/server/services/noteService";
import { createProject } from "@/server/services/projectService";
import { createCalendarEvent } from "@/server/services/calendarService";
import { createGpaCourse, type DisplayLetterGrade } from "@/server/services/gpaService";
import { createJobApplication } from "@/server/services/jobApplicationService";
import { createTimeOffRequest } from "@/server/services/timeOffService";
import { createPerson } from "@/server/services/crmService";
import { createKnowledgeArticle } from "@/server/services/knowledgeService";
import type { TimeOffType, PersonType, KnowledgeCategory } from "@/types";

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
];

export function toolsForEdition(editionKey: string): AiTool[] {
  const modules = getAllowedModuleKeys(editionKey);
  return TOOL_DEFINITIONS.filter((def) => modules === null || modules.has(def.moduleKey)).map((def) => def.tool);
}

export function buildToolExecutor(workspaceId: string, userId: string): AiToolExecutor {
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
      default:
        return "Unknown tool.";
    }
  };
}
