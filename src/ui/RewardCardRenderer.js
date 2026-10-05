import { GameConfig } from '../config/GameConfig.js';
import { gameState } from '../systems/GameState.js';

/**
 * RewardCardRenderer:
 * 1. 1회용 긴장감 점프스케어 및 인쇄 시퀀스(기계음, 전구 소등, 시계 멈춤, 종이 롤업) 연출
 * 2. 9:16 (1080x1920) 고해상도 Canvas 레이어 합성 (배경 / 비주얼 / 문구 / 공식 도장)
 * 3. 고해상도 PNG 다운로드 지원
 */
export class RewardCardRenderer {
  constructor(soundManager, lighting, playerControls) {
    this.soundManager = soundManager;
    this.lighting = lighting;
    this.playerControls = playerControls;

    this.modalEl = document.getElementById('reward-card-modal');
    this.animationContainer = document.getElementById('printing-animation');
    this.cardDisplay = document.getElementById('card-display');
    this.canvas = document.getElementById('card-canvas');
    this.downloadBtn = document.getElementById('download-card-btn');
    this.closeBtn = document.getElementById('close-card-btn');
    this.jumpscareEl = document.getElementById('jumpscare-overlay');

    this.jumpscareTriggered = false;
    this.currentCardType = null;
    this.serialNumber = `No. 1934-${Math.floor(1000 + Math.random() * 9000)}`;

    this.initEvents();
  }

  initEvents() {
    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadPNG());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
  }

  // 인쇄 시퀀스 시작
  startSequence() {
    if (this.modalEl) this.modalEl.classList.add('active');
    if (this.animationContainer) this.animationContainer.classList.remove('hidden');
    if (this.cardDisplay) this.cardDisplay.classList.add('hidden');

    if (this.playerControls && this.playerControls.controls.isLocked) {
      this.playerControls.controls.unlock();
    }

    // 1. 시계 째깍 소리 완전히 멈춤 (갑작스러운 적막 공포 연출)
    if (this.soundManager) {
      this.soundManager.stopClockTick();
      this.soundManager.startPrintingMachinery();
    }

    // 2. 전구 한 번 꺼졌다 켜짐
    if (this.lighting && this.lighting.triggerFlicker) {
      this.lighting.triggerFlicker();
    }

    // 3. 인쇄 완료 직전: 단 1회 점프스케어 연출 (약 2.4초 후)
    setTimeout(() => {
      this.triggerSingleJumpscare();
    }, 2200);

    // 4. 종이 롤업 후 최종 카드 출력 (약 3.0초 후)
    setTimeout(() => {
      if (this.soundManager) {
        this.soundManager.stopPrintingMachinery();
        this.soundManager.playPuzzleSuccess();
      }

      const cardData = gameState.determineRewardCard();
      this.currentCardType = cardData;
      this.renderCanvas(cardData);

      if (this.animationContainer) this.animationContainer.classList.add('hidden');
      if (this.cardDisplay) this.cardDisplay.classList.remove('hidden');
    }, 3000);
  }

  // 점프스케어: 1회용 빠른 화면 점멸 및 금속성 스크리치
  triggerSingleJumpscare() {
    if (this.jumpscareTriggered) return;
    this.jumpscareTriggered = true;

    if (this.soundManager) {
      this.soundManager.playJumpscare();
    }

    if (this.jumpscareEl) {
      this.jumpscareEl.classList.add('active');
      setTimeout(() => {
        this.jumpscareEl.classList.remove('active');
      }, 450);
    }
  }

  close() {
    if (this.modalEl) this.modalEl.classList.remove('active');
    if (this.playerControls && !this.playerControls.controls.isLocked) {
      this.playerControls.controls.lock();
    }
  }

  // 9:16 (1080 x 1920) 캔버스 레이어 합성
  renderCanvas(card) {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    const W = 1080;
    const H = 1920;

    // Layer 1: 1930s Aged Newsprint Background
    ctx.fillStyle = '#dfcfb2';
    ctx.fillRect(0, 0, W, H);

    // Paper Aging Texture & Borders
    ctx.fillStyle = 'rgba(70, 45, 25, 0.08)';
    for (let i = 0; i < 60000; i++) {
      const rx = Math.random() * W;
      const ry = Math.random() * H;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Outer Vintage Borders
    ctx.strokeStyle = '#22150a';
    ctx.lineWidth = 12;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    ctx.lineWidth = 3;
    ctx.strokeRect(56, 56, W - 112, H - 112);

    // Layer 2: Newspaper Masthead
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1c130b';

    // Top Meta Line
    ctx.font = '700 28px "Cinzel", serif';
    ctx.fillText('THE GYEONGSEONG DAILY ARCHIVE · SPECIAL EDITION', W / 2, 115);

    ctx.font = '800 32px "Nanum Myeongjo", serif';
    ctx.fillText('1934年 10月 25日 (木曜日) · 活版 號外', W / 2, 165);

    // Serial Number
    ctx.font = '700 30px "Cinzel", serif';
    ctx.fillStyle = '#8a2018';
    ctx.textAlign = 'right';
    ctx.fillText(this.serialNumber, W - 80, 165);

    // Masthead Divider
    ctx.beginPath();
    ctx.moveTo(70, 195);
    ctx.lineTo(W - 70, 195);
    ctx.strokeStyle = '#1c130b';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Giant Masthead Title: 京城日報 號外
    ctx.textAlign = 'center';
    ctx.fillStyle = '#120b06';
    ctx.font = '900 110px "Nanum Myeongjo", serif';
    ctx.fillText('京 城 日 報', W / 2 - 120, 315);

    // Red "號外" Box
    ctx.fillStyle = '#a6241e';
    ctx.fillRect(W / 2 + 250, 220, 190, 110);
    ctx.fillStyle = '#fff9f0';
    ctx.font = '900 64px "Nanum Myeongjo", serif';
    ctx.fillText('號 外', W / 2 + 345, 302);

    // Divider under Masthead
    ctx.beginPath();
    ctx.moveTo(70, 360);
    ctx.lineTo(W - 70, 360);
    ctx.strokeStyle = '#1c130b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Layer 3: Main Visual Graphic Area (680px height)
    this.drawCardVisualGraphic(ctx, card, W);

    // Layer 4: Headline & Article Content
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9e1a1a';
    ctx.font = '900 52px "Nanum Myeongjo", serif';
    ctx.fillText(card.headline, W / 2, 1150);

    ctx.fillStyle = '#2b1b11';
    ctx.font = '700 32px "Nanum Myeongjo", serif';
    ctx.fillText(card.subhead, W / 2, 1220);

    // Body Article Box
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e140d';
    ctx.font = '400 31px "Nanum Myeongjo", serif';
    this.wrapText(ctx, card.description, 100, 1310, W - 200, 52);

    // Additional Horror Lore
    const subLore = "지하 윤전기실에서 울려 퍼지던 활판 기계음은 자정이 지난 지금도 멈추지 않고 있다. 활자를 조판하던 이들은 어디로 사라졌는가. 핏빛 먹물이 마르지 않은 채 경성의 밤거리를 떠돌고 있다.";
    this.wrapText(ctx, subLore, 100, 1500, W - 200, 48);

    // Layer 5: Official Blood-Red Ink Seal Stamp
    this.drawOfficialStamp(ctx, card.stamp, W - 240, 1680);

    // Layer 6: Mandatory Notice & Footer
    ctx.beginPath();
    ctx.moveTo(70, 1820);
    ctx.lineTo(W - 70, 1820);
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a5a3a';
    ctx.font = '700 24px "Nanum Myeongjo", serif';
    ctx.fillText(card.notice, W / 2, 1865);
  }

  drawCardVisualGraphic(ctx, card, W) {
    const boxX = 90;
    const boxY = 400;
    const boxW = W - 180;
    const boxH = 680;

    // Dark Graphic Frame
    ctx.fillStyle = '#110b07';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#4a341e';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Ambient Eerie Glow
    const radGlow = ctx.createRadialGradient(W / 2, boxY + boxH / 2, 50, W / 2, boxY + boxH / 2, 350);
    radGlow.addColorStop(0, 'rgba(160, 30, 20, 0.45)');
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Visual Icon based on card type
    ctx.textAlign = 'center';
    if (card.type === 'TYPE_B') {
      // Type B: 식자공의 피 묻은 유서
      ctx.font = '120px serif';
      ctx.fillText('📜🩸', W / 2, boxY + 280);
      ctx.fillStyle = '#dfcfb2';
      ctx.font = '700 36px "Nanum Myeongjo", serif';
      ctx.fillText('『遺書 : 활자가 나를 삼킨다』', W / 2, boxY + 410);
    } else if (card.type === 'TYPE_D') {
      // Type D: 저주받은 심령사진 (거대한 눈동자)
      ctx.font = '130px serif';
      ctx.fillText('👁️‍🗨️', W / 2, boxY + 280);
      ctx.fillStyle = '#dfcfb2';
      ctx.font = '700 36px "Nanum Myeongjo", serif';
      ctx.fillText('『心靈寫眞 : 어둠 속의 응시자』', W / 2, boxY + 410);
    } else if (card.type === 'TYPE_A') {
      // Type A: 영구결번 지면
      ctx.font = '120px serif';
      ctx.fillText('📰⛓️', W / 2, boxY + 280);
      ctx.fillStyle = '#dfcfb2';
      ctx.font = '700 36px "Nanum Myeongjo", serif';
      ctx.fillText('『檢閱 押收 : 영구결번 지면』', W / 2, boxY + 410);
    } else {
      // Type C: 해부실 감식표 (히든)
      ctx.font = '120px serif';
      ctx.fillText('🩻🔬', W / 2, boxY + 280);
      ctx.fillStyle = '#ff6655';
      ctx.font = '900 38px "Nanum Myeongjo", serif';
      ctx.fillText('『極秘 : 京城醫專 解剖室 鑑識表』', W / 2, boxY + 410);
    }

    ctx.fillStyle = '#9e8469';
    ctx.font = '24px "Cinzel", serif';
    ctx.fillText('ARCHIVAL RECORD #1934-EXP-OCT24', W / 2, boxY + 480);
  }

  drawOfficialStamp(ctx, text, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.15); // Tilted stamp angle

    // Outer double square
    ctx.strokeStyle = '#b51c14';
    ctx.lineWidth = 6;
    ctx.strokeRect(-90, -45, 180, 90);

    ctx.lineWidth = 2;
    ctx.strokeRect(-82, -38, 164, 76);

    ctx.fillStyle = '#b51c14';
    ctx.font = '900 36px "Nanum Myeongjo", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  downloadPNG() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `Gyeongseong_1934_${this.currentCardType ? this.currentCardType.cardId : 'card'}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}
