import { useEffect, useState, type PointerEvent } from "react";
import { X, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import type { Card } from "@/hooks/useDeckStorage";

type Props = {
  cards: Card[];
  onClose: () => void;
  onShuffle: () => void;
};

export function StudyViewer({ cards, onClose, onShuffle }: Props) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [tick, setTick] = useState(0);
  const total = cards.length;

  const go = (d: 1 | -1) => {
    setDir(d);
    setIndex((i) => (i + d + total) % total);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const swipeStart = { x: 0, y: 0, t: 0 };
  let start = { ...swipeStart };
  const onPointerDown = (e: PointerEvent) => {
    start = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 600) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 400) {
      // Tap — advance
      go(1);
    }
  };

  const card = cards[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-sm tabular-nums text-white/70">
          {index + 1} / {total}
        </div>
        <button
          onClick={() => {
            onShuffle();
            setIndex(0);
            setTick((t) => t + 1);
          }}
          aria-label="Shuffle"
          className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Shuffle className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex flex-1 select-none items-center justify-center overflow-hidden px-4 pb-6"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ touchAction: "pan-y" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          aria-label="Previous"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          aria-label="Next"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          <ChevronRight className="h-7 w-7" />
        </button>

        <div
          key={tick}
          className={`w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-10 ${
            dir === 1
              ? "animate-in fade-in slide-in-from-right-6"
              : "animate-in fade-in slide-in-from-left-6"
          }`}
          style={{ animationDuration: "220ms" }}
        >
          {card.title && (
            <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">
              {card.title}
            </h2>
          )}
          {card.bullets.length > 0 && (
            <ul className="space-y-3">
              {card.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed sm:text-lg">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/60"
                  />
                  <span className="text-white/90">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pb-6 text-center text-xs text-white/40">
        Tap or swipe to advance · ← → keys · Esc to exit
      </div>
    </div>
  );
}
