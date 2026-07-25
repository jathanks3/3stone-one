import type { Metadata } from "next";
import { getSession, hasStaffAccess } from "@/lib/session";
import { listFeatureFlags } from "@/server/platform/services/featureFlagService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";
import { AddFeatureFlagForm } from "./AddFeatureFlagForm";
import { FlagToggle } from "./FlagToggle";

export const metadata: Metadata = { title: "Feature Flags — 3Stone AI" };

// Global product feature flags, real reads/writes against Neon via
// featureFlagService — the founder's first direct-control lever over the
// live product from the Platform section (docs/15-company-platform-vision.md).
export default async function FeatureFlagsPage() {
  const session = await getSession();
  if (!hasStaffAccess(session)) return null; // layout above already redirects

  const flags = await listFeatureFlags();
  await recordAuditEntry({ staffUserId: session.userId, action: "viewed_feature_flags" });

  return (
    <div>
      <h1 className="text-[22px] font-bold text-ink-1">Feature Flags</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">
        Global on/off switches the product checks at runtime. Toggling here changes live behavior immediately.
      </p>

      <div className="mt-5">
        <AddFeatureFlagForm />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[12px] border border-line">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-surface text-left text-ink-3">
              <th className="px-4 py-2.5 font-medium">Flag</th>
              <th className="px-4 py-2.5 font-medium">Key</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.key} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-1">{f.label}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink-3">{f.key}</td>
                <td className="px-4 py-2.5 text-ink-2">{f.description ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <FlagToggle flagKey={f.key} enabled={f.defaultEnabled} />
                </td>
              </tr>
            ))}
            {flags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-3">
                  No feature flags yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
