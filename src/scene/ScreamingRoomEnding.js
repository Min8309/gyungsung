import * as THREE from 'three';

/**
 * 철문이 열렸을 때 펼쳐지는 엔딩 씬:
 * 어두운 빈 방, 천장에 매달린 외로운 전구 아래의 빈 의자,
 * 그리고 벽과 천장에서 문(플레이어) 쪽을 노려보며 비명을 지르는 무수히 많은 고통스러운 얼굴들과 붉은 화면 엔딩.
 */
export class ScreamingRoomEnding {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    this.facesList = [];
    this.isRedPhase = false;
    this.redFactor = 0;

    // 텍스처 로더
    const textureLoader = new THREE.TextureLoader();
    this.facesTexture = textureLoader.load('/img/ending/screaming_faces.png');
    this.facesTexture.wrapS = THREE.RepeatWrapping;
    this.facesTexture.wrapT = THREE.RepeatWrapping;

    this.chairRoomTexture = textureLoader.load('/img/ending/empty_room_chair.png');

    this.buildRoom();
    this.buildHangingBulb();
    this.buildChair();
    this.buildScreamingFaces();

    // 엔딩 시네마틱 카메라 설정 (문 바로 앞 복도에서 시작하여 방 안으로 전진)
    this.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 70);
    this.camera.position.set(0, 1.65, -15.2);
    this.camera.lookAt(0, 1.4, -22);
  }

  buildRoom() {
    // 차갑고 어두운 콘크리트 벽/바닥 재질
    const wallColor = 0x161e1f;
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121718,
      roughness: 0.95,
      metalness: 0.1
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.9,
      metalness: 0.05
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x0f1414,
      roughness: 0.95
    });

    // 방 크기: 너비 9m, 높이 4.6m, 깊이 12m (z: -16.5 ~ -28.5)
    const roomCenterZ = -22.5;

    // 바닥
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, roomCenterZ);
    floor.receiveShadow = true;
    this.group.add(floor);

    // 천장
    this.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), ceilingMat);
    this.ceiling.rotation.x = Math.PI / 2;
    this.ceiling.position.set(0, 4.4, roomCenterZ);
    this.group.add(this.ceiling);

    // 정면(뒷) 벽 (z = -28.5)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.4), wallMat);
    backWall.position.set(0, 2.2, -28.5);
    this.group.add(backWall);

    // 좌측 벽 (x = -4.5)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.4), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4.5, 2.2, roomCenterZ);
    this.group.add(leftWall);

    // 우측 벽 (x = 4.5)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 4.4), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(4.5, 2.2, roomCenterZ);
    this.group.add(rightWall);
  }

  buildHangingBulb() {
    const bulbZ = -22;
    const bulbX = 0;

    // 천장에서 내려오는 얇은 검은색 전선
    const wireGeo = new THREE.CylinderGeometry(0.008, 0.008, 2.1, 8);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(bulbX, 3.35, bulbZ);
    this.group.add(wire);

    // 소켓
    const socketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 12);
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x2b2923, metalness: 0.8, roughness: 0.4 });
    const socket = new THREE.Mesh(socketGeo, socketMat);
    socket.position.set(bulbX, 2.32, bulbZ);
    this.group.add(socket);

    // 알전구 (빛을 발산하는 오브젝트)
    const bulbGeo = new THREE.SphereGeometry(0.09, 16, 16);
    this.bulbMat = new THREE.MeshStandardMaterial({
      color: 0xf5fff8,
      emissive: 0x98d4c6,
      emissiveIntensity: 2.2,
      roughness: 0.2
    });
    this.bulbMesh = new THREE.Mesh(bulbGeo, this.bulbMat);
    this.bulbMesh.position.set(bulbX, 2.22, bulbZ);
    this.group.add(this.bulbMesh);

    // 메인 조명: 스포트라이트 (아래 의자를 집중적으로 비춤)
    this.spotLight = new THREE.SpotLight(0xa5dfd5, 8.5, 14, Math.PI / 4.5, 0.45, 1.2);
    this.spotLight.position.set(bulbX, 2.2, bulbZ);
    this.spotLight.target.position.set(bulbX, 0, bulbZ);
    this.group.add(this.spotLight);
    this.group.add(this.spotLight.target);

    // 주변을 은은하게 밝히는 포인트라이트
    this.pointLight = new THREE.PointLight(0x7fb8b0, 4.2, 10, 1.8);
    this.pointLight.position.set(bulbX, 2.15, bulbZ);
    this.group.add(this.pointLight);
  }

  buildChair() {
    // 중앙 스포트라이트 바로 아래 놓인 고독한 낡은 나무 의자 (1930년대 빈티지 의자 모델링)
    this.chairGroup = new THREE.Group();
    this.chairGroup.position.set(0, 0, -22);
    this.group.add(this.chairGroup);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2e231b,
      roughness: 0.82,
      metalness: 0.08
    });

    // 다리 4개
    const legGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.46, 8);
    const legPositions = [
      [-0.2, 0.23, -0.2],
      [0.2, 0.23, -0.2],
      [-0.2, 0.23, 0.2],
      [0.2, 0.23, 0.2]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.chairGroup.add(leg);
    });

    // 다리 가로 버팀대 (들보)
    const stretcherGeoX = new THREE.BoxGeometry(0.38, 0.02, 0.02);
    const stretcherGeoZ = new THREE.BoxGeometry(0.02, 0.02, 0.38);
    const s1 = new THREE.Mesh(stretcherGeoX, woodMat);
    s1.position.set(0, 0.15, -0.2);
    this.chairGroup.add(s1);
    const s2 = new THREE.Mesh(stretcherGeoX, woodMat);
    s2.position.set(0, 0.12, 0.2);
    this.chairGroup.add(s2);
    const s3 = new THREE.Mesh(stretcherGeoZ, woodMat);
    s3.position.set(-0.2, 0.14, 0);
    this.chairGroup.add(s3);
    const s4 = new THREE.Mesh(stretcherGeoZ, woodMat);
    s4.position.set(0.2, 0.14, 0);
    this.chairGroup.add(s4);

    // 좌판
    const seatGeo = new THREE.BoxGeometry(0.48, 0.04, 0.48);
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.set(0, 0.47, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.chairGroup.add(seat);

    // 등받이 좌우 기둥
    const backPostGeo = new THREE.BoxGeometry(0.035, 0.54, 0.035);
    const bp1 = new THREE.Mesh(backPostGeo, woodMat);
    bp1.position.set(-0.2, 0.74, -0.21);
    this.chairGroup.add(bp1);
    const bp2 = new THREE.Mesh(backPostGeo, woodMat);
    bp2.position.set(0.2, 0.74, -0.21);
    this.chairGroup.add(bp2);

    // 등받이 상단 가로대
    const topRailGeo = new THREE.BoxGeometry(0.46, 0.07, 0.03);
    const topRail = new THREE.Mesh(topRailGeo, woodMat);
    topRail.position.set(0, 0.98, -0.21);
    this.chairGroup.add(topRail);

    // 등받이 세로 살대 4개
    const slatGeo = new THREE.BoxGeometry(0.018, 0.42, 0.015);
    for (let i = -1.5; i <= 1.5; i += 1.0) {
      const slat = new THREE.Mesh(slatGeo, woodMat);
      slat.position.set(i * 0.09, 0.72, -0.21);
      this.chairGroup.add(slat);
    }

    // 의자를 약간 문 쪽을 비스듬히 바라보도록 회전
    this.chairGroup.rotation.y = 0.25;
  }

  buildScreamingFaces() {
    // 벽면 및 천장 전체에 배치되는 무수히 많은 고통스러운 얼굴들
    const doorLookTarget = new THREE.Vector3(0, 1.6, -15.5);

    // 1. 벽면 텍스처 패널 (반복 타일링된 얼굴 텍스처 배경)
    const facesWallMat = new THREE.MeshStandardMaterial({
      map: this.facesTexture,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65
    });

    const roomCenterZ = -22.5;

    // 좌/우/정면 벽 패널
    const makeWallFaces = (w, h, pos, rotY) => {
      const tex = this.facesTexture.clone();
      tex.needsUpdate = true;
      tex.repeat.set(w / 2.5, h / 2.2);
      const mat = facesWallMat.clone();
      mat.map = tex;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.copy(pos);
      if (rotY) mesh.rotation.y = rotY;
      this.group.add(mesh);
      return mesh;
    };

    makeWallFaces(9, 4.4, new THREE.Vector3(0, 2.2, -28.4), 0); // 뒷벽
    makeWallFaces(12, 4.4, new THREE.Vector3(-4.45, 2.2, roomCenterZ), Math.PI / 2); // 좌벽
    makeWallFaces(12, 4.4, new THREE.Vector3(4.45, 2.2, roomCenterZ), -Math.PI / 2); // 우벽

    // 천장 패널
    const ceilingTex = this.facesTexture.clone();
    ceilingTex.repeat.set(3, 4);
    const ceilFacesMat = facesWallMat.clone();
    ceilFacesMat.map = ceilingTex;
    const ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), ceilFacesMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(0, 4.35, roomCenterZ);
    this.group.add(ceilMesh);

    // 2. 벽과 천장에서 3차원으로 튀어나와 문 쪽을 똑바로 쏘아보는 80개 이상의 개별 얼굴들
    const faceGeo = new THREE.PlaneGeometry(0.72, 0.95);
    const individualFaceMat = new THREE.MeshStandardMaterial({
      map: this.facesTexture,
      transparent: true,
      opacity: 0.92,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    // 배치 구역: 좌측벽(-4.3m), 우측벽(4.3m), 정면벽(-28.2m), 천장(4.2m)
    const positions = [];

    // 좌측 벽면 얼굴들 (22개)
    for (let i = 0; i < 22; i++) {
      const z = -17.5 - Math.random() * 9.8;
      const y = 0.6 + Math.random() * 3.4;
      const x = -4.25 + Math.random() * 0.35;
      positions.push({ pos: new THREE.Vector3(x, y, z), type: 'wall' });
    }

    // 우측 벽면 얼굴들 (22개)
    for (let i = 0; i < 22; i++) {
      const z = -17.5 - Math.random() * 9.8;
      const y = 0.6 + Math.random() * 3.4;
      const x = 4.25 - Math.random() * 0.35;
      positions.push({ pos: new THREE.Vector3(x, y, z), type: 'wall' });
    }

    // 뒷쪽 정면 벽면 얼굴들 (24개)
    for (let i = 0; i < 24; i++) {
      const x = -3.8 + Math.random() * 7.6;
      const y = 0.6 + Math.random() * 3.4;
      const z = -28.1 + Math.random() * 0.35;
      positions.push({ pos: new THREE.Vector3(x, y, z), type: 'wall' });
    }

    // 천장에서 매달려 문 쪽을 내려다보는 얼굴들 (20개)
    for (let i = 0; i < 20; i++) {
      const x = -3.6 + Math.random() * 7.2;
      const z = -17.5 - Math.random() * 9.8;
      const y = 4.15 - Math.random() * 0.3;
      positions.push({ pos: new THREE.Vector3(x, y, z), type: 'ceiling' });
    }

    positions.forEach((data, index) => {
      // 텍스처 UV 오프셋으로 다양한 얼굴 표정 영역 표시
      const uOffset = (index % 4) * 0.25;
      const vOffset = (Math.floor(index / 4) % 4) * 0.25;

      const fMat = individualFaceMat.clone();
      const faceTex = this.facesTexture.clone();
      faceTex.repeat.set(0.45, 0.45);
      faceTex.offset.set(uOffset, vOffset);
      faceTex.needsUpdate = true;
      fMat.map = faceTex;

      const mesh = new THREE.Mesh(faceGeo, fMat);
      mesh.position.copy(data.pos);

      // 모든 얼굴이 일제히 문(플레이어) 방향을 노려보도록 회전!
      mesh.lookAt(doorLookTarget);

      this.group.add(mesh);

      this.facesList.push({
        mesh,
        basePos: data.pos.clone(),
        baseScale: 0.85 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 3.5 + Math.random() * 4.0,
        shiverAmp: 0.03 + Math.random() * 0.04
      });
    });
  }

  update(time, elapsedSeconds) {
    // 1. 전구의 미세한 흔들림 및 기괴한 깜빡임
    const bulbFlicker = Math.sin(time * 28) * 0.4 + Math.sin(time * 53) * 0.3;
    const baseIntensity = this.isRedPhase ? 12 : 7.5;
    this.spotLight.intensity = Math.max(1.5, baseIntensity + bulbFlicker);
    this.pointLight.intensity = Math.max(0.8, (this.isRedPhase ? 8 : 4.0) + bulbFlicker * 0.6);

    // 2. 붉은 화면 엔딩 페이즈 (시간 경과에 따라 피처럼 붉게 변환)
    if (elapsedSeconds > 3.2) {
      this.isRedPhase = true;
      this.redFactor = Math.min(1.0, (elapsedSeconds - 3.2) / 3.0);

      // 차가운 청록색(0xa5dfd5) -> 강렬한 핏빛 붉은색(0xff0818)
      const currentColor = new THREE.Color().lerpColors(
        new THREE.Color(0xa5dfd5),
        new THREE.Color(0xff1220),
        this.redFactor
      );
      this.spotLight.color.copy(currentColor);
      this.pointLight.color.copy(currentColor);
      this.bulbMat.emissive.copy(currentColor);

      // 씬의 안개도 붉은 핏빛으로 물들임
      if (this.scene.fog) {
        this.scene.fog.color.lerpColors(
          new THREE.Color(0x040b0b),
          new THREE.Color(0x350005),
          this.redFactor
        );
      }
    }

    // 3. 벽과 천장의 얼굴들이 비명을 지르듯 요동치고 다가오는 애니메이션
    const screamAgitation = Math.min(2.5, 1.0 + elapsedSeconds * 0.3);
    this.facesList.forEach(item => {
      // 비명에 따라 크기가 격렬하게 팽창/수축
      const pulse = Math.sin(time * item.speed + item.phase) * 0.22 * screamAgitation;
      const s = item.baseScale * (1.0 + pulse);
      item.mesh.scale.set(s, s * (1.0 + Math.abs(pulse * 0.6)), s);

      // 공포에 질려 미세하게 떠는 진동 (Shiver)
      const shiverX = (Math.random() - 0.5) * item.shiverAmp * screamAgitation;
      const shiverY = (Math.random() - 0.5) * item.shiverAmp * screamAgitation;
      const shiverZ = (Math.random() - 0.5) * item.shiverAmp * screamAgitation;

      // 엔딩이 고조될수록 문(플레이어) 쪽으로 서서히 돌출
      const forwardPush = Math.min(0.8, elapsedSeconds * 0.08);
      const toDoorDir = new THREE.Vector3(0, 1.6, -15.5).sub(item.basePos).normalize().multiplyScalar(forwardPush);

      item.mesh.position.copy(item.basePos).add(toDoorDir).add(new THREE.Vector3(shiverX, shiverY, shiverZ));

      // 붉은 페이즈에서 얼굴들이 핏빛으로 물듦
      if (this.isRedPhase) {
        item.mesh.material.color.lerp(new THREE.Color(0xff5566), 0.03);
      }
    });

    // 4. 시네마틱 카메라 전진 (문 밖 복도 -> 문 통과 -> 빈 의자와 비명 지르는 벽을 마주함)
    if (elapsedSeconds > 1.8) {
      // 1.8초부터 문이 충분히 열리면 카메라가 방 안으로 천천히 진입
      const t = Math.min(1.0, (elapsedSeconds - 1.8) / 4.5);
      const easeT = t * t * (3 - 2 * t); // smoothstep
      // z: -15.2 (복도) -> -19.6 (방 입구 안쪽, 의자 바로 앞)
      const camZ = -15.2 + easeT * (-4.4);
      const camY = 1.65 - easeT * 0.2;
      this.camera.position.set(0, camY, camZ);
      this.camera.lookAt(0, 1.3, -22);
    }

    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
