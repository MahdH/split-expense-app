"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { switchIdentity } from "@/app/actions/groups";
import { DownloadIcon, MoreIcon, SwitchUserIcon } from "@/components/icons";

export function MoreMenu({
  groupId,
  memberName,
  glass = false,
}: {
  groupId: string;
  memberName: string;
  glass?: boolean;
}) {
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
    "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[15px] font-semibold text-ink hover:bg-surface-2";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`icon-btn ${glass ? "icon-btn-glass" : ""}`}
      >
        <MoreIcon size={20} />
      </button>

      {open && (
        <div
          role="menu"
          className="card absolute right-0 z-30 mt-2 w-60 !rounded-[24px] p-1.5 text-ink"
        >
          <Link
            role="menuitem"
            href={`/g/${groupId}/export`}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <DownloadIcon size={18} className="text-ink-2" />
            Export data
          </Link>
          <form action={switchIdentity.bind(null, groupId)}>
            <button type="submit" role="menuitem" className={itemClass}>
              <SwitchUserIcon size={18} className="text-ink-2" />
              Not {memberName}?
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
