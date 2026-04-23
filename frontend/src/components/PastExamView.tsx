import { useEffect, useState, useCallback } from "react";
import { getPastExams, submitPastExamReview } from "../lib/api";
import {
  CHOICE_LABELS,
  type PastExamProblem,
  type PastExamData,
  type ChoiceKey,
} from "../lib/types";
import styles from "./StudyView.module.css";

type Props = { onBack: () => void };
type ShuffledChoice = { key: ChoiceKey; label: string; text: string };
type Phase = "loading" | "question" | "result" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PastExamView({ onBack }: Props) {
  const [data, setData] = useState<PastExamData | null>(null);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<ShuffledChoice[]>([]);
  const [selected, setSelected] = useState<ChoiceKey | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  const loadExams = useCallback(async () => {
    setPhase("loading");
    try {
      const examData = await getPastExams();
      if (!examData.problems.length) {
        setPhase("done");
        return;
      }
      setData(examData);
      setIndex(0);
      setPhase("question");
    } catch {
      setPhase("done");
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    if (phase !== "question" || !data || !data.problems[index]) return;
    const problem = data.problems[index];
    const raw: ShuffledChoice[] = (["a", "b", "c", "d"] as ChoiceKey[]).map(
      (k) => ({
        key: k,
        label: CHOICE_LABELS[k],
        text: problem[`choice_${k}` as keyof PastExamProblem] as string,
      }),
    );
    setChoices(shuffle(raw));
    setSelected(null);
  }, [phase, index, data]);

  const handleSelect = async (key: ChoiceKey) => {
    if (selected) return;
    setSelected(key);
    setPhase("result");
    if (data) {
      const problem = data.problems[index];
      await submitPastExamReview(problem.problem_id, key).catch(() => {});
    }
  };

  const next = () => {
    if (!data) return;
    const nextIndex = index + 1;
    if (nextIndex >= data.problems.length) {
      setPhase("done");
      return;
    }
    setIndex(nextIndex);
    setPhase("question");
  };

  if (phase === "loading")
    return <CenterMessage onBack={onBack}>読み込み中…</CenterMessage>;
  if (phase === "done" || !data)
    return (
      <CenterMessage onBack={onBack}>
        <span style={{ fontSize: "2.4rem" }}>🎉</span>
        <strong>過去問学習完了</strong>
        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          全問題の解答が終わりました
        </span>
      </CenterMessage>
    );

  const problem = data.problems[index];
  const isCorrect = selected === problem.correct;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          ‹ 戻る
        </button>
        <span className={styles.progress}>
          {index + 1} / {data.problems.length}
        </span>
      </header>

      <div className={styles.card}>
        <p className={styles.question}>{problem.question}</p>
      </div>

      <div className={styles.choices}>
        {choices.map((c) => {
          let mod = "";
          if (selected) {
            if (c.key === problem.correct) mod = styles.correct;
            else if (c.key === selected) mod = styles.wrong;
          }
          return (
            <button
              key={c.key}
              className={`${styles.choice} ${mod}`}
              onClick={() => handleSelect(c.key)}
              disabled={!!selected}
            >
              <span className={styles.choiceLabel}>{c.label}</span>
              <span className={styles.choiceText}>{c.text}</span>
            </button>
          );
        })}
      </div>

      {phase === "result" && (
        <div
          className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
        >
          <span>
            {isCorrect
              ? "正解！"
              : `不正解　正解は「${CHOICE_LABELS[problem.correct]}」`}
          </span>
          <div style={{ marginTop: "12px", fontSize: "0.9rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>
              {problem.explanation}
            </p>
          </div>
          <button className={styles.next} onClick={next}>
            次へ ›
          </button>
        </div>
      )}
    </div>
  );
}

function CenterMessage({
  onBack,
  children,
}: {
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          ‹ 戻る
        </button>
      </header>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
