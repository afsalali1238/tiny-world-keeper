// src/lib/tts.ts

export async function speakViaTTS(text: string, signal: AbortSignal) {
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
