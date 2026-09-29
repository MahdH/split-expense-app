"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { switchIdentity } from "@/app/actions/groups";
import { DownloadIcon, MoreIcon, SwitchUserIcon } from "@/components/icons";

export function MoreMenu({ groupId, memberName }: { groupId: string; memberName: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <MoreIcon size={20} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <Link
            role="menuitem"
            href={`/g/${groupId}/export`}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <DownloadIcon size={18} className="text-slate-400" />
            Export data
          </Link>
          <form action={switchIdentity.bind(null, groupId)}>
            <button type="submit" role="menuitem" className={itemClass}>
              <SwitchUserIcon size={18} className="text-slate-400" />
              Not {memberName}?
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
