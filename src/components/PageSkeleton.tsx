import { ViewTransition } from "react";

// Instant placeholder shown while a group page loads on the server, so taps respond
// immediately instead of the old page sitting frozen. Shape-agnostic on purpose: a title
// row and a few cards fit every screen.
export function PageSkeleton() {
  // No enter animation: the placeholder should appear the instant the old page leaves.
  // It fades out (default page-out) when the real page takes over.
  return (
    <ViewTransition enter="none" exit="page-out" default="none">
      <main
        aria-busy="true"
        aria-label="Loading"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-36 pt-6"
      >
        <div className="flex items-center gap-3 px-1">
          <div className="skeleton h-11 w-11 !rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-40 !rounded-full" />
            <div className="skeleton h-3.5 w-28 !rounded-full" />
          </div>
        </div>
        <div className="skeleton h-40 !rounded-[28px]" />
        <div className="skeleton h-24 !rounded-[28px]" />
        <div className="skeleton h-24 !rounded-[28px]" />
      </main>
    </ViewTransition>
  );
}
