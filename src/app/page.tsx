import { createGroup, joinGroupByCode } from "@/app/actions/groups";
import { CURRENCIES } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";
import { GradientBanner } from "@/components/GradientBanner";
import { PageMain } from "@/components/PageMain";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink-2";

export default function Home() {
  return (
    <PageMain className="mx-auto w-full max-w-xl flex-1 px-4 pb-12 pt-4">
      <section className="relative overflow-hidden rounded-[32px] shadow-hero">
        <GradientBanner className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[#0b3954]/25" />
        <div className="pointer-events-none relative z-10 px-6 pb-14 pt-16 text-center text-white [text-shadow:0_1px_14px_rgba(11,57,84,0.45)]">
          <p className="text-[15px] font-medium text-white/90">Welcome to</p>
          <h1 className="mt-1 text-[40px] font-semibold leading-tight tracking-tight">
            Splitwise It
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-white/90">
            Track shared expenses with friends, family, or roommates &mdash; no account needed.
          </p>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        <section className="card p-6">
          <h2 className="text-xl font-semibold tracking-tight">Start a new group</h2>
          <form action={createGroup} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                Group name
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="Cabin trip, Roommates, Italy 2026…"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="yourName" className={labelClass}>
                Your name
              </label>
              <input
                id="yourName"
                name="yourName"
                required
                placeholder="How others will see you"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="currency" className={labelClass}>
                Currency
              </label>
              <select id="currency" name="currency" defaultValue="USD" className="field">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton className="btn-dark mt-1 w-full">Create group</SubmitButton>
          </form>
        </section>

        <div className="flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
          <div className="h-px flex-1 bg-black/10" />
          or
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <section className="card p-6">
          <h2 className="text-xl font-semibold tracking-tight">Join an existing group</h2>
          <form action={joinGroupByCode} className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="code" className={labelClass}>
                Invite code
              </label>
              <input
                id="code"
                name="code"
                required
                placeholder="e.g. 7K4QXPZ"
                className="field uppercase tracking-[0.25em]"
              />
            </div>
            <SubmitButton className="btn-soft w-full !py-3">Join group</SubmitButton>
          </form>
        </section>
      </div>
    </PageMain>
  );
}
