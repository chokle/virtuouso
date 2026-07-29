import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  prompt: z.string().min(1).max(500),
  count: z.number().int().min(3).max(20),
});

export const generateFlashcards = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const systemPrompt = `You organize study material into flashcards. Each card is ONE topic with a short heading and the bullet points that belong under it. Group related points together — do not split one topic into multiple cards, and do not put unrelated points on the same card. If the user provides pre-structured material with headings, preserve those headings and their bullets on individual cards. Aim for around ${data.count} cards but prefer natural topic grouping over the exact count. Keep each bullet concise (under 140 chars).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flashcards",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "bullets"],
                  },
                },
              },
              required: ["cards"],
            },
          },
        },
      }),
    });

    if (res.status === 429) {
      throw new Error("Rate limit reached. Please try again in a moment.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { cards?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    const raw = Array.isArray(parsed.cards) ? parsed.cards : [];
    const cards = raw
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const obj = c as { title?: unknown; bullets?: unknown };
        const title = typeof obj.title === "string" ? obj.title.trim() : "";
        const bullets = Array.isArray(obj.bullets)
          ? obj.bullets
              .filter((b): b is string => typeof b === "string")
              .map((b) => b.trim())
              .filter(Boolean)
          : [];
        if (!title && bullets.length === 0) return null;
        return { title, bullets };
      })
      .filter((c): c is { title: string; bullets: string[] } => c !== null);
    if (cards.length === 0) throw new Error("No cards generated. Try a different prompt.");
    return { cards };
  });
