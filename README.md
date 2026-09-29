# Splitwise It

A Splid-style group expense splitter: create a group, invite people with a link
or code, log shared or partial-group expenses with flexible splits, record
settlement payments, and export everything to CSV. No accounts or passwords —
just like Splid, joining a group is enough to start using it.

## Features

- **Groups & invites** — create a group and share an invite link or 7-character
  code. Anyone with the link can join by picking their name.
- **No-login identity** — each browser remembers which member you are in each
  group via a cookie, so there's nothing to sign up for.
- **Flexible expenses** — add an expense paid by one member and split it
  among any subset of the group:
  - **Equally** among selected members
  - **Exact amounts** per person
  - **Percentages** per person
  - **Shares** (weighted split, e.g. 2x vs 1x)
- **Settle up** — see the minimum set of payments needed to zero out the
  group's balances (debt simplification), and record real-world payments
  (cash, Venmo, bank transfer) between members.
- **Balances** — live net balance per member and "who owes whom."
- **CSV export** — download expenses, balances/settlements, and payment
  history as CSV files.
- **Members management** — add placeholder members (for people not using the
  app), remove/restore members.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Server Actions) + TypeScript
- [Prisma ORM](https://www.prisma.io) + PostgreSQL
- Tailwind CSS (v4) with [Manrope](https://fonts.google.com/specimen/Manrope)
- Money is stored as integer cents to avoid floating-point rounding issues.

## Visual style

The design tokens live in `src/app/globals.css` (colours, shadows, and the
`.card`, `.btn-dark`, `.btn-soft`, `.icon-btn`, `.tag`, `.field` component classes).

- **Surfaces** — light-grey canvas (`#ececec`), near-white cards with a white
  top highlight and wide soft shadows, quieter inset cards for secondary content.
- **Shape** — very round: cards ~28px, everything interactive is a pill or circle.
- **Ink** — near-black headings (`#171415`), mid-grey secondary text, pale-grey inactive.
- **Buttons** — dark charcoal pills, light-grey circular icon buttons, white chips.
- **Accent** — orange-coral with peach/rose tag pills; money uses teal (owed to you)
  and crimson (you owe), taken from the banner gradient.
- **Banner** — a "Prussian" mesh gradient drawn by a small in-repo WebGL shader
  (`src/components/GradientBanner.tsx`, no external dependency) with a centred white
  title and a frosted status pill. It falls back to a CSS gradient if WebGL is
  unavailable, pauses when off-screen, and stays still for `prefers-reduced-motion`.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up a Postgres database

Any Postgres instance works (local, Docker, Neon, Supabase, Vercel Postgres…).
Copy `.env.example` to `.env` and set `DATABASE_URL` (and `DIRECT_URL`, which
can be the same value unless your provider requires a separate pooled/direct
connection string):

```bash
cp .env.example .env
```

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. **Push this repo to GitHub** (or GitLab/Bitbucket) and
   [import it into Vercel](https://vercel.com/new).
2. **Create a Postgres database.** The easiest options from the Vercel
   dashboard are Neon or Supabase (under Storage → Create Database), or
   Vercel Postgres if available on your plan. Any managed Postgres works.
3. **Set environment variables** on the Vercel project (Settings →
   Environment Variables):
   - `DATABASE_URL` — your Postgres connection string.
   - `DIRECT_URL` — a non-pooled connection string, if your provider gives
     you a separate one for migrations (Neon and Supabase both do). If not,
     set it to the same value as `DATABASE_URL`.
4. **Deploy.** The build command (`npm run build`) runs
   `prisma migrate deploy && prisma generate && next build`, so your schema
   is applied to the production database automatically on every deploy.
5. Visit your deployed URL, create a group, and share the invite link.

No other configuration is required — there's no auth provider or external
service to wire up.

## How splitting works

Every expense has a `splitType`:

| Split type | What you enter | 
|---|---|
| Equal | Nothing — the total is divided evenly (remainder cents distributed one-by-one) |
| Exact | A dollar amount per participant; must sum to the total |
| Percentage | A percentage per participant; must sum to 100% |
| Shares | A weight per participant (e.g. 2 vs 1); the total is divided proportionally |

Balances are computed by summing, per member, what they paid minus what they
owe across all expenses, plus/minus any settlement payments. "Settle up"
then runs a greedy debt-simplification algorithm (largest creditor paired
with largest debtor, repeated) to produce the minimum number of payments
needed to zero everyone out.

## Identity model

There are no passwords. Creating or joining a group sets an HTTP-only cookie
scoped to that group (`member_<groupId>`) remembering which member you are on
that browser. This mirrors Splid's own model — trust is based on having the
invite link/code, not an account. If you want to switch who you're signed in
as within a group, use "Not \<name\>?" in the group header.
