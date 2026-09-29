"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon, CopyIcon, ShareIcon } from "@/components/icons";

export function ShareSheet({ groupName, inviteCode }: { groupName: string; inviteCode: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  function openSheet() {
    setLink(`${window.location.origin}/join/${inviteCode}`);
    setCanShare(typeof navigator.share === "function");
    setCopied(null);
    setOpen(true);
  }

  async function copy(value: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1600);
    } catch {
      // Clipboard unavailable; the value is selectable in the field for manual copy.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: groupName,
        text: `Join "${groupName}" to split expenses. Invite code: ${inviteCode}`,
        url: link,
      });
    } catch {
      // User dismissed the share dialog.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="Share invite"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <ShareIcon size={20} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Invite others">
        <p className="text-sm text-slate-500">
          Anyone with the code or link can join <span className="font-medium">{groupName}</span>.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="font-mono text-xl font-semibold tracking-[0.3em] text-slate-900">
            {inviteCode}
          </span>
          <button
            type="button"
            onClick={() => copy(inviteCode, "code")}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            {copied === "code" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            readOnly
            value={link}
            aria-label="Invite link"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => copy(link, "link")}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {copied === "link" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>

        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <ShareIcon size={18} />
            Share via&hellip;
          </button>
        )}
      </BottomSheet>
    </>
  );
}
