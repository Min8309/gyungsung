import * as THREE from 'three';

export class Furniture {
  constructor(scene, textureFactory, room) {
    this.scene = scene;
    this.tf = textureFactory;
    this.room = room;
    this.interactables = [];

    this.woodMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#281b12'),
      roughness: 0.75,
      metalness: 0.05,
    });

    this.typeCaseTex = this.tf.createTypeCaseTexture();
    this.typeCaseMat = new THREE.MeshStandardMaterial({
      map: this.typeCaseTex,
      roughness: 0.65,
      metalness: 0.2,
    });

    this.leadMetalMat = new THREE.MeshStandardMaterial({
      color: 0x5a5c64,
      roughness: 0.35,
      metalness: 0.85,
    });

    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0x99773d,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.buildTypeRacks();
    this.buildCenterDesk();
    this.buildSideStorage();
  }

  // 1. Towering Movable-Type Cabinets (활자 보관장 / 문선대)
  buildTypeRacks() {
    // Left Wall Racks (along X = -4.5)
    this.createTypeRack(-4.55, 1, 0, 2.8, 3.4, 0.45);
    this.createTypeRack(-4.55, 3.8, 0, 2.4, 3.4, 0.45);

    // Right Wall Racks (along X = 4.5)
    this.createTypeRack(4.55, 1, Math.PI, 2.8, 3.4, 0.45);
    this.createTypeRack(4.55, 3.8, Math.PI, 2.4, 3.4, 0.45);

    // Corridor Aisles Racks: Towering on both sides of the corridor! (X = -1.55 and X = 1.55)
    // Left Corridor Racks
    this.createTypeRack(-1.55, -6.5, 0, 2.8, 3.3, 0.4);
    this.createTypeRack(-1.55, -9.5, 0, 2.8, 3.3, 0.4);
    this.createTypeRack(-1.55, -12.5, 0, 2.8, 3.3, 0.4);

    // Right Corridor Racks
    this.createTypeRack(1.55, -6.5, Math.PI, 2.8, 3.3, 0.4);
    this.createTypeRack(1.55, -9.5, Math.PI, 2.8, 3.3, 0.4);
    this.createTypeRack(1.55, -12.5, Math.PI, 2.8, 3.3, 0.4);
  }

  createTypeRack(x, z, rotationY, width, height, depth) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, 0, z);
    rackGroup.rotation.y = rotationY;

    // Main Wooden Cabinet Body
    const bodyGeo = new THREE.BoxGeometry(depth, height, width);
    const body = new THREE.Mesh(bodyGeo, this.woodMat);
    body.position.set(0, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    rackGroup.add(body);

    // Front Facing Type Matrix Panels (Packed with lead characters)
    const faceW = width - 0.1;
    const faceH = height - 0.3;
    const faceGeo = new THREE.PlaneGeometry(faceW, faceH);
    const face = new THREE.Mesh(faceGeo, this.typeCaseMat);
    // Face points towards positive X (interior of the room)
    face.rotation.y = Math.PI / 2;
    face.position.set(depth / 2 + 0.01, height / 2, 0);
    rackGroup.add(face);

    // Slanted top composing rack ledge (상단 경사 식자대)
    const slantGeo = new THREE.BoxGeometry(0.3, 0.04, width);
    const slant = new THREE.Mesh(slantGeo, this.woodMat);
    slant.position.set(depth / 2 + 0.08, height - 0.8, 0);
    slant.rotation.z = 0.35; // Slanted towards worker
    rackGroup.add(slant);

    // Slanted composing galley tray with lead type on it
    const trayGeo = new THREE.BoxGeometry(0.24, 0.02, 0.6);
    const tray = new THREE.Mesh(trayGeo, this.leadMetalMat);
    tray.position.set(depth / 2 + 0.09, height - 0.77, 0);
    tray.rotation.z = 0.35;
    rackGroup.add(tray);

    // Paper tags hanging off shelves
    for (let t = -width / 2 + 0.3; t < width / 2; t += 0.7) {
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 64;
      tagCanvas.height = 32;
      const tCtx = tagCanvas.getContext('2d');
      tCtx.fillStyle = '#cfb98d';
      tCtx.fillRect(0, 0, 64, 32);
      tCtx.fillStyle = '#221509';
      tCtx.font = '10px serif';
      tCtx.fillText('五號 明朝', 4, 18);
      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, side: THREE.DoubleSide });
      const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), tagMat);
      tagMesh.rotation.y = Math.PI / 2;
      tagMesh.position.set(depth / 2 + 0.02, 1.2 + Math.random() * 1.2, t);
      rackGroup.add(tagMesh);
    }

    // Interactive data
    const isSpecialClueRack = (x === -4.55 && z === 1);
    rackGroup.userData = {
      isInteractable: true,
      clueId: isSpecialClueRack ? 'clue_rack_types' : null,
      name: isSpecialClueRack ? '활자 보관장 (노란 색인표: 특호 활자)' : '활자 보관장 (문선대)',
      description: isSpecialClueRack 
        ? '노란 색인 라벨이 붙은 칸에 [식], [자], [공] 특호 납 활자가 꽂혀 있다.'
        : '수만 자에 달하는 납 활자가 크기별, 부수별로 분류되어 꽂혀 있는 거대한 목재 활자장이다.',
      type: isSpecialClueRack ? 'type_rack_label' : 'rack'
    };

    this.scene.add(rackGroup);
    this.interactables.push(rackGroup);

    // Physical collision
    const colliderSize = new THREE.Vector3(depth + 0.2, height, width + 0.2);
    this.room.addColliderBox(new THREE.Vector3(x, height / 2, z), colliderSize);
  }

  // 2. Central Typesetting Desk (중앙 식자 조판대 - 이미지의 핵심 작업대)
  buildCenterDesk() {
    const deskGroup = new THREE.Group();
    // Positioned directly under the main hanging swinging lamp at (0, 0, 1.0)
    deskGroup.position.set(0, 0, 1.2);

    const deskW = 2.4;
    const deskH = 0.95;
    const deskD = 1.2;

    // Heavy main wooden desk body
    const bodyGeo = new THREE.BoxGeometry(deskW, deskH, deskD);
    const deskBody = new THREE.Mesh(bodyGeo, this.woodMat);
    deskBody.position.set(0, deskH / 2, 0);
    deskBody.castShadow = true;
    deskBody.receiveShadow = true;
    deskGroup.add(deskBody);

    // Desk Top Overhang Board
    const topBoardGeo = new THREE.BoxGeometry(deskW + 0.15, 0.06, deskD + 0.15);
    const topBoard = new THREE.Mesh(topBoardGeo, this.woodMat);
    topBoard.position.set(0, deskH + 0.03, 0);
    topBoard.castShadow = true;
    topBoard.receiveShadow = true;
    deskGroup.add(topBoard);

    // Front Face Drawers (24 drawers: 4 rows x 6 columns)
    const rows = 4;
    const cols = 6;
    const drawerW = (deskW - 0.2) / cols;
    const drawerH = (deskH - 0.15) / rows;

    const drawerMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#342317'),
      roughness: 0.7,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dx = -deskW / 2 + 0.1 + c * drawerW + drawerW / 2;
        const dy = deskH - 0.1 - r * drawerH - drawerH / 2;
        const dz = deskD / 2 + 0.02;

        // Drawer Front Panel
        const drawerGeo = new THREE.BoxGeometry(drawerW - 0.02, drawerH - 0.02, 0.03);
        const drawer = new THREE.Mesh(drawerGeo, drawerMat);
        drawer.position.set(dx, dy, dz);
        drawer.castShadow = true;
        deskGroup.add(drawer);

        // Brass Cup Pull Handle
        const handleGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.04, 8, 1, false, 0, Math.PI);
        const handle = new THREE.Mesh(handleGeo, this.brassMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(dx, dy, dz + 0.02);
        deskGroup.add(handle);

        // Drawer 24 (r=3, c=5): Brass Dial Padlock for Puzzle A
        if (r === rows - 1 && c === cols - 1) {
          const dialLock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.03), this.brassMat);
          dialLock.position.set(dx, dy - 0.015, dz + 0.035);
          deskGroup.add(dialLock);

          drawer.userData = {
            isInteractable: true,
            clueId: 'clue_drawer',
            name: '24번 서랍 (놋쇠 다이얼 자물쇠)',
            description: '24개의 서랍 중 오직 이 서랍에만 4자리 놋쇠 다이얼 자물쇠가 채워져 있다.',
            type: 'drawer_24'
          };
          this.interactables.push(drawer);
        } else if (r === 0 && c === 0) {
          drawer.userData = {
            isInteractable: true,
            name: '1번 서랍',
            description: '굳게 잠겨 있어 열리지 않는다.',
            type: 'drawer_locked'
          };
          this.interactables.push(drawer);
        }
      }
    }

    // Top Workstation Props:
    // A. Large Composing Galley Tray (조판 상판)
    const galleyGeo = new THREE.BoxGeometry(1.0, 0.03, 0.65);
    const galley = new THREE.Mesh(galleyGeo, this.leadMetalMat);
    galley.position.set(-0.35, deskH + 0.075, 0.05);
    galley.castShadow = true;
    deskGroup.add(galley);

    // Inside the galley: Lead Type rows
    const leadTypeTex = this.typeCaseTex;
    const leadRows = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.58),
      new THREE.MeshStandardMaterial({ map: leadTypeTex, roughness: 0.4, metalness: 0.7 })
    );
    leadRows.rotation.x = -Math.PI / 2;
    leadRows.position.set(-0.35, deskH + 0.092, 0.05);
    deskGroup.add(leadRows);

    // Highlighted Composing Row (조판 상판 빈칸 3개 강조 라인 - 문제점 4번 개선)
    const highlightRow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x5a4425,
        roughness: 0.3,
        metalness: 0.7
      })
    );
    highlightRow.rotation.x = -Math.PI / 2;
    highlightRow.position.set(-0.35, deskH + 0.094, 0.05);
    deskGroup.add(highlightRow);

    // Yellow Label Tag on the highlighted row
    const rowTagCanvas = document.createElement('canvas');
    rowTagCanvas.width = 128;
    rowTagCanvas.height = 32;
    const rtc = rowTagCanvas.getContext('2d');
    rtc.fillStyle = '#ffdd44';
    rtc.fillRect(0, 0, 128, 32);
    rtc.fillStyle = '#111';
    rtc.font = 'bold 15px serif';
    rtc.textAlign = 'center';
    rtc.fillText('題字 組版 (3칸)', 64, 21);
    const rowTagTex = new THREE.CanvasTexture(rowTagCanvas);
    const rowTagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.06),
      new THREE.MeshBasicMaterial({ map: rowTagTex })
    );
    rowTagMesh.rotation.x = -Math.PI / 2;
    rowTagMesh.position.set(-0.65, deskH + 0.096, 0.05);
    deskGroup.add(rowTagMesh);

    // 3 Distinct Empty Slot Boxes for [식] [자] [공]
    [-0.2, 0.0, 0.2].forEach((sx) => {
      const slotGeo = new THREE.BoxGeometry(0.08, 0.015, 0.08);
      const slotMat = new THREE.MeshStandardMaterial({ color: 0x140d08, roughness: 0.8, metalness: 0.2 });
      const slotMesh = new THREE.Mesh(slotGeo, slotMat);
      slotMesh.position.set(-0.35 + sx, deskH + 0.095, 0.05);
      deskGroup.add(slotMesh);
    });

    // Square pulsed slot for Cursed Cube on the right side of the tray
    const cubeSlotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.015, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x2e120f, roughness: 0.6, metalness: 0.4 })
    );
    cubeSlotMesh.position.set(0.02, deskH + 0.095, -0.15);
    deskGroup.add(cubeSlotMesh);

    galley.userData = {
      isInteractable: true,
      clueId: 'clue_galley_slot',
      name: '식자 조판 상판 (빈칸 3개와 큐브 홈)',
      description: '노란 라벨이 붙은 제자 조판 줄에 3개의 빈칸이 있고, 우측에는 붉게 맥동하는 네모난 홈이 파여 있다.',
      type: 'galley_slot'
    };
    this.interactables.push(galley);

    // Polished Copper/Brass Mirror Plate for Negative Type Reflection
    const mirrorPlateGeo = new THREE.BoxGeometry(0.26, 0.015, 0.34);
    const mirrorPlateMat = new THREE.MeshStandardMaterial({
      color: 0xd4a24e,
      metalness: 0.95,
      roughness: 0.12,
    });
    const mirrorPlate = new THREE.Mesh(mirrorPlateGeo, mirrorPlateMat);
    mirrorPlate.position.set(0.85, deskH + 0.075, -0.28);
    mirrorPlate.castShadow = true;
    mirrorPlate.userData = {
      isInteractable: true,
      clueId: 'clue_mirror_type',
      name: '연마된 황동 반사판',
      description: '거울처럼 매끄럽게 연마된 황동 판이다. 거꾸로 된 활자를 비추어 정방향을 확인할 수 있다.',
      type: 'mirror_plate'
    };
    this.interactables.push(mirrorPlate);
    deskGroup.add(mirrorPlate);

    // B. Wooden Hand Ink Roller (먹물 롤러 / Brayer) - 3D Props
    const rollerGroup = new THREE.Group();
    rollerGroup.position.set(0.6, deskH + 0.09, -0.1);
    rollerGroup.rotation.y = 0.4;

    // Ink-black rubber cylinder
    const cylGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 16);
    const cylMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.25,
      metalness: 0.1,
    });
    const cylinder = new THREE.Mesh(cylGeo, cylMat);
    cylinder.rotation.z = Math.PI / 2;
    cylinder.castShadow = true;
    rollerGroup.add(cylinder);

    // Metal Frame Bracket
    const bracketGeo = new THREE.BoxGeometry(0.32, 0.02, 0.08);
    const bracket = new THREE.Mesh(bracketGeo, this.brassMat);
    bracket.position.set(0, 0.04, 0);
    rollerGroup.add(bracket);

    // Wooden Turned Handle
    const handleBarGeo = new THREE.CylinderGeometry(0.016, 0.02, 0.18, 12);
    const handleBar = new THREE.Mesh(handleBarGeo, this.woodMat);
    handleBar.rotation.x = Math.PI / 2;
    handleBar.position.set(0, 0.04, 0.12);
    rollerGroup.add(handleBar);

    rollerGroup.userData = {
      isInteractable: true,
      name: '먹물 롤러와 인쇄 레버',
      description: '아직 굳지 않은 끈적한 먹물이 묻어 있다. 윤전기와 연결된 레버가 달려 있다.',
      type: 'door' // Can trigger print
    };
    this.interactables.push(rollerGroup);
    deskGroup.add(rollerGroup);

    // C. Newsprint Proofs (경성신문 활판 교정지)
    const newsTex = this.tf.createNewspaperTexture();
    const paperMat = new THREE.MeshStandardMaterial({
      map: newsTex,
      roughness: 0.9,
    });
    const paperGeo = new THREE.PlaneGeometry(0.42, 0.6);
    const paper = new THREE.Mesh(paperGeo, paperMat);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = 0.15;
    paper.position.set(0.55, deskH + 0.065, 0.25);
    paper.receiveShadow = true;
    paper.userData = {
      isInteractable: true,
      clueId: 'clue_proof_title',
      name: '경성일보 호외 교정지',
      description: '인쇄 직전 검수를 위한 신문 교정지다. 안경을 쓰고 자세히 들여다보자.',
      type: 'proof'
    };
    this.interactables.push(paper);
    deskGroup.add(paper);

    // D. Antique Stool (활판공 의자)
    const stoolGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12);
    const stool = new THREE.Mesh(stoolGeo, this.woodMat);
    stool.position.set(0, 0.275, 1.2);
    stool.castShadow = true;
    deskGroup.add(stool);

    this.scene.add(deskGroup);
    this.interactables.push(deskGroup);

    // Desk collider
    this.room.addColliderBox(
      new THREE.Vector3(0, deskH / 2, 1.2),
      new THREE.Vector3(deskW + 0.3, deskH, deskD + 0.3)
    );
  }

  // 3. Side Storage, Paper Stacks & Ink Barrels
  buildSideStorage() {
    // Paper storage shelf on left side (X = -4.0, Z = 5.0)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-3.6, 0, 5.0);

    const shelfBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.6), this.woodMat);
    shelfBody.position.set(0, 0.9, 0);
    shelfBody.castShadow = true;
    shelfGroup.add(shelfBody);

    // Paper Stacks (신문 용지 더미)
    const paperStackMat = new THREE.MeshStandardMaterial({
      color: 0xd4c7ae,
      roughness: 0.95,
    });
    for (let s = 0; s < 3; s++) {
      const pStack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.45), paperStackMat);
      pStack.position.set(-0.5 + s * 0.55, 1.95, 0);
      pStack.castShadow = true;
      shelfGroup.add(pStack);
    }

    this.scene.add(shelfGroup);
    this.room.addColliderBox(new THREE.Vector3(-3.6, 0.9, 5.0), new THREE.Vector3(1.9, 1.8, 0.7));

    // Vintage cast-iron printing ink barrels in corner (X = 4.2, Z = 5.2)
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.5,
    });
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.8, 16), barrelMat);
    barrel1.position.set(4.2, 0.4, 5.0);
    barrel1.castShadow = true;
    this.scene.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.7, 16), barrelMat);
    barrel2.position.set(3.7, 0.35, 5.3);
    barrel2.castShadow = true;
    this.scene.add(barrel2);

    this.room.addColliderBox(new THREE.Vector3(4.0, 0.4, 5.1), new THREE.Vector3(1.2, 0.8, 1.2));
  }
}
