import { useState } from "react";
import { createCard } from "../lib/api";
import styles from "./InputView.module.css";

type Props = { onBack: () => void };

const EMPTY = {
  question: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  correct: "a" as const,
};

export default function InputView({ onBack }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof EMPTY) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCard(form);
      setSaved(true);
      setForm(EMPTY);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>
          ‹ 戻る
        </button>
        <h2 className={styles.heading}>入力</h2>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          問題文
          <textarea
            className={styles.textarea}
            value={form.question}
            onChange={set("question")}
            required
            rows={3}
            placeholder="問題を入力してください"
          />
        </label>

        {(["a", "b", "c", "d"] as const).map((k, i) => (
          <label key={k} className={styles.label}>
            選択肢 {["ア", "イ", "ウ", "エ"][i]}
            <input
              className={styles.input}
              value={form[`choice_${k}` as keyof typeof form] as string}
              onChange={set(`choice_${k}` as keyof typeof EMPTY)}
              required
              placeholder={`選択肢${["ア", "イ", "ウ", "エ"][i]}`}
            />
          </label>
        ))}

        <label className={styles.label}>
          正解
          <select
            className={styles.select}
            value={form.correct}
            onChange={set("correct")}
          >
            {(["a", "b", "c", "d"] as const).map((k, i) => (
              <option key={k} value={k}>
                {["ア", "イ", "ウ", "エ"][i]}
              </option>
            ))}
          </select>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submit} type="submit" disabled={saving}>
          {saving ? "保存中…" : saved ? "✓ 保存しました" : "保存"}
        </button>
      </form>
    </div>
  );
}
