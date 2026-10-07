import * as THREE from 'three';
import { gameState } from '../systems/GameState.js';

export class ExplorationHUD {
  constructor(controls, camera, targets = []) {
    this.controls = controls;
    this.camera = camera;
    this.targets = targets;
    this.marker = document.createElement('div');
    this.marker.id = 'clue-direction';
    this.hud = document.getElementById('hud-overlay');
    this.hud.appendChild(this.marker);
    this.objective = document.createElement('div');
    this.objective.id = 'exploration-objective';
    this.objective.setAttribute('role', 'status');
    this.hud.appendChild(this.objective);
    const refresh = () => {
      this.objective.hidden = false;
      const hasGlasses = gameState.hasItem('round_glasses');
      const inspectedProof = gameState.isClueInspected('clue_proof_unreadable');
      const readProof = gameState.notebookClues.has('clue_proof_title');
      this.targetId = !readProof ? (hasGlasses || !inspectedProof ? 'clue_proof_title' : 'clue_glasses')
        : !gameState.puzzles.puzzle_c ? (gameState.hasItem('lead_types') ? 'clue_galley_slot' : 'clue_rack_types')
        : !gameState.hasItem('benzene_bottle') ? 'clue_glasses' : 'clue_exit_door';
      const instruction = readProof
        ? !gameState.puzzles.puzzle_c
          ? '교정지의 밑줄 친 식·자·공을 노란 표찰의 활자장에서 찾으시오. 조판대 세 칸에 맞추면 철문의 열쇠를 얻을 것이오. 눈동자 큐브는 눈을 위로 돌려 별도 홈에 끼우시오.'
          : !gameState.hasItem('benzene_bottle')
            ? '열쇠를 얻었소. 오른쪽 벽 앞치마 주머니의 세척액을 챙기시오.'
            : '이제 복도 끝 철문으로 가시오. 자물쇠의 잉크를 세척액으로 닦은 뒤 열쇠를 쓰시오.'
        : hasGlasses
        ? '안경을 챙겼으니, 책상 위 교정지를 다시 살펴보시오. 붉은 글씨가 다음 길을 일러줄 것이오.'
        : inspectedProof
          ? '글씨가 흐려 읽히지 않거든, 오른쪽 벽 앞치마의 둥근 안경부터 챙기시오. 책상 옆으로 돌아 가까이 다가가시오. 그 뒤 교정지를 다시 보시오.'
          : '처음 오셨소? 우선 책상 위 교정지에 눈길을 두고 [E]를 누르시오. 이 인쇄소의 첫 실마리가 거기 있소.';
      this.objective.replaceChildren();
      const title = document.createElement('strong');
      title.className = 'exploration-notice-title';
      title.textContent = '告示 · 처음 오신 이께';
      const body = document.createElement('p');
      body.textContent = instruction;
      const help = document.createElement('small');
      help.textContent = '붉게 빛나는 물건을 살피시오 · [E] 조사 · [Tab] 수첩 · [H] 도움말';
      this.objective.append(title, body, help);
      this.reveal();
    };
    window.addEventListener('notebook-updated', refresh);
    window.addEventListener('inventory-changed', refresh);
    window.addEventListener('puzzle-solved', refresh);
    window.addEventListener('hud-attention', () => this.reveal());
    window.addEventListener('keydown', e => {
      if (['KeyF', 'KeyM', 'KeyH', 'Tab', 'KeyE', 'Escape'].includes(e.code)) this.reveal();
    });
    controls.addEventListener('lock', () => this.reveal());
    controls.addEventListener('unlock', () => {
      clearTimeout(this.timer);
      this.hud.classList.remove('quiet');
    });
    refresh();
  }

  updateTarget() {
    if (!this.targetId) { this.marker.hidden = true; return; }
    const target = this.targets.find(object => object.userData.clueId === this.targetId);
    if (!target || !this.controls.isLocked) { this.marker.hidden = true; return; }
    target.updateWorldMatrix(true, false);
    const point = target.getWorldPosition(new THREE.Vector3());
    const distance = point.distanceTo(this.camera.position);
    const facing = point.clone().sub(this.camera.position).dot(this.camera.getWorldDirection(new THREE.Vector3())) > 0;
    point.project(this.camera);
    this.marker.hidden = false;
    this.marker.style.left = `${Math.max(12, Math.min(88, (point.x + 1) * 50))}%`;
    this.marker.style.top = `${Math.max(36, Math.min(78, (1 - point.y) * 50))}%`;
    this.marker.textContent = `${facing && Math.abs(point.x) < 1 ? '◇' : '↪'} ${target.userData.name.replace('● ', '')} · ${distance.toFixed(1)}m${distance > 3.5 ? ' · 가까이 다가가시오' : ' · 중앙에 맞추고 [E]'}`;
  }

  reveal() {
    this.hud.classList.remove('quiet');
    clearTimeout(this.timer);
    if (this.controls.isLocked) {
      this.timer = setTimeout(() => this.hud.classList.add('quiet'), 7000);
    }
  }
}
