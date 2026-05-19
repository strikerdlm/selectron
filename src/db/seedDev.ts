import { db } from "./schema";
import { createCandidate, upsertCriterionEntry } from "./repository";

const DEV_FIXTURES = [
  { alias: "alpha-demo", scores: { "psych.conscientiousness": 60, "psych.emotional_stability": 50 } },
  { alias: "bravo-demo", scores: { "psych.conscientiousness": 75, "psych.emotional_stability": 70 } },
  { alias: "charlie-demo", scores: { "psych.conscientiousness": 45, "psych.emotional_stability": 55 } },
];

export async function seedDevIfEmpty(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const count = await db.candidates.count();
  if (count > 0) return;
  for (const fx of DEV_FIXTURES) {
    const c = await createCandidate({ alias: fx.alias });
    for (const [criterionId, rawValue] of Object.entries(fx.scores)) {
      await upsertCriterionEntry({
        candidateId: c.id,
        criterionId,
        rawValue,
        citationFree: "seed fixture",
      });
    }
  }
}
