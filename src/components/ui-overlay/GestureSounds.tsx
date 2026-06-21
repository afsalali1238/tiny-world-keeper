import { useEffect, useRef } from "react";
import { useWorld } from "@/game/store";
import type { ToolKind } from "@/game/types";

// Tiny per-gesture WebAudio plinks. No assets. Gated by audio toggle.
// Pitch is nudged by the planet seed so every world sounds slightly its own.

function seededHz(seed: number, base: number) {
  // ±1.5 semitones from base
  const semis = ((seed % 7) - 3) / 2;
  return base * Math.pow(2, semis / 12);
}

function play(ctx: AudioContext, kind: ToolKind, seed: number) {
  const now = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(ctx.destination);

  if (kind === "rain") {
    // brief filtered noise burst -> soft "shh"
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = seededHz(seed, 1800);
    f.Q.value = 0.9;
    src.connect(f).connect(g);
    g.gain.linearRampToValueAtTime(0.18, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    src.start(now);
    src.stop(now + 0.5);
  } else if (kind === "sun") {
    // warm soft pad: two sines, slow attack
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = "sine";
    b.type = "sine";
    a.frequency.value = seededHz(seed, 392);
    b.frequency.value = seededHz(seed, 588);
    a.connect(g);
    b.connect(g);
    g.gain.linearRampToValueAtTime(0.12, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    a.start(now);
    b.start(now);
    a.stop(now + 1.5);
    b.stop(now + 1.5);
  } else if (kind === "wind") {
    // airy whoosh: noise through a sweeping low-pass
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(seededHz(seed, 400), now);
    f.frequency.exponentialRampToValueAtTime(seededHz(seed, 1400), now + 0.4);
    f.frequency.exponentialRampToValueAtTime(seededHz(seed, 280), now + 0.8);
    f.Q.value = 0.6;
    src.connect(f).connect(g);
    g.gain.linearRampToValueAtTime(0.16, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    src.start(now);
    src.stop(now + 0.9);
  } else if (kind === "seed") {
    // tiny pluck: short triangle with steep decay
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(seededHz(seed, 880), now);
    o.frequency.exponentialRampToValueAtTime(seededHz(seed, 660), now + 0.2);
    o.connect(g);
    g.gain.linearRampToValueAtTime(0.22, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    o.start(now);
    o.stop(now + 0.55);
  }
}

export function GestureSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let prevTs = useWorld.getState().lastToolEvent?.ts ?? 0;
    const unsub = useWorld.subscribe((s) => {
      const ts = s.lastToolEvent?.ts ?? 0;
      if (ts === prevTs || !s.lastToolEvent) return;
      prevTs = ts;
      if (!s.audioOn) return;
      try {
        let ctx = ctxRef.current;
        if (!ctx) {
          ctx = new AudioContext();
          ctxRef.current = ctx;
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        play(ctx, s.lastToolEvent.kind, s.seed);
      } catch {
        // ignore
      }
    });
    return unsub;
  }, []);

  return null;
}
