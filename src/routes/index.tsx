import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PromptForm } from "@/components/PromptForm";
import { StudyViewer } from "@/components/StudyViewer";
import { useDeckStorage, type Deck } from "@/hooks/useDeckStorage";
import { generateFlashcards } from "@/lib/flashcards.functions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Play, Trash2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flashcard Generator — Prompt to Study Cards" },
      {
        name: "description",
        content:
          "Turn any topic into a fullscreen deck of study flashcards. Tap or swipe to flip through. Free and saved in your browser.",
      },
      { property: "og:title", content: "Flashcard Generator — Prompt to Study Cards" },
      {
        property: "og:description",
        content:
          "Turn any topic into a fullscreen deck of study flashcards. Tap or swipe to flip through.",
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
  const [studying, setStudying] = useState(false);
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
      setStudying(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong.");
    },
  });

  // Guard against legacy string-only decks in localStorage.
  useEffect(() => {
    if (current && current.cards.some((c) => typeof c !== "object" || !("bullets" in c))) {
      saveCurrent(null);
    }
  }, [current, saveCurrent]);

  const handleShuffle = () => {
    if (!current) return;
    saveCurrent({ ...current, cards: shuffle(current.cards) });
  };

  const handleClear = () => saveCurrent(null);

  const loadRecent = (d: Deck) => {
    saveCurrent(d);
    setStudying(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      {studying && current && current.cards.length > 0 && (
        <StudyViewer
          cards={current.cards}
          onShuffle={handleShuffle}
          onClose={() => setStudying(false)}
        />
      )}

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Powered by Lovable AI
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Flashcard Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Paste a topic or notes. Study fullscreen — tap or swipe to advance.
          </p>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <PromptForm
            onSubmit={(prompt, count) => mutation.mutate({ prompt, count })}
            loading={mutation.isPending}
            initialPrompt={current?.prompt ?? ""}
          />
        </section>

        {current && current.cards.length > 0 && (
          <section className="mt-6 rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{current.prompt}</p>
                <p className="text-xs text-muted-foreground">
                  {current.cards.length} cards ready
                </p>
              </div>
              <Button size="sm" onClick={() => setStudying(true)}>
                <Play className="mr-1.5 h-4 w-4" />
                Study
              </Button>
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="mt-10">
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
