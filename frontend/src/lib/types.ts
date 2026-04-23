export type ChoiceKey = "a" | "b" | "c" | "d";

export const CHOICE_LABELS: Record<ChoiceKey, string> = {
  a: "ア",
  b: "イ",
  c: "ウ",
  d: "エ",
};

export type Card = {
  id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct: ChoiceKey;
  interval_days: number;
  ease_factor: number;
  next_review: string;
  review_count: number;
  created_at: string;
  updated_at: string;
};

export type PastExamProblem = {
  problem_id: string;
  number: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct: ChoiceKey;
  explanation: string;
};

export type PastExamData = {
  year: string;
  examination: string;
  exam_date: string;
  total_questions: number;
  problems: PastExamProblem[];
};
