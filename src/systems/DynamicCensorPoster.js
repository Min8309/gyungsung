import * as THREE from 'three';
import { GameConfig } from '../config/GameConfig.js';
import { gameState } from './GameState.js';

/**
 * DynamicCensorPoster:
 * 벽면 조선총독부 경무국 검열 통보서 3D 포스터 및 60초 정체 시 동적 붉은 먹줄 번짐 연출
 */
export class DynamicCensorPoster {
  constructor(scene) {
    this.scene = scene;
    this.config = GameConfig.extendedHints;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 768;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    this.bleedProgress = 0; // 0.0 ~ 1.0
    this.isBleeding = false;

    this.buildMesh();
    this.drawPoster(0);
  }

  buildMesh() {
    const posterGeo = new THREE.PlaneGeometry(0.7, 1.05);
    const posterMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.85,
      metalness: 0.05
    });

    this.mesh = new THREE.Mesh(posterGeo, posterMat);
    // Mounted on Left Partition Wall next to calendar at (X = -3.8, Y = 1.95, Z = -3.88)
    this.mesh.position.set(-3.85, 1.95, -3.88);
    this.mesh.receiveShadow = true;

    this.mesh.userData = {
      isInteractable: true,
      clueId: 'clue_censor',
      name: '조선총독부 검열 통보서',
      description: '붉은 먹줄로 난도질당한 총독부 검열 통지문이다. 붉은 취소선 사이로 지워지지 않은 문구가 번져 나오고 있다.',
      type: 'censor_poster'
    };

    this.scene.add(this.mesh);
  }

  update(now, delta) {
    const elapsedSec = (now - gameState.lastProgressTime) / 1000;

    // 60초 이상 진전이 없으면 붉은 먹줄과 잉크 번짐 진행
    if (elapsedSec >= this.config.censorPosterTriggerTime) {
      if (this.bleedProgress < 1.0) {
        this.bleedProgress = Math.min(1.0, this.bleedProgress + delta * 0.15);
        this.drawPoster(this.bleedProgress);
        this.texture.needsUpdate = true;
      }
    } else {
      if (this.bleedProgress > 0) {
        this.bleedProgress = Math.max(0, this.bleedProgress - delta * 0.4);
        this.drawPoster(this.bleedProgress);
        this.texture.needsUpdate = true;
      }
    }
  }

  drawPoster(bleed) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Aged Paper Background
    ctx.fillStyle = '#d9cbb2';
    ctx.fillRect(0, 0, W, H);

    // Official Censor Stamp at Top
    ctx.strokeStyle = '#a6241e';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a6241e';
    ctx.font = 'bold 28px serif';
    ctx.fillText('【 朝鮮總督府 警務局 檢閱 處分 】', W / 2, 75);

    ctx.fillStyle = '#22150c';
    ctx.font = 'bold 18px serif';
    ctx.fillText('京城日報社 活版 號外 發刊 差押 通告', W / 2, 115);

    // Body Text Lines
    ctx.textAlign = 'left';
    ctx.font = '16px serif';
    ctx.fillStyle = '#3a2818';

    const lines = [
      "1. 소화 9년 10월 24일자 활판 인쇄물 치안 방해 혐의.",
      "2. 식자실 내 작업 인원의 불온 행위 엄중 감시 요망.",
      "3. 지하 윤전기실의 10월 25일자 1면 압수 및 봉인 처분.",
      "4. 자정 23시 58분 이후의 무단 활판 작업을 일체 금함."
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 55, 175 + i * 55);
    });

    // Dynamic Red Bleed & Black Ink Cancellations (먹줄)
    if (bleed > 0) {
      // 1. Red Ink Strikethroughs across censored lines
      ctx.strokeStyle = `rgba(180, 25, 20, ${bleed * 0.9})`;
      ctx.lineWidth = 8;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(50, 170 + i * 55);
        ctx.lineTo(W - 50, 170 + i * 55 + (Math.sin(i * 3) * 5));
        ctx.stroke();
      }

      // 2. Black Ink spreading wash to obscure irrelevant parts
      ctx.fillStyle = `rgba(10, 6, 4, ${bleed * 0.85})`;
      ctx.fillRect(45, 140, W - 90, 160);

      // 3. Highlighted Surviving Keyword: 식자공 실종 사건 23:58
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(235, 55, 45, ${bleed})`;
      ctx.font = 'bold 26px serif';
      ctx.fillText('【 活版室 植字工 謎의 失踪 23:58 】', W / 2, 220);

      ctx.fillStyle = `rgba(255, 220, 180, ${bleed})`;
      ctx.font = '18px serif';
      ctx.fillText('“멈춘 괘종시각 23:58에 24번 서랍을 열어라”', W / 2, 260);
    }

    // Official Seal Stamp
    ctx.save();
    ctx.translate(W - 120, H - 120);
    ctx.rotate(-0.1);
    ctx.strokeStyle = '#a6241e';
    ctx.lineWidth = 4;
    ctx.strokeRect(-50, -35, 100, 70);
    ctx.fillStyle = '#a6241e';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('發行停止', 0, 0);
    ctx.restore();
  }
}
