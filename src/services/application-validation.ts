export type FormQuestion = {
  id: string;
  type: "SHORT_TEXT" | "LONG_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOXES" | "DROPDOWN";
  required: boolean;
  options?: string[];
  limit?: number;
  limitType?: "words" | "characters";
};

export function validateApplicationAnswers(questions: FormQuestion[], answers: Record<string, unknown>): Record<string, string | string[]> {
  const validated: Record<string, string | string[]> = {};
  for (const question of questions) {
    const raw = answers[question.id];
    const values = Array.isArray(raw) ? raw.map(String).filter(Boolean) : raw == null ? [] : [String(raw).trim()].filter(Boolean);
    if (question.required && values.length === 0) throw new Error(`Missing required answer: ${question.id}`);
    if (question.type === "CHECKBOXES") {
      if (values.some((value) => !question.options?.includes(value))) throw new Error(`Invalid choice: ${question.id}`);
      validated[question.id] = values;
      continue;
    }
    const value = values[0] ?? "";
    if (["MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type) && value && !question.options?.includes(value)) throw new Error(`Invalid choice: ${question.id}`);
    if (question.limit && value) {
      const length = question.limitType === "words" ? value.split(/\s+/).filter(Boolean).length : value.length;
      if (length > question.limit) throw new Error(`Answer exceeds limit: ${question.id}`);
    }
    validated[question.id] = value;
  }
  return validated;
}

export function assertOpportunityAcceptsApplications(opportunity: { publicationStatus: string; applicationOpens: Date; applicationDeadline: Date }, now = new Date()): void {
  if (opportunity.publicationStatus !== "PUBLISHED") throw new Error("Opportunity is not published");
  if (now < opportunity.applicationOpens) throw new Error("Applications have not opened");
  if (now > opportunity.applicationDeadline) throw new Error("Applications are closed");
}
