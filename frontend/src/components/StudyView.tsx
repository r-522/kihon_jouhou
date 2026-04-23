import { useEffect, useState, useCallback } from 'react'
import { getDueCards, submitReview } from '../lib/api'
import { CHOICE_LABELS, type Card, type ChoiceKey } from '../lib/types'
import styles from './StudyView.module.css'

type Props = { onBack: () => void }
type ShuffledChoice = { key: ChoiceKey; label: string; text: string }
type Phase = 'loading' | 'question' | 'result' | 'done'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function StudyView({ onBack }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<ShuffledChoice[]>([])
  const [selected, setSelected] = useState<ChoiceKey | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')

  const loadCards = useCallback(async () => {
    setPhase('loading')
    try {
      const data = await getDueCards()
      if (!data.length) { setPhase('done'); return }
      setCards(data)
      setIndex(0)
      setPhase('question')
    } catch {
      setPhase('done')
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  useEffect(() => {
    if (phase !== 'question' || !cards[index]) return
    const card = cards[index]
    const raw: ShuffledChoice[] = (['a', 'b', 'c', 'd'] as ChoiceKey[]).map(k => ({
      key: k,
      label: CHOICE_LABELS[k],
      text: card[`choice_${k}` as keyof Card] as string,
    }))
    setChoices(shuffle(raw))
    setSelected(null)
  }, [phase, index, cards])

  const handleSelect = async (key: ChoiceKey) => {
    if (selected) return
    setSelected(key)
    setPhase('result')
    await submitReview(cards[index].id, key).catch(() => {})
  }

  const next = () => {
    const nextIndex = index + 1
    if (nextIndex >= cards.length) { setPhase('done'); return }
    setIndex(nextIndex)
    setPhase('question')
  }

  const card = cards[index]

  if (phase === 'loading') return <CenterMessage onBack={onBack}>読み込み中…</CenterMessage>
  if (phase === 'done') return (
    <CenterMessage onBack={onBack}>
      <span style={{ fontSize: '2.4rem' }}>🎉</span>
      <strong>本日の学習完了</strong>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>復習カードがありません</span>
    </CenterMessage>
  )

  const isCorrect = selected === card.correct

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>‹ 戻る</button>
        <span className={styles.progress}>{index + 1} / {cards.length}</span>
      </header>

      <div className={styles.card}>
        <p className={styles.question}>{card.question}</p>
      </div>

      <div className={styles.choices}>
        {choices.map(c => {
          let mod = ''
          if (selected) {
            if (c.key === card.correct) mod = styles.correct
            else if (c.key === selected) mod = styles.wrong
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
          )
        })}
      </div>

      {phase === 'result' && (
        <div className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
          <span>{isCorrect ? '正解！' : `不正解　正解は「${CHOICE_LABELS[card.correct]}」`}</span>
          <button className={styles.next} onClick={next}>次へ ›</button>
        </div>
      )}
    </div>
  )
}

function CenterMessage({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>‹ 戻る</button>
      </header>
      <div className={styles.center}>{children}</div>
    </div>
  )
}
