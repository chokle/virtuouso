import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type Props = {
  onSubmit: (prompt: string, count: number) => void;
  loading: boolean;
  initialPrompt?: string;
};

export function PromptForm({ onSubmit, loading, initialPrompt = "" }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [count, setCount] = useState("10");

  const handle = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed, Number(count));
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">What do you want to study?</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Key events of the French Revolution"
          maxLength={500}
          rows={3}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">{prompt.length}/500</p>
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="count">Cards</Label>
          <Select value={count} onValueChange={setCount} disabled={loading}>
            <SelectTrigger id="count" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading || !prompt.trim()} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate flashcards"
          )}
        </Button>
      </div>
    </form>
  );
}
