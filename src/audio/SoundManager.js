import * as THREE from 'three';
import { startPrintShopAmbience } from './PrintShopAmbience.js';

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.droneGain = null;
    this.clockGain = null;
    this.lastTickTime = 0;
    this.isTock = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startHorrorDrone();
      this.ambience = startPrintShopAmbience(this.ctx, this.masterGain);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Dark Atmospheric Horror Room Drone
  startHorrorDrone() {
    if (!this.ctx) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Deep sub bass oscillator 1 (48Hz)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(48, this.ctx.currentTime);

    // Deep sub bass oscillator 2 (51Hz detuned)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(51.5, this.ctx.currentTime);

    // Low pass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    // LFO to slowly sweep the filter frequency for eerie breathing sensation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8 second cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.droneGain);

    osc1.start();
    osc2.start();
    lfo.start();
  }

  // 2. Wall Clock Ticking (Synchronized with 3D pendulum)
  updateClockTick(sceneTime) {
    if (!this.ctx || this.isMuted || this.clockStopped || this.ambience) return;

    // Tick once every ~0.5 second (half-period of pendulum)
    if (sceneTime - this.lastTickTime >= 0.5) {
      this.lastTickTime = sceneTime;
      this.playClockTick(this.isTock);
      this.isTock = !this.isTock;
    }
  }

  playClockTick(isTock = false) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const freq = isTock ? 620 : 780;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(6, t);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Directional tick for 90s idle auto-hint
  playSpatialTick(camera, targetWorldPos) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      let pan = 0;
      if (camera && targetWorldPos) {
        // Calculate horizontal panning (-1.0 left to +1.0 right) relative to camera
        const toTarget = targetWorldPos.clone().sub(camera.position).normalize();
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        pan = THREE.MathUtils.clamp(camRight.dot(toTarget), -0.9, 0.9);
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(820, t);
      filter.Q.setValueAtTime(8, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(filter);
      filter.connect(gain);

      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(pan, t);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        gain.connect(this.masterGain);
      }

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {
      this.playClockTick(false);
    }
  }

  stopClockTick() {
    this.clockStopped = true;
    this.ambience?.layers.clock.gain.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  // Dial rotation tick
  playDialClick() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.015);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  // Drawer unlock & slide
  playDrawerUnlock() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Heavy brass click
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.25);
  }

  // Puzzle Solved eerie chord
  playPuzzleSuccess() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.08, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + 2.0);
    });
  }

  // 1930s Grandfather Clock Midnight Bell Gong (자정 12회 타종)
  playBellGong(strikeIndex = 1) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const baseFreq = 95; // 95Hz low bell resonance

    // 3 harmonic oscillators for metallic church bell resonance
    [baseFreq, baseFreq * 2.1, baseFreq * 3.8, baseFreq * 5.4].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      // Slight pitch droop characteristic of large brass bells
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 1.8);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(14, t);

      const amp = i === 0 ? 0.35 : 0.15 / (i + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 2.3);
    });
  }

  // Accelerated tick as pendulum amplitude increases (1.0s -> 0.5s, higher pitch)
  playResonantTick(pitchMultiplier = 1.0) {
    if (!this.ctx || this.isMuted || this.clockStopped) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const freq = 680 * pitchMultiplier;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(8, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Heavy rotary press printing machinery drone
  startPrintingMachinery() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(32, t);
    osc.frequency.linearRampToValueAtTime(75, t + 2.0);
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 1.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    this.printOsc = osc;
    this.printGain = gain;
  }

  stopPrintingMachinery() {
    if (this.printGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.printGain.gain.linearRampToValueAtTime(0.001, t + 0.5);
      setTimeout(() => {
        try { this.printOsc && this.printOsc.stop(); } catch(e) {}
      }, 600);
    }
  }

  // Jumpscare string / metallic screech (used exactly once before print completion)
  playJumpscare() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, t);
    osc1.frequency.linearRampToValueAtTime(1760, t + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(220, t + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(840, t);
    osc2.frequency.linearRampToValueAtTime(1700, t + 0.1);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.65);
    osc2.stop(t + 0.65);
  }

  // 3. Dusty concrete footsteps
  playFootstep(isSprinting = false) {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Short shoe impact on solid concrete
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitch = 145 + Math.random() * 35;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);

    // Dry grit scuff on the concrete surface
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1300 + Math.random() * 700, t);
    noiseFilter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.035, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  // 4. Loose Floorboard Creak (Occasional eerie groan)
  playFloorboardCreak() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.15);
    osc.frequency.linearRampToValueAtTime(260, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, t);
    filter.Q.setValueAtTime(8, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // 5. Flashlight Mechanical Toggle Click
  playFlashlightClick() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.025);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // 6. Lightbulb Electrical Voltage Buzz on Flicker
  playBulbBuzz() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t); // 120Hz AC buzz

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // 7. Chilling Discovery Stinger
  playInspectStinger() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.8);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.3);
  }

  playMetalDoorOpen() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Dissonant resonances with a slow pitch fall evoke a heavy rusted hinge.
    [113, 281, 467, 793].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = index === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(frequency, t);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.55, t + 2.8);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08 / (index + 1), t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 3.3);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    });
    this.playDrawerUnlock();
  }

  playGhostScream() {
    if (!this.ctx || this.isMuted) return;
    // Lower machinery briefly so the scream is distinct without increasing master volume.
    if (this.ambience) {
      const gain = this.ambience.bus.gain, t = this.ctx.currentTime;
      gain.cancelScheduledValues(t);
      gain.setValueAtTime(0.8, t);
      gain.linearRampToValueAtTime(0.18, t + 0.035);
      gain.setValueAtTime(0.18, t + 0.85);
      gain.linearRampToValueAtTime(0.8, t + 1.3);
    }
    this.playTimeoutScream(1.1);
  }

  playTimeoutScream(duration = 3) {
    if (!this.ctx || this.isMuted || duration <= 0) return;
    const t = this.ctx.currentTime;
    const voice = this.ctx.createOscillator();
    const vibrato = this.ctx.createOscillator();
    const depth = this.ctx.createGain();
    const envelope = this.ctx.createGain();
    const formant = this.ctx.createBiquadFilter();
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(480, t);
    voice.frequency.exponentialRampToValueAtTime(1050, t + duration * 0.3);
    voice.frequency.exponentialRampToValueAtTime(260, t + duration);
    vibrato.frequency.value = 9;
    depth.gain.value = 65;
    vibrato.connect(depth);
    depth.connect(voice.frequency);
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(900, t);
    formant.frequency.linearRampToValueAtTime(1800, t + duration * 0.35);
    formant.frequency.linearRampToValueAtTime(1100, t + duration);
    formant.Q.value = 0.9;
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(0.35, t + Math.min(0.08, duration / 4));
    envelope.gain.linearRampToValueAtTime(0, t + duration);
    const breath = this.ctx.createBufferSource();
    const breathBuffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const breathData = breathBuffer.getChannelData(0);
    for (let i = 0; i < breathData.length; i++) breathData[i] = (Math.random() * 2 - 1) * 0.16;
    breath.buffer = breathBuffer;
    breath.connect(formant);
    breath.start(t);
    breath.stop(t + duration);
    voice.connect(formant);
    formant.connect(envelope);
    envelope.connect(this.masterGain);
    voice.start(t);
    vibrato.start(t);
    voice.stop(t + duration);
    vibrato.stop(t + duration);
    voice.onended = () => {
      breath.disconnect(); voice.disconnect(); vibrato.disconnect(); depth.disconnect();
      formant.disconnect(); envelope.disconnect();
    };
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}
