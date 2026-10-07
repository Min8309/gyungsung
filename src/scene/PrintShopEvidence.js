import * as THREE from 'three';

export const EVIDENCE = {
  worklog: { name: '바닥에 떨어진 식자공 작업일지', text: '10월 24일 밤. 교정용 안경은 오른쪽 벽의 앞치마에 걸어 두었다. 안경을 챙겨 책상 위 교정지를 다시 읽을 것. 책상 뒤쪽을 돌아가면 앞치마에 닿을 수 있다.\n\n마지막 기록: 동료들은 지하 윤전기실로 불려간 뒤 돌아오지 않았다. 문 너머에서 종이 대신 쇠붙이 긁히는 소리가 난다.' },
  procedure: { name: '벽보 — 야간 작업 수칙', text: '一. 교정지의 붉은 표시를 확인할 것.\n二. 눈동자 활자는 눈이 위를 향하도록 돌려 작업대의 네모 홈에 끼울 것.\n三. 제목에 밑줄 친 세 글자는 노란 표찰의 활자장에서 찾아 조판할 것.\n四. 철문 열쇠는 조판이 끝나면 비밀 선반에서 꺼낼 것.\n\n달력의 날짜는 서랍 번호, 멈춘 시각은 네 자리 암호이니 혼동하지 말 것.' },
  maintenance: { name: '벽보 — 윤전기실 정비 기록', text: '철문 열쇠 구멍에 잉크가 굳었다. 앞치마 주머니의 세척액을 가져와 철문에서 문질러 닦은 뒤 열쇠를 넣을 것. 세척액만으로 문은 열리지 않는다.\n\n벽시계의 바늘은 사건 시각에 멎어 있다. 시계 아래와 화면 오른쪽의 숫자는 남은 탐색 시간이므로 암호로 쓰지 말 것.\n\n시계추를 공명시키면 전원을 켤 수 있으나, 24번 서랍을 연 것으로 기록하지 말 것.' }
};
export class PrintShopEvidence {
  constructor(scene) {
    this.interactables = [];
    const make = (id,x,y,z,rotation) => {
      const entry=EVIDENCE[id];
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#9a8e70';ctx.fillRect(0,0,512,640);
      ctx.strokeStyle='#493d2b';ctx.strokeRect(24,24,464,592);ctx.fillStyle='#2d241a';
      ctx.font='bold 27px serif';ctx.fillText(id==='worklog'?'植字工 作業日誌':'活版室 告示',42,75);
      ctx.font='22px serif';let line=0;
      for(const paragraph of entry.text.split('\n')) {
        for(let i=0;i<paragraph.length;i+=19) ctx.fillText(paragraph.slice(i,i+19),42,125+line++*32);
        line++;
      }
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.75,0.95,0.035),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(canvas),roughness:1}));
      mesh.position.set(x,y,z);mesh.rotation.set(...rotation);
      mesh.userData={isInteractable:true,type:'evidence',evidenceId:id,clueId:`clue_${id}`,name:entry.name,description:'낡은 종이에 식자공이 남긴 기록이다. 읽은 내용은 수첩에 남는다.'};
      scene.add(mesh);this.interactables.push(mesh);
    };
    make('worklog',-1.5,0.08,2.3,[-Math.PI/2,0,0.25]);
    make('procedure',-4.74,2,0.5,[0,Math.PI/2,0.04]);
    make('maintenance',-1.73,1.65,-13,[0,Math.PI/2,0]);
  }
}
