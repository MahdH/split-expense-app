"use client";

import { useEffect, useState } from "react";

// Keeps something mounted for `exitMs` after `open` turns false so its exit animation can play.
export function usePresence(open: boolean, exitMs: number) {
  const [state, setState] = useState<"closed" | "open" | "closing">(open ? "open" : "closed");

  if (open && state !== "open") setState("open");
  if (!open && state === "open") setState("closing");

  useEffect(() => {
    if (state !== "closing") return;
    const timer = setTimeout(() => setState("closed"), exitMs);
    return () => clearTimeout(timer);
  }, [state, exitMs]);

  return { mounted: state !== "closed", closing: state === "closing" };
}
