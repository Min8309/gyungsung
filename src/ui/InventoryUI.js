import { gameState } from '../systems/GameState.js';

/**
 * InventoryUI: HUD 하단 좌측 소지품 바
 */
export class InventoryUI {
  constructor() {
    this.container = document.getElementById('inventory-items');
    this.initEvents();
    this.render();
  }

  initEvents() {
    window.addEventListener('inventory-changed', () => this.render());
  }

  render() {
    if (!this.container) return;

    if (gameState.inventory.length === 0) {
      this.container.innerHTML = '<span class="empty-inv-text">소지한 물품 없음</span>';
      return;
    }

    this.container.innerHTML = '';
    gameState.inventory.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'inv-item-chip';
      let icon = '📦';
      if (item.id === 'round_glasses') icon = '👓';
      else if (item.id === 'power_fuse') icon = '⚡';
      else if (item.id === 'suicide_note_piece') icon = '📜';
      else if (item.id === 'lead_types') icon = '🔤';
      else if (item.id === 'rusty_key') icon = '🗝️';

      chip.innerHTML = `<span>${icon}</span> <span>${item.name}</span>`;
      chip.title = item.desc || item.name;
      this.container.appendChild(chip);
    });
  }
}
