import * as THREE from 'three';

// One deterministic, non-tiling surface per architectural face.
export function seededRandom(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createConcreteMaterial(width, height, seed, kind = 'wall') {
  const random = seededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(128, Math.min(1024, Math.round(width * 90)));
  canvas.height = Math.max(128, Math.min(1024, Math.round(height * 90)));
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  const bumpCanvas = canvas.cloneNode();
  const bumpCtx = bumpCanvas.getContext('2d');
  const roughCanvas = canvas.cloneNode();
  const roughCtx = roughCanvas.getContext('2d');
  ctx.fillStyle = kind === 'floor' ? '#474b44' : '#525c54';
  ctx.fillRect(0, 0, w, h);
  bumpCtx.fillStyle = '#808080'; bumpCtx.fillRect(0, 0, w, h);
  roughCtx.fillStyle = '#eeeeee'; roughCtx.fillRect(0, 0, w, h);

  // Dust accumulates in asymmetrical clouds, not circular stamps or repeated tiles.
  const cloud = (cx, cy, radius, color, opacity) => {
    for (let i = 0; i < 26; i++) {
      const x = cx + (random() - 0.5) * radius * 1.8;
      const y = cy + (random() - 0.5) * radius * 1.4;
      const r = radius * (0.15 + random() * 0.55);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${color},${opacity})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2);
    }
  };
  for (let i = 0; i < 20; i++) {
    cloud(random()*w, random()*h, Math.min(w,h)*(0.08+random()*0.22),
      i % 3 === 0 ? '124,119,100' : '14,26,19', 0.035+random()*0.065);
  }
  // Aggregate pores, embedded grit and irregular dust specks.
  for (let i = 0; i < w*h/9; i++) {
    const x = random()*w, y = random()*h, size = 0.4+random()*1.8;
    const dark = random()>0.35;
    ctx.fillStyle = dark ? 'rgba(15,20,16,0.17)' : 'rgba(150,147,129,0.16)';
    ctx.fillRect(x,y,size,size*random());
    bumpCtx.fillStyle = dark ? '#666666' : '#999999';
    bumpCtx.fillRect(x,y,size,size);
  }
  // Branching hairline cracks with interrupted, uneven edges.
  for (let i=0;i<7;i++) {
    let x=random()*w,y=random()*h;
    ctx.strokeStyle='rgba(12,18,15,0.55)';ctx.lineWidth=0.5+random();
    ctx.beginPath();ctx.moveTo(x,y);
    bumpCtx.strokeStyle='#333333';bumpCtx.lineWidth=1;
    bumpCtx.beginPath();bumpCtx.moveTo(x,y);
    for(let j=0;j<8+random()*10;j++) {
      x+=(random()-0.45)*24;y+=(random()-0.3)*20;
      ctx.lineTo(x,y);bumpCtx.lineTo(x,y);
      if(random()>0.75){ctx.moveTo(x,y);ctx.lineTo(x+random()*22,y-random()*16);ctx.moveTo(x,y);}
    }
    ctx.stroke();bumpCtx.stroke();
  }
  // Runoff stains on vertical faces; dusty, greasy puddle marks on the floor.
  if(kind==='wall') {
    for(let i=0;i<18;i++) {
      const x=random()*w,y=random()*h*0.35,length=h*(0.12+random()*0.55);
      const g=ctx.createLinearGradient(x,y,x,y+length);
      g.addColorStop(0,'rgba(10,24,18,0.25)');g.addColorStop(1,'rgba(10,24,18,0)');
      ctx.fillStyle=g;ctx.fillRect(x,y,1+random()*9,length);
      roughCtx.fillStyle='#999999';roughCtx.fillRect(x,y,1+random()*5,length);
    }
    cloud(random()*w,h*0.96,Math.min(w,h)*0.45,'12,24,17',0.06);
  } else if(kind==='floor') {
    for(let i=0;i<9;i++) {
      const x=random()*w,y=random()*h,r=12+random()*45;
      cloud(x,y,r,'8,13,11',0.1);
      roughCtx.fillStyle='#aaaaaa';roughCtx.beginPath();
      roughCtx.ellipse(x,y,r,r*(0.2+random()*0.4),random()*Math.PI,0,Math.PI*2);roughCtx.fill();
    }
  }
  const texture = source => {
    const map = new THREE.CanvasTexture(source);
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    map.repeat.set(1,1);
    return map;
  };
  const map=texture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map,bumpMap:texture(bumpCanvas),
    roughnessMap:texture(roughCanvas),bumpScale:0.028,roughness:0.96,metalness:0});
  material.name=`aged-concrete-${kind}-${seed}`;
  return material;
}
