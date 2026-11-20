# CLUBHUB Phase 1 handoff

## Completed

- Original CLUBHUB visual system with deep navy, warm coral, professional typography, responsive cards, and explicit non-affiliation language.
- Landing experience, Discover, personalized Dashboard, Saved, Profile, and Calendar views.
- Twenty-one rich representative clubs across eight categories, each with a mission, activities, tags, faculty relevance, membership information, time commitment, and an event.
- Thirteen recruitment opportunities with dynamic dates: active, closing soon, opening soon, and closed examples.
- Four demo personas (Alex, Maya, Jordan, and Sam) whose results come from the same deterministic algorithm rather than name-specific lists.
- Case-insensitive fuzzy search over club and opportunity fields; category, interest, recruitment, and commitment filters; relevance, match, alphabetic, and deadline sorts.
- Save/unsave from cards and profiles, persisted per persona in browser storage.
- Month and week calendar views. Recruitment opening/deadline entries are derived from opportunity data. Filters support event type, saved clubs, and recommended clubs. Upcoming events can be exported as `.ics`.
- Multi-step onboarding, editable profile preferences, and Phase 2 application placeholder.
- PostgreSQL Prisma schema, SQL migration, repeatable/upsert-based seed, production-guarded current-user provider, and standalone recommendation service.

## Architecture

The presentation UI is a buildless single-page application so it can run in the supplied environment without a package install. `data.js` owns representative records. `app.js` owns routing, view rendering, state, personalization, search, persistence, and calendar derivation. `styles.css` is the shared responsive design system.

The service foundation is intentionally separate:

- `prisma/schema.prisma`: normalized durable model.
- `prisma/migrations/.../migration.sql`: initial PostgreSQL migration.
- `prisma/seed.ts`: idempotent clubs/personas plus replace-on-title dynamic opportunities and events.
- `src/services/current-user.ts`: authentication boundary; development personas throw in production.
- `src/services/recommendation.ts`: deterministic provider that can later sit behind an API route or be swapped for another implementation.

## Database models

- `User`: nullable unique external auth ID, optional email, display identity.
- `StudentProfile`: one-to-one user profile, faculty, major, year, interests, time preference, onboarding state.
- `Club`: unique slug, content, category, array-indexed tags and academic relevance, contact/social/membership fields.
- `RecruitmentOpportunity`: publication lifecycle, opening time, deadline, requirements, club relation.
- `ClubEvent`: information sessions and club events.
- `SavedClub`: composite key prevents duplicate saves.

The schema uses cascade rules and indexes for category, arrays, dates, event type, status, and foreign-key access patterns.

## Routes and experiences

The zero-build demo uses hash routes: `#/home`, `#/discover`, `#/dashboard`, `#/calendar`, `#/saved`, and `#/profile`. Club and calendar details use accessible in-app dialogs. In the future Next.js service, map these to App Router pages and expose recommendations, clubs, profile updates, saves, and calendar events through server routes/actions.

## Demo profile setup

Use the header switcher to select Alex (business), Maya (science), Jordan (arts), or Sam (social impact). The switcher is deliberately labeled `DEV ONLY`; it is not authentication. Profile and save changes are namespaced in `localStorage`. The production current-user provider refuses to run development personas when `NODE_ENV=production`.

## Setup and testing

```bash
# Presentation runtime
python3 -m http.server 4173

# Automated static/data/schema tests
python3 tests/test_static_app.py

# Service foundation — requires Node.js 20+ and PostgreSQL
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Environment variable: `DATABASE_URL` (PostgreSQL connection string).

## Verification and known issues

- Automated checks validate club/opportunity/persona counts, required Prisma models and uniqueness, core experiences, accessibility shell, persistence, recommendation/search/calendar functions, and the production guard.
- The local server was verified over HTTP.
- The supplied workspace had no Node.js/npm/PostgreSQL or database credentials. Prisma generation, migration execution, seed execution, TypeScript checking, and linting could not run.
- Browser visual QA could not run because the session's browser-access host was unavailable. Responsive CSS is implemented at 900 px and 640 px breakpoints, but final screenshot review remains recommended.
- The working presentation uses browser persistence rather than claiming an unverified database connection. Wiring the Prisma repository into a server runtime is the first infrastructure task below.
- Google Fonts require an internet connection; system sans-serif fallbacks preserve layout when offline.

## Phase 2 must preserve

- Keep authentication behind `CurrentUserProvider`; never treat the persona selector as auth.
- Keep saves keyed by `StudentProfile`, not raw browser identity.
- Keep calendar recruitment entries derived from `RecruitmentOpportunity` opening/deadline fields.
- Preserve the composite unique key for saves and authorization checks at service boundaries.
- Preserve deterministic recommendations as a tested fallback even if an optional new provider is added.
- Do not expose staff or applicant data through the development persona path.

## Recommended next steps

1. Install Node.js 20+ and PostgreSQL, run the migration and seed, and verify Prisma types.
2. Create the Next.js App Router service and move the working views into React components without changing the information architecture.
3. Add repositories/server actions for clubs, search, profiles, saves, recommendations, and calendar events; use PostgreSQL full-text/trigram indexes for production typo tolerance.
4. Add Auth0 behind `CurrentUserProvider`, remove the persona UI from production bundles, and implement student/staff authorization tests.
5. Run Playwright desktop/mobile visual and interaction coverage before the presentation.
