"use client";

import { useEffect } from "react";

// Cursor-reactive card glow (see the `.spotlight-card` utility in
// globals.css) - mounted explicitly on marketing pages only
// (HomePage.tsx, /workspace, /student), never in the real in-app
// product, so it can't change the paying-customer experience as a side
// effect. One delegated mousemove listener rather than one per card.
// Skipped entirely for prefers-reduced-motion.
export function SpotlightCards() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onMouseMove(event: MouseEvent) {
      const card = (event.target as HTMLElement)?.closest<HTMLElement>(".spotlight-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, []);

  return null;
}
