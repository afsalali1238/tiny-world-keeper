import { useEffect, useRef, useState } from "react";
import { useWorld, lifeLabel } from "@/game/store";
import {
  pickLine,
  TRIGGER_FROM_TOOL,
  type NarratorLine,
  type NarratorTrigger,
} from "@/game/narrator-lines";

const MIN_GAP_MS = 26_000; // calm pacing between lines

function readingDuration(text: string) {
  // Rough: ~14 chars per second + 1.2s lead + 1.2s tail. Clamped.
  const sec = 1.2 + text.length / 14 + 1.2;
  return Math.max(4500, Math.min(11000, Math.round(sec * 1000)));
}

async function speakViaTTS(text: string, signal: AbortSignal) {
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext({ sampleRate: 24000 });
    if (ctx.state === "suspended") await ctx.resume().catch(() => {});

    let playhead = 0;
    let pending = new Uint8Array(0);

    const schedule = (incoming: Uint8Array) => {
      if (!ctx) return;
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (usable === 0) return;
      const samples = new Int16Array(bytes.buffer, 0, usable / 2);
      const floats = Float32Array.from(samples, (s) => s / 32768);
      const buffer = ctx.createBuffer(1, floats.length, 24000);
      buffer.copyToChannel(floats, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.85;
      src.connect(gain).connect(ctx.destination);
      if (playhead === 0) {
        playhead = ctx.currentTime + 0.05;
      } else {
        playhead = Math.max(playhead, ctx.currentTime);
      }
      src.start(playhead);
      playhead += buffer.duration;
    };

    const res = await fetch("/api/narrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok || !res.body) return;

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          const payload = JSON.parse(data);
          if (payload.type === "speech.audio.delta" && payload.audio) {
            const binary = atob(payload.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            schedule(bytes);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  } catch {
    // network error or aborted: fail silently, subtitle still shows
  } finally {
    // let the buffered audio play out; close later
    setTimeout(() => ctx?.close().catch(() => {}), 12_000);
  }
}

function lifeBand(life: number) {
  return lifeLabel(life);
}

export function Narrator() {
  const intro = useWorld((s) => s.intro);
  const audioOn = useWorld((s) => s.audioOn);
  const cue = useWorld((s) => s.currentNarration);
  const clearNarration = useWorld((s) => s.clearNarration);

  // Driver: listens to world events and fires narrator lines.
  useEffect(() => {
    if (intro !== "done") return;
    let lastNarratedAt = 0;
    let lastInteractedAt = Date.now();
    let prevEra = useWorld.getState().era;
    let prevBand = lifeBand(useWorld.getState().life);
    let prevToolTs = useWorld.getState().lastToolEvent?.ts ?? 0;

    const fire = (trigger: NarratorTrigger, allowUncannyDraft = true) => {
      const s = useWorld.getState();
      const now = Date.now();
      if (s.activeChoiceId) return;
      if (now - lastNarratedAt < MIN_GAP_MS) return;
      // 8% chance to substitute an uncanny line on certain triggers, after session 2
      let chosen: NarratorLine | null = null;
      const canUncanny =
        allowUncannyDraft &&
        s.session >= 2 &&
        (trigger === "idle" || trigger === "lifeRise" || trigger === "era") &&
        Math.random() < 0.08;
      if (canUncanny) chosen = pickLine("uncanny", s.recentNarrationIds);
      if (!chosen) chosen = pickLine(trigger, s.recentNarrationIds);
      if (!chosen) return;
      lastNarratedAt = now;
      useWorld.getState().narrate({ id: chosen.id, text: chosen.text, bornAt: now });
    };

    // Fifth-visit fires once shortly after entry.
    const fifthTimer = setTimeout(() => {
      const s = useWorld.getState();
      if (s.session >= 5 && !s.fifthFired) {
        const line = pickLine("fifthVisit", []);
        if (line) {
          lastNarratedAt = Date.now();
          useWorld.getState().narrate({ id: line.id, text: line.text, bornAt: Date.now() });
          useWorld.getState().markFifthFired();
        }
      }
    }, 6000);

    const unsub = useWorld.subscribe((s) => {
      // tool used
      const ts = s.lastToolEvent?.ts ?? 0;
      if (ts !== prevToolTs && s.lastToolEvent) {
        prevToolTs = ts;
        lastInteractedAt = ts;
        fire(TRIGGER_FROM_TOOL[s.lastToolEvent.kind], false);
      }
      // era crossed
      if (s.era !== prevEra) {
        prevEra = s.era;
        fire("era");
      }
      // life band crossed
      const band = lifeBand(s.life);
      if (band !== prevBand) {
        prevBand = band;
        fire("lifeRise");
      }
    });

    // Idle pulse.
    const idleTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractedAt > 22_000 && now - lastNarratedAt > 38_000) {
        fire("idle");
      }
    }, 6000);

    // first welcome ~4s after intro ends
    const introTimer = setTimeout(() => fire("idle", false), 4000);

    return () => {
      unsub();
      clearInterval(idleTimer);
      clearTimeout(fifthTimer);
      clearTimeout(introTimer);
    };
  }, [intro]);

  // Auto-clear the subtitle when its reading time elapses.
  useEffect(() => {
    if (!cue) return;
    const hold = readingDuration(cue.text);
    const t = setTimeout(() => clearNarration(), hold);
    return () => clearTimeout(t);
  }, [cue, clearNarration]);

  // Speak via TTS when audio is on.
  const speakingForId = useRef<string | null>(null);
  useEffect(() => {
    if (!cue || !audioOn) return;
    if (speakingForId.current === cue.id) return;
    speakingForId.current = cue.id;
    const ctl = new AbortController();
    speakViaTTS(cue.text, ctl.signal);
    return () => ctl.abort();
  }, [cue, audioOn]);

  // visible subtitle
  const [visible, setVisible] = useState<typeof cue>(null);
  useEffect(() => {
    if (cue) {
      setVisible(cue);
    } else {
      // small fade-out delay
      const t = setTimeout(() => setVisible(null), 700);
      return () => clearTimeout(t);
    }
  }, [cue]);

  if (intro !== "done" || !visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-6">
      <p
        key={visible.id}
        className="terrarium-narrate max-w-2xl text-center font-serif text-base italic leading-relaxed text-cream md:text-lg"
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,0.25), 0 0 24px rgba(0,0,0,0.18)",
        }}
      >
        {visible.text}
      </p>
    </div>
  );
}
