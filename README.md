<<<<<<< HEAD
# COMM-196
Club search bar
=======
# CLUBHUB — Phase 1

CLUBHUB is a polished student club discovery and recruitment-calendar prototype. It demonstrates how different students can receive meaningfully different recommendations, explore representative university clubs, save favourites, and see recruitment dates in one place.

> All clubs and opportunities are fictional or representative demo data. CLUBHUB is not affiliated with UBC or AMS.

## Run the working demo

No installation is required for the browser prototype:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`. The demo stores profile edits and saved clubs in browser `localStorage`, isolated by persona.

Run the available automated checks:

```bash
python3 tests/test_static_app.py
```

## PostgreSQL / Prisma foundation

The repository includes the Phase 1 PostgreSQL schema, initial SQL migration, repeatable Prisma seed, a current-user abstraction, and a reusable recommendation service. To run that foundation in an environment with Node.js 20+ and PostgreSQL:

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

`DATABASE_URL` is the only required environment variable. This workspace did not provide Node.js, npm, PostgreSQL, or database credentials, so the database migration and seed could not be executed here. The current presentation runtime is therefore browser-backed; it does not claim to be connected to PostgreSQL.

## Highlights

- Responsive landing page and student portal
- 21 diverse representative clubs and 13 recruitment opportunities
- Four development personas with distinct profile-driven recommendations
- Deterministic matching: interests 50%, academics 25%, recruitment 15%, time fit 10%
- Fuzzy search, combined filters, and four sorts
- Club profiles, opportunity details, and per-persona saved clubs
- Month/week calendar generated from recruitment opening and deadline records
- Calendar filters and `.ics` export
- Multi-step onboarding and editable preferences
- Prisma schema designed for later Auth0 and application workflows

See [docs/PHASE_1_HANDOFF.md](docs/PHASE_1_HANDOFF.md) for architecture, limitations, and Phase 2 guidance.
>>>>>>> fb248e0 (start)
