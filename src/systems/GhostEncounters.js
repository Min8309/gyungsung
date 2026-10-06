import * as THREE from 'three';

// Each encounter fires once per play session, only while its location is in view.
export class GhostEncounters {
  constructor(scene, camera, soundManager, lighting) {
    Object.assign(this, { scene, camera, soundManager, lighting });
    this.ready = false;
    this.active = null;
    this.lastEncounter = -Infinity;
    this.direction = new THREE.Vector3();
    this.toTarget = new THREE.Vector3();
    this.encounters = [
      { id: 'cabinet', after: 10, origin: new THREE.Vector3(-4.7, 2.15, -0.7),
        target: new THREE.Vector3(-3.55, 2.15, -0.7), size: [1.8, 2.7], seen: false },
      { id: 'ceiling', after: 30, origin: new THREE.Vector3(4.65, 3.7, -2.6),
        target: new THREE.Vector3(3.7, 2.85, -2.6), size: [1.6, 2.4], seen: false }
    ];
    this.texture = new THREE.TextureLoader().load('/assets/basement-ghost.png',
      () => { this.ready = true; }, undefined,
      error => console.warn('Ghost image could not be loaded:', error));
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.SpriteMaterial({ map: this.texture, transparent: true,
      opacity: 0, depthWrite: false, depthTest: true, toneMapped: false });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.visible = false;
    this.sprite.userData.isGhostEffect = true;
    scene.add(this.sprite);
  }

  trigger(encounter, now) {
    if (!this.ready || this.active || encounter.seen) return false;
    encounter.seen = true;
    this.active = { encounter, startedAt: now };
    this.sprite.visible = true;
    this.sprite.position.copy(encounter.origin);
    this.sprite.scale.set(...encounter.size, 1);
    this.material.opacity = 0;
    this.lighting.triggerFlicker();
    this.soundManager.playGhostScream();
    return true;
  }

  update(now, playing, elapsedSeconds) {
    if (this.active) {
      const { encounter, startedAt } = this.active;
      const t = (now - startedAt) / 1000;
      if (t >= 1.8 || !playing) {
        this.sprite.visible = false;
        this.material.opacity = 0;
        this.active = null;
        this.lastEncounter = now;
        return;
      }
      const emerge = 1 - Math.pow(1 - Math.min(1, t / 0.22), 3);
      this.sprite.position.lerpVectors(encounter.origin, encounter.target, emerge);
      const scale = 1 + Math.min(0.18, t * 0.2);
      this.sprite.scale.set(encounter.size[0] * scale, encounter.size[1] * scale, 1);
      this.material.opacity = t < 0.12 ? t / 0.12 : Math.min(1, (1.8 - t) / 0.45);
      return;
    }
    if (!playing || !this.ready || now - this.lastEncounter < 12_000) return;
    this.camera.getWorldDirection(this.direction);
    for (const encounter of this.encounters) {
      if (encounter.seen || elapsedSeconds < encounter.after) continue;
      this.toTarget.subVectors(encounter.target, this.camera.position);
      const distance = this.toTarget.length();
      const lookingToward = this.direction.dot(this.toTarget.normalize()) > 0.85;
      if (distance < 8 && lookingToward) {
        this.trigger(encounter, now);
        break;
      }
    }
  }
}
