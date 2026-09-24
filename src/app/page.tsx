import { createGroup, joinGroupByCode } from "@/app/actions/groups";
import { CURRENCIES } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-slate-50 px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Splitwise It</h1>
          <p className="mt-2 text-slate-500">
            Track shared expenses with friends, family, or roommates — no account needed.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Start a new group</h2>
          <form action={createGroup} className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Group name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Cabin trip, Roommates, Italy 2026…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="yourName" className="mb-1 block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="yourName"
                name="yourName"
                required
                placeholder="How others will see you"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="currency" className="mb-1 block text-sm font-medium text-slate-700">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue="USD"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Create group
            </SubmitButton>
          </form>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          or
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Join an existing group</h2>
          <form action={joinGroupByCode} className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
                Invite code
              </label>
              <input
                id="code"
                name="code"
                required
                placeholder="e.g. 7K4QXPZ"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <SubmitButton className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Join group
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
