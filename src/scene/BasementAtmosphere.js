import * as THREE from 'three';

export class BasementAtmosphere {
  constructor(scene) {
    const iron = new THREE.MeshStandardMaterial({ color: 0x26302e, metalness: 0.7, roughness: 0.85 });
    // Exposed service pipes below the ceiling replace the feeling of an upstairs room.
    for (const x of [-4.15, 4.15]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 9.6, 10), iron);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 3.95, 1);
      scene.add(pipe);
      for (const z of [-3.5, -0.5, 2.5, 5.5]) {
        const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 5, 10), iron);
        clamp.position.set(x, 3.95, z);
        scene.add(clamp);
      }
    }
    const cableMat = new THREE.LineBasicMaterial({ color: 0x202b27 });
    for (let i = 0; i < 12; i++) {
      const x = (i - 5.5) * 0.05;
      const length = 0.25 + (i % 5) * 0.15;
      const points = [new THREE.Vector3(x, 4.25, -9.8),
        new THREE.Vector3(x + 0.05, 4.1 - length, -9.75),
        new THREE.Vector3(x - 0.03, 4.05 - length, -9.7)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), cableMat));
    }
    const rubble = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.08, 0),
      new THREE.MeshStandardMaterial({ color: 0x343c38, roughness: 1 }), 60);
    const transform = new THREE.Object3D();
    for (let i = 0; i < 60; i++) {
      transform.position.set((i % 2 ? 1 : -1) * (1.18 + (i % 7) * 0.05), 0.035, -4.5 - (i / 60) * 10.7);
      transform.scale.set(0.6 + (i % 4) * 0.3, 0.45, 0.75);
      transform.rotation.set(i, i * 0.7, i * 0.3);
      transform.updateMatrix();
      rubble.setMatrixAt(i, transform.matrix);
    }
    scene.add(rubble);
  }
}
