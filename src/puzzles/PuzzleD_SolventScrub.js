import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * PuzzleD_SolventScrub:
 * 퍼즐 D: 활판 세척액과 피 묻은 앞치마 (아이템 조합 및 스크러빙 물리 인터랙션)
 * 1. 앞치마 주머니 조사 시 '세척용 벤젠 유리병' 획득
 * 2. 벤젠 병으로 앞치마 천 적시기
 * 3. 벤젠 천으로 자물쇠/열쇠의 굳은 잉크 슬러지를 문질러 닦아내는 스크러빙(Scrubbing) 물리 상호작용
 * 4. 숨겨진 붉은 필적 ("그는 기계 안에 있다") 알파 페이드인
 * 5. 자물쇠 슬러지 제거 및 철문 해금 연동
 */
export class PuzzleD_SolventScrub {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.config = GameConfig.puzzleD;

    // 상태 추적
    this.hasBenzene = false;
    this.isApronSoaked = false;
    this.scrubProgress = 0; // 0.0 ~ 1.0
    this.isSludgeCleared = false;
    this.lastPointerPos = null;
    this.isDragging = false;
  }

  // 1. 앞치마 주머니에서 벤젠 병 획득
  acquireBenzene() {
    if (this.hasBenzene) return false;
    this.hasBenzene = true;
    gameState.addItem({
      id: this.config.benzeneItemId,
      name: this.config.benzeneItemName,
      desc: this.config.benzeneDesc
    });
    gameState.markClueInspected('clue_benzene');
    if (this.soundManager) this.soundManager.playInspectStinger();
    return true;
  }

  // 2. 앞치마에 벤젠 붓기 (적시기)
  soakApronWithBenzene() {
    if (!this.hasBenzene || this.isApronSoaked) return false;
    this.isApronSoaked = true;
    if (this.soundManager) this.soundManager.playFloorboardCreak(); // 기름 젖는 소리
    return true;
  }

  // 3. 스크러빙 인터랙티브 뷰 생성 (DOM / Canvas)
  renderScrubbingView(container, onComplete) {
    container.innerHTML = `
      <div class="scrub-container" style="display:flex; flex-direction:column; align-items:center; gap:14px; width:100%;">
        <div style="font-size:14px; color:#cca468; letter-spacing:1px; text-align:center;">
          ${!this.isApronSoaked 
            ? '💡 세척용 벤젠 병을 앞치마 천에 부어 적신 후 굳은 슬러지를 문질러 닦으십시오.' 
            : '✋ 마우스나 손가락을 자물쇠 표면 위에서 문질러(Scrubbing) 굳은 핏덩이와 잉크를 닦아내십시오.'}
        </div>

        <!-- Interactive Scrub Canvas Frame -->
        <div id="scrub-touch-area" style="position:relative; width:300px; height:220px; background:#1b120c; border:3px solid #73502d; border-radius:6px; overflow:hidden; touch-action:none; cursor:crosshair; box-shadow:inset 0 0 25px #000;">
          <!-- Iron Lock & Key Background -->
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#554433;">
            <div style="font-size:48px; opacity:0.85;">🔒🗝️</div>
            <div style="font-size:13px; color:#a68868; font-weight:700; margin-top:4px;">지하 윤전기실 놋쇠 자물쇠 구멍</div>
          </div>

          <!-- Hidden Red Text (revealed as scrubbing continues) -->
          <div id="scrub-secret-text" style="position:absolute; bottom:14px; width:100%; text-align:center; color:#e6392f; font-size:17px; font-weight:800; letter-spacing:2px; opacity:${this.scrubProgress}; text-shadow:0 0 10px rgba(230,57,47,0.7); pointer-events:none;">
            "${this.config.revealedSecretText}"
          </div>

          <!-- Dirty Sludge Layer Canvas -->
          <canvas id="scrub-canvas" width="300" height="220" style="position:absolute; inset:0; width:100%; height:100%;"></canvas>
        </div>

        <!-- Progress Bar -->
        <div style="width:100%; max-width:300px; background:#150d08; border:1px solid #573a1d; height:12px; border-radius:6px; overflow:hidden;">
          <div id="scrub-progress-bar" style="width:${Math.floor(this.scrubProgress * 100)}%; height:100%; background:linear-gradient(90deg, #8a241c, #55ff77); transition:width 0.1s ease;"></div>
        </div>

        <div id="scrub-status-text" style="font-size:13px; font-weight:700; color:${this.isSludgeCleared ? '#55ff77' : '#e0c8b0'}; text-align:center;">
          ${this.isSludgeCleared 
            ? '✓ 슬러지 세척 완료! 자물쇠 구멍이 완전히 개방되었습니다.' 
            : `세척 진척도: ${Math.floor(this.scrubProgress * 100)}%`}
        </div>

        ${!this.isApronSoaked ? `
          <button id="btn-soak-benzene" class="inspect-action-btn" style="background:#2a4422; border-color:#55bb44;">
            🧪 벤젠 병을 앞치마 천에 붓기 (천 적시기)
          </button>
        ` : ''}
      </div>
    `;

    // 벤젠 붓기 버튼
    const soakBtn = container.querySelector('#btn-soak-benzene');
    if (soakBtn) {
      soakBtn.addEventListener('click', () => {
        this.soakApronWithBenzene();
        this.renderScrubbingView(container, onComplete);
      });
    }

    // 캔버스 초기화 및 스크러빙 슬러지 그리기
    const canvas = container.querySelector('#scrub-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    this.drawSludge(ctx, canvas.width, canvas.height);

    // 포인터 이벤트 (모바일 터치 & 데스크톱 마우스 공통 추상화)
    const touchArea = container.querySelector('#scrub-touch-area');
    const secretTextEl = container.querySelector('#scrub-secret-text');
    const progressBar = container.querySelector('#scrub-progress-bar');
    const statusText = container.querySelector('#scrub-status-text');

    let accumulatedDistance = this.scrubProgress * this.config.scrubDistanceThreshold;

    const onPointerDown = (e) => {
      if (!this.isApronSoaked || this.isSludgeCleared) return;
      this.isDragging = true;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      touchArea.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging || !this.lastPointerPos || this.isSludgeCleared) return;

      const dx = e.clientX - this.lastPointerPos.x;
      const dy = e.clientY - this.lastPointerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 3) {
        accumulatedDistance += dist;
        this.lastPointerPos = { x: e.clientX, y: e.clientY };

        // 캔버스 상의 포인터 로컬 좌표
        const rect = canvas.getBoundingClientRect();
        const localX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const localY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // 잉크 슬러지 지우기 (Destination-Out)
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(localX, localY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 진척도 갱신
        this.scrubProgress = Math.min(1.0, accumulatedDistance / this.config.scrubDistanceThreshold);

        if (secretTextEl) secretTextEl.style.opacity = this.scrubProgress;
        if (progressBar) progressBar.style.width = `${Math.floor(this.scrubProgress * 100)}%`;
        if (statusText) statusText.textContent = `세척 진척도: ${Math.floor(this.scrubProgress * 100)}%`;

        // 주기적 마찰음
        if (Math.random() < 0.25 && this.soundManager) {
          this.soundManager.playFootstep(); // 마찰 사운드 응용
        }

        // 100% 도달 시 완료 판정
        if (this.scrubProgress >= 1.0) {
          this.isSludgeCleared = true;
          gameState.doorLockCleared = true;
          gameState.markClueInspected('clue_apron_text');
          if (this.soundManager) {
            this.soundManager.playDrawerUnlock();
            this.soundManager.playPuzzleSuccess();
          }
          if (statusText) {
            statusText.style.color = '#55ff77';
            statusText.textContent = '✓ 굳은 슬러지 세척 완료! 자물쇠 구멍이 열렸습니다.';
          }
          if (onComplete) onComplete();
        }
      }
    };

    const onPointerUp = (e) => {
      this.isDragging = false;
      this.lastPointerPos = null;
      try { touchArea.releasePointerCapture(e.pointerId); } catch(err) {}
    };

    touchArea.addEventListener('pointerdown', onPointerDown);
    touchArea.addEventListener('pointermove', onPointerMove);
    touchArea.addEventListener('pointerup', onPointerUp);
    touchArea.addEventListener('pointercancel', onPointerUp);
  }

  drawSludge(ctx, w, h) {
    if (this.isSludgeCleared) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    // 굳은 검붉은 핏덩이와 잉크 슬러지 층
    ctx.fillStyle = '#0f0805';
    ctx.fillRect(0, 0, w, h);

    // 핏자국 얼룩
    ctx.fillStyle = 'rgba(120, 20, 15, 0.75)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(w / 2 + (Math.random() * 140 - 70), h / 2 + (Math.random() * 100 - 50), 20 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // 끈적한 잉크 텍스처
    ctx.fillStyle = 'rgba(5, 5, 5, 0.85)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(w / 2 + (Math.random() * 180 - 90), h / 2 + (Math.random() * 120 - 60), 15 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
