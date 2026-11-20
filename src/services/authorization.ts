export type ClubRole = "OWNER" | "EDITOR" | "REVIEWER";
export type ClubPermission = "club:edit" | "recruitment:write" | "applications:review" | "team:manage";

const PERMISSIONS: Record<ClubRole, ReadonlySet<ClubPermission>> = {
  OWNER: new Set(["club:edit", "recruitment:write", "applications:review", "team:manage"]),
  EDITOR: new Set(["club:edit", "recruitment:write"]),
  REVIEWER: new Set(["applications:review"]),
};

export type ApprovedMembership = { userId: string; clubId: string; role: ClubRole; status: "APPROVED" };

export function requireClubPermission(
  authenticatedUserId: string | null,
  requestedClubId: string,
  permission: ClubPermission,
  memberships: ApprovedMembership[],
): ApprovedMembership {
  if (!authenticatedUserId) throw new Error("Unauthenticated");
  const membership = memberships.find((item) => item.userId === authenticatedUserId && item.clubId === requestedClubId);
  if (!membership || !PERMISSIONS[membership.role].has(permission)) throw new Error("Forbidden");
  return membership;
}

export function requireSubmissionOwner(authenticatedStudentId: string | null, submissionStudentId: string): void {
  if (!authenticatedStudentId || authenticatedStudentId !== submissionStudentId) throw new Error("Forbidden");
}
