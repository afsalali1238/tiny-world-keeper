import { useEffect, useRef } from "react";
import { useWorld } from "@/game/store";

// Procedural ambient bed: low pink-noise wind + sine drone.
// Gated behind the audio toggle. No audio files.

export function AmbientAudio() {
  const audioOn = useWorld((s) => s.audioOn);
  const intro = useWorld((s) => s.intro);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    gain: GainNode;
    droneGain: GainNode;
    windGain: GainNode;
  } | null>(null);

  useEffect(() => {
    if (!audioOn || intro !== "done") {
      // teardown
      const n = nodesRef.current;
      if (n) {
        try {
          n.gain.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.6);
        } catch {
          // ignore
        }
      }
      return;
    }

    // build (or reuse)
    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = new AudioContext();
        ctxRef.current = ctx;
      } catch {
        return;
      }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    if (!nodesRef.current) {
      // pink-noise wind via filtered white noise
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      // wind shape: low-pass + slow LFO on the cutoff
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.value = 480;
      windFilter.Q.value = 0.4;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(windFilter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.value = 0.22;

      noise.connect(windFilter).connect(windGain);

      // low drone: two slightly detuned sines
      const droneA = ctx.createOscillator();
      droneA.type = "sine";
      droneA.frequency.value = 55;
      const droneB = ctx.createOscillator();
      droneB.type = "sine";
      droneB.frequency.value = 55.6;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.06;
      droneA.connect(droneGain);
      droneB.connect(droneGain);

      // master
      const gain = ctx.createGain();
      gain.gain.value = 0;
      windGain.connect(gain);
      droneGain.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      droneA.start();
      droneB.start();
      lfo.start();

      nodesRef.current = { gain, droneGain, windGain };
    }

    // fade in
    const n = nodesRef.current;
    n.gain.gain.cancelScheduledValues(ctx.currentTime);
    n.gain.gain.setTargetAtTime(0.5, ctx.currentTime, 1.2);
  }, [audioOn, intro]);

  // Duck the bed while the narrator speaks. Also shift drone/wind by era
  // (Genesis is quieter; Civilizations adds more drone weight).
  useEffect(() => {
    if (!audioOn || intro !== "done") return;
    const eraMix = (era: number) => {
      // returns { drone, wind } multipliers
      if (era <= 0) return { drone: 0.4, wind: 0.6 };
      if (era === 1) return { drone: 0.8, wind: 0.9 };
      if (era === 2) return { drone: 1.0, wind: 1.0 };
      return { drone: 1.25, wind: 1.05 };
    };
    // Initial era apply
    {
      const s0 = useWorld.getState();
      const n = nodesRef.current;
      const ctx = ctxRef.current;
      if (n && ctx) {
        const mix = eraMix(s0.era);
        n.droneGain.gain.setTargetAtTime(0.06 * mix.drone, ctx.currentTime, 1.5);
        n.windGain.gain.setTargetAtTime(0.22 * mix.wind, ctx.currentTime, 1.5);
      }
    }
    const unsub = useWorld.subscribe((s, prev) => {
      const n = nodesRef.current;
      const ctx = ctxRef.current;
      if (!n || !ctx) return;
      // duck on narration toggle
      const speaking = !!s.currentNarration;
      const wasSpeaking = !!prev.currentNarration;
      if (speaking !== wasSpeaking) {
        n.gain.gain.cancelScheduledValues(ctx.currentTime);
        n.gain.gain.setTargetAtTime(speaking ? 0.18 : 0.5, ctx.currentTime, speaking ? 0.25 : 0.8);
      }
      // era shift
      if (s.era !== prev.era) {
        const mix = eraMix(s.era);
        n.droneGain.gain.setTargetAtTime(0.06 * mix.drone, ctx.currentTime, 3.0);
        n.windGain.gain.setTargetAtTime(0.22 * mix.wind, ctx.currentTime, 3.0);
      }
    });
    return unsub;
  }, [audioOn, intro]);


  useEffect(() => {
    return () => {
      const n = nodesRef.current;
      const ctx = ctxRef.current;
      if (n && ctx) {
        try {
          n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return null;
}
