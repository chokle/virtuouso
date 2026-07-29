import { useState, type DragEvent } from "react";

type Props = {
  cards: string[];
  onReorder: (next: string[]) => void;
  onShuffle: () => void;
};

export function FlashcardGrid({ cards, onReorder, onShuffle }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [shuffleTick, setShuffleTick] = useState(0);

  const handleClick = (i: number) => {
    if (dragIndex !== null) return;
    setShuffleTick((t) => t + 1);
    onShuffle();
    void i;
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, i: number) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== i) setOverIndex(i);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...cards];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div
      key={shuffleTick}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((text, i) => (
        <button
          key={`${shuffleTick}-${i}`}
          type="button"
          draggable
          onClick={() => handleClick(i)}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          className={[
            "group relative flex min-h-32 cursor-grab items-center justify-center rounded-xl border bg-card px-4 py-5 text-left text-card-foreground shadow-sm transition-all duration-300 ease-out",
            "hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:scale-[0.98]",
            "animate-in fade-in zoom-in-95",
            dragIndex === i ? "opacity-40" : "",
            overIndex === i && dragIndex !== i ? "ring-2 ring-ring" : "",
          ].join(" ")}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <span className="absolute left-2 top-2 text-xs text-muted-foreground">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed sm:text-base">{text}</span>
        </button>
      ))}
    </div>
  );
}
