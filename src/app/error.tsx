"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="card w-full p-8">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">{error.message}</p>
        <button onClick={reset} className="btn-dark mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
