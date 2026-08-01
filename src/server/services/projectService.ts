import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { TaskStatus } from "../../../generated/prisma/client";

export const PROJECT_STATUS_ORDER = ["bid", "scheduled", "in_progress", "done"] as const;
export type ProjectStatusKey = (typeof PROJECT_STATUS_ORDER)[number];

export interface ProjectTaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  statusKey: string;
  ownerId: string | null;
  ownerName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  tasks: ProjectTaskRow[];
}

async function withOwnerNames(projects: Awaited<ReturnType<typeof db.project.findMany>>): Promise<Map<string, string>> {
  const ownerIds = [...new Set(projects.map((p) => p.ownerId).filter((id): id is string => !!id))];
  if (!ownerIds.length) return new Map();
  const owners = await db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } });
  return new Map(owners.map((o) => [o.id, o.name]));
}

export async function listProjects(workspaceId: string): Promise<ProjectRow[]> {
  const projects = await db.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { tasks: { orderBy: { createdAt: "asc" } }, organization: { select: { id: true, name: true } } },
  });
  const ownerNameById = await withOwnerNames(projects);
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    statusKey: p.statusKey,
    ownerId: p.ownerId,
    ownerName: p.ownerId ? ownerNameById.get(p.ownerId) ?? "Former member" : null,
    organizationId: p.organizationId,
    organizationName: p.organization?.name ?? null,
    startDate: p.startDate,
    dueDate: p.dueDate,
    tasks: p.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, dueDate: t.dueDate })),
  }));
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  dueDate?: string;
}

export async function createProject(workspaceId: string, ownerId: string, input: CreateProjectInput): Promise<ProjectRow> {
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required.");
  const project = await db.project.create({
    data: {
      workspaceId,
      name,
      description: input.description?.trim() || null,
      statusKey: "bid",
      ownerId,
      startDate: new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
  await logActivity(workspaceId, ownerId, "created_project", "Project", project.id, { name });
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    statusKey: project.statusKey,
    ownerId: project.ownerId,
    ownerName: null,
    organizationId: null,
    organizationName: null,
    startDate: project.startDate,
    dueDate: project.dueDate,
    tasks: [],
  };
}

export async function updateProjectStatus(workspaceId: string, projectId: string, actorId: string, statusKey: ProjectStatusKey): Promise<void> {
  const existing = await db.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!existing) throw new Error("Project not found.");
  await db.project.update({ where: { id: projectId }, data: { statusKey } });
  await logActivity(workspaceId, actorId, "updated_project_status", "Project", projectId, { statusKey });
}

export async function deleteProject(workspaceId: string, projectId: string, actorId: string): Promise<void> {
  const existing = await db.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!existing) throw new Error("Project not found.");
  await db.task.deleteMany({ where: { projectId, workspaceId } });
  await db.project.delete({ where: { id: projectId } });
  await logActivity(workspaceId, actorId, "deleted_project", "Project", projectId, { name: existing.name });
}

export async function createTask(workspaceId: string, projectId: string, actorId: string, title: string): Promise<ProjectTaskRow> {
  const project = await db.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!project) throw new Error("Project not found.");
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Task title is required.");
  const task = await db.task.create({ data: { workspaceId, projectId, title: trimmed, status: "todo" } });
  await logActivity(workspaceId, actorId, "created_task", "Task", task.id, { title: trimmed });
  return { id: task.id, title: task.title, status: task.status, dueDate: task.dueDate };
}

export async function toggleTaskDone(workspaceId: string, taskId: string, actorId: string): Promise<ProjectTaskRow> {
  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId } });
  if (!existing) throw new Error("Task not found.");
  const nextStatus: TaskStatus = existing.status === "done" ? "todo" : "done";
  const task = await db.task.update({ where: { id: taskId }, data: { status: nextStatus } });
  await logActivity(workspaceId, actorId, nextStatus === "done" ? "completed_task" : "reopened_task", "Task", taskId);
  return { id: task.id, title: task.title, status: task.status, dueDate: task.dueDate };
}

export async function deleteTask(workspaceId: string, taskId: string, actorId: string): Promise<void> {
  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId } });
  if (!existing) throw new Error("Task not found.");
  await db.task.delete({ where: { id: taskId } });
  await logActivity(workspaceId, actorId, "deleted_task", "Task", taskId, { title: existing.title });
}
