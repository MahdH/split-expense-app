"use client";

import { useState } from "react";

export function InviteBox({ groupId, inviteCode }: { groupId: string; inviteCode: string }) {
  const [copied, setCopied] = useState(false);
  void groupId;

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; user can still copy manually from the input
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Invite others
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          Share the code{" "}
          <span className="font-mono font-semibold tracking-widest text-slate-900">
            {inviteCode}
          </span>{" "}
          or send the link below.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:w-64"
        />
        <button
          onClick={copy}
          type="button"
          className="flex-shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
