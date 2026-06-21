import { createFileRoute } from "@tanstack/react-router";

const VOICE_INSTRUCTIONS =
  "Speak in a hushed, warm, awed voice. Calm British nature-documentary narrator. Slow pace, gentle, observational, never urgent. Quiet wonder.";

export const Route = createFileRoute("/api/narrator")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Narrator unavailable", { status: 503 });
        }
        let body: { text?: string } = {};
        try {
          body = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const text = (body.text ?? "").toString().trim();
        if (!text) return new Response("Empty text", { status: 400 });
        if (text.length > 600) {
          return new Response("Text too long", { status: 400 });
        }

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/speech",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice: "ash",
              instructions: VOICE_INSTRUCTIONS,
              stream_format: "sse",
              response_format: "pcm",
              speed: 0.92,
            }),
          },
        );

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          return new Response(detail || "TTS failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
