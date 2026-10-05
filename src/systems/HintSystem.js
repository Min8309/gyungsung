import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig.js';
import { gameState } from './GameState.js';

/**
 * HintSystem:
 * 1. 단서 오브젝트 근접/손전등 조준 시 붉은 잉크빛 맥동(림라이트 / Emissive) 제어
 * 2. 퍼즐 해결 시 림라이트 자동 소등
 * 3. 60s / 90s / 120s 무진전 시 자동 힌트 연출 (전구 깜빡임, 공간 음향, 강화 림라이트)
 */
export class HintSystem {
  constructor(scene, camera, lighting, soundManager) {
    this.scene = scene;
    this.camera = camera;
    this.lighting = lighting;
    this.soundManager = soundManager;
    this.config = GameConfig;

    // 등록된 단서 오브젝트 정보 목록
    // { id, puzzleKey, object, meshList, originalEmissives }
    this.clueRegistry = [];

    this.tempVec = new THREE.Vector3();
    this.camDir = new THREE.Vector3();
    this.objDir = new THREE.Vector3();
  }

  // 단서 오브젝트 등록
  registerClue(clueId, puzzleKey, object3D) {
    const meshList = [];
    object3D.traverse((child) => {
      if (child.isMesh && child.material) {
        // 복제된 머티리얼을 적용하여 고유 emissive 제어 가능하도록 함
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
          meshList.push(...child.material);
        } else {
          child.material = child.material.clone();
          meshList.push(child.material);
        }
      }
    });

    this.clueRegistry.push({
      id: clueId,
      puzzleKey,
      object: object3D,
      meshList,
    });
  }

  update(time, delta) {
    const now = performance.now();
    this.camera.getWorldDirection(this.camDir);
    const camPos = this.camera.position;
    const isFlashlightOn = this.lighting ? this.lighting.flashlightOn : true;

    let nearestClue = null;
    let minDistance = Infinity;

    // 1. 단서별 림라이트/맥동 처리
    for (const clue of this.clueRegistry) {
      // 해당 퍼즐이 이미 해결되었으면 림라이트 끔
      if (clue.puzzleKey && gameState.puzzles[clue.puzzleKey]) {
        for (const mat of clue.meshList) {
          if (mat.emissive) mat.emissiveIntensity = 0;
        }
        continue;
      }

      clue.object.getWorldPosition(this.tempVec);
      const dist = camPos.distanceTo(this.tempVec);

      // 미해결 단서 중 가장 가까운 것 기록 (자동 힌트용)
      if (dist < minDistance) {
        minDistance = dist;
        nearestClue = clue;
      }

      // 카메라 시선과 오브젝트 방향 각도 (손전등 조준 여부)
      this.objDir.subVectors(this.tempVec, camPos).normalize();
      const dot = this.camDir.dot(this.objDir);
      const isAimedByFlashlight = isFlashlightOn && dot > 0.88; // 약 30도 이내
      const isNearby = dist <= this.config.rimLight.detectDistance;

      if (isNearby || isAimedByFlashlight) {
        // 맥동 계산 (1.5 ~ 2.0초 주기)
        const period = this.config.rimLight.period;
        const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * (2 * Math.PI / period)));

        // 120초 자동 힌트 3단계 발동 시 강화
        const baseIntensity = gameState.hintStage >= 3
          ? this.config.rimLight.strongIntensity
          : this.config.rimLight.normalIntensity;

        const finalIntensity = pulse * baseIntensity;

        for (const mat of clue.meshList) {
          if (mat.emissive) {
            mat.emissive.setHex(this.config.rimLight.hexColor);
            mat.emissiveIntensity = finalIntensity;
          }
        }
      } else {
        // 사거리 밖이거나 조준되지 않은 경우 서서히 감쇠
        for (const mat of clue.meshList) {
          if (mat.emissive && mat.emissiveIntensity > 0) {
            mat.emissiveIntensity = Math.max(0, mat.emissiveIntensity - delta * 2.5);
          }
        }
      }
    }

    gameState.activeHintTarget = nearestClue;

    // 2. 자동 힌트 타이머(60s, 90s, 120s) 검사
    gameState.updateTimer(
      now,
      // 60초: 가장 가까운 단서 방향의 전구 깜빡임 연출
      (target) => {
        if (this.lighting && this.lighting.triggerFlicker) {
          this.lighting.triggerFlicker();
        }
      },
      // 90초: 해당 방향에서 시계 째깍 소리 좌우 패닝 재생
      (target) => {
        if (this.soundManager && this.soundManager.playSpatialTick && target) {
          target.object.getWorldPosition(this.tempVec);
          this.soundManager.playSpatialTick(this.camera, this.tempVec);
        }
      }
    );
  }
}
