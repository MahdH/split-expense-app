"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";
import { usePresence } from "@/components/usePresence";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { mounted, closing } = usePresence(open, 220);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted) return null;

  // Portal to <body> so the sheet escapes the caller's stacking context and inherited text styles.
  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${
        closing ? "pointer-events-none" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full max-w-xl ${
          closing ? "animate-sheet-down" : "animate-sheet-up"
        } rounded-t-[32px] bg-surface p-6 pb-9 text-ink shadow-[0_-20px_50px_-20px_rgba(23,20,21,0.4)] outline-none sm:rounded-[32px]`}
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-black/10 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn h-9 w-9">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
