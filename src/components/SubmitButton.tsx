"use client";

import { useFormStatus } from "react-dom";
import { ButtonHTMLAttributes } from "react";

export function SubmitButton({
  children,
  className,
  pendingText,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:cursor-not-allowed disabled:opacity-60`}
      {...props}
    >
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}
