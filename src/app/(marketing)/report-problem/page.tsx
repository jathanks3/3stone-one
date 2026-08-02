import type { Metadata } from "next";
import Link from "next/link";
import { ReportProblemForm } from "@/components/shared/ReportProblemForm";

export const metadata: Metadata = { title: "Report a problem — 3Stone AI" };

export default async function ReportProblemPage({ searchParams }: { searchParams: Promise<{ source?: string; product?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-bg px-5 py-14 text-ink-1">
      <div className="mx-auto max-w-[560px] rounded-2xl border border-line-strong bg-surface p-6 shadow-xl">
        <Link href="https://www.3stoneai.com" className="text-[12.5px] font-semibold text-accent">← 3Stone AI</Link>
        <h1 className="mt-4 text-[24px] font-extrabold">Report a problem</h1>
        <p className="mb-6 mt-2 text-[13.5px] leading-relaxed text-ink-2">Tell us what is not working. Your report goes directly to the internal 3Stone AI support dashboard.</p>
        <ReportProblemForm sourceUrl={params.source ?? ""} productArea={params.product ?? "3Stone AI website"} />
      </div>
    </main>
  );
}
