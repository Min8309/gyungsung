import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * RadioAmbiencePanner:
 * 90초 이상 정체 시 복도 모퉁이 진공관 라디오에서 잡음 및 모스 부호 공간 음향(StereoPanner) 재생
 * 플레이어가 시선을 돌릴 때 소리의 방향(좌/우 팬)으로 미해결 단서 위치를 직관적으로 안내
 */
export class RadioAmbiencePanner {
  constructor(scene, soundManager, camera) {
    this.scene = scene;
    this.soundManager = soundManager;
    this.camera = camera;
    this.config = GameConfig.extendedHints;

    this.radioPos = new THREE.Vector3(
      this.config.radioWorldPos.x,
      this.config.radioWorldPos.y,
      this.config.radioWorldPos.z
    );

    this.isPlaying = false;
    this.morseTimer = 0;

    this.buildRadioMesh();
  }

  buildRadioMesh() {
    const radioGroup = new THREE.Group();
    radioGroup.position.copy(this.radioPos);

    // 1930s Wooden Radio Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.7, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.18), bodyMat);
    body.castShadow = true;
    radioGroup.add(body);

    // Front Speaker Grill & Dial
    const grillMat = new THREE.MeshStandardMaterial({ color: 0xc4af8b, roughness: 0.9 });
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), grillMat);
    grill.position.set(0, 0.02, 0.092);
    radioGroup.add(grill);

    // Glowing Vacuum Tube Indicator (Dim amber light)
    this.tubeLight = new THREE.PointLight(0xff7722, 0, 1.2);
    this.tubeLight.position.set(0, 0.12, 0.08);
    radioGroup.add(this.tubeLight);

    radioGroup.userData = {
      isInteractable: true,
      clueId: 'clue_radio',
      name: '진공관 단파 라디오',
      description: '잡음과 함께 귓가를 맴도는 불길한 모스 부호가 흘러나온다. 소리의 방향이 지하 윤전기실 쪽을 가리키고 있다.',
      type: 'radio'
    };

    this.scene.add(radioGroup);
    this.radioMesh = radioGroup;
  }

  update(now, delta) {
    const elapsedSec = (now - gameState.lastProgressTime) / 1000;

    // 90초 이상 정체 시 라디오 공간 오디오 활성화
    if (elapsedSec >= this.config.radioAmbienceTriggerTime) {
      if (!this.isPlaying) {
        this.startRadioAudio();
      }
      this.updatePanning();
    } else {
      if (this.isPlaying) {
        this.stopRadioAudio();
      }
    }
  }

  startRadioAudio() {
    if (!this.soundManager.ctx || this.soundManager.isMuted) return;
    this.isPlaying = true;
    if (this.tubeLight) this.tubeLight.intensity = 0.8;

    const ctx = this.soundManager.ctx;

    // 1. Static Noise Node (치직거리는 진공관 라디오 잡음)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

    // 2. Stereo Panner Node for spatial positioning
    if (ctx.createStereoPanner) {
      this.panner = ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(0, ctx.currentTime);
      this.noiseGain.connect(this.panner);
      this.panner.connect(this.soundManager.masterGain);
    } else {
      this.noiseGain.connect(this.soundManager.masterGain);
    }

    noiseSource.connect(filter);
    filter.connect(this.noiseGain);
    noiseSource.start();
    this.noiseSource = noiseSource;

    // 3. Periodic Morse Code Beep Interval
    this.morseInterval = setInterval(() => {
      this.playMorseBeep();
    }, 1800);
  }

  playMorseBeep() {
    if (!this.isPlaying || !this.soundManager.ctx || this.soundManager.isMuted) return;
    const ctx = this.soundManager.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.config.radioMorseFreq, t);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    if (this.panner) {
      gain.connect(this.panner);
    } else {
      gain.connect(this.soundManager.masterGain);
    }

    osc.start(t);
    osc.stop(t + 0.14);
  }

  updatePanning() {
    if (!this.panner || !this.camera) return;
    // Calculate direction from camera to radio
    const toRadio = this.radioPos.clone().sub(this.camera.position).normalize();
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const pan = THREE.MathUtils.clamp(camRight.dot(toRadio), -0.95, 0.95);

    try {
      this.panner.pan.setValueAtTime(pan, this.soundManager.ctx.currentTime);
    } catch(e) {}
  }

  stopRadioAudio() {
    this.isPlaying = false;
    if (this.tubeLight) this.tubeLight.intensity = 0;
    if (this.morseInterval) clearInterval(this.morseInterval);
    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch(e) {}
    }
  }
}
