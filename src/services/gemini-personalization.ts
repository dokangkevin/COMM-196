import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ExtractedProfile = z.object({
  academicInterests: z.array(z.string()).max(12),
  technicalSkills: z.array(z.string()).max(12),
  leadershipExperience: z.array(z.string()).max(8),
  volunteeringExperience: z.array(z.string()).max(8),
  extracurricularActivities: z.array(z.string()).max(12),
  professionalInterests: z.array(z.string()).max(12),
  hobbies: z.array(z.string()).max(12),
  careerGoals: z.array(z.string()).max(8),
  preferredInvolvement: z.array(z.string()).max(8),
});
export type ExtractedStudentProfile = z.infer<typeof ExtractedProfile>;

function minimizeProfileText(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email removed]")
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, "[phone removed]")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9 .'-]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr)\b/gi, "[address removed]")
    .slice(0, 12_000);
}

export async function extractStudentProfileWithGemini(text: string, consent: boolean): Promise<ExtractedStudentProfile> {
  if (!consent) throw new Error("Explicit AI-processing consent is required");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: `Extract only explicitly stated, non-sensitive interests, skills, experiences, hobbies, goals, and involvement preferences. Do not infer protected or sensitive traits.\n\nPROFILE:\n${minimizeProfileText(text)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["academicInterests", "technicalSkills", "leadershipExperience", "volunteeringExperience", "extracurricularActivities", "professionalInterests", "hobbies", "careerGoals", "preferredInvolvement"],
        properties: Object.fromEntries(["academicInterests", "technicalSkills", "leadershipExperience", "volunteeringExperience", "extracurricularActivities", "professionalInterests", "hobbies", "careerGoals", "preferredInvolvement"].map((key) => [key, { type: Type.ARRAY, items: { type: Type.STRING } }]))
      }
    }
  });
  return ExtractedProfile.parse(JSON.parse(response.text || "{}"));
}
