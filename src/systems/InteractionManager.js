import * as THREE from 'three';
import { gameState } from './GameState.js';

export class InteractionManager {
  constructor(camera, scene, playerControls, soundManager, inspectViewRenderer = null) {
    this.camera = camera;
    this.scene = scene;
    this.playerControls = playerControls;
    this.soundManager = soundManager;
    this.inspectViewRenderer = inspectViewRenderer;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.2; // 3.2 meter interaction range
    this.centerCoord = new THREE.Vector2(0, 0);

    this.currentInteractable = null;
    this.isInspecting = false;

    // UI elements
    this.crosshairEl = document.getElementById('crosshair');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');
    this.inspectModalEl = document.getElementById('inspect-modal');
    this.inspectTitleEl = document.getElementById('inspect-title');
    this.inspectDescEl = document.getElementById('inspect-desc');
    this.inspectTagEl = document.getElementById('inspect-tag');
    this.inspectCloseBtn = document.getElementById('inspect-close');

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        if (this.isInspecting) {
          this.closeInspect();
        } else if (this.currentInteractable) {
          this.triggerInspect(this.currentInteractable);
        }
      } else if (e.code === 'Escape' && this.isInspecting) {
        this.closeInspect();
      }
    });

    if (this.inspectCloseBtn) {
      this.inspectCloseBtn.addEventListener('click', () => {
        this.closeInspect();
      });
    }

    if (this.promptEl) {
      this.promptEl.style.cursor = 'pointer';
      this.promptEl.addEventListener('click', () => {
        if (this.currentInteractable && !this.isInspecting) {
          this.triggerInspect(this.currentInteractable);
        }
      });
    }
  }

  update() {
    if (this.isInspecting || !this.playerControls.controls.isLocked) {
      this.setPrompt(null);
      return;
    }

    // Raycast from camera center
    this.raycaster.setFromCamera(this.centerCoord, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    let foundInteractable = null;

    for (const hit of intersects) {
      let obj = hit.object;
      // Traverse upward to check if this mesh or any parent is interactable
      while (obj && obj !== this.scene) {
        if (obj.userData && obj.userData.isInteractable) {
          foundInteractable = obj.userData;
          break;
        }
        obj = obj.parent;
      }
      if (foundInteractable) break;
    }

    this.currentInteractable = foundInteractable;
    this.setPrompt(foundInteractable);
  }

  setPrompt(data) {
    if (!this.promptEl || !this.crosshairEl) return;

    if (data) {
      this.crosshairEl.classList.add('interactable');
      this.promptEl.style.opacity = '1';
      this.promptEl.style.transform = 'translate(-50%, 0) scale(1)';
      if (this.promptTextEl) {
        let prefix = '';
        if (data.clueId) {
          const inspected = gameState.isClueInspected(data.clueId);
          prefix = inspected ? '○ ' : '● ';
        }
        this.promptTextEl.textContent = `[E] 조사하기 : ${prefix}${data.name}`;
      }
    } else {
      this.crosshairEl.classList.remove('interactable');
      this.promptEl.style.opacity = '0';
      this.promptEl.style.transform = 'translate(-50%, 10px) scale(0.95)';
    }
  }

  triggerInspect(data) {
    this.isInspecting = true;
    if (this.soundManager) {
      this.soundManager.playInspectStinger();
    }

    // Temporarily unlock pointer lock so player can see cursor/modal
    this.playerControls.controls.unlock();

    if (this.inspectTitleEl) this.inspectTitleEl.textContent = data.name;
    if (this.inspectDescEl) this.inspectDescEl.textContent = data.description;
    if (this.inspectTagEl) this.inspectTagEl.textContent = `[${data.type.toUpperCase()}] 1930s Gyeongseong`;

    // Render custom zoom clue / puzzle view
    if (this.inspectViewRenderer) {
      this.inspectViewRenderer.render(data);
    }

    if (this.inspectModalEl) {
      this.inspectModalEl.classList.add('active');
    }

    // Dispatch event for game systems
    window.dispatchEvent(new CustomEvent('space-inspect', { detail: data }));
  }

  closeInspect() {
    this.isInspecting = false;
    if (this.inspectModalEl) {
      this.inspectModalEl.classList.remove('active');
    }
    // Re-lock pointer
    this.playerControls.controls.lock();
  }
}
