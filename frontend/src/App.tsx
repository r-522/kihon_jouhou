import { useState } from "react";
import InputView from "./components/InputView";
import StudyView from "./components/StudyView";
import PastExamView from "./components/PastExamView";
import styles from "./App.module.css";

type Screen = "home" | "input" | "study" | "pastexam";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  if (screen === "input") return <InputView onBack={() => setScreen("home")} />;
  if (screen === "study") return <StudyView onBack={() => setScreen("home")} />;
  if (screen === "pastexam")
    return <PastExamView onBack={() => setScreen("home")} />;

  return (
    <main className={styles.home}>
      <h1 className={styles.title}>基本情報</h1>
      <p className={styles.subtitle}>フラッシュカードで効率的に暗記</p>
      <div className={styles.buttons}>
        <button
          className={styles.btnPrimary}
          onClick={() => setScreen("pastexam")}
        >
          <span className={styles.btnIcon}>📝</span>
          過去問回答
          <span className={styles.btnDesc}>実践形式で学習</span>
        </button>
        <button
          className={styles.btnPrimary}
          onClick={() => setScreen("study")}
        >
          <span className={styles.btnIcon}>✦</span>
          暗記
          <span className={styles.btnDesc}>選択肢で出題</span>
        </button>
      </div>
    </main>
  );
}
