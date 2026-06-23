import { useEffect, useRef, useState } from "react";
import { useWorld, lifeLabel } from "@/game/store";
import {
  pickLine,
  TRIGGER_FROM_TOOL,
  type NarratorLine,
  type NarratorTrigger,
} from "@/game/narrator-lines";
import { priorKeeper } from "@/game/keepers";

const MIN_GAP_MS = 18_000; // calm pacing between lines

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
  const activeChoiceId = useWorld((s) => s.activeChoiceId);
  const clearNarration = useWorld((s) => s.clearNarration);

  // Driver: listens to world events and fires narrator lines.
  useEffect(() => {
    if (intro !== "done") return;
    let lastNarratedAt = 0;
    let lastInteractedAt = Date.now();
    let prevEra = useWorld.getState().era;
    let prevBand = lifeBand(useWorld.getState().life);
    let prevToolTs = useWorld.getState().lastToolEvent?.ts ?? 0;
    let prevComboTs = useWorld.getState().recentCombo?.ts ?? 0;

    const fire = (trigger: NarratorTrigger, opts?: { allowUncannyDraft?: boolean; allowEchoDraft?: boolean; minGapOverride?: number }) => {
      const s = useWorld.getState();
      const now = Date.now();
      if (s.activeChoiceId) return;
      const gap = opts?.minGapOverride ?? MIN_GAP_MS;
      if (now - lastNarratedAt < gap) return;

      let chosen: NarratorLine | null = null;
      const canUncanny =
        (opts?.allowUncannyDraft ?? true) &&
        s.session >= 2 &&
        (trigger === "idle" || trigger === "lifeRise" || trigger === "era") &&
        Math.random() < 0.08;
      if (canUncanny) chosen = pickLine("uncanny", s.recentNarrationIds);

      // Echo: rare on idle, only when a prior keeper exists.
      let echoName: string | null = null;
      if (!chosen && (opts?.allowEchoDraft ?? true) && trigger === "idle" && Math.random() < 0.18) {
        echoName = priorKeeper(s.planetName);
        if (echoName) {
          const line = pickLine("echo", s.recentNarrationIds);
          if (line) chosen = { ...line, text: line.text.replaceAll("{NAME}", echoName) };
        }
      }

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

    // The Pivot: one-shot, fires once playMs crosses ~25 minutes.
    const PIVOT_MS = 25 * 60_000;
    const pivotTimer = setInterval(() => {
      const s = useWorld.getState();
      if (s.pivotFired) {
        clearInterval(pivotTimer);
        return;
      }
      if (s.activeChoiceId || s.currentNarration) return;
      if (s.playMs < PIVOT_MS) return;
      const line = pickLine("pivot", []);
      if (!line) return;
      lastNarratedAt = Date.now();
      useWorld.getState().narrate({ id: line.id, text: line.text, bornAt: Date.now() });
      useWorld.getState().markPivotFired();
      clearInterval(pivotTimer);
    }, 8000);

    // The Anthropic Whisper. Once unlocked (~12 min in), rare break-frame line every ~30 min.
    const whisperTimer = setInterval(() => {
      const s = useWorld.getState();
      if (s.activeChoiceId || s.currentNarration) return;
      if (s.playMs < 12 * 60_000) return;
      const lastWhisperAt = (s.flags["whisper:lastAt"] as unknown as number) ?? 0;
      const since = Date.now() - lastWhisperAt;
      if (lastWhisperAt && since < 30 * 60_000) return;
      if (Math.random() > 0.06) return; // ~each 8s check, low prob → roughly once per few minutes after unlock
      const line = pickLine("whisper", s.recentNarrationIds);
      if (!line) return;
      lastNarratedAt = Date.now();
      useWorld.getState().narrate({ id: line.id, text: line.text, bornAt: Date.now() });
      useWorld.setState({ flags: { ...s.flags, "whisper:lastAt": Date.now() as unknown as boolean } });
    }, 8000);

    const unsub = useWorld.subscribe((s) => {
      // combo wins over tool line (it's the more interesting beat).
      const cTs = s.recentCombo?.ts ?? 0;
      if (cTs !== prevComboTs && s.recentCombo) {
        prevComboTs = cTs;
        lastInteractedAt = cTs;
        fire(`combo:${s.recentCombo.kind}` as NarratorTrigger, {
          allowUncannyDraft: false,
          allowEchoDraft: false,
          minGapOverride: 8000,
        });
        return;
      }
      // tool used
      const ts = s.lastToolEvent?.ts ?? 0;
      if (ts !== prevToolTs && s.lastToolEvent) {
        prevToolTs = ts;
        lastInteractedAt = ts;
        fire(TRIGGER_FROM_TOOL[s.lastToolEvent.kind], { allowUncannyDraft: false });
      }
      if (s.era !== prevEra) {
        prevEra = s.era;
        fire("era");
      }
      const band = lifeBand(s.life);
      if (band !== prevBand) {
        prevBand = band;
        fire("lifeRise");
      }
    });

    const idleTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractedAt > 22_000 && now - lastNarratedAt > 38_000) {
        fire("idle");
      }
    }, 6000);

    const introTimer = setTimeout(() => fire("idle", { allowUncannyDraft: false, allowEchoDraft: false, minGapOverride: 0 }), 900);

    return () => {
      unsub();
      clearInterval(idleTimer);
      clearTimeout(fifthTimer);
      clearTimeout(introTimer);
      clearInterval(pivotTimer);
      clearInterval(whisperTimer);
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
  // Never stack with a choice card.
  if (activeChoiceId) return null;

  const holdMs = readingDuration(visible.text);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-6 md:pr-[22rem] md:pl-10 safe-offset-bottom safe-x"
      style={{ ["--safe-bottom-base" as string]: "7rem" }}
    >
      <p
        key={visible.id}
        className="terrarium-narrate w-full max-w-sm text-center font-serif text-sm italic leading-relaxed text-cream sm:max-w-md sm:text-base md:max-w-lg md:text-lg"
        style={{
          textShadow: "0 1px 2px rgba(0,0,0,0.25), 0 0 24px rgba(0,0,0,0.18)",
          animationDuration: `${holdMs}ms`,
          overflowWrap: "break-word",
        }}
      >
        {visible.text}
      </p>
    </div>
  );
}

