import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * NotebookUI: 식자공의 수첩 (Tab 키 토글)
 * 단서 자동 기록 및 퍼즐 해결 스탬프 갱신
 */
export class NotebookUI {
  constructor(playerControls) {
    this.playerControls = playerControls;
    this.modalEl = document.getElementById('notebook-modal');
    this.cluesListEl = document.getElementById('notebook-clues-list');
    this.closeBtn = document.getElementById('notebook-close-btn');
    this.printReadyBadge = document.getElementById('print-ready-badge');
    this.statusTag = document.getElementById('notebook-status');

    this.isOpen = false;

    this.initEvents();
    this.render();
  }

  initEvents() {
    // Tab key listener
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.toggle();
      } else if (e.code === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.statusTag) {
      this.statusTag.style.cursor = 'pointer';
      this.statusTag.addEventListener('click', () => this.toggle());
    }

    // Reactive state updates
    window.addEventListener('notebook-updated', () => this.render());
    window.addEventListener('puzzle-solved', () => this.render());
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.render();
    if (this.modalEl) this.modalEl.classList.add('active');
    if (this.playerControls && this.playerControls.controls.isLocked) {
      this.playerControls.controls.unlock();
    }
  }

  close() {
    this.isOpen = false;
    if (this.modalEl) this.modalEl.classList.remove('active');
    if (this.playerControls && !this.playerControls.controls.isLocked) {
      this.playerControls.controls.lock();
    }
  }

  render() {
    if (!this.cluesListEl) return;

    // 1. Render recorded clues
    this.cluesListEl.innerHTML = '';
    const clues = Array.from(gameState.notebookClues);

    if (clues.length === 0) {
      this.cluesListEl.innerHTML = `
        <div class="notebook-clue-item empty">
          아직 발견된 단서가 없다...<br>공간 속 의심스러운 물건들을 조사([E])하라.
        </div>
      `;
    } else {
      clues.forEach((clueId) => {
        let clueData = GameConfig.notebookClues[clueId];
        if (!clueData) {
          clueData = Object.values(GameConfig.notebookClues).find(c => c.id === clueId);
        }
        if (clueData) {
          const item = document.createElement('div');
          item.className = 'notebook-clue-item';
          item.innerHTML = `🖋️ ${clueData.text}`;
          this.cluesListEl.appendChild(item);
        }
      });
    }

    // 2. Render puzzle stamps
    this.updateStamp('stamp-puzzle-a', gameState.puzzles.puzzle_a);
    this.updateStamp('stamp-puzzle-b', gameState.puzzles.puzzle_b);
    this.updateStamp('stamp-puzzle-c', gameState.puzzles.puzzle_c);

    // 3. Print Ready Badge
    if (this.printReadyBadge) {
      if (gameState.isPrintReady) {
        this.printReadyBadge.classList.remove('hidden');
      } else {
        this.printReadyBadge.classList.add('hidden');
      }
    }
  }

  updateStamp(elementId, isSolved) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (isSolved) {
      el.textContent = '✓ 解決';
      el.className = 'track-stamp solved';
    } else {
      el.textContent = '未解決';
      el.className = 'track-stamp';
    }
  }
}
