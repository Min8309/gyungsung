import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerControls {
  constructor(camera, domElement, room, soundManager, lighting) {
    this.camera = camera;
    this.domElement = domElement;
    this.room = room;
    this.soundManager = soundManager;
    this.lighting = lighting;

    this.controls = new PointerLockControls(this.camera, this.domElement);

    // Initial position: standing near the entrance facing the main typesetting desk
    this.camera.position.set(0, 1.65, 4.2);
    this.camera.rotation.set(0, 0, 0);

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isZooming = false;

    // Movement parameters
    this.walkSpeed = 2.2;
    this.sprintSpeed = 4.0;
    this.crouchSpeed = 1.3;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Head bobbing & camera heights
    this.standHeight = 1.65;
    this.crouchHeight = 0.95;
    this.currentHeight = this.standHeight;
    this.bobTimer = 0;
    this.lastFootstepBob = 0;

    // Camera FOV
    this.defaultFOV = 75;
    this.zoomFOV = 40;
    this.currentFOV = this.defaultFOV;

    // Collision radius
    this.playerRadius = 0.35;

    this.initEventListeners();
  }

  initEventListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Right Click for Zoom / Focus
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.controls.isLocked) {
        this.isZooming = true;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isZooming = false;
      }
    });

    // Prevent default context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mobile touch controls: drag to look around
    let touchPrevX = 0;
    let touchPrevY = 0;
    let isTouching = false;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchPrevX = e.touches[0].clientX;
        touchPrevY = e.touches[0].clientY;
        isTouching = true;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isTouching && e.touches.length === 1) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchX - touchPrevX;
        const deltaY = touchY - touchPrevY;
        touchPrevX = touchX;
        touchPrevY = touchY;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        euler.y -= deltaX * 0.0035;
        euler.x -= deltaY * 0.0035;
        euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x));
        this.camera.quaternion.setFromEuler(euler);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isTouching = false;
    }, { passive: true });
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
      case 'KeyC':
      case 'ControlLeft':
        this.isCrouching = !this.isCrouching;
        break;
      case 'KeyZ':
        this.isZooming = !this.isZooming;
        break;
      case 'KeyF':
        if (this.lighting) {
          this.lighting.toggleFlashlight(this.soundManager);
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }

  update(delta) {
    if (!this.controls.isLocked) return;

    // 1. Smooth Camera Zoom (FOV)
    const targetFOV = this.isZooming ? this.zoomFOV : this.defaultFOV;
    this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, targetFOV, delta * 10);
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();

    // 2. Crouch Height Interpolation
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, delta * 8);

    // 3. Movement Direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    // Speed selection
    let speed = this.walkSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    else if (this.isSprinting) speed = this.sprintSpeed;

    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;

    if (isMoving) {
      const moveVector = new THREE.Vector3();
      // Forward vector projected on XZ ground plane
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      // Right vector
      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      moveVector.addScaledVector(forward, this.direction.z * speed * delta);
      moveVector.addScaledVector(right, this.direction.x * speed * delta);

      // 4. Sliding Collision Detection with Axis Separation
      this.applyMoveWithCollision(moveVector);

      // 5. Head Bobbing & Footsteps
      const bobFreq = this.isSprinting ? 12 : (this.isCrouching ? 6 : 8.5);
      const bobAmp = this.isSprinting ? 0.05 : (this.isCrouching ? 0.015 : 0.03);
      this.bobTimer += delta * bobFreq;

      const bobY = Math.sin(this.bobTimer) * bobAmp;
      this.camera.position.y = this.currentHeight + bobY;

      // Footstep audio on bottom of bob
      const sinVal = Math.sin(this.bobTimer);
      if (sinVal < -0.9 && this.lastFootstepBob >= -0.9) {
        if (this.soundManager) {
          this.soundManager.playFootstep(this.isSprinting);

          // 7% chance of a loose floorboard creak
          if (Math.random() < 0.07) {
            this.soundManager.playFloorboardCreak();
          }
        }
      }
      this.lastFootstepBob = sinVal;
    } else {
      // Idle breathing bob
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.currentHeight, delta * 6);
      this.bobTimer = 0;
      this.lastFootstepBob = 0;
    }
  }

  applyMoveWithCollision(moveVec) {
    const origPos = this.camera.position.clone();

    // Test X movement independently
    const testPosX = origPos.clone();
    testPosX.x += moveVec.x;
    if (!this.checkCollision(testPosX)) {
      this.camera.position.x = testPosX.x;
    }

    // Test Z movement independently
    const testPosZ = this.camera.position.clone();
    testPosZ.z += moveVec.z;
    if (!this.checkCollision(testPosZ)) {
      this.camera.position.z = testPosZ.z;
    }
  }

  checkCollision(testPos) {
    if (!this.room || !this.room.colliders) return false;

    const r = this.playerRadius;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(testPos.x - r, 0.1, testPos.z - r),
      new THREE.Vector3(testPos.x + r, 2.0, testPos.z + r)
    );

    for (const box of this.room.colliders) {
      if (playerBox.intersectsBox(box)) {
        return true;
      }
    }
    return false;
  }
}
