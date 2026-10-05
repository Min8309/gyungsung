import * as THREE from 'three';

export class DustParticles {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 1200;
    this.bounds = {
      minX: -4.5, maxX: 4.5,
      minY: 0.2, maxY: 4.0,
      minZ: -14.0, maxZ: 5.5
    };

    this.buildParticles();
  }

  buildParticles() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const scales = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      // Concentrate more particles near the center lamp (X: -2 to 2, Z: -1 to 3)
      const nearCenter = Math.random() < 0.6;
      const x = nearCenter
        ? (Math.random() - 0.5) * 4.0
        : THREE.MathUtils.lerp(this.bounds.minX, this.bounds.maxX, Math.random());
      const y = THREE.MathUtils.lerp(this.bounds.minY, this.bounds.maxY, Math.random());
      const z = nearCenter
        ? THREE.MathUtils.lerp(-1.0, 3.5, Math.random())
        : THREE.MathUtils.lerp(this.bounds.minZ, this.bounds.maxZ, Math.random());

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Gentle floating velocity
      velocities[i * 3] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.03 - 0.01; // slight downward drift
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      scales[i] = Math.random() * 0.025 + 0.01;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle sprite using canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 190, 1)');
    grad.addColorStop(0.3, 'rgba(255, 220, 160, 0.6)');
    grad.addColorStop(1, 'rgba(255, 220, 160, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    const pTex = new THREE.CanvasTexture(pCanvas);

    const mat = new THREE.PointsMaterial({
      map: pTex,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.velocities = velocities;
    this.scene.add(this.points);
  }

  update(delta) {
    const pos = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3] += this.velocities[i * 3] * delta;
      pos[i * 3 + 1] += this.velocities[i * 3 + 1] * delta;
      pos[i * 3 + 2] += this.velocities[i * 3 + 2] * delta;

      // Wrap around bounds
      if (pos[i * 3 + 1] < this.bounds.minY) pos[i * 3 + 1] = this.bounds.maxY;
      if (pos[i * 3 + 1] > this.bounds.maxY) pos[i * 3 + 1] = this.bounds.minY;
      if (pos[i * 3] < this.bounds.minX) pos[i * 3] = this.bounds.maxX;
      if (pos[i * 3] > this.bounds.maxX) pos[i * 3] = this.bounds.minX;
      if (pos[i * 3 + 2] < this.bounds.minZ) pos[i * 3 + 2] = this.bounds.maxZ;
      if (pos[i * 3 + 2] > this.bounds.maxZ) pos[i * 3 + 2] = this.bounds.minZ;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
