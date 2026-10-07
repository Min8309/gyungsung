import { EVIDENCE } from '../scene/PrintShopEvidence.js';
import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * InspectViewRenderer:
 * 상호작용 조사([E]) 시 오브젝트별 확대 뷰 및 인터랙티브 퍼즐 조작(다이얼 락, 안경 장착, 큐브 회전, 활자 조판) 렌더링
 */
export class InspectViewRenderer {
  constructor(soundManager, onPrintStart, puzzleD = null, puzzleE = null, negativeMirror = null) {
    this.soundManager = soundManager;
    this.onPrintStart = onPrintStart;
    this.puzzleD = puzzleD;
    this.puzzleE = puzzleE;
    this.negativeMirror = negativeMirror;

    this.viewContainer = document.getElementById('inspect-interactive-view');
    this.actionBar = document.getElementById('inspect-action-bar');
    this.titleEl = document.getElementById('inspect-title');
    this.descEl = document.getElementById('inspect-desc');
    this.tagEl = document.getElementById('inspect-tag');

    // 24번 서랍 다이얼 상태 (퍼즐 A)
    this.dialDigits = [0, 0, 0, 0];

    // 큐브 회전 상태 (퍼즐 B)
    // 0: 정면, 1: 위(TOP-정답), 2: 뒤, 3: 아래, 4: 좌, 5: 우
    this.cubeRotX = 0;
    this.cubeRotY = 0;
    this.cubeEyeOrientation = 'FRONT'; // FRONT, TOP, BACK, BOTTOM, LEFT, RIGHT
  }

  render(data) {
    if (!this.viewContainer || !this.actionBar) return;

    this.viewContainer.innerHTML = '';
    this.actionBar.innerHTML = '';

    const type = data.type;
    const clueId = data.clueId || type;

    // 단서 조사 기록
    gameState.markClueInspected(type === 'proof' || type === 'newspaper'
      ? 'clue_proof_unreadable' : clueId);

    switch (type) {
      case 'evidence': {
        const entry = EVIDENCE[data.evidenceId];
        const paper = document.createElement('div');
        paper.className = 'evidence-paper';
        paper.textContent = entry?.text || '기록이 훼손되어 읽을 수 없다.';
        this.viewContainer.appendChild(paper);
        break;
      }
      case 'print_roller':
        this.viewContainer.textContent = gameState.isPrintReady
          ? '전원이 준비되었다. 레버를 당기면 호외가 인쇄된다. 철문을 열려면 별도로 조판하여 열쇠를 얻고 자물쇠를 세척해야 한다.'
          : '멈춘 인쇄기다. 24번 서랍의 퓨즈를 얻거나 시계추를 공명시켜 전원을 준비하자.';
        if (gameState.isPrintReady) {
          const button = document.createElement('button');
          button.className = 'inspect-action-btn'; button.textContent = '인쇄 레버 당기기';
          button.addEventListener('click', () => this.onPrintStart?.());
          this.actionBar.appendChild(button);
        }
        break;
      case 'calendar':
        this.renderCalendarView();
        break;
      case 'clock':
        this.renderClockView();
        break;
      case 'drawer_24':
        this.renderDrawer24View();
        break;
      case 'drawer_locked':
        this.renderLockedDrawerView();
        break;
      case 'apron':
      case 'glasses':
        this.renderApronGlassesView();
        break;
      case 'proof':
      case 'newspaper':
        this.renderProofView();
        break;
      case 'cursed_cube':
        this.renderCursedCubeView();
        break;
      case 'galley_slot':
      case 'desk':
        this.renderGalleySlotView();
        break;
      case 'mirror_plate':
        this.renderMirrorPlateView();
        break;
      case 'censor_poster':
        this.renderCensorPosterView();
        break;
      case 'radio':
        this.renderRadioView();
        break;
      case 'rack':
        this.viewContainer.textContent = '평범한 활자 보관장이다. 식·자·공 활자는 노란 표찰이 붙은 별도 칸에서 찾을 수 있다.';
        break;
      case 'type_rack_label':
        this.renderTypeRackView();
        break;
      case 'door':
        this.renderDoorView();
        break;
      default:
        this.viewContainer.innerHTML = '';
        break;
    }
  }

  // 1. 달력 확대 뷰 (단서 1)
  renderCalendarView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="background: #e4d7bf; border: 2px solid #5a3c20; padding: 18px; border-radius: 4px; text-align: center; width: 100%; max-width: 320px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);">
          <div style="font-size: 16px; font-weight: 800; color: #1a120c; border-bottom: 2px solid #1a120c; padding-bottom: 4px; margin-bottom: 8px;">
            1934年 10月 (昭和九年)
          </div>
          <div style="font-size: 42px; font-weight: 900; color: #22140a; line-height: 1.2;">
            <span class="red-circle-marker" style="padding: 4px 14px; border-width: 3px;">24</span>
          </div>
          <div style="font-size: 13px; color: #554433; margin-top: 4px;">水曜日 · 大安</div>
        </div>
        <div class="clue-highlight-box">
          <span class="red-handwriting">"멈춘 시각에 열어라" ➔</span>
        </div>
      </div>
    `;
  }

  // 2. 괘종시계 확대 뷰 (단서 2 & 퍼즐 E)
  renderClockView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const isMidnight = this.puzzleE && this.puzzleE.isMidnightTriggered;

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="width: 200px; height: 200px; border-radius: 50%; border: 6px solid #4a341e; background: #e3d2b8; position: relative; box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.8);">
          <!-- Dial numerals -->
          <div style="position: absolute; top: 10px; width: 100%; text-align: center; font-weight: 800; color: #1a120c; font-size: 20px;">XII</div>
          <div style="position: absolute; right: 12px; top: 88px; font-weight: 800; color: #1a120c; font-size: 18px;">III</div>
          <div style="position: absolute; bottom: 10px; width: 100%; text-align: center; font-weight: 800; color: #1a120c; font-size: 18px;">VI</div>
          <div style="position: absolute; left: 12px; top: 88px; font-weight: 800; color: #1a120c; font-size: 18px;">IX</div>
          <!-- Clock Hands (23:58 or 00:00) -->
          <!-- Hour Hand -->
          <div style="position: absolute; width: 6px; height: 60px; background: #111; top: 44px; left: 97px; transform: rotate(${isMidnight ? '0deg' : '-6deg'}); transform-origin: bottom center; border-radius: 3px;"></div>
          <!-- Minute Hand -->
          <div style="position: absolute; width: 4px; height: 85px; background: #111; top: 18px; left: 98px; transform: rotate(${isMidnight ? '0deg' : '-12deg'}); transform-origin: bottom center; border-radius: 2px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #e6392f; position: absolute; top: -2px; left: -2px; box-shadow: 0 0 6px #e6392f;"></div>
          </div>
          <!-- Center Pin -->
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #99773d; top: 93px; left: 93px;"></div>
        </div>
        <div class="clue-highlight-box">
          <span class="red-handwriting">
            ${isMidnight 
              ? '자정 00:00 (12회 타종 완료 - 윤전기 전원 인가)' 
              : '멈춘 시각: 23시 58분 (자정 2분 전 - 하단 시계추를 흔들어 공명시켜라)'}
          </span>
        </div>
      </div>
    `;

    if (this.puzzleE) {
      const swingBtn = document.createElement('button');
      swingBtn.className = 'inspect-action-btn';
      swingBtn.style.background = isMidnight ? '#2a4422' : '#8a331c';
      swingBtn.textContent = isMidnight 
        ? '✓ 자정 공명 타종 완료됨 (00:00)' 
        : '🕰️ 괘종시계 하단 유리문 열기 및 시계추 흔들기 (공명 스윙)';
      swingBtn.addEventListener('click', () => {
        this.actionBar.innerHTML = '';
        this.puzzleE.renderClockInteractiveView(this.viewContainer, () => this.renderClockView());
      });
      this.actionBar.appendChild(swingBtn);
    }
  }

  // 3. 24번 서랍 4자리 다이얼 자물쇠 (퍼즐 A)
  renderDrawer24View() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    if (gameState.drawer24Opened) {
      this.viewContainer.innerHTML = `
        <div class="clue-zoom-container">
          <div class="dial-lock-feedback success" style="font-size: 17px; margin-bottom: 10px;">
            ✓ 24번 서랍이 활짝 열려 있습니다. (비밀번호: 2358)
          </div>
          <div style="display: flex; gap: 16px; justify-content: center; width: 100%;">
            <div class="inv-item-chip">⚡ 전원 퓨즈 획득됨</div>
            <div class="inv-item-chip">📜 식자공의 유서 조각 획득됨</div>
          </div>
        </div>
      `;
      return;
    }

    this.viewContainer.innerHTML = `
      <div class="dial-lock-wrapper">
        <div style="font-size: 13px; color: #cca468; letter-spacing: 2px; font-family: 'Cinzel', serif;">
          DRAWER NO. 24 - 4-DIAL BRASS LOCK
        </div>
        <div class="dial-lock-frame">
          ${[0, 1, 2, 3].map(i => `
            <div class="dial-column">
              <button class="dial-btn" data-col="${i}" data-dir="up">▲</button>
              <div class="dial-number" id="dial-digit-${i}">${this.dialDigits[i]}</div>
              <button class="dial-btn" data-col="${i}" data-dir="down">▼</button>
            </div>
          `).join('')}
        </div>
        <div class="dial-lock-feedback locked" id="dial-feedback">
          숫자 4자리를 회전시켜 맞춰라 (현재: ${this.dialDigits.join('')})
        </div>
      </div>
    `;

    // Button event handlers
    const btns = this.viewContainer.querySelectorAll('.dial-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const col = parseInt(e.target.dataset.col, 10);
        const dir = e.target.dataset.dir;
        if (dir === 'up') {
          this.dialDigits[col] = (this.dialDigits[col] + 1) % 10;
        } else {
          this.dialDigits[col] = (this.dialDigits[col] + 9) % 10;
        }

        if (this.soundManager) this.soundManager.playDialClick();

        const digitEl = document.getElementById(`dial-digit-${col}`);
        if (digitEl) digitEl.textContent = this.dialDigits[col];

        this.checkDrawerCode();
      });
    });
  }

  checkDrawerCode() {
    const code = this.dialDigits.join('');
    const feedbackEl = document.getElementById('dial-feedback');
    if (code === GameConfig.puzzleA.correctCode) {
      // 정답 맞춤: 2358
      gameState.drawer24Opened = true;
      if (this.soundManager) {
        this.soundManager.playDrawerUnlock();
        this.soundManager.playPuzzleSuccess();
      }

      // 아이템 보상 지급
      GameConfig.puzzleA.itemsRewarded.forEach(item => gameState.addItem(item));

      // 퍼즐 A 완료!
      gameState.solvePuzzle('puzzle_a');

      if (feedbackEl) {
        feedbackEl.className = 'dial-lock-feedback success';
        feedbackEl.textContent = '★ 찰칵! 24번 서랍의 놋쇠 자물쇠가 풀렸습니다!';
      }

      setTimeout(() => this.renderDrawer24View(), 1000);
    } else {
      if (feedbackEl) {
        feedbackEl.className = 'dial-lock-feedback locked';
        feedbackEl.textContent = `비밀번호 입력 중... (${code})`;
      }
    }
  }

  // 4. 일반 잠긴 서랍
  renderLockedDrawerView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="font-size: 16px; color: #a8947f; line-height: 1.8;">
          서랍이 굳게 잠겨 있다. 다른 서랍에 자물쇠가 있는지 살펴보자.
        </div>
      </div>
    `;
  }

  // 5. 앞치마와 안경 뷰 (퍼즐 B 단서 1 & 퍼즐 D)
  renderApronGlassesView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const hasGlasses = gameState.hasItem('round_glasses');
    const hasBenzene = this.puzzleD ? this.puzzleD.hasBenzene : gameState.hasItem('benzene_bottle');
    const isSludgeCleared = this.puzzleD ? this.puzzleD.isSludgeCleared : gameState.doorLockCleared;

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="background: #2a1e15; border: 2px solid #73502d; padding: 20px; border-radius: 4px; text-align: center; width: 100%;">
          <div style="font-size: 40px; margin-bottom: 8px;">🥼👓</div>
          <div style="font-size: 18px; font-weight: 700; color: #eed9be; margin-bottom: 6px;">
            피 묻은 식자공의 앞치마와 둥근 안경
          </div>
          <div style="font-size: 14px; color: #b89f82; line-height: 1.6; margin-bottom: 12px;">
            ${hasGlasses 
              ? '둥근 안경을 소지하고 있습니다. 교정지와 황동 반사판을 또렷하게 볼 수 있습니다.' 
              : '벽걸이 못에 걸려 있습니다. 렌즈 안쪽에 무언가를 두려워하며 긁어낸 흔적이 남아 있습니다.'}
          </div>

          <div style="background: #1b120c; border: 1px solid #5a3c20; padding: 12px; border-radius: 4px; text-align: left; font-size: 13px; color: #d0b89b;">
            <div>• <strong>앞치마 주머니</strong>: ${hasBenzene ? '✓ 세척용 벤젠 유리병을 꺼냈습니다.' : '무언가 묵직하고 차가운 유리병이 들어 있습니다.'}</div>
            <div style="margin-top: 6px;">• <strong>앞치마 천 표면</strong>: 굳은 먹물과 핏자국이 말라붙어 있습니다. 주머니의 쪽지에는 ‘그는 기계 안에 있다’라고 적혀 있습니다.</div>
          </div>
        </div>
      </div>
    `;

    // 1. 안경 획득 버튼
    if (!hasGlasses) {
      const takeBtn = document.createElement('button');
      takeBtn.className = 'inspect-action-btn';
      takeBtn.textContent = '👓 둥근 안경 집어들기 (획득)';
      takeBtn.addEventListener('click', () => {
        gameState.addItem({
          id: 'round_glasses',
          name: '둥근 안경',
          desc: '활자 교정용 두꺼운 안경. 미세한 글씨와 숨겨진 붉은 필적을 볼 수 있다.'
        });
        if (this.soundManager) this.soundManager.playInspectStinger();
        this.renderApronGlassesView();
      });
      this.actionBar.appendChild(takeBtn);
    }

    // 2. 벤젠 병 획득 버튼
    if (hasGlasses && !hasBenzene && this.puzzleD) {
      const benzeneBtn = document.createElement('button');
      benzeneBtn.className = 'inspect-action-btn';
      benzeneBtn.textContent = '🧪 앞치마 주머니에서 벤젠 병 꺼내기 (획득)';
      benzeneBtn.addEventListener('click', () => {
        this.puzzleD.acquireBenzene();
        this.renderApronGlassesView();
      });
      this.actionBar.appendChild(benzeneBtn);
    }

    const next = document.createElement('p');
    next.className = 'inspect-next-step';
    next.textContent = !hasGlasses ? '먼저 안경을 챙기시오.'
      : !gameState.notebookClues.has('clue_proof_title') ? '다음: 책상 위 교정지를 다시 조사하시오. 세척액은 철문에서 쓰시오.'
      : '세척액은 철문의 자물쇠를 조사할 때 쓸 수 있소.';
    this.viewContainer.appendChild(next);
  }

  // 6. 교정지 확대 뷰 (퍼즐 B 단서 2 & 퍼즐 C 단서 1)
  renderProofView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const hasGlasses = gameState.hasItem('round_glasses');

    if (!hasGlasses) {
      // 안경이 없을 때: 흐린 블러 처리
      this.viewContainer.innerHTML = `
        <div class="proof-container proof-blurred">
          <div class="proof-headline">
            경성일보 호외 (京城日報 號外)
          </div>
          <div style="font-size: 14px; line-height: 1.8;">
            활판실 식자공 의문의 실종 사건... 어젯밤 깊은 시각 지하 윤전기실에서...
            글자가 심하게 번져서 자세한 내용을 판독하기 어렵다...
          </div>
        </div>
        <div class="proof-blur-notice">
          ⚠ 작고 흐릿한 교정 표시가 잘 보이지 않는다.<br>선명하게 볼 수 있는 '안경'이 필요하다.
        </div>
      `;
    } else {
      // 안경 소지 시: 선명하게 보이며 붉은 단서 노출!
      gameState.markClueInspected('clue_proof_title');
      gameState.markClueInspected('clue_proof_glasses');

      this.viewContainer.innerHTML = `
        <div class="proof-container">
          <div style="font-size: 12px; color: #775533; border-bottom: 1px solid #775533; margin-bottom: 8px; padding-bottom: 4px; display: flex; justify-content: space-between;">
            <span>京城日報 號外 校正紙</span>
            <span>1934年 10月 24日 · 深夜</span>
          </div>

          <!-- 퍼즐 C 단서: "식자공" 세 글자에 붉은 밑줄 -->
          <div class="proof-headline">
            『활판실 <span class="red-underline-marker" style="border-width: 4px; font-weight: 900; color: #b51c14;">식자공</span> 의문의 실종 사건』
          </div>

          <!-- 퍼즐 B 단서: "눈이 위를 보게 하라" 붉은 글씨 -->
          <div class="proof-clue-line" style="font-size: 20px; letter-spacing: 2px;">
            붉은 손글씨: <span class="red-circle-marker" style="padding: 4px 12px; border-width: 3px;">"눈이 위를 보게 하라"</span>
          </div>

          <p style="font-size: 13.5px; color: #332418; line-height: 1.8; margin-top: 14px;">
            "사라진 식자공의 작업대 위에는 기괴한 눈동자 활자 큐브가 놓여 있었으며, 조판대에는 빈칸 세 개가 남아 있었다. 노란 표찰의 활자장에서 밑줄 친 식·자·공 활자를 찾아 차례로 채울 것. 눈동자 큐브는 이 빈칸 옆의 별도 네모 홈에 끼울 것."
          </p>
        </div>
      `;
    }
  }

  // 7. 눈동자 활자 큐브 확대 회전 뷰 (퍼즐 B 단서 3)
  renderCursedCubeView() {
    if (this.actionBar) this.actionBar.innerHTML = '';

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <!-- 3D Realistic Eye Graphic Representation -->
        <div style="width: 170px; height: 170px; background: #1c1511; border: 4px solid #664426; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 30px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.9);">
          ${this.getEyeFaceHtml()}
        </div>

        <div class="clue-highlight-box">
          <div style="font-size: 14px; color: #e6b87d; margin-bottom: 6px;">
            현재 눈동자 위치: <strong style="color: ${this.cubeEyeOrientation === 'TOP' ? '#55ff77' : '#ff7766'}; font-size: 16px;">
              ${this.getOrientationName(this.cubeEyeOrientation)}
            </strong>
          </div>
          <small style="color: #997755;">큐브를 회전시켜 눈동자가 향하는 면을 변경하십시오.</small>
        </div>
      </div>
    `;

    // Rotation action buttons
    const rotUpBtn = document.createElement('button');
    rotUpBtn.className = 'inspect-action-btn';
    rotUpBtn.textContent = '⬆️ 위로 굴리기';
    rotUpBtn.addEventListener('click', () => {
      this.rotateCube('UP');
      if (this.soundManager) this.soundManager.playDialClick();
      this.renderCursedCubeView();
    });

    const rotDownBtn = document.createElement('button');
    rotDownBtn.className = 'inspect-action-btn';
    rotDownBtn.textContent = '⬇️ 아래로 굴리기';
    rotDownBtn.addEventListener('click', () => {
      this.rotateCube('DOWN');
      if (this.soundManager) this.soundManager.playDialClick();
      this.renderCursedCubeView();
    });

    const rotLeftBtn = document.createElement('button');
    rotLeftBtn.className = 'inspect-action-btn';
    rotLeftBtn.textContent = '🔄 회전하기';
    rotLeftBtn.addEventListener('click', () => {
      this.rotateCube('ROTATE');
      if (this.soundManager) this.soundManager.playDialClick();
      this.renderCursedCubeView();
    });

    this.actionBar.appendChild(rotUpBtn);
    this.actionBar.appendChild(rotDownBtn);
    this.actionBar.appendChild(rotLeftBtn);
  }

  rotateCube(direction) {
    if (direction === 'UP') {
      if (this.cubeEyeOrientation === 'FRONT') this.cubeEyeOrientation = 'TOP';
      else if (this.cubeEyeOrientation === 'TOP') this.cubeEyeOrientation = 'BACK';
      else if (this.cubeEyeOrientation === 'BACK') this.cubeEyeOrientation = 'BOTTOM';
      else this.cubeEyeOrientation = 'FRONT';
    } else if (direction === 'DOWN') {
      if (this.cubeEyeOrientation === 'FRONT') this.cubeEyeOrientation = 'BOTTOM';
      else if (this.cubeEyeOrientation === 'BOTTOM') this.cubeEyeOrientation = 'BACK';
      else if (this.cubeEyeOrientation === 'BACK') this.cubeEyeOrientation = 'TOP';
      else this.cubeEyeOrientation = 'FRONT';
    } else {
      // Horizontal toggle
      if (this.cubeEyeOrientation === 'FRONT') this.cubeEyeOrientation = 'LEFT';
      else if (this.cubeEyeOrientation === 'LEFT') this.cubeEyeOrientation = 'RIGHT';
      else this.cubeEyeOrientation = 'FRONT';
    }
  }

  getOrientationName(ori) {
    switch (ori) {
      case 'TOP': return '위쪽 (TOP) - 정답 조건 부합!';
      case 'BOTTOM': return '아래쪽 (바닥을 봄)';
      case 'BACK': return '뒤쪽 (안쪽을 봄)';
      case 'LEFT': return '좌측 면';
      case 'RIGHT': return '우측 면';
      default: return '정면 (당신을 노려봄)';
    }
  }

  getEyeFaceHtml() {
    if (this.cubeEyeOrientation === 'TOP') {
      return `
        <div style="text-align: center; color: #55ff77; font-weight: 800; font-size: 15px;">
          <div style="font-size: 40px; margin-bottom: 4px;">👁️ ⬆️</div>
          눈이 위를 향하고 있습니다!
        </div>
      `;
    } else if (this.cubeEyeOrientation === 'FRONT') {
      return `
        <div style="width: 130px; height: 90px; border-radius: 50%; background: #ece1ce; border: 3px solid #8c211a; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 15px rgba(140, 33, 26, 0.6);">
          <!-- Bloodshot lines -->
          <div style="position: absolute; left: 8px; width: 30px; height: 2px; background: #a8241c; transform: rotate(15deg);"></div>
          <div style="position: absolute; right: 8px; width: 30px; height: 2px; background: #a8241c; transform: rotate(-10deg);"></div>
          <!-- Iris and Pupil -->
          <div style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, #000 45%, #7a1f18 75%, #330b08 100%); position: relative;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #fff; position: absolute; top: 10px; right: 12px;"></div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="color: #66503b; font-size: 14px; text-align: center;">
          [철제 각인 활자면]<br>눈동자가 다른 면으로 돌아가 있습니다.
        </div>
      `;
    }
  }

  // 8. 조판 상판 (퍼즐 B 슬롯 & 퍼즐 C 3개 슬롯)
  renderGalleySlotView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const isCubeSolved = gameState.puzzles.puzzle_b;
    const isTypesSolved = gameState.puzzles.puzzle_c;
    const hasLeadTypes = gameState.hasItem('lead_types');

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container" style="width: 100%;">
        <!-- Section 1: Cursed Cube Slot (퍼즐 B) -->
        <div style="background: rgba(30, 20, 14, 0.9); border: 2px dashed ${isCubeSolved ? '#55ff77' : '#e6392f'}; padding: 14px; border-radius: 4px; width: 100%; text-align: center;">
          <div style="font-size: 15px; font-weight: 800; color: #edd9be; margin-bottom: 6px;">
            [1] 큐브 활자 결합 홈
          </div>
          <div style="font-size: 13px; color: ${isCubeSolved ? '#55ff77' : '#cca468'};">
            ${isCubeSolved 
              ? '✓ 눈이 위를 향한 큐브가 결합되어 잉크 롤러가 활성화되었습니다.' 
              : '붉게 맥동하는 네모난 홈이 있습니다. 눈이 위를 향한 큐브를 장착해야 합니다.'}
          </div>
        </div>

        <!-- Section 2: Composing Galley Slots (퍼즐 C) -->
        <div style="background: rgba(30, 20, 14, 0.9); border: 2px solid #997341; padding: 14px; border-radius: 4px; width: 100%; text-align: center;">
          <div style="font-size: 12px; color: #ffdd44; background: #3b2a15; display: inline-block; padding: 2px 10px; border-radius: 2px; margin-bottom: 8px;">
            ★ 題字 組版 (제자 조판) 빈칸
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; margin: 10px 0;">
            ${[0, 1, 2].map(idx => {
              const val = gameState.galleySlots[idx];
              return `
                <div style="width: 52px; height: 52px; background: #160f09; border: 2px solid ${val ? '#55ff77' : '#b51c14'}; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #eeddc3;">
                  ${val || '?'}
                </div>
              `;
            }).join('')}
          </div>
          <div style="font-size: 13px; color: ${isTypesSolved ? '#55ff77' : '#b89f82'};">
            ${isTypesSolved 
              ? '✓ 식·자·공 조판을 완성하여 녹슨 열쇠를 얻었습니다!'
              : '활자장에서 노란 라벨의 [식], [자], [공] 활자를 찾아 순서대로 꽂으십시오.'}
          </div>
        </div>
      </div>
    `;

    // Action button for Cube (Puzzle B)
    if (!isCubeSolved) {
      const attachCubeBtn = document.createElement('button');
      attachCubeBtn.className = 'inspect-action-btn';
      attachCubeBtn.textContent = '👁️ 큐브 장착하기';
      attachCubeBtn.addEventListener('click', () => {
        if (this.cubeEyeOrientation === 'TOP') {
          gameState.cubeAttached = true;
          gameState.cubeEyeUp = true;
          gameState.solvePuzzle('puzzle_b');
          if (this.soundManager) {
            this.soundManager.playDrawerUnlock();
            this.soundManager.playPuzzleSuccess();
          }
          alert('찰칵! 눈이 위를 향한 큐브가 홈에 맞물리며 잉크 롤러가 활성화되었습니다!');
          this.renderGalleySlotView();
        } else {
          alert('큐브가 결합되지 않습니다! 눈이 위(+Y)를 바라보도록 회전시켜야 합니다.');
        }
      });
      this.actionBar.appendChild(attachCubeBtn);
    }

    // Action button for Types (Puzzle C)
    if (!isTypesSolved && hasLeadTypes) {
      const attachTypesBtn = document.createElement('button');
      attachTypesBtn.className = 'inspect-action-btn';
      attachTypesBtn.textContent = '🔤 식 · 자 · 공 활자 조판하기';
      attachTypesBtn.addEventListener('click', () => {
        gameState.galleySlots = ['식', '자', '공'];
        gameState.solvePuzzle('puzzle_c');

        // 열쇠 획득!
        gameState.addItem({
          id: 'rusty_key',
          name: '머리카락 엉킨 녹슨 열쇠',
          desc: '붉은 실과 머리카락으로 묶인 피 묻은 열쇠. 지하 윤전기실 문을 열 수 있다.'
        });

        if (this.soundManager) {
          this.soundManager.playDrawerUnlock();
          this.soundManager.playPuzzleSuccess();
        }

        alert('철컥! 조판이 완성되며 활자장 비밀 선반이 열려 [머리카락 엉킨 녹슨 열쇠]를 획득했습니다!');
        this.renderGalleySlotView();
      });
      this.actionBar.appendChild(attachTypesBtn);
    }

    if (gameState.isPrintReady) {
      const printButton = document.createElement('button');
      printButton.className = 'inspect-action-btn';
      printButton.textContent = '인쇄기 가동 · 호외 출력';
      printButton.addEventListener('click', () => this.onPrintStart?.());
      this.actionBar.appendChild(printButton);
    }

    // Shortcut button to examine brass mirror plate
    if (this.negativeMirror) {
      const viewMirrorBtn = document.createElement('button');
      viewMirrorBtn.className = 'inspect-action-btn';
      viewMirrorBtn.textContent = '🪞 황동 반사판으로 음각 활자 거울상 비추어보기';
      viewMirrorBtn.addEventListener('click', () => {
        this.actionBar.innerHTML = '';
        this.renderMirrorPlateView();
      });
      this.actionBar.appendChild(viewMirrorBtn);
    }
  }

  // 9. 활자 보관장 확대 뷰 (퍼즐 C 단서 3)
  renderTypeRackView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const hasLeadTypes = gameState.hasItem('lead_types');

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="background: #24170d; border: 2px solid #825b2f; padding: 18px; border-radius: 4px; width: 100%; text-align: center;">
          <div style="background: #dfcfb2; color: #1a1006; font-size: 12px; font-weight: 800; padding: 4px 12px; display: inline-block; margin-bottom: 12px; border-radius: 2px;">
            黃色 索引標 : 特號 活字 (특호 활자)
          </div>
          <div style="display: flex; gap: 16px; justify-content: center; margin: 12px 0;">
            ${['植 (식)', '字 (자)', '工 (공)'].map(ch => `
              <div style="width: 60px; height: 75px; background: #44474f; border: 2px solid #777c88; border-radius: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-weight: 800; box-shadow: inset 0 0 10px #000;">
                <div style="font-size: 26px;">${ch[0]}</div>
                <small style="color: #ffaa55; font-size: 11px;">${ch.slice(2, 4)}</small>
              </div>
            `).join('')}
          </div>
          <div style="font-size: 13.5px; color: #cca468;">
            ${hasLeadTypes 
              ? '이미 [식], [자], [공] 세 활자를 소지품에 챙겼습니다.' 
              : '수만 자의 활자 중 유독 노란 라벨이 붙은 칸에 세 활자가 보관되어 있습니다.'}
          </div>
        </div>
      </div>
    `;

    if (!hasLeadTypes) {
      const takeTypesBtn = document.createElement('button');
      takeTypesBtn.className = 'inspect-action-btn';
      takeTypesBtn.textContent = '🔤 식 · 자 · 공 활자 3개 집어들기 (획득)';
      takeTypesBtn.addEventListener('click', () => {
        gameState.addItem({
          id: 'lead_types',
          name: '납 활자 3개 (식·자·공)',
          desc: '식자 조판대 제자 빈칸에 들어맞는 특호 납 활자.'
        });
        if (this.soundManager) this.soundManager.playInspectStinger();
        this.renderTypeRackView();
      });
      this.actionBar.appendChild(takeTypesBtn);
    }
  }

  // 10. 복도 끝 【지하 윤전기실】 철문 뷰 (퍼즐 D 연동)
  renderDoorView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    const hasKey = gameState.hasItem('rusty_key');
    const isUnlocked = gameState.doorUnlocked;
    const isSludgeCleared = this.puzzleD ? this.puzzleD.isSludgeCleared : gameState.doorLockCleared;

    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="background: #1b120a; border: 2px solid #5a381a; padding: 20px; border-radius: 4px; width: 100%; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">🚪⛓️</div>
          <div style="font-size: 18px; font-weight: 800; color: #eeddc3; margin-bottom: 6px;">
            口出 · 출구 (출구 · 지하 윤전기실)
          </div>
          <div style="font-size: 14px; color: ${isUnlocked ? '#55ff77' : '#b89f82'}; line-height: 1.6;">
            ${isUnlocked 
              ? '✓ 쇠빗장이 풀리고 철문이 열렸습니다! 문틈 너머로 윤전기의 묵직한 진동이 울려 퍼집니다.'
              : (!isSludgeCleared
                  ? '자물쇠 구멍이 굳은 핏덩이와 잉크 슬러지로 막혀 있어 열쇠가 들어가지 않습니다. 오른쪽 벽 앞치마의 주머니에서 세척액을 챙긴 뒤 이 자물쇠를 닦으시오.'
                  : (hasKey 
                      ? '슬러지가 제거되어 열쇠를 꽂을 수 있습니다. [머리카락 엉킨 녹슨 열쇠]를 돌려 빗장을 여십시오.'
                      : '자물쇠 구멍은 뚫렸으나, 문을 열 [녹슨 열쇠]가 필요합니다.'))}
          </div>
        </div>
      </div>
    `;

    // 1. 슬러지가 막혀 있으면 스크러빙 세척 버튼
    if (!isSludgeCleared && this.puzzleD && gameState.hasItem('benzene_bottle')) {
      const scrubBtn = document.createElement('button');
      scrubBtn.className = 'inspect-action-btn';
      scrubBtn.style.background = '#8a331c';
      scrubBtn.textContent = '🧼 벤젠 세척액으로 자물쇠 구멍 슬러지 문질러 닦기';
      scrubBtn.addEventListener('click', () => {
        this.actionBar.innerHTML = '';
        this.puzzleD.renderScrubbingView(this.viewContainer, () => this.renderDoorView());
      });
      this.actionBar.appendChild(scrubBtn);
    }

    // 2. 슬러지가 제거되었고 열쇠가 있으면 자물쇠 열기 버튼
    if (!isUnlocked && isSludgeCleared && hasKey) {
      const unlockBtn = document.createElement('button');
      unlockBtn.className = 'inspect-action-btn';
      unlockBtn.textContent = '🗝️ 머리카락 엉킨 열쇠로 자물쇠 풀기 (회전)';
      unlockBtn.addEventListener('click', () => {
        if (gameState.doorUnlocked || !gameState.hasItem('rusty_key')) return;
        gameState.doorUnlocked = true;
        gameState.recordProgress();
        this.renderDoorView();
        window.dispatchEvent(new Event('door-unlocked'));
      });
      this.actionBar.appendChild(unlockBtn);
    }

    // 3. 인쇄 준비 완료 시 윤전기 가동 버튼
    if (gameState.isPrintReady || isUnlocked) {
      const printBtn = document.createElement('button');
      printBtn.className = 'inspect-action-btn';
      printBtn.style.background = '#a8241c';
      printBtn.textContent = '⚙️ 지하 윤전기 인쇄 가동하기 (호외 출력)';
      printBtn.addEventListener('click', () => {
        if (this.onPrintStart) this.onPrintStart();
      });
      this.actionBar.appendChild(printBtn);
    }
  }

  // 11. 황동 반사판 (네거티브 활자 반전 뷰)
  renderMirrorPlateView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    if (this.negativeMirror) {
      this.negativeMirror.renderMirrorView(this.viewContainer);
    }
  }

  // 12. 총독부 검열 통보서 확대 뷰
  renderCensorPosterView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container" style="max-width: 420px; width: 100%;">
        <div style="background: #d9cbb2; border: 3px solid #8c211a; padding: 20px; border-radius: 4px; color: #22150c; box-shadow: 0 6px 20px rgba(0,0,0,0.8); position: relative;">
          <div style="border-bottom: 2px solid #8c211a; padding-bottom: 6px; margin-bottom: 12px; text-align: center;">
            <div style="color: #8c211a; font-weight: 900; font-size: 16px; letter-spacing: 2px;">【 朝鮮總督府 警務局 檢閱 處分 】</div>
            <div style="font-size: 13px; font-weight: 700; color: #442a17; margin-top: 4px;">京城日報社 活版 號外 發刊 差押 通告</div>
          </div>
          <div style="font-size: 13px; line-height: 1.8; color: #3a2818;">
            <div style="text-decoration: line-through; color: #884433;">1. 소화 9년 10월 24일자 활판 인쇄물 치안 방해 혐의.</div>
            <div style="text-decoration: line-through; color: #884433;">2. 식자실 내 작업 인원의 불온 행위 엄중 감시 요망.</div>
            <div style="text-decoration: line-through; color: #884433;">3. 지하 윤전기실의 10월 25일자 1면 압수 및 봉인 처분.</div>
          </div>
          <div class="clue-highlight-box" style="margin-top: 14px; background: rgba(140, 33, 26, 0.15); border-color: #8c211a;">
            <div style="color: #b51c14; font-weight: 900; font-size: 17px; margin-bottom: 4px;">
              붉은 먹줄 사이 살아남은 단서:
            </div>
            <div style="font-size: 15px; color: #1a1008; font-weight: 800;">
              “멈춘 괘종시각 23:58에 24번 서랍을 열어라”
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 13. 진공관 라디오 확대 뷰
  renderRadioView() {
    if (this.actionBar) this.actionBar.innerHTML = '';
    this.viewContainer.innerHTML = `
      <div class="clue-zoom-container">
        <div style="background: #24160d; border: 2px solid #6b4722; padding: 22px; border-radius: 4px; text-align: center; width: 100%;">
          <div style="font-size: 38px; margin-bottom: 8px;">📻⚡</div>
          <div style="font-size: 18px; font-weight: 800; color: #eeddc3; margin-bottom: 6px;">
            진공관 단파 라디오 (真空管 受信機)
          </div>
          <div style="font-size: 14px; color: #cca468; line-height: 1.7;">
            희미하게 주황빛으로 달아오른 진공관에서 치직거리는 잡음과 함께 귓가를 울리는 모스 부호가 흘러나옵니다.<br>
            <strong style="color: #ffaa55;">헤드폰을 착용하고 시선을 돌려보십시오. 소리가 들려오는 방향에 아직 풀지 못한 비밀이 있습니다.</strong>
          </div>
        </div>
      </div>
    `;
  }
}

