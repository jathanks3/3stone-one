import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";

export interface DirectoryMemberRow {
  id: string;
  name: string;
  email: string;
  roleName: string;
  departmentId: string | null;
  departmentName: string | null;
  status: string;
}

export async function listDirectory(workspaceId: string): Promise<DirectoryMemberRow[]> {
  const members = await db.workspaceMember.findMany({
    where: { workspaceId, status: "active" },
    include: { user: true, role: true, department: true },
    orderBy: { joinedAt: "asc" },
  });
  return members.map((m) => ({
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    roleName: m.role.name,
    departmentId: m.departmentId,
    departmentName: m.department?.name ?? null,
    status: m.status,
  }));
}

export interface DepartmentRow {
  id: string;
  name: string;
  leadUserId: string | null;
  leadName: string | null;
  memberCount: number;
}

export async function listDepartments(workspaceId: string): Promise<DepartmentRow[]> {
  const departments = await db.department.findMany({ where: { workspaceId }, include: { members: true } });
  const leadIds = [...new Set(departments.map((d) => d.leadUserId).filter((id): id is string => !!id))];
  const leads = leadIds.length ? await db.user.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true } }) : [];
  const leadNameById = new Map(leads.map((l) => [l.id, l.name]));
  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    leadUserId: d.leadUserId,
    leadName: d.leadUserId ? leadNameById.get(d.leadUserId) ?? null : null,
    memberCount: d.members.length,
  }));
}

export async function createDepartment(workspaceId: string, actorId: string, name: string): Promise<DepartmentRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Department name is required.");
  const department = await db.department.create({ data: { workspaceId, name: trimmed } });
  await logActivity(workspaceId, actorId, "created_department", "Department", department.id, { name: trimmed });
  return { id: department.id, name: department.name, leadUserId: null, leadName: null, memberCount: 0 };
}

export async function assignMemberDepartment(workspaceId: string, memberId: string, actorId: string, departmentId: string | null): Promise<void> {
  const member = await db.workspaceMember.findFirst({ where: { id: memberId, workspaceId } });
  if (!member) throw new Error("Member not found.");
  await db.workspaceMember.update({ where: { id: memberId }, data: { departmentId } });
  await logActivity(workspaceId, actorId, "assigned_department", "WorkspaceMember", memberId, { departmentId });
}

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  authorId: string | null;
  authorName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  publishedAt: Date;
}

export async function listAnnouncements(workspaceId: string): Promise<AnnouncementRow[]> {
  const announcements = await db.announcement.findMany({
    where: { workspaceId },
    orderBy: { publishedAt: "desc" },
    include: { department: { select: { name: true } } },
  });
  const authorIds = [...new Set(announcements.map((a) => a.authorId).filter((id): id is string => !!id))];
  const authors = authorIds.length ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(authors.map((a) => [a.id, a.name]));
  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    authorId: a.authorId,
    authorName: a.authorId ? nameById.get(a.authorId) ?? "Former member" : null,
    departmentId: a.departmentId,
    departmentName: a.department?.name ?? null,
    publishedAt: a.publishedAt,
  }));
}

export async function createAnnouncement(workspaceId: string, authorId: string, title: string, body: string, departmentId?: string): Promise<AnnouncementRow> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required.");
  const announcement = await db.announcement.create({
    data: { workspaceId, authorId, title: trimmed, body: body.trim(), departmentId: departmentId || null },
  });
  await logActivity(workspaceId, authorId, "posted_announcement", "Announcement", announcement.id, { title: trimmed });
  return { id: announcement.id, title: announcement.title, body: announcement.body, authorId, authorName: null, departmentId: announcement.departmentId, departmentName: null, publishedAt: announcement.publishedAt };
}

export async function deleteAnnouncement(workspaceId: string, announcementId: string, actorId: string): Promise<void> {
  const existing = await db.announcement.findFirst({ where: { id: announcementId, workspaceId } });
  if (!existing) throw new Error("Announcement not found.");
  await db.announcement.delete({ where: { id: announcementId } });
  await logActivity(workspaceId, actorId, "deleted_announcement", "Announcement", announcementId, { title: existing.title });
}
