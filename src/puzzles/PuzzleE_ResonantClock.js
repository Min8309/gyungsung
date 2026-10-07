import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * PuzzleE_ResonantClock:
 * 퍼즐 E: 2분의 유예와 공명 추 (물리 진자 스윙 & 자정 12회 타종 시퀀스)
 * 1. 괘종시계 하단 유리문 개방
 * 2. 진자의 고유 주기(1.0s ± 0.22s)에 맞춘 좌우 스와이프 리듬 인터랙션
 * 3. 공명 누적에 따른 진폭(0~100%) 증가 및 째깍음 가속/피치 상승
 * 4. 100% 도달 시 23:58 -> 00:00(자정) 스냅 이동 및 12회 묵직한 타종(Bell Gong)
 * 5. 타종 시마다 전구 완전 암전 및 12m 복도 끝 실루엣 플래시
 * 6. 12번째 타종 종료 시 지하 윤전기 전원 강제 인가
 */
export class PuzzleE_ResonantClock {
  constructor(soundManager, lighting, corridorGhostMesh = null) {
    this.soundManager = soundManager;
    this.lighting = lighting;
    this.corridorGhostMesh = corridorGhostMesh;
    this.config = GameConfig.puzzleE;

    this.isGlassOpen = false;
    this.amplitude = 0.2; // 기본 20% 진폭
    this.lastSwipeTime = 0;
    this.lastDirection = null; // 'left' | 'right'
    this.isMidnightTriggered = false;
    this.gongSequenceActive = false;

    this.currentGongCount = 0;
  }

  // 괘종시계 인터랙티브 진자 뷰 렌더링
  renderClockInteractiveView(container, onComplete) {
    container.innerHTML = `
      <div class="resonant-clock-view" style="display:flex; flex-direction:column; align-items:center; gap:12px; width:100%;">
        <!-- Upper Clock Face Display -->
        <div style="display:flex; align-items:center; justify-content:center; gap:20px; width:100%;">
          <div id="clock-face-min" style="font-size:26px; font-weight:900; color:${this.isMidnightTriggered ? '#e6392f' : '#ffeed3'}; font-family:'Cinzel', serif; letter-spacing:2px; text-shadow:0 0 10px rgba(0,0,0,0.8);">
            ${this.isMidnightTriggered ? '00:00 (子正)' : '23:58 (子正 2分 前)'}
          </div>
        </div>

        <!-- Lower Pendulum Box Frame -->
        <div id="pendulum-interactive-frame" style="position:relative; width:260px; height:240px; background:#18110b; border:3px solid #6b4d2b; border-radius:6px; overflow:hidden; touch-action:none; display:flex; flex-direction:column; align-items:center; box-shadow:inset 0 0 30px #000;">
          <!-- Glass Door Reflection Overlay -->
          <div id="clock-glass-overlay" style="position:absolute; inset:0; background:linear-gradient(135deg, rgba(80,120,160,0.25) 0%, transparent 60%); pointer-events:${this.isGlassOpen ? 'none' : 'auto'}; opacity:${this.isGlassOpen ? '0' : '1'}; transition:opacity 0.3s ease; z-index:5;">
            <div style="position:absolute; bottom:12px; width:100%; text-align:center; color:#cca468; font-size:12px; font-weight:700;">
              🔒 하단 유리문이 닫혀 있습니다
            </div>
          </div>

          <!-- Swinging Brass Pendulum Element -->
          <div id="pendulum-pivot-arm" style="width:4px; height:160px; background:linear-gradient(180deg, #b58b40, #664d20); transform-origin:top center; transform:rotate(0deg); transition:transform 0.15s ease-out; margin-top:10px; position:relative;">
            <!-- Brass Bob Weight -->
            <div style="width:50px; height:50px; border-radius:50%; background:radial-gradient(circle, #f7d583 20%, #b58b40 70%, #573f15 100%); position:absolute; bottom:-15px; left:-23px; box-shadow:0 6px 15px rgba(0,0,0,0.8), inset 0 0 6px rgba(0,0,0,0.5);"></div>
          </div>

          <!-- Swipe Rhythm Helper -->
          <div style="position:absolute; bottom:8px; font-size:12px; color:#a68e72; font-weight:700;">
            ${this.isMidnightTriggered 
              ? '★ 자정 타종 완료 - 윤전기 전원 인가' 
              : '좌우로 올바른 박자(1.0초 주기)로 드래그하여 공명 진폭을 높이십시오'}
          </div>
        </div>

        <!-- Resonance Amplitude Gauge -->
        <div style="width:100%; max-width:260px; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; color:#c7ab87; font-weight:700;">
            <span>진자 공명 진폭:</span>
            <span id="resonance-pct">${Math.floor(this.amplitude * 100)}%</span>
          </div>
          <div style="width:100%; height:12px; background:#150d08; border:1px solid #573a1d; border-radius:6px; overflow:hidden;">
            <div id="resonance-bar" style="width:${Math.floor(this.amplitude * 100)}%; height:100%; background:linear-gradient(90deg, #d48e35, #e6392f); transition:width 0.2s ease;"></div>
          </div>
        </div>

        <!-- Controls / Glass Door Open Button -->
        <div style="display:flex; gap:10px; margin-top:4px;">
          ${!this.isGlassOpen ? `
            <button id="btn-open-clock-glass" class="inspect-action-btn">
              🔓 시계 하단 유리문 열기
            </button>
          ` : `
            <button id="btn-push-left" class="dial-btn" style="width:60px; height:34px; font-weight:800;">◀ 좌측</button>
            <button id="btn-push-right" class="dial-btn" style="width:60px; height:34px; font-weight:800;">우측 ▶</button>
          `}
        </div>
      </div>
    `;

    // 1. 유리문 개방 버튼
    const openGlassBtn = container.querySelector('#btn-open-clock-glass');
    if (openGlassBtn) {
      openGlassBtn.addEventListener('click', () => {
        this.isGlassOpen = true;
        if (this.soundManager) this.soundManager.playDrawerUnlock();
        this.renderClockInteractiveView(container, onComplete);
      });
    }

    // 2. 포인터 스와이프 인터랙션 설정
    const frame = container.querySelector('#pendulum-interactive-frame');
    const pivotArm = container.querySelector('#pendulum-pivot-arm');
    const resonanceBar = container.querySelector('#resonance-bar');
    const resonancePct = container.querySelector('#resonance-pct');
    const clockFaceMin = container.querySelector('#clock-face-min');

    if (!frame || !this.isGlassOpen || this.isMidnightTriggered) return;

    let startX = 0;
    let isSwiping = false;

    const handlePush = (direction) => {
      const now = performance.now() / 1000;
      const dt = now - this.lastSwipeTime;

      // 올바른 방향 교대 및 주기 검증
      const isAlternating = direction !== this.lastDirection;
      const isGoodTiming = (dt >= this.config.naturalPeriod - this.config.timingTolerance &&
                            dt <= this.config.naturalPeriod + this.config.timingTolerance) || this.lastSwipeTime === 0;

      this.lastSwipeTime = now;
      this.lastDirection = direction;

      // 시계추 시각 애니메이션
      const angle = direction === 'left' ? -24 : 24;
      if (pivotArm) {
        pivotArm.style.transform = `rotate(${angle}deg)`;
        setTimeout(() => {
          if (pivotArm) pivotArm.style.transform = 'rotate(0deg)';
        }, 350);
      }

      if (isAlternating && isGoodTiming) {
        // 공명 진폭 증가
        this.amplitude = Math.min(1.0, this.amplitude + 0.22);
        // 가속 째깍음 재생
        if (this.soundManager) {
          this.soundManager.playResonantTick(1.0 + this.amplitude * 0.4);
        }
      } else {
        // 박자가 어긋나면 감쇠
        this.amplitude = Math.max(0.15, this.amplitude - 0.08);
        if (this.soundManager) {
          this.soundManager.playClockTick(false);
        }
      }

      if (resonanceBar) resonanceBar.style.width = `${Math.floor(this.amplitude * 100)}%`;
      if (resonancePct) resonancePct.textContent = `${Math.floor(this.amplitude * 100)}%`;

      // 100% 도달 시 자정 타종 시퀀스 돌입!
      if (this.amplitude >= 1.0 && !this.isMidnightTriggered) {
        this.isMidnightTriggered = true;
        if (clockFaceMin) {
          clockFaceMin.textContent = '00:00 (子正)';
          clockFaceMin.style.color = '#e6392f';
        }
        this.triggerMidnightGongSequence(onComplete);
      }
    };

    // 터치/마우스 스와이프 리스너
    frame.addEventListener('pointerdown', (e) => {
      isSwiping = true;
      startX = e.clientX;
      frame.setPointerCapture(e.pointerId);
    });

    frame.addEventListener('pointermove', (e) => {
      if (!isSwiping || this.isMidnightTriggered) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 35) {
        handlePush(dx < 0 ? 'left' : 'right');
        startX = e.clientX;
      }
    });

    const endSwipe = (e) => {
      isSwiping = false;
      try { frame.releasePointerCapture(e.pointerId); } catch(err) {}
    };

    frame.addEventListener('pointerup', endSwipe);
    frame.addEventListener('pointercancel', endSwipe);

    // 보조 버튼
    const leftBtn = container.querySelector('#btn-push-left');
    const rightBtn = container.querySelector('#btn-push-right');
    if (leftBtn) leftBtn.addEventListener('click', () => handlePush('left'));
    if (rightBtn) rightBtn.addEventListener('click', () => handlePush('right'));
  }

  // 12회 자정 타종 및 암전/복도 실루엣 공포 연출
  triggerMidnightGongSequence(onComplete) {
    if (this.gongSequenceActive) return;
    this.gongSequenceActive = true;
    this.currentGongCount = 0;

    gameState.markClueInspected('clue_clock_gong');

    const strikeIntervalMs = this.config.gongInterval * 1000;

    const strikeGong = () => {
      this.currentGongCount++;

      // 1. Web Audio 저음 종소리
      if (this.soundManager) {
        this.soundManager.playBellGong(this.currentGongCount);
      }

      // 2. 전구 순간 암전 및 복도 끝 실루엣 플래시
      if (this.lighting && this.lighting.mainPointLight) {
        const origIntensity = this.lighting.mainPointLight.intensity;
        this.lighting.mainPointLight.intensity = 0; // 완전 암전
        
        if (this.corridorGhostMesh) {
          this.corridorGhostMesh.visible = true; // 복도 끝 실루엣 노출
        }

        setTimeout(() => {
          if (this.lighting && this.lighting.mainPointLight) {
            this.lighting.mainPointLight.intensity = origIntensity;
          }
          if (this.corridorGhostMesh) {
            this.corridorGhostMesh.visible = false;
          }
        }, 400);
      }

      if (this.currentGongCount < this.config.maxGongs) {
        setTimeout(strikeGong, strikeIntervalMs);
      } else {
        // 12회 타종 종료: 윤전기 전원 강제 인가 및 퍼즐 A 해결 처리
        this.gongSequenceActive = false;
        gameState.isPrintReady = true;
        gameState.recordProgress();
        window.dispatchEvent(new Event('inventory-changed'));

        if (this.soundManager) {
          this.soundManager.playPuzzleSuccess();
        }

        alert('자정 12회의 타종이 끝나며 지하 윤전기에 강제 전원이 인가되었습니다! 인쇄기를 가동할 수 있습니다.');
        if (onComplete) onComplete();
      }
    };

    strikeGong();
  }
}
