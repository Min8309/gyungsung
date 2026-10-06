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
      this.objective.textContent = gameState.isClueInspected('clue_proof_unreadable')
        ? '다음 기록 · 앞치마에 걸린 교정용 안경을 찾아보자. [Tab] 수첩'
        : '첫 기록 · 책상 위 교정지를 바라보고 [E]로 조사하자.';
      this.reveal();
    };
    window.addEventListener('notebook-updated', refresh);
    window.addEventListener('inventory-changed', () => {
      refresh();
      if (gameState.hasItem('round_glasses') && !gameState.notebookClues.has('clue_proof_title')) {
        this.objective.textContent = '다음 기록 · 안경을 챙겼다. 책상 위 교정지를 다시 조사하자.';
      }
    });
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
