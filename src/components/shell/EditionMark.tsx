// Distinct brand marks for the Workspace and Student editions - so the
// sidebar reads as its own product, not the flagship monogram with a
// different color. Simple, fixed-color geometric shapes, same craft
// level as 3Stone Admin's white-label sub-products (e.g. Cleat Man's
// CleatManMark) rather than theme-reactive icons.
export function WorkspaceMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="flex-shrink-0">
      <rect width="24" height="24" rx="7" fill="#2f7d5c" />
      <path d="M6 15L12 8L18 15H14V18H10V15H6Z" fill="#ffffff" />
    </svg>
  );
}

export function StudentMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="flex-shrink-0">
      <rect width="24" height="24" rx="7" fill="#6f57d6" />
      <path d="M12 6L20 10L12 14L4 10L12 6Z" fill="#ffffff" />
      <path d="M7 11.5V15C7 16.1 9.2 17 12 17C14.8 17 17 16.1 17 15V11.5" stroke="#ffffff" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

// Shared by AppShell (desktop sidebar) and MobileNav (mobile drawer) so
// both surfaces show the same edition identity. Business edition isn't
// in this map - callers fall back to the flagship monogram + "3Stone One".
export const EDITION_BRAND: Record<string, { Mark: typeof WorkspaceMark; label: string } | undefined> = {
  workspace: { Mark: WorkspaceMark, label: "3Stone One Workspace" },
  student: { Mark: StudentMark, label: "3Stone One Student" },
};
