export type RecommendationInput = {
  interests: string[];
  faculty: string;
  preferredHoursPerWeek?: number | null;
};

export type RecommendableClub = {
  id: string;
  tags: string[];
  academicRelevance: string[];
  expectedHoursPerWeek?: number | null;
  isRecruiting: boolean;
};

export type ClubRecommendation = {
  clubId: string;
  score: number;
  explanation: string;
};

/** Deterministic, replaceable Phase 1 recommendation strategy. */
export function recommendClub(profile: RecommendationInput, club: RecommendableClub): ClubRecommendation {
  const interests = profile.interests.map((value) => value.toLowerCase());
  const matches = club.tags.filter((tag) => interests.some((interest) => interest.includes(tag) || tag.includes(interest)));
  const interestScore = matches.length / Math.max(1, Math.min(3, club.tags.length));
  const academicScore = club.academicRelevance.some((faculty) => faculty === "All Faculties" || faculty === profile.faculty) ? 1 : 0;
  const recruitmentScore = club.isRecruiting ? 1 : 0;
  const timeScore = profile.preferredHoursPerWeek && club.expectedHoursPerWeek
    ? Math.max(0, 1 - Math.abs(profile.preferredHoursPerWeek - club.expectedHoursPerWeek) / Math.max(profile.preferredHoursPerWeek, club.expectedHoursPerWeek))
    : 0;
  const score = Math.round(Math.min(1, interestScore * 0.5 + academicScore * 0.25 + recruitmentScore * 0.15 + timeScore * 0.1) * 100);
  const explanation = matches.length
    ? `Matches your interest${matches.length > 1 ? "s" : ""} in ${matches.slice(0, 2).join(" and ")}.`
    : academicScore
      ? `Relevant to your ${profile.faculty} academic background.`
      : `A chance to explore ${club.tags[0]} beyond your usual interests.`;
  return { clubId: club.id, score, explanation };
}
