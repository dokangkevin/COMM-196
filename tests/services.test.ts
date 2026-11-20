import test from "node:test";
import assert from "node:assert/strict";
import { assertOpportunityAcceptsApplications, validateApplicationAnswers } from "../src/services/application-validation";
import { requireClubPermission, requireSubmissionOwner } from "../src/services/authorization";

test("application validation enforces required questions, choices, and word limits", () => {
  const questions = [
    { id: "motivation", type: "LONG_TEXT" as const, required: true, limit: 3, limitType: "words" as const },
    { id: "year", type: "MULTIPLE_CHOICE" as const, required: true, options: ["First", "Second"] },
  ];
  assert.deepEqual(validateApplicationAnswers(questions, { motivation: "I enjoy strategy", year: "Second" }), { motivation: "I enjoy strategy", year: "Second" });
  assert.throws(() => validateApplicationAnswers(questions, { motivation: "", year: "Second" }), /Missing required/);
  assert.throws(() => validateApplicationAnswers(questions, { motivation: "I really enjoy strategic projects", year: "Second" }), /exceeds limit/);
  assert.throws(() => validateApplicationAnswers(questions, { motivation: "I enjoy strategy", year: "Fifth" }), /Invalid choice/);
});

test("opportunity checks enforce publication and dates", () => {
  const now = new Date("2026-11-20T20:00:00Z");
  assert.doesNotThrow(() => assertOpportunityAcceptsApplications({ publicationStatus: "PUBLISHED", applicationOpens: new Date("2026-11-19T20:00:00Z"), applicationDeadline: new Date("2026-11-21T20:00:00Z") }, now));
  assert.throws(() => assertOpportunityAcceptsApplications({ publicationStatus: "DRAFT", applicationOpens: now, applicationDeadline: new Date("2026-11-21T20:00:00Z") }, now), /not published/);
  assert.throws(() => assertOpportunityAcceptsApplications({ publicationStatus: "PUBLISHED", applicationOpens: new Date("2026-11-21T20:00:00Z"), applicationDeadline: new Date("2026-11-22T20:00:00Z") }, now), /not opened/);
});

test("club permissions are scoped by club and role", () => {
  const memberships = [{ userId: "owner", clubId: "club-a", role: "OWNER" as const, status: "APPROVED" as const }, { userId: "reviewer", clubId: "club-a", role: "REVIEWER" as const, status: "APPROVED" as const }];
  assert.equal(requireClubPermission("owner", "club-a", "team:manage", memberships).role, "OWNER");
  assert.equal(requireClubPermission("reviewer", "club-a", "applications:review", memberships).role, "REVIEWER");
  assert.throws(() => requireClubPermission("reviewer", "club-a", "team:manage", memberships), /Forbidden/);
  assert.throws(() => requireClubPermission("owner", "club-b", "club:edit", memberships), /Forbidden/);
  assert.doesNotThrow(() => requireSubmissionOwner("student-a", "student-a"));
  assert.throws(() => requireSubmissionOwner("student-a", "student-b"), /Forbidden/);
});
