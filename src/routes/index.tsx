import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PromptForm } from "@/components/PromptForm";
import { FlashcardGrid } from "@/components/FlashcardGrid";
import { useDeckStorage, type Deck } from "@/hooks/useDeckStorage";
import { generateFlashcards } from "@/lib/flashcards.functions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { RotateCcw, Trash2, Shuffle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flashcard Generator — Prompt to Study Cards" },
      {
        name: "description",
        content:
          "Turn any topic into a shuffleable deck of study flashcards in seconds. Free, simple, and saved in your browser.",
      },
      { property: "og:title", content: "Flashcard Generator — Prompt to Study Cards" },
      {
        property: "og:description",
        content:
          "Turn any topic into a shuffleable deck of study flashcards in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Index() {
  const { current, recent, saveCurrent, pushRecent, removeRecent } =
    useDeckStorage();
  const [originalOrder, setOriginalOrder] = useState<string[] | null>(null);
  const generate = useServerFn(generateFlashcards);

  const mutation = useMutation({
    mutationFn: (v: { prompt: string; count: number }) =>
      generate({ data: v }),
    onSuccess: (res, vars) => {
      const deck: Deck = {
        id: crypto.randomUUID(),
        prompt: vars.prompt,
        cards: res.cards,
        createdAt: Date.now(),
      };
      saveCurrent(deck);
      pushRecent(deck);
      setOriginalOrder(res.cards);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  const updateCards = (cards: string[]) => {
    if (!current) return;
    saveCurrent({ ...current, cards });
  };

  const handleShuffle = () => {
    if (!current) return;
    updateCards(shuffle(current.cards));
  };

  const handleReset = () => {
    if (!current || !originalOrder) return;
    updateCards(originalOrder);
  };

  const handleClear = () => {
    saveCurrent(null);
    setOriginalOrder(null);
  };

  const loadRecent = (d: Deck) => {
    saveCurrent(d);
    setOriginalOrder(d.cards);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Powered by Lovable AI
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Flashcard Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Type a topic, get a shuffleable deck of study cards.
          </p>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <PromptForm
            onSubmit={(prompt, count) => mutation.mutate({ prompt, count })}
            loading={mutation.isPending}
            initialPrompt={current?.prompt ?? ""}
          />
        </section>

        {current && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">
                  {current.prompt}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {current.cards.length} cards · tap to shuffle · drag to reorder
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleShuffle}>
                  <Shuffle className="mr-1.5 h-4 w-4" />
                  Shuffle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!originalOrder}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Reset order
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            <FlashcardGrid
              cards={current.cards}
              onReorder={updateCards}
              onShuffle={handleShuffle}
            />
          </section>
        )}

        {recent.length > 0 && (
          <section className="mt-12">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Recent decks
            </h3>
            <ul className="space-y-2">
              {recent.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <button
                    onClick={() => loadRecent(d)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium">{d.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.cards.length} cards
                    </p>
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRecent(d.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
