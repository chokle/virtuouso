# Flashcard Generator

A minimal app that turns a prompt into a set of single-sided flashcards. Decks persist in the browser (localStorage). Cards can be shuffled by click or manually reordered by drag.

## User flow

1. On `/`, user sees a prompt input ("Generate flashcards about…"), a count selector (e.g. 5/10/15/20, default 10), and a Generate button.
2. On submit, a server function calls Lovable AI Gateway (Gemini Flash Lite) and returns an array of short card texts.
3. Cards render as a responsive grid of tiles — single side only, one string per card.
4. Interactions on the deck:
   - **Click a card** → shuffles the whole deck with a quick animation.
   - **Drag a card** → reorder manually into a chosen sequence.
   - **Reset order** → restores original generated order.
   - **Clear** → wipes current deck.
5. Deck + prompt are auto-saved to `localStorage` so a refresh restores state. A small "Recent decks" list (last 3–5) lets the user reload prior decks.

## Screens

- `/` — single page: prompt form on top, active deck below, recent decks in a collapsible section.

## Technical details

**Frontend**
- `src/routes/index.tsx` — replaces placeholder. Holds prompt form, deck grid, controls.
- `src/components/FlashcardGrid.tsx` — renders tiles, handles click-shuffle animation.
- `src/components/PromptForm.tsx` — textarea + count select + submit.
- `src/hooks/useDeckStorage.ts` — read/write current deck + recent decks in localStorage (guarded for SSR via `useEffect`).
- Drag-to-reorder using native HTML5 drag events (no extra library) to stay lean. Shuffle = Fisher-Yates.

**Backend (server function, credit-friendly)**
- `src/lib/flashcards.functions.ts` — `generateFlashcards` createServerFn.
  - Input: `{ prompt: string, count: number }`, validated with Zod (count clamped 3–20, prompt ≤ 500 chars).
  - Reads `LOVABLE_API_KEY` inside handler; POSTs to `https://ai.gateway.lovable.dev/v1/chat/completions`.
  - Model: `google/gemini-2.5-flash-lite` (cheapest).
  - Uses a tight system prompt + `response_format: json_schema` requesting `{ cards: string[] }` so we get structured output in one call — no retries, no follow-ups.
  - Low `max_tokens` cap (~600) sized to requested count to keep spend minimal.
  - Handles 429/402 by returning a friendly error the UI can show.
- Called from the component via `useServerFn` inside a `useMutation` (not a route loader, so no SSR prerender cost).

**Styling / design tokens**
- Uses existing semantic tokens in `src/styles.css`; no hardcoded colors. Cards use `bg-card`, `text-card-foreground`, subtle `border`, small `rounded-lg` shadow. Shuffle animation via Tailwind transform + transition.

**SEO / head**
- `head()` on `/` with unique title ("Flashcard Generator — Prompt to Study Cards"), meta description, og/twitter tags. No og:image (no hero image).

## Out of scope

- No accounts, no database, no export/import, no spaced repetition, no front/back flip.

## Files to add/modify

- modify: `src/routes/index.tsx`, `src/routes/__root.tsx` (only if needed; likely leave alone)
- add: `src/lib/flashcards.functions.ts`, `src/components/PromptForm.tsx`, `src/components/FlashcardGrid.tsx`, `src/hooks/useDeckStorage.ts`
- enable Lovable AI Gateway (sets `LOVABLE_API_KEY`)
