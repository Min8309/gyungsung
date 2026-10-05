import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * NegativeTypeMirror:
 * 심화 퍼즐: 네거티브 활자 반전 (식자공 거울상 해독)
 * 1. 활판 조판 상판의 음각/거울상 반전 문자 렌더링
 * 2. 황동 반사판/잉크 웅덩이를 통한 평면 반사(Mirror Reflection) 정방향 해독
 * 3. 둥근 안경 착용 여부에 따른 가독성 및 정방향 암호([2358]) 교차 검증 제공
 */
export class NegativeTypeMirror {
  constructor(soundManager) {
    this.soundManager = soundManager;
    this.config = GameConfig.negativeMirror;
  }

  renderMirrorView(container) {
    const hasGlasses = gameState.hasItem('round_glasses');

    if (hasGlasses) {
      gameState.markClueInspected('clue_mirror_type');
    }

    container.innerHTML = `
      <div class="negative-mirror-view" style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%;">
        <div style="font-size:13px; color:#cca468; letter-spacing:1px; text-align:center;">
          활판 인쇄는 지면에 바르게 인쇄되기 위해 <strong>거울상(음각 반전)</strong>으로 조판됩니다.
        </div>

        <!-- Two Panel Comparison: Negative Plate vs Polished Mirror Plate -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; width:100%;">
          <!-- Left: Mirrored Inverted Lead Plate -->
          <div style="background:#1a1510; border:2px solid #5a3d24; border-radius:4px; padding:16px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:inset 0 0 15px #000;">
            <div style="font-size:11px; color:#997755; margin-bottom:8px;">[조판 상판 납 활자: 거울상]</div>
            <!-- Mirrored backwards text using CSS transform -->
            <div style="font-size:32px; font-weight:900; color:#888f9c; transform:scaleX(-1); letter-spacing:4px; font-family:'Nanum Myeongjo', serif; background:#292c33; padding:8px 16px; border:2px solid #4f535c; border-radius:3px;">
              2358
            </div>
            <div style="font-size:11px; color:#775533; margin-top:8px;">(좌우 반전된 음각 활자)</div>
          </div>

          <!-- Right: Brass Reflection Plate -->
          <div style="background:#22180c; border:2px solid ${hasGlasses ? '#d4a24e' : '#55331a'}; border-radius:4px; padding:16px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 20px rgba(212,162,78,0.25);">
            <div style="font-size:11px; color:#d4a24e; margin-bottom:8px;">[연마된 황동 반사면: 정방향 투영]</div>
            ${hasGlasses ? `
              <div style="font-size:32px; font-weight:900; color:#ffdd55; letter-spacing:6px; font-family:'Cinzel', serif; text-shadow:0 0 12px rgba(255,221,85,0.7); background:radial-gradient(circle, #573f15 0%, #1a1208 100%); padding:8px 16px; border:2px solid #d4a24e; border-radius:3px;">
                2 3 5 8
              </div>
              <div style="font-size:12px; color:#55ff77; font-weight:700; margin-top:8px;">
                ✓ 안경을 통해 정방향 암호가 해독되었습니다!
              </div>
            ` : `
              <div style="font-size:28px; font-weight:900; color:#554433; filter:blur(6px); letter-spacing:4px; user-select:none;">
                ? ? ? ?
              </div>
              <div style="font-size:11px; color:#e07766; margin-top:8px; line-height:1.4;">
                ${this.config.mirrorNoticeWithoutGlasses}
              </div>
            `}
          </div>
        </div>

        <div class="clue-highlight-box" style="width:100%;">
          <span class="red-handwriting" style="font-size:16px;">
            ${hasGlasses 
              ? '조판 상판의 음각 활자를 황동판에 비추어 정방향 비밀번호 [2358]을 확인했다.' 
              : '활판공 앞치마에 걸린 둥근 안경을 찾아 착용하면 반사면을 또렷하게 읽을 수 있다.'}
          </span>
        </div>
      </div>
    `;
  }
}
