# CLUBHUB

CLUBHUB is a two-sided university club discovery and recruitment prototype. Students receive personalized club matches, search and save communities, follow deadlines, submit applications, and track review status. Authorized club staff maintain profiles, publish recruitment campaigns, build versioned forms, and review applicants.

> All people, clubs, opportunities, and applications in the classroom demo are fictional or representative. CLUBHUB is not affiliated with UBC or AMS.

## Run the classroom prototype

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. The first-time gateway provides:

- **Continue as Demo Student** — Alex, a Sauder student with finance, consulting, entrepreneurship, and strategy interests.
- **Continue as Demo Club Staff** — ClubHub Staff Demo, an owner of the representative Pacific Finance Association.

The prototype persists isolated fictional data in browser `localStorage`. Do not deploy this static demo alongside real applicant information. Production deployments must set `DEMO_MODE=false`, remove the static persona entry points from the client bundle, and use validated Auth0 sessions plus server-side club permissions.

## Implemented prototype workflows

- Responsive authentication-first gateway and student/staff workspace switcher
- Personalized dashboard and dedicated recommendations view
- Synchronized saved clubs, counters, applications, discovery, and calendar records
- Accessible club dialogs with focus trapping, Escape/backdrop/X closing, scroll reset, and background scroll lock
- Dynamic application forms, required-answer and length validation, duplicate prevention, and form-version references
- My Applications with submitted answers and public review status
- Staff overview, shared club editor, recruitment creation, versioned form builder, applicant review, private notes, and team roles
- Free-text profile analysis with a clearly labeled deterministic fallback
- PDF/DOCX server extraction and consent-gated Gemini structured extraction services
- Auth0 Next.js SDK v4 server boundary and proxy prepared for server-rendered deployment
- Extended Prisma schema, migration, seed data, indexes, scoped relationships, and uniqueness constraints

## Tests and checks

```bash
npm run check:js
npm run typecheck
npm test
npx prisma validate
npx prisma generate
```

The suite covers representative data, form versioning, student/staff isolation, application validation, deadline enforcement, club-scoped authorization, required navigation, and modal interaction wiring.

## PostgreSQL and Prisma

```bash
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
```

The repeatable seed includes 21 clubs, dynamic opportunities, four student personas, the isolated staff demo, two staff teams, three published forms, and fictional submissions. PostgreSQL was not supplied in this workspace, so migration execution and database-backed runtime behavior remain unverified; schema validation and Prisma Client generation pass.

## Auth0 configuration

The server integration follows Auth0's Next.js SDK v4 pattern in `src/integrations/auth0.ts` and `src/proxy.ts`. Configure:

```dotenv
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=...
```

Register the corresponding `/auth/callback` and logout URLs in Auth0. Universal Login authenticates identity; CLUBHUB's approved `ClubStaffMembership` records authorize club access. Selecting “Club Staff” is never authorization. Auth0 credentials were not provided, so live login/logout was not tested.

## Gemini and document processing

The official `@google/genai` server service requests structured JSON, validates it with Zod, removes common contact details, requires explicit consent, and never invents club IDs. Configure:

```dotenv
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

Without a key, the profile page remains functional using transparent keyword extraction and deterministic matching labeled **Basic matching**. PDF and DOCX extraction is implemented server-side with `pdf-parse` and `mammoth`; the static classroom page validates files but does not pretend binary extraction succeeded. Raw CV files are not persisted.

## Security boundaries

- Every production mutation must revalidate the Auth0 session and call the server authorization helpers.
- Staff access is scoped by approved user/club membership and role.
- Students can access only their own submission records.
- Reviewer notes have a separate private model and are never included in student views.
- Duplicate applications are prevented by a composite database constraint.
- Published form versions remain immutable references for historical submissions.
- Gemini keys and Auth0 secrets are server-only variables.
- CVs and biographies are never exposed to club staff or used to rank applicants.

See [the classroom demonstration guide](docs/CLUBHUB_DEMO_GUIDE.md) and [the Phase 1 handoff](docs/PHASE_1_HANDOFF.md).
