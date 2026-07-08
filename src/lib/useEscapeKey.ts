import { useEffect } from "react";

export function useEscapeKey(active: boolean, handler: () => void) {
  useEffect(() => {
    if (!active) return;
    function listener(event: KeyboardEvent) {
      if (event.key === "Escape") handler();
    }
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [active, handler]);
}
