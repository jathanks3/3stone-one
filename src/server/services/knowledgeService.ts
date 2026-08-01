import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { KnowledgeCategory } from "../../../generated/prisma/client";

export interface KnowledgeArticleRow {
  id: string;
  title: string;
  body: string;
  category: KnowledgeCategory;
  videoUrl: string | null;
  authorName: string | null;
  updatedAt: Date;
}

export async function listKnowledgeArticles(workspaceId: string): Promise<KnowledgeArticleRow[]> {
  const articles = await db.knowledgeArticle.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  const authorIds = [...new Set(articles.map((a) => a.authorId).filter((id): id is string => !!id))];
  const authors = authorIds.length
    ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(authors.map((a) => [a.id, a.name]));
  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    category: a.category,
    videoUrl: a.videoUrl,
    authorName: a.authorId ? nameById.get(a.authorId) ?? "Former member" : null,
    updatedAt: a.updatedAt,
  }));
}

export interface KnowledgeArticleInput {
  title: string;
  body: string;
  category: KnowledgeCategory;
  videoUrl?: string;
}

export async function createKnowledgeArticle(workspaceId: string, authorId: string, input: KnowledgeArticleInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  const article = await db.knowledgeArticle.create({
    data: { workspaceId, authorId, title, body: input.body.trim(), category: input.category, videoUrl: input.videoUrl || null },
  });
  await logActivity(workspaceId, authorId, "created_knowledge_article", "KnowledgeArticle", article.id, { title });
  return article;
}

export async function updateKnowledgeArticle(workspaceId: string, articleId: string, actorId: string, input: KnowledgeArticleInput) {
  const existing = await db.knowledgeArticle.findFirst({ where: { id: articleId, workspaceId } });
  if (!existing) throw new Error("Article not found.");
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  const article = await db.knowledgeArticle.update({
    where: { id: articleId },
    data: { title, body: input.body.trim(), category: input.category, videoUrl: input.videoUrl || null },
  });
  await logActivity(workspaceId, actorId, "updated_knowledge_article", "KnowledgeArticle", articleId, { title });
  return article;
}

export async function deleteKnowledgeArticle(workspaceId: string, articleId: string, actorId: string): Promise<void> {
  const existing = await db.knowledgeArticle.findFirst({ where: { id: articleId, workspaceId } });
  if (!existing) throw new Error("Article not found.");
  await db.knowledgeArticle.delete({ where: { id: articleId } });
  await logActivity(workspaceId, actorId, "deleted_knowledge_article", "KnowledgeArticle", articleId, { title: existing.title });
}
