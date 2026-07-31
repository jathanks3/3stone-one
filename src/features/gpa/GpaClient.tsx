"use client";

import { useRef, useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { STUDENT_GPA_COURSES } from "@/server/mock-data/gpa";
import type { GpaCourse, LetterGrade } from "@/types";

const GRADE_POINTS: Record<LetterGrade, number> = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,
  F: 0.0,
};

const GRADE_OPTIONS = Object.keys(GRADE_POINTS) as LetterGrade[];

function computeGpa(courses: GpaCourse[]): { gpa: number; totalCredits: number } {
  const totalCredits = courses.reduce((sum, c) => sum + (Number.isFinite(c.credits) ? c.credits : 0), 0);
  if (totalCredits === 0) return { gpa: 0, totalCredits: 0 };
  const totalPoints = courses.reduce(
    (sum, c) => sum + GRADE_POINTS[c.grade] * (Number.isFinite(c.credits) ? c.credits : 0),
    0
  );
  return { gpa: totalPoints / totalCredits, totalCredits };
}

export function GpaClient() {
  const [courses, setCourses] = useState<GpaCourse[]>(STUDENT_GPA_COURSES);
  const nextId = useRef(STUDENT_GPA_COURSES.length);

  function addCourse() {
    nextId.current += 1;
    setCourses((prev) => [...prev, { id: `local_${nextId.current}`, name: "", credits: 3, grade: "A" }]);
  }

  function updateCourse(id: string, patch: Partial<GpaCourse>) {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function deleteCourse(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  const { gpa, totalCredits } = computeGpa(courses);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-[22px] font-bold text-ink-1">GPA Calculator</h1>
      <p className="mt-1 text-[14px] text-ink-2">Add your courses and grades — your GPA updates instantly.</p>

      <Card className="mt-5 flex items-center gap-6 p-5">
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">Cumulative GPA</p>
          <p className="mt-1 text-[38px] font-extrabold leading-none text-ink-1">{totalCredits > 0 ? gpa.toFixed(2) : "—"}</p>
        </div>
        <div className="h-10 w-px bg-line" />
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">Total credits</p>
          <p className="mt-1 text-[22px] font-bold text-ink-1">{totalCredits}</p>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        {courses.length === 0 ? (
          <EmptyState icon={Calculator} title="No courses yet" description="Add a course to start calculating your GPA." />
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="flex items-center gap-2.5 p-3">
              <input
                value={course.name}
                onChange={(e) => updateCourse(course.id, { name: e.target.value })}
                placeholder="Course name"
                className="h-9 min-w-0 flex-1 rounded-[8px] border border-line-strong bg-bg px-3 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
              <input
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={course.credits}
                onChange={(e) => updateCourse(course.id, { credits: Number(e.target.value) })}
                aria-label="Credits"
                className="h-9 w-16 flex-shrink-0 rounded-[8px] border border-line-strong bg-bg px-2 text-center text-[13.5px] text-ink-1 outline-none focus:border-accent"
              />
              <select
                value={course.grade}
                onChange={(e) => updateCourse(course.id, { grade: e.target.value as LetterGrade })}
                aria-label="Grade"
                className="h-9 flex-shrink-0 rounded-[8px] border border-line-strong bg-bg px-2 text-[13.5px] text-ink-1 outline-none focus:border-accent"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <button
                onClick={() => deleteCourse(course.id)}
                aria-label="Remove course"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] text-ink-3 hover:bg-critical-wash hover:text-critical"
              >
                <Trash2 size={15} />
              </button>
            </Card>
          ))
        )}
      </div>

      <button
        onClick={addCourse}
        className="mt-4 flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong px-3.5 text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
      >
        <Plus size={15} />
        Add course
      </button>
    </div>
  );
}
