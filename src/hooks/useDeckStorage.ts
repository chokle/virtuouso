import { useCallback, useEffect, useState } from "react";

export type Deck = {
  id: string;
  prompt: string;
  cards: string[];
  createdAt: number;
};

const CURRENT_KEY = "flashcards.current";
const RECENT_KEY = "flashcards.recent";
const RECENT_MAX = 5;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useDeckStorage() {
  const [current, setCurrent] = useState<Deck | null>(null);
  const [recent, setRecent] = useState<Deck[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrent(safeParse<Deck>(localStorage.getItem(CURRENT_KEY)));
    setRecent(safeParse<Deck[]>(localStorage.getItem(RECENT_KEY)) ?? []);
    setHydrated(true);
  }, []);

  const saveCurrent = useCallback((deck: Deck | null) => {
    setCurrent(deck);
    if (deck) localStorage.setItem(CURRENT_KEY, JSON.stringify(deck));
    else localStorage.removeItem(CURRENT_KEY);
  }, []);

  const pushRecent = useCallback((deck: Deck) => {
    setRecent((prev) => {
      const next = [deck, ...prev.filter((d) => d.id !== deck.id)].slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { current, recent, hydrated, saveCurrent, pushRecent, removeRecent };
}
