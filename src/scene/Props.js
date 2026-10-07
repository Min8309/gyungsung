import * as THREE from 'three';

export class Props {
  constructor(scene, textureFactory) {
    this.scene = scene;
    this.tf = textureFactory;
    this.interactables = [];
    this.animatables = [];

    this.buildClock();
    this.buildCalendar();
    this.buildApronAndGlasses();
    this.buildCursedCube();
    this.buildCursedKey();
  }

  // 1. Vintage 1930s Octagonal Pendulum Wall Clock (1930년대 괘종시계)
  setCountdown(text) {
    if (this.countdownText === text) return;
    this.countdownText = text;
    const ctx = this.countdownCanvas.getContext('2d');
    ctx.fillStyle = '#160806';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#ff6655';
    ctx.font = 'bold 58px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 48);
    this.countdownTexture.needsUpdate = true;
  }

  buildClock() {
    const clockGroup = new THREE.Group();
    // Mounted on right back partition pillar / wall at (X = 2.4, Y = 2.5, Z = -3.88)
    clockGroup.position.set(2.4, 2.5, -3.88);

    const woodMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#22140a'),
      roughness: 0.65,
      metalness: 0.1,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb58b40,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Octagonal Upper Clock Case
    const topCaseGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.14, 8);
    const topCase = new THREE.Mesh(topCaseGeo, woodMat);
    topCase.rotation.x = Math.PI / 2;
    topCase.rotation.y = Math.PI / 8;
    topCase.castShadow = true;
    clockGroup.add(topCase);

    // Clock Dial Face
    const dialTex = this.tf.createClockFaceTexture();
    const dialMat = new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4 });
    const dialMesh = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), dialMat);
    dialMesh.position.set(0, 0, 0.075);
    clockGroup.add(dialMesh);

    // Clock Hands (Fixed at 11:58 PM - 2 minutes before the witching hour)
    const handMat = new THREE.MeshBasicMaterial({ color: 0x0f0b07 });
    // Minute Hand (pointing at 58 min = ~348 deg)
    const minHandGeo = new THREE.BoxGeometry(0.015, 0.24, 0.005);
    const minHand = new THREE.Mesh(minHandGeo, handMat);
    minHand.position.set(-0.02, 0.1, 0.08);
    minHand.rotation.z = 0.2;
    clockGroup.add(minHand);

    // Hour Hand (pointing at 11:58 = ~358 deg, almost 12)
    const hourHandGeo = new THREE.BoxGeometry(0.02, 0.16, 0.005);
    const hourHand = new THREE.Mesh(hourHandGeo, handMat);
    hourHand.position.set(-0.01, 0.07, 0.082);
    hourHand.rotation.z = 0.08;
    clockGroup.add(hourHand);

    // Lower Pendulum Box Body (하단 진자 보관함)
    const lowerBoxGeo = new THREE.BoxGeometry(0.42, 0.65, 0.14);
    const lowerBox = new THREE.Mesh(lowerBoxGeo, woodMat);
    lowerBox.position.set(0, -0.42, 0);
    lowerBox.castShadow = true;
    clockGroup.add(lowerBox);

    // Glass Window on Lower Box
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.45), glassMat);
    glass.position.set(0, -0.42, 0.075);
    clockGroup.add(glass);

    // Swinging Brass Pendulum (시계추)
    const pendulumPivot = new THREE.Group();
    pendulumPivot.position.set(0, -0.15, 0.03); // Pivot at top of lower box

    // Brass Rod
    const rodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.4, 8);
    const rod = new THREE.Mesh(rodGeo, brassMat);
    rod.position.set(0, -0.2, 0);
    pendulumPivot.add(rod);

    // Brass Circular Bob
    const bobGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
    const bob = new THREE.Mesh(bobGeo, brassMat);
    bob.rotation.x = Math.PI / 2;
    bob.position.set(0, -0.38, 0);
    pendulumPivot.add(bob);

    clockGroup.add(pendulumPivot);

    // Countdown plaque; the stopped hands remain readable as the original puzzle clue.
    this.countdownCanvas = document.createElement('canvas');
    this.countdownCanvas.width = 256;
    this.countdownCanvas.height = 96;
    this.countdownTexture = new THREE.CanvasTexture(this.countdownCanvas);
    const countdown = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.165),
      new THREE.MeshBasicMaterial({ map: this.countdownTexture })
    );
    countdown.position.set(0, -0.78, 0.09);
    clockGroup.add(countdown);

    // Interactive data
    clockGroup.userData = {
      isInteractable: true,
      clueId: 'clue_clock',
      name: '멈춘 괘종시계',
      description: '시계바늘이 밤 11시 58분에서 멈추어 있다. 확대하여 조사하면 바늘 끝에 미세한 붉은 점이 찍혀 있다.',
      type: 'clock'
    };

    this.scene.add(clockGroup);
    this.interactables.push(clockGroup);

    // Register pendulum animation
    this.pendulumPivot = pendulumPivot;
    this.animatables.push((time, delta, soundManager) => {
      // Harmonic pendulum swing
      const swingAngle = Math.sin(time * 3.14159) * 0.18; // ~1 tick per second
      this.pendulumPivot.rotation.z = swingAngle;

      // Trigger tick audio when pendulum passes center or reversal
      if (soundManager && soundManager.updateClockTick) {
        soundManager.updateClockTick(time);
      }
    });
  }

  // 2. 1934 Calendar Poster (1934년 달력)
  buildCalendar() {
    const calGroup = new THREE.Group();
    // Mounted on Left Partition Wall (X = -2.8, Y = 1.95, Z = -3.88) - comfortably in view upon entry
    calGroup.position.set(-2.8, 1.95, -3.88);

    const calTex = this.tf.createCalendarTexture();
    const calMat = new THREE.MeshStandardMaterial({
      map: calTex,
      roughness: 0.9,
    });

    // Hanging paper sheet
    const paperGeo = new THREE.PlaneGeometry(0.85, 1.25);
    const paper = new THREE.Mesh(paperGeo, calMat);
    paper.castShadow = true;
    calGroup.add(paper);

    // Wooden top hanging strip
    const stripMat = new THREE.MeshStandardMaterial({
      map: this.tf.createWoodPlankTexture('#1b1008'),
      roughness: 0.8,
    });
    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.03), stripMat);
    topStrip.position.set(0, 0.62, 0.015);
    calGroup.add(topStrip);

    // Bottom weighting strip
    const btmStrip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.02), stripMat);
    btmStrip.position.set(0, -0.62, 0.015);
    calGroup.add(btmStrip);

    // Interactive data
    calGroup.userData = {
      isInteractable: true,
      clueId: 'clue_calendar',
      name: '1934년 인쇄국 달력',
      description: '1934년(소화 9년) 10월 달력이다. 24일 날짜에 붉은 동그라미가 쳐져 있고, "멈춘 시각에 열어라"라고 적혀 있다.',
      type: 'calendar'
    };

    this.scene.add(calGroup);
    this.interactables.push(calGroup);
  }

  // 3. Stained Canvas Apron & Thick Round Spectacles (활판공 앞치마와 안경)
  buildApronAndGlasses() {
    const apronGroup = new THREE.Group();
    // Hanging on right wall near type racks (X = 4.75, Y = 2.0, Z = -1.2)
    apronGroup.position.set(4.75, 2.0, -1.2);
    apronGroup.rotation.y = -Math.PI / 2;

    const brassMat = new THREE.MeshStandardMaterial({ color: 0x99773d, metalness: 0.8, roughness: 0.3 });

    // Wall Peg (벽걸이 못)
    const pegGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8);
    const peg = new THREE.Mesh(pegGeo, brassMat);
    peg.rotation.x = Math.PI / 2;
    peg.position.set(0, 0.25, 0.06);
    apronGroup.add(peg);

    // Thick Round Spectacles / Magnifying Loupe (작업용 둥근 안경)
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.25, 0.1);

    const wireMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.3 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x88bbcc, transparent: true, opacity: 0.5, roughness: 0.1 });

    [-0.06, 0.06].forEach(lx => {
      // Round lens frame
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 24), wireMat);
      rim.position.set(lx, 0, 0);
      glassesGroup.add(rim);

      // Glass lens
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), lensMat);
      lens.position.set(lx, 0, 0);
      glassesGroup.add(lens);
    });

    // Bridge bar
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.006), wireMat);
    bridge.position.set(0, 0, 0);
    glassesGroup.add(bridge);

    apronGroup.add(glassesGroup);

    // Stained Canvas Apron (먹물과 붉은 얼룩이 묻은 앞치마)
    const apronTex = this.tf.createApronTexture();
    const apronMat = new THREE.MeshStandardMaterial({
      map: apronTex,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });

    // Modeled hanging cloth with slight natural curvature
    const apronGeo = new THREE.PlaneGeometry(0.7, 1.4, 6, 8);
    // Displace vertices slightly to give draped cloth fold
    const pos = apronGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      // Taper at neck
      if (y > 0.4) {
        pos.setX(i, x * 0.55);
      }
      // Draped forward curve
      const fold = Math.sin(x * 12) * 0.02 + Math.cos(y * 4) * 0.015;
      pos.setZ(i, fold);
    }
    apronGeo.computeVertexNormals();

    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.set(0, -0.4, 0.06);
    apronMesh.castShadow = true;
    apronGroup.add(apronMesh);

    // Interactive data
    apronGroup.userData = {
      isInteractable: true,
      clueId: 'clue_glasses',
      name: '피 묻은 앞치마와 안경',
      description: '거친 삼베 앞치마에 둥근 안경이 걸려 있다. "이걸 쓰면 보인다."',
      type: 'apron'
    };

    this.scene.add(apronGroup);
    this.interactables.push(apronGroup);
  }

  // 4. Cursed Lead Type Cube with Eye (저주받은 활자 - 사용자 제공 Easter Egg 이미지)
  buildCursedCube() {
    const cubeGroup = new THREE.Group();
    // Placed on the main central typesetting desk near center view (X = 0.22, Y = 1.05, Z = 1.35)
    cubeGroup.position.set(0.22, 1.05, 0.75);

    // Sharp high-contrast eye texture on 1 face, metal lead on other 5 faces
    const sharpEyeTex = this.tf.createSharpEyeTexture();
    const leadMat = new THREE.MeshStandardMaterial({
      color: 0x3a3632,
      roughness: 0.5,
      metalness: 0.8,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      map: sharpEyeTex,
      roughness: 0.35,
      metalness: 0.4,
    });

    const cubeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    // 6 faces: [+X, -X, +Y, -Y, +Z, -Z] -> Face +Z (index 4) faces player
    const cubeMats = [leadMat, leadMat, leadMat, leadMat, eyeMat, leadMat];
    const cubeMesh = new THREE.Mesh(cubeGeo, cubeMats);
    cubeMesh.castShadow = true;
    cubeGroup.add(cubeMesh);

    // Subtle eerie glow around the cube
    const eyeLight = new THREE.PointLight(0x991111, 0.8, 1.5);
    eyeLight.position.set(0, 0, 0.1);
    cubeGroup.add(eyeLight);

    // Interactive data
    cubeGroup.userData = {
      isInteractable: true,
      clueId: 'clue_cube',
      name: '저주받은 눈동자 활자 큐브',
      description: '육중한 쇳덩이의 한 면에만 인간의 붉은 눈동자가 뚜렷하게 각인되어 있다. 조사하여 회전시킬 수 있다.',
      type: 'cursed_cube'
    };

    this.scene.add(cubeGroup);
    this.interactables.push(cubeGroup);

    // Animate subtle eye light pulse and rotation tracking
    this.animatables.push((time, delta, soundManager, camera) => {
      eyeLight.intensity = 0.6 + Math.sin(time * 3.5) * 0.3;
      if (camera) {
        // Subtle creepy tilt toward player
        const dir = new THREE.Vector3().subVectors(camera.position, cubeGroup.position).normalize();
        cubeMesh.rotation.y = Math.atan2(dir.x, dir.z) * 0.25;
      }
    });
  }

  // 5. Cursed Rusty Key with Hair (피 묻은 녹슨 열쇠 - 사용자 제공 Easter Egg 이미지)
  buildCursedKey() {
    const keyGroup = new THREE.Group();
    // Placed on the typeset rack small tray (X = -4.3, Y = 1.25, Z = 2.0)
    keyGroup.position.set(-4.28, 1.25, 2.0);

    const keyTex = this.tf.loadAsset('/assets/Gemini_Generated_Image_1vv61r1vv61r1vv6.png');
    const keyMat = new THREE.MeshStandardMaterial({
      map: keyTex,
      roughness: 0.5,
      metalness: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
    });

    // 2.5D Key Card / Mesh with authentic texture
    const keyMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), keyMat);
    keyMesh.rotation.x = -Math.PI / 2;
    keyMesh.rotation.z = 0.4;
    keyMesh.castShadow = true;
    keyGroup.add(keyMesh);

    // Interactive data
    keyGroup.userData = {
      isInteractable: true,
      name: '머리카락이 엉킨 녹슨 철열쇠',
      description: '붉은 실과 검은 사람 머리카락으로 꽁꽁 묶인 채 굳은 핏자국이 선명한 녹슨 열쇠다. 안쪽 깊은 복도 끝의 "지하 윤전기실" 철문을 열 수 있을 것만 같다.',
      type: 'cursed_key'
    };

    this.scene.add(keyGroup);
    this.interactables.push(keyGroup);
  }

  update(time, delta, soundManager, camera) {
    for (const anim of this.animatables) {
      anim(time, delta, soundManager, camera);
    }
  }
}
