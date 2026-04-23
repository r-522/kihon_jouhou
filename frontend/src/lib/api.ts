import type { Card, ChoiceKey } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(await res.text())
  if (res.status === 204) return undefined as T
  return res.json()
}

export const getDueCards = (): Promise<Card[]> =>
  request('/cards/due')

export const createCard = (data: {
  question: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  correct: ChoiceKey
}): Promise<Card> =>
  request('/cards', { method: 'POST', body: JSON.stringify(data) })

export const submitReview = (cardId: string, answered: ChoiceKey): Promise<void> =>
  request('/review', {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId, answered }),
  })
