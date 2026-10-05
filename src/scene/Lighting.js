import * as THREE from 'three';

export class Lighting {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.flashlightOn = true;
    this.flickerTimer = 0;
    this.isFlickering = false;

    this.buildAmbientLight();
    this.buildMainHangingLamp();
    this.buildCorridorLamp();
    this.buildFlashlight();
    this.buildVolumetricLightCone();
  }

  buildAmbientLight() {
    // Very dim, deep midnight blue-gray ambient light so unlit corners stay dark and creepy
    this.ambientLight = new THREE.AmbientLight(0x0c0907, 0.4);
    this.scene.add(this.ambientLight);
  }

  buildMainHangingLamp() {
    // Hanging lamp assembly suspended from ceiling at (0, 4.2, 1.0)
    this.lampAnchor = new THREE.Group();
    this.lampAnchor.position.set(0, 4.15, 1.0);

    // Twisted black wire drop
    const wireGeo = new THREE.CylinderGeometry(0.005, 0.005, 1.6, 6);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(0, -0.8, 0);
    this.lampAnchor.add(wire);

    // Hanging Lamp Head (Socket + Shade + Bulb)
    this.lampHead = new THREE.Group();
    this.lampHead.position.set(0, -1.6, 0);

    // Brass Socket
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x8a6e38, metalness: 0.8, roughness: 0.3 });
    const socketGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.08, 12);
    const socket = new THREE.Mesh(socketGeo, socketMat);
    this.lampHead.add(socket);

    // Conical Dark Metal Lampshade (갓)
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0x1a211a, // Dark vintage enameled green/black
      roughness: 0.6,
      metalness: 0.4,
      side: THREE.DoubleSide
    });
    const shadeGeo = new THREE.ConeGeometry(0.25, 0.12, 16, 1, true);
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(0, -0.04, 0);
    this.lampHead.add(shade);

    // Glowing Edison Light Bulb (백열전구 구체)
    const bulbMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
    });
    const bulbGeo = new THREE.SphereGeometry(0.05, 16, 16);
    this.bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    this.bulbMesh.position.set(0, -0.07, 0);
    this.lampHead.add(this.bulbMesh);

    // Filament glow halo
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.6,
    });
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), glowMat);
    glowSphere.position.set(0, -0.07, 0);
    this.lampHead.add(glowSphere);

    // Dynamic PointLight (핵심 조명)
    this.mainPointLight = new THREE.PointLight(0xffa844, 45, 14, 2);
    this.mainPointLight.position.set(0, -0.1, 0);
    this.mainPointLight.castShadow = true;
    this.mainPointLight.shadow.mapSize.width = 1024;
    this.mainPointLight.shadow.mapSize.height = 1024;
    this.mainPointLight.shadow.camera.near = 0.1;
    this.mainPointLight.shadow.camera.far = 16;
    this.mainPointLight.shadow.bias = -0.002;
    this.lampHead.add(this.mainPointLight);

    this.lampAnchor.add(this.lampHead);
    this.scene.add(this.lampAnchor);
  }

  buildVolumetricLightCone() {
    // Air kept clear without dusty haze per request
    this.volumetricCone = null;
  }

  buildCorridorLamp() {
    // Secondary faint reddish-amber light down the long back corridor (Z = -10.5)
    this.corridorLight = new THREE.PointLight(0xd46830, 20, 10, 2);
    this.corridorLight.position.set(0, 3.2, -10.5);
    this.corridorLight.castShadow = true;
    this.corridorLight.shadow.mapSize.width = 512;
    this.corridorLight.shadow.mapSize.height = 512;
    this.corridorLight.shadow.bias = -0.003;
    this.scene.add(this.corridorLight);

    // Bare bulb mesh for corridor
    const cBulbMat = new THREE.MeshBasicMaterial({ color: 0xff7733 });
    const cBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), cBulbMat);
    cBulb.position.set(0, 3.2, -10.5);
    this.scene.add(cBulb);
  }

  buildFlashlight() {
    // Player's handheld flashlight
    this.flashlight = new THREE.SpotLight(0xfcf6e6, 32, 18, 0.42, 0.55, 1.8);
    this.flashlight.position.set(0.18, -0.15, -0.1);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.camera.near = 0.1;
    this.flashlight.shadow.camera.far = 20;
    this.flashlight.shadow.bias = -0.001;

    // Flashlight target attached to camera
    const flashlightTarget = new THREE.Object3D();
    flashlightTarget.position.set(0, 0, -5);
    this.camera.add(flashlightTarget);
    this.flashlight.target = flashlightTarget;

    this.camera.add(this.flashlight);
  }

  toggleFlashlight(soundManager) {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.visible = this.flashlightOn;
    if (soundManager && soundManager.playFlashlightClick) {
      soundManager.playFlashlightClick();
    }
    return this.flashlightOn;
  }

  triggerFlicker() {
    this.isFlickering = true;
    this.flickerDuration = 0.4;
  }

  update(time, delta, soundManager) {
    // 1. Dual-axis pendulum swing for main hanging bulb
    // Subtle, eerie swaying caused by drafts or footsteps
    const swayAngleX = Math.sin(time * 0.9) * 0.05 + Math.sin(time * 1.7) * 0.02;
    const swayAngleZ = Math.cos(time * 0.7) * 0.04;
    this.lampHead.rotation.x = swayAngleX;
    this.lampHead.rotation.z = swayAngleZ;

    // 2. Bulb Electrical Voltage Flicker
    this.flickerTimer -= delta;
    if (this.flickerTimer <= 0) {
      // Chance of starting a flicker sequence
      if (Math.random() < 0.08) {
        this.isFlickering = true;
        this.flickerDuration = 0.15 + Math.random() * 0.35;
        this.flickerTimer = 4.0 + Math.random() * 7.0; // Next flicker in 4~11 seconds
        if (soundManager && soundManager.playBulbBuzz) {
          soundManager.playBulbBuzz();
        }
      } else {
        this.flickerTimer = 1.0;
      }
    }

    if (this.isFlickering) {
      this.flickerDuration -= delta;
      if (this.flickerDuration <= 0) {
        this.isFlickering = false;
        this.mainPointLight.intensity = 45;
        this.bulbMesh.material.color.setHex(0xffeedd);
        if (this.volumetricCone) this.volumetricCone.material.opacity = 0.045;
      } else {
        // High frequency erratic voltage drop
        const dimFactor = Math.random() > 0.4 ? 0.15 : 0.85;
        this.mainPointLight.intensity = 45 * dimFactor;
        this.bulbMesh.material.color.setHex(dimFactor < 0.3 ? 0x442211 : 0xffeedd);
        if (this.volumetricCone) this.volumetricCone.material.opacity = 0.045 * dimFactor;
      }
    }

    // Corridor light subtle breathing
    this.corridorLight.intensity = 20 + Math.sin(time * 2.1) * 3;
  }
}
