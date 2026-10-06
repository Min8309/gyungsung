// Procedural sound beds: no downloads, autoplay dependencies, or frame-based scheduling.
export function createAmbienceBuffer(ctx, kind) {
  const durations = { clock: 2, type: 17, roller: 6, machine: 10 };
  if (!(kind in durations)) throw new Error(`Unknown ambience: ${kind}`);
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * durations[kind]), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  let seed = 19341024;
  const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 2147483648 - 1; };
  const impacts = [0.7, 2.1, 4.85, 6.3, 8.95, 9.14, 11.8, 14.2, 15.9];
  for (let i = 0; i < samples.length; i++) {
    const t = i / ctx.sampleRate;
    let value = 0;
    if (kind === 'clock') {
      const beat = Math.floor(t / 0.5), local = t % 0.5;
      if (local < 0.065) {
        const frequency = beat % 2 ? 640 : 850;
        value = Math.exp(-local * 95) * (0.7 * Math.sin(2 * Math.PI * frequency * local) + 0.2 * noise());
      }
    } else if (kind === 'type') {
      for (const impact of impacts) {
        const local = t - impact;
        if (local >= 0 && local < 0.22) {
          value += Math.exp(-local * 35) * (0.45 * Math.sin(2*Math.PI*1297*local)
            + 0.23 * Math.sin(2*Math.PI*2137*local) + 0.1 * Math.sin(2*Math.PI*3421*local) + 0.12 * noise());
        }
      }
    } else if (kind === 'roller') {
      const rotation = 0.65 + 0.35 * Math.sin(2*Math.PI*1.5*t);
      value = rotation * (0.35*Math.sin(2*Math.PI*29*t) + 0.16*Math.sin(2*Math.PI*87*t)) + 0.025*noise();
    } else {
      const pulse = Math.pow(0.5 + 0.5*Math.sin(2*Math.PI*2.6*t), 10);
      value = 0.28*Math.sin(2*Math.PI*55*t) + 0.11*Math.sin(2*Math.PI*109*t)
        + pulse * 0.22*Math.sin(2*Math.PI*191*t) + 0.025*noise();
    }
    // Short edge fades remove clicks at loop joins, including the noise layers.
    const edge = Math.min(1, t / 0.005, (samples.length - 1 - i) / (ctx.sampleRate * 0.005));
    samples[i] = Math.max(-1, Math.min(1, value)) * edge;
  }
  return buffer;
}

export function startPrintShopAmbience(ctx, destination) {
  const bus = ctx.createGain();
  bus.gain.value = 0.8;
  bus.connect(destination);
  const layers = {};
  for (const [kind, level, pan] of [['clock', 0.12, 0.45], ['type', 0.075, -0.4],
    ['roller', 0.15, 0.15], ['machine', 0.1, 0]]) {
    const source = ctx.createBufferSource();
    source.buffer = createAmbienceBuffer(ctx, kind);
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = level;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    source.connect(gain); gain.connect(panner); panner.connect(bus);
    source.start();
    layers[kind] = { source, gain, panner };
  }
  return { bus, layers };
}
