CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "OnboardingState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');
CREATE TYPE "EventType" AS ENUM ('INFORMATION_SESSION', 'CLUB_EVENT');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "externalAuthId" TEXT, "displayName" TEXT NOT NULL, "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "university" TEXT NOT NULL DEFAULT 'University of British Columbia',
  "faculty" TEXT NOT NULL, "major" TEXT NOT NULL, "academicYear" INTEGER NOT NULL, "interests" TEXT[],
  "preferredHoursPerWeek" INTEGER, "onboardingState" "OnboardingState" NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Club" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT NOT NULL,
  "mission" TEXT NOT NULL, "category" TEXT NOT NULL, "tags" TEXT[], "academicRelevance" TEXT[],
  "imageRef" TEXT, "contactEmail" TEXT, "socialLinks" JSONB, "membershipInformation" TEXT NOT NULL,
  "expectedHoursPerWeek" INTEGER, "activities" TEXT[], "isRepresentativeDemoData" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecruitmentOpportunity" (
  "id" TEXT NOT NULL, "clubId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "requirements" TEXT NOT NULL, "applicationOpens" TIMESTAMP(3) NOT NULL, "applicationDeadline" TIMESTAMP(3) NOT NULL,
  "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "RecruitmentOpportunity_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ClubEvent" (
  "id" TEXT NOT NULL, "clubId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL,
  "eventType" "EventType" NOT NULL, "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SavedClub" (
  "studentId" TEXT NOT NULL, "clubId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedClub_pkey" PRIMARY KEY ("studentId", "clubId")
);
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_externalAuthId_idx" ON "User"("externalAuthId");
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE INDEX "StudentProfile_faculty_idx" ON "StudentProfile"("faculty");
CREATE INDEX "StudentProfile_interests_idx" ON "StudentProfile" USING GIN ("interests");
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");
CREATE INDEX "Club_category_idx" ON "Club"("category");
CREATE INDEX "Club_tags_idx" ON "Club" USING GIN ("tags");
CREATE INDEX "Club_academicRelevance_idx" ON "Club" USING GIN ("academicRelevance");
CREATE INDEX "RecruitmentOpportunity_clubId_publicationStatus_idx" ON "RecruitmentOpportunity"("clubId", "publicationStatus");
CREATE INDEX "RecruitmentOpportunity_applicationOpens_idx" ON "RecruitmentOpportunity"("applicationOpens");
CREATE INDEX "RecruitmentOpportunity_applicationDeadline_idx" ON "RecruitmentOpportunity"("applicationDeadline");
CREATE INDEX "ClubEvent_clubId_startsAt_idx" ON "ClubEvent"("clubId", "startsAt");
CREATE INDEX "ClubEvent_eventType_startsAt_idx" ON "ClubEvent"("eventType", "startsAt");
CREATE INDEX "SavedClub_clubId_idx" ON "SavedClub"("clubId");
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentOpportunity" ADD CONSTRAINT "RecruitmentOpportunity_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedClub" ADD CONSTRAINT "SavedClub_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedClub" ADD CONSTRAINT "SavedClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
