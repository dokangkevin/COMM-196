CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'EDITOR', 'REVIEWER');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');
CREATE TYPE "ReviewStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'ACCEPTED', 'NOT_SELECTED', 'WITHDRAWN');

ALTER TABLE "StudentProfile"
  ADD COLUMN "biography" TEXT,
  ADD COLUMN "extractedProfile" JSONB,
  ADD COLUMN "cvFileName" TEXT,
  ADD COLUMN "cvProcessedAt" TIMESTAMP(3);

ALTER TABLE "RecruitmentOpportunity"
  ADD COLUMN "responsibilities" TEXT,
  ADD COLUMN "expectedHoursPerWeek" INTEGER,
  ADD COLUMN "preferredExperience" TEXT,
  ADD COLUMN "positionsAvailable" INTEGER,
  ADD COLUMN "additionalNotes" TEXT;

CREATE TABLE "ClubStaffMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "role" "StaffRole" NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubStaffMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClubAccessRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "clubId" TEXT,
  "proposedClubData" JSONB,
  "verificationInfo" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationForm" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "schema" JSONB NOT NULL,
  "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationForm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationSubmission" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "formVersion" INTEGER NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationAnswer" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "questionRef" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  CONSTRAINT "ApplicationAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrivateReviewNote" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrivateReviewNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClubStaffMembership_userId_clubId_key" ON "ClubStaffMembership"("userId", "clubId");
CREATE INDEX "ClubStaffMembership_clubId_status_idx" ON "ClubStaffMembership"("clubId", "status");
CREATE INDEX "ClubAccessRequest_status_createdAt_idx" ON "ClubAccessRequest"("status", "createdAt");
CREATE INDEX "ClubAccessRequest_clubId_idx" ON "ClubAccessRequest"("clubId");
CREATE UNIQUE INDEX "ApplicationForm_opportunityId_version_key" ON "ApplicationForm"("opportunityId", "version");
CREATE INDEX "ApplicationForm_opportunityId_publicationStatus_idx" ON "ApplicationForm"("opportunityId", "publicationStatus");
CREATE UNIQUE INDEX "ApplicationSubmission_applicantId_opportunityId_key" ON "ApplicationSubmission"("applicantId", "opportunityId");
CREATE INDEX "ApplicationSubmission_opportunityId_reviewStatus_submittedAt_idx" ON "ApplicationSubmission"("opportunityId", "reviewStatus", "submittedAt");
CREATE INDEX "ApplicationSubmission_applicantId_submittedAt_idx" ON "ApplicationSubmission"("applicantId", "submittedAt");
CREATE UNIQUE INDEX "ApplicationAnswer_submissionId_questionRef_key" ON "ApplicationAnswer"("submissionId", "questionRef");
CREATE INDEX "PrivateReviewNote_submissionId_createdAt_idx" ON "PrivateReviewNote"("submissionId", "createdAt");

ALTER TABLE "ClubStaffMembership" ADD CONSTRAINT "ClubStaffMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubStaffMembership" ADD CONSTRAINT "ClubStaffMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubAccessRequest" ADD CONSTRAINT "ClubAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubAccessRequest" ADD CONSTRAINT "ClubAccessRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClubAccessRequest" ADD CONSTRAINT "ClubAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationForm" ADD CONSTRAINT "ApplicationForm_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecruitmentOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "RecruitmentOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationSubmission" ADD CONSTRAINT "ApplicationSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "ApplicationForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationAnswer" ADD CONSTRAINT "ApplicationAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ApplicationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateReviewNote" ADD CONSTRAINT "PrivateReviewNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ApplicationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateReviewNote" ADD CONSTRAINT "PrivateReviewNote_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
