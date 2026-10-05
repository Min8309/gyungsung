import * as THREE from 'three';

export class TextureFactory {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.cachedTextures = new Map();
  }

  // Helper to load image texture from public/assets
  loadAsset(path, repeatX = 1, repeatY = 1) {
    if (this.cachedTextures.has(path)) {
      return this.cachedTextures.get(path);
    }
    const texture = this.textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    this.cachedTextures.set(path, texture);
    return texture;
  }

  // 1. Dilapidated, Broken & Cracked Wooden Floor Planks (부서지고 갈라진 낡은 원목 마루 - 먹물 얼룩 제거)
  createWoodFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const roughnessCanvas = document.createElement('canvas');
    roughnessCanvas.width = 1024;
    roughnessCanvas.height = 1024;
    const rCtx = roughnessCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 1024;
    const bCtx = bumpCanvas.getContext('2d');

    // Base dark weathered timber tone
    ctx.fillStyle = '#261b12';
    ctx.fillRect(0, 0, 1024, 1024);

    rCtx.fillStyle = '#d0d0d0'; // Weathered dry wood is matte
    rCtx.fillRect(0, 0, 1024, 1024);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 1024, 1024);

    const plankCount = 8;
    const plankWidth = 1024 / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const x = i * plankWidth;
      // Weathered wood tone variation (aged grey-brown timber with desaturated tones)
      const baseTone = 38 + Math.sin(i * 1.9) * 12 + (Math.random() * 8 - 4);
      const r = Math.floor(baseTone * 1.25);
      const g = Math.floor(baseTone * 1.05);
      const b = Math.floor(baseTone * 0.85);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + 1, 0, plankWidth - 2, 1024);

      // Peeling & flaking old lacquer patches (군데군데 벗겨진 니스 칠)
      for (let p = 0; p < 4; p++) {
        const py = Math.random() * 850;
        const ph = 60 + Math.random() * 140;
        const lacquerGrad = ctx.createLinearGradient(x, py, x + plankWidth, py + ph);
        lacquerGrad.addColorStop(0, 'rgba(85, 48, 22, 0.45)');
        lacquerGrad.addColorStop(0.5, 'rgba(110, 62, 28, 0.6)');
        lacquerGrad.addColorStop(1, 'rgba(65, 36, 16, 0.2)');
        ctx.fillStyle = lacquerGrad;
        ctx.fillRect(x + 4, py, plankWidth - 8, ph);

        // Lacquer patches have slight sheen
        rCtx.fillStyle = '#707070';
        rCtx.fillRect(x + 4, py, plankWidth - 8, ph);
      }

      // Fine wood grain fibers and weathered grooves
      for (let j = 0; j < 120; j++) {
        const grainY = Math.random() * 1024;
        const grainH = 80 + Math.random() * 320;
        const grainX = x + Math.random() * plankWidth;
        const grainAlpha = 0.06 + Math.random() * 0.14;
        ctx.fillStyle = Math.random() > 0.4 ? `rgba(18, 12, 7, ${grainAlpha})` : `rgba(75, 60, 44, ${grainAlpha})`;
        ctx.fillRect(grainX, grainY, 1 + Math.random() * 2, grainH);

        bCtx.fillStyle = Math.random() > 0.5 ? '#555555' : '#aaaaaa';
        bCtx.fillRect(grainX, grainY, 1, grainH);
      }

      // Horizontal plank joints & square cut rusted nails
      const joints = [0.22, 0.48, 0.74, 0.95];
      joints.forEach(ratio => {
        const jy = Math.floor((ratio + Math.sin(i * 3.7) * 0.06) * 1024);
        // Jagged joint line
        ctx.fillStyle = '#080503';
        ctx.fillRect(x, jy - 2, plankWidth, 4);

        bCtx.fillStyle = '#050505';
        bCtx.fillRect(x, jy - 2, plankWidth, 4);

        // Chipped joint edges
        ctx.fillStyle = 'rgba(125, 100, 75, 0.5)';
        ctx.fillRect(x + 2, jy - 4, 12, 2);
        ctx.fillRect(x + plankWidth - 16, jy + 2, 14, 2);

        // Rusted square nail dents
        ctx.fillStyle = '#020101';
        ctx.fillRect(x + 16, jy - 10, 5, 5);
        ctx.fillRect(x + plankWidth - 22, jy - 10, 5, 5);

        // Rust halos around nails
        ctx.fillStyle = 'rgba(110, 50, 20, 0.35)';
        ctx.fillRect(x + 13, jy - 13, 11, 11);
        ctx.fillRect(x + plankWidth - 25, jy - 13, 11, 11);

        bCtx.fillStyle = '#000000';
        bCtx.fillRect(x + 16, jy - 10, 5, 5);
        bCtx.fillRect(x + plankWidth - 22, jy - 10, 5, 5);
      });

      // Plank bevel groove (chipped and weathered)
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(x, 0, 3, 1024);
      ctx.fillStyle = 'rgba(110, 90, 70, 0.25)';
      ctx.fillRect(x + 3, 0, 1.5, 1024);

      bCtx.fillStyle = '#0a0a0a';
      bCtx.fillRect(x, 0, 3, 1024);
      bCtx.fillStyle = '#b5b5b5';
      bCtx.fillRect(x + 3, 0, 1.5, 1024);
    }

    // 2. Deep Longitudinal Splits & Cracks (나무 결을 따라 길게 갈라진 균열들)
    for (let c = 0; c < 18; c++) {
      const cx = 30 + Math.random() * 960;
      const cy = Math.random() * 700;
      const ch = 120 + Math.random() * 320;

      let curX = cx;
      ctx.beginPath();
      ctx.moveTo(curX, cy);
      bCtx.beginPath();
      bCtx.moveTo(curX, cy);

      for (let s = 0; s < ch; s += 15) {
        curX += (Math.random() - 0.5) * 4;
        ctx.lineTo(curX, cy + s);
        bCtx.lineTo(curX, cy + s);
      }

      // Dark deep fissure void
      ctx.strokeStyle = '#050302';
      ctx.lineWidth = 2.5 + Math.random() * 2.5;
      ctx.stroke();

      // Splintered wood fiber highlight along the crack edge
      ctx.strokeStyle = 'rgba(165, 138, 105, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bump indentation
      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 4;
      bCtx.stroke();

      rCtx.strokeStyle = '#ffffff';
      rCtx.lineWidth = 4;
      rCtx.stroke();
    }

    // 3. Broken & Missing Plank Sections (부서져 떨어져 나간 널빤지 결손 부위와 노출된 바닥 틈)
    const brokenGaps = [
      { x: 135, y: 320, w: 110, h: 95 },
      { x: 520, y: 160, w: 120, h: 140 },
      { x: 770, y: 580, w: 115, h: 120 },
      { x: 390, y: 720, w: 118, h: 105 }
    ];

    brokenGaps.forEach(bg => {
      // Dark underfloor void cavity (부서져 뚫린 어두운 바닥 틈새)
      ctx.fillStyle = '#050302';
      ctx.fillRect(bg.x, bg.y, bg.w, bg.h);

      bCtx.fillStyle = '#000000';
      bCtx.fillRect(bg.x, bg.y, bg.w, bg.h);

      rCtx.fillStyle = '#e8e8e8';
      rCtx.fillRect(bg.x, bg.y, bg.w, bg.h);

      // Exposed structural cross-joist beam visible in gap (바닥 받침목/장선)
      ctx.fillStyle = '#22160d';
      ctx.fillRect(bg.x + 8, bg.y + bg.h * 0.35, bg.w - 16, 22);

      // Jagged splintered teeth at the fractured break boundary (쪼개진 거친 파면)
      ctx.fillStyle = '#7a6248';
      for (let tx = bg.x; tx < bg.x + bg.w; tx += 6) {
        const toothH = 4 + Math.random() * 12;
        ctx.beginPath();
        ctx.moveTo(tx, bg.y);
        ctx.lineTo(tx + 3, bg.y + toothH);
        ctx.lineTo(tx + 6, bg.y);
        ctx.fill();

        const btmToothH = 4 + Math.random() * 12;
        ctx.beginPath();
        ctx.moveTo(tx, bg.y + bg.h);
        ctx.lineTo(tx + 3, bg.y + bg.h - btmToothH);
        ctx.lineTo(tx + 6, bg.y + bg.h);
        ctx.fill();
      }
    });

    // 4. Loose Wood Splinters & Chipped Fibers (떨어져 나온 나무 파편과 긁힘)
    for (let sp = 0; sp < 60; sp++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      const sw = 6 + Math.random() * 22;
      const sh = 1.5 + Math.random() * 3;

      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(145, 115, 85, 0.7)' : 'rgba(25, 16, 10, 0.8)';
      ctx.fillRect(sx, sy, sw, sh);

      bCtx.fillStyle = '#b0b0b0';
      bCtx.fillRect(sx, sy, sw, sh);
    }

    const diffuse = new THREE.CanvasTexture(canvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(4, 5); // Balanced tiling for long natural planks

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(4, 5);

    const roughness = new THREE.CanvasTexture(roughnessCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;
    roughness.repeat.set(4, 5);

    return { diffuse, bump, roughness };
  }

  // 2. Towering Lead Movable Type Cases (문선대 활자장 그리드)
  createTypeCaseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark aged wood background
    ctx.fillStyle = '#241a12';
    ctx.fillRect(0, 0, 1024, 1024);

    const cols = 28;
    const rows = 36;
    const cellW = 1024 / cols;
    const cellH = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;

        // Wooden divider borders
        ctx.fillStyle = '#140d07';
        ctx.fillRect(x, y, cellW, cellH);

        // Compartment inner shadow
        ctx.fillStyle = '#0b0704';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Lead type metal blocks (납 활자) inside compartment
        // Random metallic lead brightness (lead is gray/silver with dark ink stains)
        const leadTone = 70 + Math.floor(Math.random() * 60);
        const hasInk = Math.random() > 0.4;
        const finalTone = hasInk ? Math.floor(leadTone * 0.4) : leadTone;

        ctx.fillStyle = `rgb(${finalTone + 10}, ${finalTone + 8}, ${finalTone + 14})`;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Relief face of lead character (한자 활자 부조 느낌)
        ctx.fillStyle = hasInk ? '#080808' : '#c0c4cc';
        ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);

        // Highlight glint on metallic top-left edge
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + 2, y + 2, cellW - 4, 1);
        ctx.fillRect(x + 2, y + 2, 1, cellH - 4);
      }

      // Occasional yellowed paper shelf label strip
      if (r % 6 === 0) {
        ctx.fillStyle = '#d4be8d';
        ctx.fillRect(10, r * cellH + 1, 1004, 3);
        ctx.fillStyle = '#5c4623';
        for (let t = 20; t < 1000; t += 35) {
          ctx.fillRect(t, r * cellH + 2, 6, 1);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 3. Walls: Upper Aged Yellowed Plaster with Inky Handprints & Notices + Lower Scuffed Wood Paneling
  createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const rCanvas = document.createElement('canvas');
    rCanvas.width = 1024;
    rCanvas.height = 1024;
    const rCtx = rCanvas.getContext('2d');

    const bCanvas = document.createElement('canvas');
    bCanvas.width = 1024;
    bCanvas.height = 1024;
    const bCtx = bCanvas.getContext('2d');

    // Upper 60%: Warm, aged, yellowish-sepia plaster with heavy discoloration
    ctx.fillStyle = '#6e5f4c';
    ctx.fillRect(0, 0, 1024, 600);

    rCtx.fillStyle = '#d0d0d0'; // Plaster is matte
    rCtx.fillRect(0, 0, 1024, 600);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 1024, 1024);

    // Mottled plaster grime noise
    for (let i = 0; i < 9000; i++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 600;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40, 32, 22, 0.16)' : 'rgba(110, 95, 78, 0.12)';
      ctx.fillRect(px, py, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }

    // Top ceiling dark soot & grease accumulation creeping down
    const topSoot = ctx.createLinearGradient(0, 0, 0, 180);
    topSoot.addColorStop(0, 'rgba(15, 10, 6, 0.85)');
    topSoot.addColorStop(0.5, 'rgba(25, 18, 12, 0.5)');
    topSoot.addColorStop(1, 'rgba(40, 30, 20, 0)');
    ctx.fillStyle = topSoot;
    ctx.fillRect(0, 0, 1024, 180);

    // Water & dampness drip streaks
    for (let s = 0; s < 30; s++) {
      const sx = Math.random() * 1024;
      const sh = 120 + Math.random() * 420;
      const grad = ctx.createLinearGradient(sx, 0, sx, sh);
      grad.addColorStop(0, 'rgba(20, 14, 8, 0.55)');
      grad.addColorStop(0.7, 'rgba(28, 20, 12, 0.3)');
      grad.addColorStop(1, 'rgba(35, 25, 15, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, 0, 6 + Math.random() * 14, sh);
    }

    // Inky Handprints and Palm Smears (작업자들의 검은 먹물 묻은 손자국 / 손때)
    const handSpots = [
      { x: 180, y: 340, scale: 1 },
      { x: 520, y: 380, scale: 0.9 },
      { x: 820, y: 320, scale: 1.1 },
      { x: 380, y: 440, scale: 0.8 }
    ];

    handSpots.forEach(h => {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.scale(h.scale, h.scale);

      // Palm heel smear
      const pGrad = ctx.createRadialGradient(0, 15, 0, 0, 15, 24);
      pGrad.addColorStop(0, 'rgba(8, 6, 4, 0.85)');
      pGrad.addColorStop(0.7, 'rgba(18, 12, 8, 0.5)');
      pGrad.addColorStop(1, 'rgba(30, 20, 12, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(0, 15, 22, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Five finger drag marks
      const fingers = [
        { x: -16, y: -18, w: 7, h: 26, r: -0.2 },
        { x: -7, y: -26, w: 7, h: 32, r: -0.05 },
        { x: 4, y: -28, w: 7, h: 34, r: 0.08 },
        { x: 14, y: -22, w: 6, h: 28, r: 0.2 },
        { x: 22, y: -2, w: 7, h: 20, r: 0.45 } // Thumb
      ];

      fingers.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.r);
        ctx.fillStyle = 'rgba(8, 5, 4, 0.8)';
        ctx.beginPath();
        ctx.ellipse(0, 0, f.w, f.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Handprint is slightly greasy
      rCtx.fillStyle = '#303030';
      rCtx.beginPath();
      rCtx.arc(h.x, h.y, 40, 0, Math.PI * 2);
      rCtx.fill();

      ctx.restore();
    });

    // Pinned Notices, Vintage Slips & Clippings (벽에 압정으로 꽂힌 생활감 있는 메모/전단)
    // Notice 1: Official Regulation Slip
    ctx.fillStyle = 'rgba(10, 8, 5, 0.4)';
    ctx.fillRect(312, 212, 110, 150); // Drop shadow
    ctx.fillStyle = '#d5c49d';
    ctx.fillRect(310, 210, 110, 150);
    // Aged paper border
    ctx.strokeStyle = '#5a4224';
    ctx.lineWidth = 1;
    ctx.strokeRect(314, 214, 102, 142);
    ctx.fillStyle = '#1c140d';
    ctx.font = 'bold 12px serif';
    ctx.fillText('【 作業 規程 】', 324, 235);
    ctx.fillStyle = '#3a2a1a';
    for (let l = 0; l < 6; l++) {
      ctx.fillRect(322, 250 + l * 12, 86, 2);
    }
    // Red official inspection stamp [檢]
    ctx.strokeStyle = '#a6241e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(375, 315, 26, 26);
    ctx.fillStyle = '#a6241e';
    ctx.font = 'bold 12px serif';
    ctx.fillText('檢', 382, 333);
    // Brass tack pin
    ctx.fillStyle = '#9e793b';
    ctx.beginPath();
    ctx.arc(365, 215, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Notice 2: Yellowed Handwritten Memo
    ctx.fillStyle = 'rgba(10, 8, 5, 0.35)';
    ctx.fillRect(682, 242, 85, 110);
    ctx.fillStyle = '#e4d3a8';
    ctx.fillRect(680, 240, 85, 110);
    ctx.fillStyle = '#4a1510';
    ctx.font = 'bold 11px serif';
    ctx.fillText('10/24 植字 完了', 690, 265);
    ctx.fillStyle = '#342315';
    ctx.fillRect(690, 280, 65, 2);
    ctx.fillRect(690, 295, 55, 2);
    ctx.fillRect(690, 310, 60, 2);
    // Tape strip at top
    ctx.fillStyle = 'rgba(215, 195, 145, 0.7)';
    ctx.fillRect(705, 236, 35, 10);

    // Middle molding rail (몰딩 분기선)
    ctx.fillStyle = '#22140a';
    ctx.fillRect(0, 590, 1024, 24);
    ctx.fillStyle = '#3d2514';
    ctx.fillRect(0, 592, 1024, 4);
    ctx.fillStyle = '#0f0804';
    ctx.fillRect(0, 612, 1024, 4);

    bCtx.fillStyle = '#101010';
    bCtx.fillRect(0, 590, 1024, 2);
    bCtx.fillRect(0, 612, 1024, 2);

    // Lower 40%: Dark polished wood wainscot paneling with boot kick scuffs
    ctx.fillStyle = '#28170d';
    ctx.fillRect(0, 614, 1024, 410);

    rCtx.fillStyle = '#7a6048';
    rCtx.fillRect(0, 614, 1024, 410);

    // Vertical panel dividers
    const panels = 8;
    const pW = 1024 / panels;
    for (let p = 0; p < panels; p++) {
      const px = p * pW;
      ctx.fillStyle = '#100804';
      ctx.fillRect(px, 614, 4, 410);

      // Inner recessed panel frame
      ctx.fillStyle = '#1b0f08';
      ctx.fillRect(px + 8, 624, pW - 16, 380);
      ctx.fillStyle = '#2d1b10';
      ctx.fillRect(px + 10, 626, pW - 20, 376);

      bCtx.fillStyle = '#202020';
      bCtx.fillRect(px, 614, 4, 410);
    }

    // Work boot kick scuffs along the bottom (발에 차여 긁힌 자국)
    for (let k = 0; k < 40; k++) {
      const kx = Math.random() * 1024;
      const ky = 920 + Math.random() * 95;
      ctx.fillStyle = 'rgba(110, 75, 45, 0.45)'; // Scuffed wood revealing lighter grain
      ctx.fillRect(kx, ky, 15 + Math.random() * 45, 2 + Math.random() * 3);
    }

    // Ink splatters along lower wainscot
    for (let is = 0; is < 25; is++) {
      const ix = Math.random() * 1024;
      const iy = 650 + Math.random() * 350;
      ctx.fillStyle = 'rgba(6, 4, 3, 0.85)';
      ctx.beginPath();
      ctx.arc(ix, iy, 2 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const diffuse = new THREE.CanvasTexture(canvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(4, 1);

    const bump = new THREE.CanvasTexture(bCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(4, 1);

    const roughness = new THREE.CanvasTexture(rCanvas);
    roughness.wrapS = THREE.RepeatWrapping;
    roughness.wrapT = THREE.RepeatWrapping;
    roughness.repeat.set(4, 1);

    return { diffuse, bump, roughness };
  }

  // 4. Vintage 1930s Octagonal Pendulum Clock Face (1930년대 괘종시계 판)
  createClockFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Aged yellowed ivory parchment dial
    const center = 256;
    const radius = 230;

    ctx.fillStyle = '#1c120a';
    ctx.fillRect(0, 0, 512, 512);

    // Brass bezel
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#6a4e23';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, radius - 12, 0, Math.PI * 2);
    ctx.fillStyle = '#9e793b';
    ctx.fill();

    // Clock face
    ctx.beginPath();
    ctx.arc(center, center, radius - 18, 0, Math.PI * 2);
    ctx.fillStyle = '#ded1b4';
    ctx.fill();

    // Outer minute track ring
    ctx.strokeStyle = '#2b2116';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, radius - 30, 0, Math.PI * 2);
    ctx.arc(center, center, radius - 55, 0, Math.PI * 2);
    ctx.stroke();

    // Minute tick marks
    for (let m = 0; m < 60; m++) {
      const angle = (m / 60) * Math.PI * 2 - Math.PI / 2;
      const isFive = m % 5 === 0;
      const inner = radius - (isFive ? 55 : 42);
      const outer = radius - 30;
      ctx.beginPath();
      ctx.moveTo(center + Math.cos(angle) * inner, center + Math.sin(angle) * inner);
      ctx.lineTo(center + Math.cos(angle) * outer, center + Math.sin(angle) * outer);
      ctx.lineWidth = isFive ? 3 : 1;
      ctx.strokeStyle = '#2b2116';
      ctx.stroke();
    }

    // Roman Numerals
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.fillStyle = '#18120b';
    ctx.font = 'bold 36px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const rPos = radius - 85;
      const nx = center + Math.cos(angle) * rPos;
      const ny = center + Math.sin(angle) * rPos;
      ctx.fillText(numerals[i], nx, ny);
    }

    // Brand / Manufacturer text: "京城 精工 (Gyeongseong Seiko)"
    ctx.font = '14px serif';
    ctx.fillText('京城 時計製作所', center, center + 45);
    ctx.font = '11px sans-serif';
    ctx.fillText('REGULATOR 8-DAY', center, center + 65);

    // Center pivot
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1a140d';
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 5. 1934 Vintage Newspaper Printing Calendar Poster (1934년 달력)
  createCalendarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    // Aged yellowed paper with distressed edges
    ctx.fillStyle = '#c7b286';
    ctx.fillRect(0, 0, 600, 900);

    // Paper stains and grime
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120,90,50,0.06)' : 'rgba(40,25,10,0.05)';
      ctx.fillRect(Math.random() * 600, Math.random() * 900, 4, 4);
    }

    // Top wooden hanging strip
    ctx.fillStyle = '#3a2514';
    ctx.fillRect(0, 0, 600, 36);

    // Bold Vintage Header: "1934" / "昭和九年 歲次甲戌"
    ctx.fillStyle = '#b82a24'; // Red vintage print
    ctx.font = 'bold 90px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('1934', 300, 130);

    ctx.fillStyle = '#1c140d';
    ctx.font = 'bold 24px serif';
    ctx.fillText('大日本帝國 朝鮮總督府 認可', 300, 175);
    ctx.font = 'bold 28px serif';
    ctx.fillText('十 月 (OCTOBER)', 300, 220);

    // Calendar Grid
    const startX = 40;
    const startY = 260;
    const cellW = 74;
    const cellH = 80;

    const days = ['日', '月', '火', '水', '木', '金', '土'];
    for (let d = 0; d < 7; d++) {
      ctx.fillStyle = d === 0 ? '#b82a24' : '#1c140d';
      ctx.font = 'bold 22px serif';
      ctx.fillText(days[d], startX + d * cellW + cellW / 2, startY);
    }

    // Grid lines
    ctx.strokeStyle = '#5a4328';
    ctx.lineWidth = 1.5;
    for (let r = 0; r <= 6; r++) {
      ctx.beginPath();
      ctx.moveTo(startX, startY + 20 + r * cellH);
      ctx.lineTo(startX + 7 * cellW, startY + 20 + r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= 7; c++) {
      ctx.beginPath();
      ctx.moveTo(startX + c * cellW, startY + 20);
      ctx.lineTo(startX + c * cellW, startY + 20 + 5 * cellH);
      ctx.stroke();
    }

    // Date Numbers 1 to 31
    let date = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (date > 31) break;
        const cx = startX + col * cellW + cellW / 2;
        const cy = startY + 50 + row * cellH;

        ctx.fillStyle = col === 0 ? '#a6241e' : '#1c140d';
        ctx.font = 'bold 28px "Times New Roman", serif';
        ctx.fillText(date.toString(), cx, cy);

        // Date 24: Circle with ominous dried dark red blood/ink
        if (date === 24) {
          ctx.strokeStyle = 'rgba(140, 15, 15, 0.85)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy - 8, 26, 0, Math.PI * 2);
          ctx.stroke();

          // Blood drip
          ctx.fillStyle = 'rgba(140, 15, 15, 0.85)';
          ctx.beginPath();
          ctx.arc(cx, cy + 20, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        date++;
      }
    }

    // Bottom notes in traditional typography
    ctx.fillStyle = '#42301c';
    ctx.font = '16px serif';
    ctx.fillText('京城 日報 印刷局 印行 · 第 九四號', 300, 750);
    ctx.font = 'italic 15px serif';
    ctx.fillText('“밤 열두 시, 활자가 스스로 움직이는 밤...”', 300, 800);

    return new THREE.CanvasTexture(canvas);
  }

  // 6. Stained Canvas Apron Texture (먹물과 혈흔이 밴 앞치마)
  createApronTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Heavy unbleached beige canvas fabric
    ctx.fillStyle = '#b3a182';
    ctx.fillRect(0, 0, 512, 1024);

    // Canvas fabric weave noise
    for (let i = 0; i < 15000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70,55,35,0.06)' : 'rgba(230,220,195,0.06)';
      ctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
    }

    // Pockets stitching
    ctx.strokeStyle = '#6e5637';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 480, 140, 180);
    ctx.strokeRect(272, 480, 140, 180);

    // Printing ink stains across lower and middle apron
    for (let s = 0; s < 18; s++) {
      const ix = 150 + Math.random() * 220;
      const iy = 420 + Math.random() * 400;
      const ir = 30 + Math.random() * 70;
      const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir);
      grad.addColorStop(0, 'rgba(10, 8, 8, 0.9)');
      grad.addColorStop(0.6, 'rgba(25, 20, 20, 0.6)');
      grad.addColorStop(1, 'rgba(35, 30, 25, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ix, iy, ir, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ominous dark crimson dried blood smear (섬뜩한 붉은 얼룩)
    const bg = ctx.createRadialGradient(240, 680, 0, 240, 680, 95);
    bg.addColorStop(0, 'rgba(95, 12, 12, 0.85)');
    bg.addColorStop(0.5, 'rgba(125, 20, 20, 0.5)');
    bg.addColorStop(1, 'rgba(130, 25, 25, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(240, 680, 95, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 7. Desk Galley Proof Newspaper Sheets (신문 교정지)
  createNewspaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    // Yellowed newsprint
    ctx.fillStyle = '#dcd2bd';
    ctx.fillRect(0, 0, 512, 720);

    // Old Newspaper Masthead: "京城 日報" (Gyeongseong Ilbo)
    ctx.fillStyle = '#1c1510';
    ctx.font = 'bold 44px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('京 城 新 聞', 256, 65);

    ctx.font = '12px serif';
    ctx.fillText('昭和 9年 10月 24日 號外 (1934년 10월 24일 호외)', 256, 90);

    // Double rule
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 105);
    ctx.lineTo(482, 105);
    ctx.moveTo(30, 110);
    ctx.lineTo(482, 110);
    ctx.stroke();

    // Chilling Headline: "深夜 印刷所서 植字工 謎의 蒸發"
    ctx.font = 'bold 22px serif';
    ctx.fillText('『활판실 식자공 의문의 실종 사건』', 256, 145);

    // Newspaper columns with lead type typesetting look
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2b2118';
    for (let col = 0; col < 3; col++) {
      const cx = 35 + col * 150;
      for (let line = 0; line < 32; line++) {
        const ly = 180 + line * 15;
        const lineLen = 120 + Math.random() * 20;
        ctx.fillRect(cx, ly, lineLen, 3);
      }
    }

    // Heavy greasy black thumbprint in corner
    const grad = ctx.createRadialGradient(420, 640, 0, 420, 640, 35);
    grad.addColorStop(0, 'rgba(10, 8, 8, 0.7)');
    grad.addColorStop(1, 'rgba(20, 15, 12, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(420, 640, 35, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 8. Dark Heavy Wooden Planks for Desks, Beams & Doors
  createWoodPlankTexture(colorHex = '#2c1e14') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 200; i++) {
      const y = Math.random() * 512;
      const h = 40 + Math.random() * 150;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15,8,4,0.1)' : 'rgba(55,40,25,0.08)';
      ctx.fillRect(0, y, 512, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // 9. Sharp, High-Contrast Cursed Eye Texture for Cursed Cube
  createSharpEyeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark iron base
    ctx.fillStyle = '#1c1511';
    ctx.fillRect(0, 0, 512, 512);

    // Iron border rim
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 16;
    ctx.strokeRect(16, 16, 480, 480);

    // Large high-contrast human eye
    // Sclera (White of the eye with eerie yellowish aged tint)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(256, 256, 210, 140, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ebdcc7';
    ctx.fill();
    ctx.strokeStyle = '#8a2318';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Blood vessels
    ctx.strokeStyle = 'rgba(180, 30, 20, 0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      const angle = (i / 16) * Math.PI * 2;
      const startX = 256 + Math.cos(angle) * 190;
      const startY = 256 + Math.sin(angle) * 125;
      const endX = 256 + Math.cos(angle) * 90;
      const endY = 256 + Math.sin(angle) * 60;
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) / 2 + (Math.random() * 20 - 10),
        (startY + endY) / 2 + (Math.random() * 20 - 10),
        endX, endY
      );
      ctx.stroke();
    }

    // Iris (Deep reddish amber)
    const irisGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 85);
    irisGrad.addColorStop(0, '#55110d');
    irisGrad.addColorStop(0.6, '#942b1e');
    irisGrad.addColorStop(1, '#2e0a07');
    ctx.beginPath();
    ctx.arc(256, 256, 85, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();
    ctx.strokeStyle = '#1a0402';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pupil (Pitch black)
    ctx.beginPath();
    ctx.arc(256, 256, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#060302';
    ctx.fill();

    // Eye highlight gleam
    ctx.beginPath();
    ctx.arc(278, 236, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }
}
