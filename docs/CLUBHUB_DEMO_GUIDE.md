# CLUBHUB classroom demonstration guide

## Launch

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. For a clean rehearsal, clear this origin's browser storage and reload to return to the account gateway.

## Scene 1 — Student login and personalized discovery

1. Choose **Continue as Demo Student**.
2. The Alex dashboard shows three data-driven statistic cards.
3. Open **Top matches ready** to show the same three recommendations and explanations used on the dashboard.
4. Open a club, save it, and close the profile with the X, Escape, or backdrop.
5. Open **Saved clubs** from the statistic card and confirm the shared count and list changed.

## Scene 2 — Profile matching

1. Open **Profile**.
2. In **Tell us about yourself**, enter:

   > I organized charity events, joined debate, and enjoy international politics and public speaking. I want to volunteer and build leadership experience.

3. Choose **Analyze for demo matches**.
4. Explain that the visible result is labeled Basic matching because no Gemini key is configured.
5. Review the extracted interests, confirm them, and show the recommendations updating.

PDF/DOCX files are validated in the static interface, while private content extraction runs only in the server service. A text file can demonstrate local extraction without retaining the raw file.

## Scene 3 — Club staff workspace

1. Use the demo identity menu to open the Auth0 welcome gateway, or clear site storage and reload.
2. Choose **Continue as Demo Club Staff**.
3. Show the Pacific Finance Association overview, current applicant totals, and recent submissions.
4. Open **Club Profile**, change a description, save it, and preview the same public club component students see.
5. Open **Recruitment** and create an opportunity. Choose Published so its opening/deadline immediately enters shared student records and the calendar.
6. Open **Forms**, edit a form, add or reorder a question, and save. This creates a new published version while preserving the prior version for historical submissions.

## Scene 4 — Student applies

1. Switch back to **Student Dashboard** using the workspace and identity controls.
2. Find Pacific Finance Association through Discover.
3. Open the published opportunity and choose **Apply now**.
4. Complete required questions and submit.
5. Confirm that My Applications and the dashboard submitted count update from the same stored submission.

If a seeded opportunity has closed because its dynamic dates elapsed, publish a new staff opportunity and associate a form before the classroom presentation.

## Scene 5 — Staff review and status synchronization

1. Return to the ClubHub Staff Demo workspace.
2. Open **Applicants** and choose the new application.
3. Read the submitted answers, set status to **Under Review**, optionally add a private note, and save.
4. Return to the student workspace and open **My Applications**.
5. Confirm the public status changed while the private note is absent.

## External-service fallback

- **Auth0 unavailable:** use only the clearly labeled local classroom identities with fictional data. Never add a production login bypass.
- **Gemini unavailable:** use deterministic Basic matching. Never describe it as a Gemini response.
- **PostgreSQL unavailable:** use browser persistence for the classroom sequence. Do not claim it demonstrates production durability.

## Production checklist

- Set `DEMO_MODE=false` and exclude classroom identities from the production client.
- Configure Auth0 callback, logout, and origin URLs exactly.
- Keep all Auth0 and Gemini values server-only.
- Apply both Prisma migrations and seed only a demonstration environment.
- Re-run type checks, tests, Prisma validation, and browser end-to-end tests.
