import * as THREE from 'three';
import { BasementAtmosphere } from './scene/BasementAtmosphere.js';
import { GhostEncounters } from './systems/GhostEncounters.js';
import { PlayTimer } from './systems/PlayTimer.js';
import { ExplorationHUD } from './ui/ExplorationHUD.js';
import { TextureFactory } from './scene/TextureFactory.js';
import { Room } from './scene/Room.js';
import { Furniture } from './scene/Furniture.js';
import { Props } from './scene/Props.js';
import { Lighting } from './scene/Lighting.js';
import { SoundManager } from './audio/SoundManager.js';
import { PlayerControls } from './player/PlayerControls.js';
import { InteractionManager } from './systems/InteractionManager.js';
import { TitleAnimation } from './ui/TitleAnimation.js';
import { HintSystem } from './systems/HintSystem.js';
import { NotebookUI } from './ui/NotebookUI.js';
import { InventoryUI } from './ui/InventoryUI.js';
import { InspectViewRenderer } from './ui/InspectViewRenderer.js';
import { RewardCardRenderer } from './ui/RewardCardRenderer.js';
import { gameState } from './systems/GameState.js';
import { PuzzleD_SolventScrub } from './puzzles/PuzzleD_SolventScrub.js';
import { PuzzleE_ResonantClock } from './puzzles/PuzzleE_ResonantClock.js';
import { NegativeTypeMirror } from './puzzles/NegativeTypeMirror.js';
import { DynamicCensorPoster } from './systems/DynamicCensorPoster.js';
import { RadioAmbiencePanner } from './audio/RadioAmbiencePanner.js';

class HorrorSpaceApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.startScreen = document.getElementById('start-screen');
    this.hudOverlay = document.getElementById('hud-overlay');
    this.flashlightDot = document.getElementById('flashlight-dot');
    this.soundDot = document.getElementById('sound-dot');

    this.lastTime = performance.now();
    this.startTime = this.lastTime;

    this.initScene();
    this.initModules();
    this.playTimer = new PlayTimer({
      controls: this.playerControls.controls,
      soundManager: this.soundManager,
      props: this.props,
      onEnd: () => { this.gameEnded = true; }
    });
    new BasementAtmosphere(this.scene);
    this.ghostEncounters = new GhostEncounters(this.scene, this.camera, this.soundManager, this.lighting);
    this.initUIEvents();
    this.explorationHUD = new ExplorationHUD(this.playerControls.controls);
    this.animate();
  }

  initScene() {
    // 1. Renderer Setup with PBR & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene with Dark Atmosphere Fog
    this.scene = new THREE.Scene();
    // Cold damp basement fog swallows the distant corridor
    this.scene.fog = new THREE.FogExp2(0x040b0b, 0.075);

    // 3. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 80);
    this.scene.add(this.camera);

    // Handle Window Resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initModules() {
    // Texture generator
    this.textureFactory = new TextureFactory();

    // Procedural sound engine
    this.soundManager = new SoundManager();

    // 3D Architecture
    this.room = new Room(this.scene, this.textureFactory);

    // Lighting (Swinging bulb, flicker, flashlight)
    this.lighting = new Lighting(this.scene, this.camera);

    // Furniture (Towering type racks, central desk, drawers)
    this.furniture = new Furniture(this.scene, this.textureFactory, this.room);

    // Props (Pendulum clock, 1934 calendar, apron & glasses, cursed artifacts)
    this.props = new Props(this.scene, this.textureFactory);

    // First-Person Player Controller
    this.playerControls = new PlayerControls(
      this.camera,
      this.renderer.domElement,
      this.room,
      this.soundManager,
      this.lighting
    );

    // Extended printing theme & physical interaction puzzles
    this.puzzleD = new PuzzleD_SolventScrub(this.soundManager);
    this.puzzleE = new PuzzleE_ResonantClock(
      this.soundManager,
      this.lighting,
      this.room.corridorGhostMesh
    );
    this.negativeMirror = new NegativeTypeMirror(this.soundManager);

    // Dynamic environmental hints
    this.censorPoster = new DynamicCensorPoster(this.scene);
    this.radioAmbience = new RadioAmbiencePanner(this.scene, this.soundManager, this.camera);

    // UI Modules
    this.inventoryUI = new InventoryUI();
    this.notebookUI = new NotebookUI(this.playerControls);
    this.rewardCardRenderer = new RewardCardRenderer(
      this.soundManager,
      this.lighting,
      this.playerControls
    );
    this.inspectViewRenderer = new InspectViewRenderer(
      this.soundManager,
      () => this.rewardCardRenderer.startSequence(),
      this.puzzleD,
      this.puzzleE,
      this.negativeMirror
    );

    // Interaction & Raycasting System
    this.interactionManager = new InteractionManager(
      this.camera,
      this.scene,
      this.playerControls,
      this.soundManager,
      this.inspectViewRenderer
    );

    // 4-Layer Hint System (Pulsing emissive rimlights & auto-hints)
    this.hintSystem = new HintSystem(
      this.scene,
      this.camera,
      this.lighting,
      this.soundManager
    );
    this.registerCluesToHintSystem();

    // Title Morph Animation (Hangul <-> Hanja)
    this.titleAnimation = new TitleAnimation('main-animated-title');
  }

  registerCluesToHintSystem() {
    // Props clues (clock, calendar, apron, cube)
    const clueProps = [
      { id: 'clue_clock', puzzle: 'puzzle_a' },
      { id: 'clue_calendar', puzzle: 'puzzle_a' },
      { id: 'clue_glasses', puzzle: 'puzzle_b' },
      { id: 'clue_cube', puzzle: 'puzzle_b' }
    ];
    clueProps.forEach(({ id, puzzle }) => {
      const obj = this.props.interactables.find(it => it.userData && it.userData.clueId === id);
      if (obj) this.hintSystem.registerClue(id, puzzle, obj);
    });

    // Furniture clues (drawer 24, galley slots, proof paper, special rack)
    const clueFurniture = [
      { id: 'clue_drawer', puzzle: 'puzzle_a' },
      { id: 'clue_galley_slot', puzzle: 'puzzle_c' },
      { id: 'clue_proof_title', puzzle: 'puzzle_c' },
      { id: 'clue_rack_types', puzzle: 'puzzle_c' }
    ];
    clueFurniture.forEach(({ id, puzzle }) => {
      const obj = this.furniture.interactables.find(it => it.userData && it.userData.clueId === id);
      if (obj) this.hintSystem.registerClue(id, puzzle, obj);
    });

    // Mirror plate on desk
    const mirrorObj = this.furniture.interactables.find(it => it.userData && it.userData.clueId === 'clue_mirror_type');
    if (mirrorObj) this.hintSystem.registerClue('clue_mirror_type', 'puzzle_a', mirrorObj);

    // Censor poster on wall
    if (this.censorPoster && this.censorPoster.mesh) {
      this.hintSystem.registerClue('clue_censor', 'puzzle_a', this.censorPoster.mesh);
    }

    // Radio at corridor
    if (this.radioAmbience && this.radioAmbience.radioMesh) {
      this.hintSystem.registerClue('clue_radio', 'puzzle_a', this.radioAmbience.radioMesh);
    }
  }

  initUIEvents() {
    window.addEventListener('door-unlocked', () => {
      if (this.gameEnded || !this.room.openDoor()) return;
      this.soundManager.playMetalDoorOpen();
      // Return to the scene so the player sees the leaves swing open.
      this.interactionManager.closeInspect();
    });
    // Click on start screen to engage pointer lock and audio
    this.startScreen.addEventListener('click', () => {
      this.soundManager.ensureContext();
      this.playerControls.controls.lock();
    });

    // PointerLock state change listener
    this.playerControls.controls.addEventListener('lock', () => {
      this.startScreen.classList.add('hidden');
    });

    this.playerControls.controls.addEventListener('unlock', () => {
      if (this.gameEnded) return;
      const isModalOpen = this.interactionManager.isInspecting || 
                          this.notebookUI.isOpen || 
                          (this.rewardCardRenderer.modalEl && this.rewardCardRenderer.modalEl.classList.contains('active'));
      if (!isModalOpen) {
        this.startScreen.classList.remove('hidden');
      }
    });

    // Global Key shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH') {
        // Toggle HUD
        if (this.hudOverlay) {
          this.hudOverlay.classList.toggle('hidden');
        }
      } else if (e.code === 'KeyM') {
        // Toggle Sound Mute
        const isMuted = this.soundManager.toggleMute();
        if (this.soundDot) {
          this.soundDot.classList.toggle('active', !isMuted);
        }
      } else if (e.code === 'KeyF') {
        // Update flashlight status dot in HUD
        if (this.flashlightDot && this.lighting) {
          this.flashlightDot.classList.toggle('active', this.lighting.flashlightOn);
        }
      }
    });
  }

  animate() {
    if (this.gameEnded) return;
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    // 1. Update Player Movement & Collision
    this.playerControls.update(delta);

    // 2. Update Interactive Raycasting & Prompts
    this.interactionManager.update();

    // 3. Update Props (Swinging pendulum, clock tick sync, eye tracking)
    this.props.update(time, delta, this.soundManager, this.camera);
    this.room.updateDoor(delta);

    // 4. Update Lighting (Bulb sway, flicker buzz)
    this.lighting.update(time, delta, this.soundManager);

    // 5. Update Dynamic Censor Poster & Radio Spatial Ambience
    if (this.censorPoster) this.censorPoster.update(now, delta);
    if (this.radioAmbience) this.radioAmbience.update(now, delta);

    // 6. Update 4-Layer Hint System (Emissive rimlight pulse & auto-hint timer)
    this.hintSystem.update(time, delta);

    this.ghostEncounters.update(now,
      this.playerControls.controls.isLocked && !this.playTimer.finalizing,
      this.playTimer.startedAt === null ? 0 : (now - this.playTimer.startedAt) / 1000);

    // 7. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Launch Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new HorrorSpaceApp();
});
