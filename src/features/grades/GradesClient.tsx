"use client";

import { GraduationCap } from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import type { GradeRow } from "@/server/services/gradesService";

const SOURCE_LABEL: Record<GradeRow["source"], string> = {
  canvas: "Canvas",
};

export function GradesClient({ grades }: { grades: GradeRow[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Grades</h1>
        <p className="mt-1 text-[14px] text-ink-2">
          Pulled live from your connected school systems - this also keeps your GPA Calculator in sync automatically.
        </p>
      </div>

      <div className="mt-6">
        {grades.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No grades yet"
            description="Connect Canvas from Integrations to see your real course grades here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grades.map((g) => (
              <Card key={`${g.source}-${g.courseId}`} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold text-ink-1">{g.courseName}</p>
                  <span className="flex-shrink-0 rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[10.5px] font-medium text-ink-3">
                    {SOURCE_LABEL[g.source]}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[26px] font-bold text-ink-1">
                    {g.currentGrade ?? (g.currentScore !== null ? `${Math.round(g.currentScore)}%` : "—")}
                  </span>
                  {g.currentGrade && g.currentScore !== null ? (
                    <span className="text-[12.5px] text-ink-3">{Math.round(g.currentScore)}%</span>
                  ) : null}
                </div>
                {g.currentScore === null && !g.currentGrade ? (
                  <p className="mt-2 text-[12px] text-ink-3">Nothing computed yet for this course.</p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
