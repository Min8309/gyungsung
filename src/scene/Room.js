import * as THREE from 'three';

export class Room {
  constructor(scene, textureFactory) {
    this.scene = scene;
    this.tf = textureFactory;
    this.colliders = []; // Bounding boxes for collision detection

    this.buildArchitecture();
    this.buildBeamsAndPillars();
    this.buildCorridorDoor();
    this.buildWindows();
    this.buildLivedInFloorDetails();
  }

  buildArchitecture() {
    const { diffuse: floorDiffuse, bump: floorBump, roughness: floorRoughness } = this.tf.createWoodFloor();
    const { diffuse: wallDiffuse, bump: wallBump, roughness: wallRoughness } = this.tf.createWallTexture();
    const ceilingTexture = this.tf.createConcreteTexture();
    ceilingTexture.repeat.set(4, 8);

    // Floor Materials with PBR Roughness (Wet ink puddles glisten, worn walkways are matte)
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorDiffuse,
      bumpMap: floorBump,
      bumpScale: 0.08,
      roughnessMap: floorRoughness,
      roughness: 0.85,
      metalness: 0.08,
    });

    // Walls with stained plaster, inky handprints, and kick-scuffed wainscoting
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallDiffuse,
      bumpMap: wallBump,
      bumpScale: 0.04,
      roughnessMap: wallRoughness,
      roughness: 0.9,
      metalness: 0.04,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      roughness: 0.9,
      metalness: 0.05,
    });

    // 1. Main Room Floor (10m x 10m: X: -5 to 5, Z: -4 to 6)
    const mainFloorGeo = new THREE.PlaneGeometry(10, 10);
    const mainFloor = new THREE.Mesh(mainFloorGeo, floorMaterial);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.position.set(0, 0, 1);
    mainFloor.receiveShadow = true;
    this.scene.add(mainFloor);

    // 2. Corridor Floor (3.6m x 12m: X: -1.8 to 1.8, Z: -4 to -16)
    const corridorFloorGeo = new THREE.PlaneGeometry(3.6, 12);
    const corridorFloor = new THREE.Mesh(corridorFloorGeo, floorMaterial);
    corridorFloor.rotation.x = -Math.PI / 2;
    corridorFloor.position.set(0, 0, -10);
    corridorFloor.receiveShadow = true;
    this.scene.add(corridorFloor);

    // 3. Ceiling
    const mainCeilingGeo = new THREE.PlaneGeometry(10, 10);
    const mainCeiling = new THREE.Mesh(mainCeilingGeo, ceilingMaterial);
    mainCeiling.rotation.x = Math.PI / 2;
    mainCeiling.position.set(0, 4.3, 1);
    this.scene.add(mainCeiling);

    const corridorCeilingGeo = new THREE.PlaneGeometry(3.6, 12);
    const corridorCeiling = new THREE.Mesh(corridorCeilingGeo, ceilingMaterial);
    corridorCeiling.rotation.x = Math.PI / 2;
    corridorCeiling.position.set(0, 4.3, -10);
    this.scene.add(corridorCeiling);

    // 4. Main Room Walls
    // Left Wall (X = -5, Z: -4 to 6)
    const leftWallGeo = new THREE.PlaneGeometry(10, 4.3);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 2.15, 1);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.addColliderBox(new THREE.Vector3(-5.2, 2.15, 1), new THREE.Vector3(0.4, 4.3, 10));

    // Right Wall (X = 5, Z: -4 to 6)
    const rightWallGeo = new THREE.PlaneGeometry(10, 4.3);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 2.15, 1);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    this.addColliderBox(new THREE.Vector3(5.2, 2.15, 1), new THREE.Vector3(0.4, 4.3, 10));

    // Front Wall (Z = 6, X: -5 to 5)
    const frontWallGeo = new THREE.PlaneGeometry(10, 4.3);
    const frontWall = new THREE.Mesh(frontWallGeo, wallMaterial);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 2.15, 6);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);
    this.addColliderBox(new THREE.Vector3(0, 2.15, 6.2), new THREE.Vector3(10, 4.3, 0.4));

    // Back Partition Wall (Z = -4): Left section (-5 to -1.8), Right section (1.8 to 5)
    const backWallPartGeo = new THREE.PlaneGeometry(3.2, 4.3);
    const backLeftWall = new THREE.Mesh(backWallPartGeo, wallMaterial);
    backLeftWall.position.set(-3.4, 2.15, -4);
    backLeftWall.receiveShadow = true;
    this.scene.add(backLeftWall);
    this.addColliderBox(new THREE.Vector3(-3.4, 2.15, -4), new THREE.Vector3(3.2, 4.3, 0.4));

    const backRightWall = new THREE.Mesh(backWallPartGeo, wallMaterial);
    backRightWall.position.set(3.4, 2.15, -4);
    backRightWall.receiveShadow = true;
    this.scene.add(backRightWall);
    this.addColliderBox(new THREE.Vector3(3.4, 2.15, -4), new THREE.Vector3(3.2, 4.3, 0.4));

    // Corridor Walls
    // Corridor Left (X = -1.8, Z: -4 to -16)
    const corridorLeftGeo = new THREE.PlaneGeometry(12, 4.3);
    const corridorLeftWall = new THREE.Mesh(corridorLeftGeo, wallMaterial);
    corridorLeftWall.rotation.y = Math.PI / 2;
    corridorLeftWall.position.set(-1.8, 2.15, -10);
    corridorLeftWall.receiveShadow = true;
    this.scene.add(corridorLeftWall);
    this.addColliderBox(new THREE.Vector3(-2.0, 2.15, -10), new THREE.Vector3(0.4, 4.3, 12));

    // Corridor Right (X = 1.8, Z: -4 to -16)
    const corridorRightWall = new THREE.Mesh(corridorLeftGeo, wallMaterial);
    corridorRightWall.rotation.y = -Math.PI / 2;
    corridorRightWall.position.set(1.8, 2.15, -10);
    corridorRightWall.receiveShadow = true;
    this.scene.add(corridorRightWall);
    this.addColliderBox(new THREE.Vector3(2.0, 2.15, -10), new THREE.Vector3(0.4, 4.3, 12));

    // A doorway and a recessed landing, rather than a solid wall behind the leaves.
    for (const x of [-1.34, 1.34]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 4.3), wallMaterial);
      wall.position.set(x, 2.15, -16);
      this.scene.add(wall);
      this.addColliderBox(new THREE.Vector3(x, 2.15, -16.1), new THREE.Vector3(0.92, 4.3, 0.2));
    }
    const lintel = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 1.45), wallMaterial);
    lintel.position.set(0, 3.575, -16);
    this.scene.add(lintel);
    const landing = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 2.4), floorMaterial);
    landing.rotation.x = -Math.PI / 2;
    landing.position.set(0, 0, -17.2);
    this.scene.add(landing);
    const landingCeiling = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 2.4), ceilingMaterial);
    landingCeiling.rotation.x = Math.PI / 2;
    landingCeiling.position.set(0, 2.85, -17.2);
    this.scene.add(landingCeiling);
    for (const x of [-0.88, 0.88]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.85), wallMaterial);
      wall.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      wall.position.set(x, 1.425, -17.2);
      this.scene.add(wall);
      this.addColliderBox(new THREE.Vector3(x, 1.425, -17.2), new THREE.Vector3(0.1, 2.85, 2.4));
    }
    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 2.85), wallMaterial);
    endWall.position.set(0, 1.425, -18.4);
    this.scene.add(endWall);
    this.addColliderBox(new THREE.Vector3(0, 1.425, -18.45), new THREE.Vector3(1.76, 2.85, 0.1));

  }

  buildBeamsAndPillars() {
    const beamMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#1b110a'),
      roughness: 0.85,
    });

    // Horizontal ceiling cross-beams in main room
    const beamPositionsZ = [4.5, 1.5, -1.5, -4];
    beamPositionsZ.forEach(bz => {
      const beamGeo = new THREE.BoxGeometry(10.2, 0.35, 0.4);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 4.12, bz);
      beam.castShadow = true;
      beam.receiveShadow = true;
      this.scene.add(beam);
    });

    // Corridor cross-beams
    const corridorBeamsZ = [-7, -10, -13, -15.8];
    corridorBeamsZ.forEach(bz => {
      const cBeamGeo = new THREE.BoxGeometry(3.8, 0.3, 0.3);
      const cBeam = new THREE.Mesh(cBeamGeo, beamMat);
      cBeam.position.set(0, 4.15, bz);
      cBeam.castShadow = true;
      cBeam.receiveShadow = true;
      this.scene.add(cBeam);
    });

    // Wooden structural corner pillars
    const pillarPositions = [
      [-4.9, 1], [-4.9, 5.9], [4.9, 1], [4.9, 5.9],
      [-1.75, -4.05], [1.75, -4.05], [-1.75, -15.9], [1.75, -15.9]
    ];
    pillarPositions.forEach(([px, pz]) => {
      const pillarGeo = new THREE.BoxGeometry(0.35, 4.3, 0.35);
      const pillar = new THREE.Mesh(pillarGeo, beamMat);
      pillar.position.set(px, 2.15, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.addColliderBox(new THREE.Vector3(px, 2.15, pz), new THREE.Vector3(0.4, 4.3, 0.4));
    });

    // Baseboards along walls
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x160f0a,
      roughness: 0.7,
    });
    // Left & Right baseboards
    const sideBBGeo = new THREE.BoxGeometry(0.08, 0.22, 10);
    const leftBB = new THREE.Mesh(sideBBGeo, baseboardMat);
    leftBB.position.set(-4.95, 0.11, 1);
    this.scene.add(leftBB);

    const rightBB = new THREE.Mesh(sideBBGeo, baseboardMat);
    rightBB.position.set(4.95, 0.11, 1);
    this.scene.add(rightBB);
  }

  openDoor() {
    if (this.doorOpening) return false;
    this.doorOpening = true;
    this.doorLockParts.forEach(part => { part.visible = false; });
    this.doorMesh.userData.description = '자물쇠가 풀려 철문이 열렸다. 문 너머로 인쇄소의 어두운 공간이 드러난다.';
    return true;
  }

  updateDoor(delta) {
    if (!this.doorOpening || this.doorOpenProgress >= 1) return;
    this.doorOpenProgress = Math.min(1, this.doorOpenProgress + delta / 2.8);
    const t = this.doorOpenProgress;
    const angle = t * t * (3 - 2 * t) * Math.PI / 2;
    this.doorPivots[0].rotation.y = angle;
    this.doorPivots[1].rotation.y = -angle;
    if (t === 1) {
      this.colliders = this.colliders.filter(box => box !== this.closedDoorCollider);
    }
  }

  buildCorridorDoor() {
    // Heavy wooden iron-reinforced double door at the end of the deep corridor
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, -15.92);

    const woodMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#23150d'),
      roughness: 0.8,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.85,
      roughness: 0.4,
    });

    // Frame posts leave the central opening clear.
    for (const x of [-0.95, 0.95]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), woodMat);
      post.position.set(x, 1.5, 0);
      doorGroup.add(post);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 0.15), woodMat);
    top.position.set(0, 2.95, 0);
    doorGroup.add(top);
    this.doorPivots = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.875, 0, 0.04);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.875, 2.7, 0.08), woodMat);
      leaf.position.set(-side * 0.4375, 1.45, 0);
      leaf.castShadow = true;
      pivot.add(leaf);
      for (const y of [0.6, 1.4, 2.2]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.02), ironMat);
        strap.position.set(-side * 0.4375, y, 0.05);
        pivot.add(strap);
        for (const offset of [0.12, 0.36, 0.62, 0.78]) {
          const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ironMat);
          rivet.rotation.x = Math.PI / 2;
          rivet.position.set(-side * offset, y, 0.06);
          pivot.add(rivet);
        }
      }
      doorGroup.add(pivot);
      this.doorPivots.push(pivot);
    }
    const lockBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.05), ironMat);
    lockBar.position.set(0, 1.4, 0.12);
    doorGroup.add(lockBar);
    const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.04), ironMat);
    padlock.position.set(0.1, 1.35, 0.16);
    doorGroup.add(padlock);
    this.doorLockParts = [lockBar, padlock];
    this.doorOpenProgress = 0;
    this.addColliderBox(new THREE.Vector3(0, 1.45, -15.88), new THREE.Vector3(1.75, 2.7, 0.12));
    this.closedDoorCollider = this.colliders[this.colliders.length - 1];

    // Wooden sign above door: "地下 活版 輪轉機室 (Underground Rotary Press Room)"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#22150c';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#5a3a20';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(10, 10, 492, 108);
    sCtx.fillStyle = '#dfcfb2';
    sCtx.font = 'bold 36px serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('地下 活版 輪轉機室', 256, 65);
    sCtx.font = '16px serif';
    sCtx.fillStyle = '#a6241e';
    sCtx.fillText('【 立 入 禁 止 】', 256, 100);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.04), signMat);
    signMesh.position.set(0, 3.2, 0.08);
    doorGroup.add(signMesh);

    // Set interactive property
    doorGroup.userData = {
      isInteractable: true,
      name: '지하 윤전기실 철문',
      description: '육중한 쇠빗장과 낡은 자물쇠로 굳게 닫혀 있는 철문이다. 문틈 너머 깊은 지하에서 묵직한 쇠 굴러가는 소리와 인쇄기의 진동이 희미하게 울려온다. 열쇠가 필요할 것 같다.',
      type: 'door'
    };

    this.scene.add(doorGroup);
    this.doorMesh = doorGroup;

    // Eerie Silhouette Ghost Mesh standing at end of 12m corridor (flashes during 12 midnight bell gongs)
    const ghostGroup = new THREE.Group();
    ghostGroup.position.set(0, 0, -15.2);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x050403 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 1.3, 8), ghostMat);
    body.position.set(0, 1.1, 0);
    ghostGroup.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), ghostMat);
    head.position.set(0, 1.88, 0);
    ghostGroup.add(head);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), ghostMat);
    armL.position.set(-0.28, 1.1, 0);
    ghostGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), ghostMat);
    armR.position.set(0.28, 1.1, 0);
    ghostGroup.add(armR);

    ghostGroup.visible = false;
    this.scene.add(ghostGroup);
    this.corridorGhostMesh = ghostGroup;
  }

  buildWindows() {
    // Vintage high multi-pane windows on front wall (Z = 5.95)
    // Foggy midnight exterior with dark silhouette of rainy Gyeongseong night
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 512;
    winCanvas.height = 512;
    const wCtx = winCanvas.getContext('2d');

    // Dark misty night gradient outside
    const grad = wCtx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#04070c');
    grad.addColorStop(0.7, '#08101a');
    grad.addColorStop(1, '#0c1524');
    wCtx.fillStyle = grad;
    wCtx.fillRect(0, 0, 512, 512);

    // Distant faint rainy window raindrops
    wCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 300; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      wCtx.fillRect(rx, ry, 1, 6 + Math.random() * 10);
    }

    const winTex = new THREE.CanvasTexture(winCanvas);
    const winMat = new THREE.MeshStandardMaterial({
      map: winTex,
      roughness: 0.2,
      metalness: 0.8,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#181008'),
      roughness: 0.85,
    });

    [-2.2, 2.2].forEach(wx => {
      const winGroup = new THREE.Group();
      winGroup.position.set(wx, 3.75, 5.92);

      // Glass plane
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.55), winMat);
      glass.rotation.y = Math.PI;
      winGroup.add(glass);

      // Wooden Window Frame Grid (4x4 colonial window panes)
      const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 0.08), frameMat);
      winGroup.add(frameOuter);

      // Horizontal and vertical grid bars
      for (let gy = -0.2; gy <= 0.2; gy += 0.4) {
        const barH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.04), frameMat);
        barH.position.set(0, gy, -0.02);
        winGroup.add(barH);
      }
      for (let gx = -0.4; gx <= 0.4; gx += 0.4) {
        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), frameMat);
        barV.position.set(gx, 0, -0.02);
        winGroup.add(barV);
      }

      this.scene.add(winGroup);
    });
  }

  buildLivedInFloorDetails() {
    const newsTex = this.tf.createNewspaperTexture();
    const paperMat = new THREE.MeshStandardMaterial({
      map: newsTex,
      roughness: 0.95,
      side: THREE.DoubleSide
    });

    // 1. Crumpled Waste Proof Papers (바닥에 굴러다니는 구겨진 신문 파지들)
    const paperPositions = [
      { x: 0.85, z: 1.85, rot: 0.6, scale: 0.09 },
      { x: -1.1, z: 1.5, rot: -0.4, scale: 0.08 },
      { x: -3.2, z: 4.4, rot: 1.2, scale: 0.11 },
      { x: 1.15, z: -5.2, rot: 0.3, scale: 0.075 },
      { x: -1.35, z: -8.4, rot: -0.9, scale: 0.085 }
    ];

    paperPositions.forEach(p => {
      const geo = new THREE.DodecahedronGeometry(p.scale, 1);
      // Displace vertices randomly to create natural crumple
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i) * (0.8 + Math.random() * 0.4);
        const vy = pos.getY(i) * 0.55; // Flatten slightly to rest on floor
        const vz = pos.getZ(i) * (0.8 + Math.random() * 0.4);
        pos.setXYZ(i, vx, vy, vz);
      }
      geo.computeVertexNormals();

      const paperMesh = new THREE.Mesh(geo, paperMat);
      paperMesh.position.set(p.x, p.scale * 0.45, p.z);
      paperMesh.rotation.set(Math.random() * 0.5, p.rot, Math.random() * 0.5);
      paperMesh.castShadow = true;
      paperMesh.receiveShadow = true;
      this.scene.add(paperMesh);
    });

    // 2. Inked Cleaning Rag (먹물 닦던 낡은 면포 걸레)
    const ragMat = new THREE.MeshStandardMaterial({
      color: 0x3d352b,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const ragGeo = new THREE.PlaneGeometry(0.35, 0.45, 6, 6);
    const rPos = ragGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const x = rPos.getX(i);
      const y = rPos.getY(i);
      const z = Math.sin(x * 10) * 0.03 + Math.cos(y * 8) * 0.02;
      rPos.setZ(i, z);
    }
    ragGeo.computeVertexNormals();
    const ragMesh = new THREE.Mesh(ragGeo, ragMat);
    ragMesh.rotation.x = -Math.PI / 2;
    ragMesh.position.set(0.7, 0.015, 0.4);
    ragMesh.receiveShadow = true;
    this.scene.add(ragMesh);

    // 3. 3D Broken, Collapsed & Dilapidated Floor Section (레퍼런스 이미지처럼 부서지고 꺼진 널빤지와 바닥 구멍)
    this.buildBrokenFloorFeature();
  }

  buildBrokenFloorFeature() {
    const brokenGroup = new THREE.Group();

    const woodPlankMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#3a2c20'),
      roughness: 0.85,
      metalness: 0.05
    });

    const darkUnderfloorMat = new THREE.MeshStandardMaterial({
      color: 0x050403,
      roughness: 0.95,
      metalness: 0.0
    });

    const beamMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#20150d'),
      roughness: 0.9
    });

    // A. Main Broken Floor Hole in Corridor Walkway (Z: -4.5 to -7.0, X: -0.65 to 0.65)
    // Dark recessed subfloor cavity (바닥 아래 깊은 구멍)
    const pitGeo = new THREE.BoxGeometry(1.35, 0.25, 2.5);
    const pit = new THREE.Mesh(pitGeo, darkUnderfloorMat);
    pit.position.set(0, -0.13, -5.75);
    brokenGroup.add(pit);

    // Structural subfloor joist beams spanning across the hole (바닥 아래 노출된 장선 멍에)
    const joistZ = [-4.9, -5.75, -6.6];
    joistZ.forEach(jz => {
      const joistGeo = new THREE.BoxGeometry(1.38, 0.12, 0.12);
      const joist = new THREE.Mesh(joistGeo, beamMat);
      joist.position.set(0, -0.06, jz);
      joist.castShadow = true;
      joist.receiveShadow = true;
      brokenGroup.add(joist);
    });

    // B. Real 3D Snapped, Tilted, Lifted & Warped Floorboards (부서지고 기울어진 널빤지들)
    // Plank 1: Left broken board tilted down into the hole
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 1.4), woodPlankMat);
    p1.position.set(-0.4, -0.04, -5.2);
    p1.rotation.set(0.12, 0.03, -0.05);
    p1.castShadow = true;
    p1.receiveShadow = true;
    brokenGroup.add(p1);

    // Plank 2: Broken board snapped in half, resting diagonally on a joist
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 1.1), woodPlankMat);
    p2.position.set(0.12, -0.07, -5.9);
    p2.rotation.set(-0.14, -0.08, 0.06);
    p2.castShadow = true;
    p2.receiveShadow = true;
    brokenGroup.add(p2);

    // Plank 3: Lifted warped board protruding slightly above floor level
    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.035, 1.3), woodPlankMat);
    p3.position.set(0.38, 0.02, -4.9);
    p3.rotation.set(-0.06, 0.04, 0.08);
    p3.castShadow = true;
    p3.receiveShadow = true;
    brokenGroup.add(p3);

    // Plank 4: Collapsed board resting near the bottom of the void
    const p4 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.9), woodPlankMat);
    p4.position.set(-0.15, -0.15, -6.3);
    p4.rotation.set(0.04, 0.2, -0.04);
    p4.castShadow = true;
    p4.receiveShadow = true;
    brokenGroup.add(p4);

    // Plank 5: Short splintered jagged plank end
    const p5 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.6), woodPlankMat);
    p5.position.set(-0.35, -0.015, -6.6);
    p5.rotation.set(-0.08, -0.02, -0.03);
    p5.castShadow = true;
    p5.receiveShadow = true;
    brokenGroup.add(p5);

    // C. Loose Splinters, Chips and Wood Shards Scattered Around Hole (부서진 나뭇조각 파편들)
    const splinterMat = new THREE.MeshStandardMaterial({
      color: 0x6e563d,
      roughness: 0.9
    });

    const splinterCoords = [
      [-0.55, -4.6, 0.18, 0.04, 0.5],
      [0.5, -4.4, 0.22, 0.03, -0.3],
      [-0.45, -6.9, 0.16, 0.04, 0.8],
      [0.35, -6.8, 0.25, 0.05, -0.6],
      [0.05, -4.55, 0.12, 0.03, 1.2],
      [-0.2, -6.85, 0.14, 0.03, -1.0]
    ];

    splinterCoords.forEach(([sx, sz, sw, sl, srot]) => {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.015, sl), splinterMat);
      sp.position.set(sx, 0.008, sz);
      sp.rotation.y = srot;
      sp.castShadow = true;
      brokenGroup.add(sp);
    });

    // D. Second Damaged / Cracked Floor Section in Main Room (Near paper storage, X: -2.6, Z: 3.2)
    const pSide1 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 1.6), woodPlankMat);
    pSide1.position.set(-2.6, 0.018, 3.2);
    pSide1.rotation.set(0.04, 0.02, 0.05);
    pSide1.castShadow = true;
    brokenGroup.add(pSide1);

    const pSide2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 1.2), woodPlankMat);
    pSide2.position.set(-2.85, -0.015, 3.5);
    pSide2.rotation.set(-0.06, -0.03, -0.04);
    pSide2.castShadow = true;
    brokenGroup.add(pSide2);

    this.scene.add(brokenGroup);
  }

  addColliderBox(center, size) {
    const min = new THREE.Vector3().subVectors(center, size.clone().multiplyScalar(0.5));
    const max = new THREE.Vector3().addVectors(center, size.clone().multiplyScalar(0.5));
    this.colliders.push(new THREE.Box3(min, max));
  }
}
