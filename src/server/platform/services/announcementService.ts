import { db } from "@/server/db";

export interface AnnouncementListItem {
  id: string;
  title: string;
  body: string;
  publishedAt: Date | null;
  createdAt: Date;
}

// First pass: audience is always "all" (every product, every visitor) —
// per-workspace/per-plan targeting (PlatformAnnouncementTarget) is real
// schema for later, not built here. Smallest real control loop: founder
// writes something, flips it published, every product sees it.
export async function listAnnouncements(): Promise<AnnouncementListItem[]> {
  const rows = await db.platformAnnouncement.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    publishedAt: r.publishedAt,
    createdAt: r.createdAt,
  }));
}

export async function createAnnouncement(input: { title: string; body: string }): Promise<void> {
  await db.platformAnnouncement.create({ data: { title: input.title, body: input.body, audience: "all" } });
}

export async function setAnnouncementPublished(id: string, published: boolean): Promise<void> {
  await db.platformAnnouncement.update({
    where: { id },
    data: { publishedAt: published ? new Date() : null },
  });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await db.platformAnnouncement.delete({ where: { id } });
}

// Read path other products call (via the public API) — only ever the
// single most recent published, audience:"all" announcement. Multiple
// simultaneous banners is a UX problem, not a feature.
export async function getActivePublicAnnouncement(): Promise<{ title: string; body: string } | null> {
  const row = await db.platformAnnouncement.findFirst({
    where: { audience: "all", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { title: true, body: true },
  });
  return row;
}
