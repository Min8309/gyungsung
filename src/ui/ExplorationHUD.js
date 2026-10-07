import { gameState } from '../systems/GameState.js';

export class ExplorationHUD {
  constructor(controls) {
    this.controls = controls;
    this.hud = document.getElementById('hud-overlay');
    this.objective = document.createElement('div');
    this.objective.id = 'exploration-objective';
    this.objective.setAttribute('role', 'status');
    this.hud.appendChild(this.objective);
    const refresh = () => {
      this.objective.hidden = gameState.notebookClues.has('clue_proof_title');
      const hasGlasses = gameState.hasItem('round_glasses');
      const inspectedProof = gameState.isClueInspected('clue_proof_unreadable');
      const instruction = hasGlasses
        ? '안경을 챙겼으니, 책상 위 교정지를 다시 살펴보시오. 붉은 글씨가 다음 길을 일러줄 것이오.'
        : inspectedProof
          ? '글씨가 흐려 읽히지 않거든, 앞치마에 걸린 둥근 안경부터 챙기시오. 그 뒤 교정지를 다시 보시오.'
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

  reveal() {
    this.hud.classList.remove('quiet');
    clearTimeout(this.timer);
    if (this.controls.isLocked) {
      this.timer = setTimeout(() => this.hud.classList.add('quiet'), 7000);
    }
  }
}
