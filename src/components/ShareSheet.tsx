"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { CheckIcon, CopyIcon, ShareIcon } from "@/components/icons";

export function ShareSheet({
  groupName,
  inviteCode,
  glass = false,
}: {
  groupName: string;
  inviteCode: string;
  glass?: boolean;
}) {
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
        className={`icon-btn ${glass ? "icon-btn-glass" : ""}`}
      >
        <ShareIcon size={20} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Invite others">
        <p className="text-[15px] text-ink-2">
          Anyone with the code or link can join{" "}
          <span className="font-semibold text-ink">{groupName}</span>.
        </p>

        <div className="card-quiet mt-5 flex items-center justify-between gap-3 px-5 py-4">
          <span className="font-mono text-[26px] font-semibold tracking-[0.3em] text-ink">
            {inviteCode}
          </span>
          <button type="button" onClick={() => copy(inviteCode, "code")} className="btn-soft">
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
            className="field min-w-0 flex-1 !py-2.5 text-sm"
          />
          <button type="button" onClick={() => copy(link, "link")} className="btn-dark shrink-0 !px-5">
            {copied === "link" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>

        {canShare && (
          <button type="button" onClick={nativeShare} className="btn-dark mt-4 w-full">
            <ShareIcon size={18} />
            Share via&hellip;
          </button>
        )}
      </BottomSheet>
    </>
  );
}
