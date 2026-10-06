import * as THREE from 'three';
import { seededRandom } from './ConcreteSurfaces.js';

export class BasementAtmosphere {
  constructor(scene) {
    const iron = new THREE.MeshStandardMaterial({ color: 0x26302e, metalness: 0.7, roughness: 0.85 });
    // Exposed service pipes below the ceiling replace the feeling of an upstairs room.
    for (const x of [-4.15, 4.15]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 9.6, 10), iron);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 3.95, 1);
      scene.add(pipe);
      for (const z of [-3.5, -0.5, 2.5, 5.5]) {
        const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.012, 5, 10), iron);
        clamp.position.set(x, 3.95, z);
        scene.add(clamp);
      }
    }
    const cableMat = new THREE.LineBasicMaterial({ color: 0x202b27 });
    for (let i = 0; i < 12; i++) {
      const x = (i - 5.5) * 0.05;
      const length = 0.25 + (i % 5) * 0.15;
      const points = [new THREE.Vector3(x, 4.25, -9.8),
        new THREE.Vector3(x + 0.05, 4.1 - length, -9.75),
        new THREE.Vector3(x - 0.03, 4.05 - length, -9.7)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), cableMat));
    }
    const rubble = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.08, 0),
      new THREE.MeshStandardMaterial({ color: 0x343c38, roughness: 1 }), 60);
    const transform = new THREE.Object3D();
    for (let i = 0; i < 60; i++) {
      transform.position.set((i % 2 ? 1 : -1) * (1.18 + (i % 7) * 0.05), 0.035, -4.5 - (i / 60) * 10.7);
      transform.scale.set(0.6 + (i % 4) * 0.3, 0.45, 0.75);
      transform.rotation.set(i, i * 0.7, i * 0.3);
      transform.updateMatrix();
      rubble.setMatrixAt(i, transform.matrix);
    }
    scene.add(rubble);
    const webs = [
      [new THREE.Vector3(-4.8,4.02,-3.78),new THREE.Vector3(1.45,0,0),new THREE.Vector3(0,-0.95,0.18)],
      [new THREE.Vector3(4.8,4.02,-3.78),new THREE.Vector3(-1.15,0,0),new THREE.Vector3(0,-1.1,0.16)],
      [new THREE.Vector3(-1.68,4.02,-9.85),new THREE.Vector3(1.15,0,0),new THREE.Vector3(0,-0.85,0.12)],
      [new THREE.Vector3(1.68,4.02,-14.6),new THREE.Vector3(-1.25,0,0),new THREE.Vector3(0,-0.7,0.12)],
      [new THREE.Vector3(-4.8,3.45,2.45),new THREE.Vector3(0.12,0,0.95),new THREE.Vector3(0,-0.85,0.1)],
      [new THREE.Vector3(0.08,2.76,0.96),new THREE.Vector3(0.48,0,0),new THREE.Vector3(0,-0.45,0.05)]
    ];
    webs.forEach((args,index)=>this.addCobweb(scene,...args,19341300+index));
  }

  addCobweb(scene, origin, horizontal, vertical, seed) {
    const random=seededRandom(seed), vertices=[];
    const points=[];
    const push=(a,b)=>vertices.push(a.x,a.y,a.z,b.x,b.y,b.z);
    for(let i=0;i<14;i++) {
      const t=(i+random()*0.4)/14;
      const endpoint=origin.clone().addScaledVector(horizontal,1-t).addScaledVector(vertical,t);
      const thread=[];
      for(let j=0;j<8;j++) {
        const fraction=j/7;
        const point=origin.clone().lerp(endpoint,fraction);
        point.y-=Math.sin(fraction*Math.PI)*(0.015+random()*0.04);
        point.z+=random()*0.018;
        thread.push(point);
        if(j&&random()>0.12)push(thread[j-1],point);
      }
      points.push(thread);
    }
    for(let i=1;i<points.length;i++) {
      for(let j=2;j<8;j++) {
        if(random()>0.3)push(points[i-1][j],points[i][j]);
      }
    }
    // Broken silk trails hang down irregularly from the damaged weave.
    for(let i=0;i<9;i++) {
      const start=points[Math.floor(random()*points.length)][3+Math.floor(random()*5)];
      const end=start.clone().add(new THREE.Vector3((random()-0.5)*0.07,-0.06-random()*0.24,0.02));
      push(start,end);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const web=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({
      color:0xa9b5aa,transparent:true,opacity:0.23,depthWrite:false
    }));
    web.name=`torn-dusty-cobweb-${seed}`;
    scene.add(web);
  }

}
