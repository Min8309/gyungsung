export class RecordedHorrorAudio {
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.45;
    this.musicGain.connect(destination);
    this.destination = destination;
    this.ready = this.load();
  }

  async load() {
    const load = async path => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      return this.ctx.decodeAudioData(await response.arrayBuffer());
    };
    const results = await Promise.allSettled([
      load('/audio/basement-bgm.wav'), load('/audio/ghost-scream.wav')
    ]);
    if (results[0].status === 'fulfilled') {
      this.music = this.ctx.createBufferSource();
      this.music.buffer = results[0].value;
      this.music.loop = true;
      this.music.connect(this.musicGain);
      this.music.start();
    } else console.warn('Generated BGM failed to load:', results[0].reason);
    if (results[1].status === 'fulfilled') this.scream = results[1].value;
    else console.warn('Generated scream failed to load:', results[1].reason);
  }

  playScream(maxDuration) {
    if (!this.scream) return false;
    const t = this.ctx.currentTime;
    const duration = Math.min(this.scream.duration, maxDuration ?? this.scream.duration);
    if (duration <= 0) return false;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = this.scream;
    gain.gain.setValueAtTime(0.75, t);
    gain.gain.setValueAtTime(0.75, t + Math.max(0, duration - 0.06));
    gain.gain.linearRampToValueAtTime(0, t + duration);
    source.connect(gain); gain.connect(this.destination);
    source.start(t, 0, duration);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    const music = this.musicGain.gain;
    music.cancelScheduledValues(t);
    music.setValueAtTime(0.45, t);
    music.linearRampToValueAtTime(0.1, t + 0.03);
    music.setValueAtTime(0.1, t + duration);
    music.linearRampToValueAtTime(0.45, t + duration + 0.4);
    return true;
  }
}
