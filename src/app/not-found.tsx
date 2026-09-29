import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="card w-full p-8">
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">
          That link doesn&rsquo;t match anything. Check the invite code or head back home.
        </p>
        <Link href="/" className="btn-dark mt-6">
          Back to home
        </Link>
      </div>
    </main>
  );
}
