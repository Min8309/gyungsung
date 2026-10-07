import * as THREE from 'three';

// The press mechanism conceals a cold mechanical operating chamber.
export class SurgicalEnding {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.position.set(0, 0, -21);
    scene.add(this.group);
    const steel = new THREE.MeshStandardMaterial({ color: 0x384645, metalness: 0.8, roughness: 0.55 });
    const concrete = new THREE.MeshStandardMaterial({ color: 0x222c2b, roughness: 1 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x7c8980, roughness: 1 });
    const box = (w,h,d,x,y,z,mat=steel) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
      m.position.set(x,y,z); this.group.add(m); return m;
    };
    const rod = (a,b,r=0.04) => {
      const direction = b.clone().sub(a);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,direction.length(),8),steel);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
      this.group.add(m); return m;
    };
    box(7,0.15,7,0,-0.1,0,concrete);
    box(7,3.8,0.2,0,1.9,-3,concrete);
    for (const x of [-3.4,3.4]) box(0.2,3.8,7,x,1.9,0,concrete);
    box(1.35,0.18,2.3,0,1.05,0);
    box(0.55,0.9,0.65,0,0.5,0);
    box(1.12,0.13,1.9,0,1.2,0,cloth);
    // A shrouded silhouette, without exposed injuries.
    const shroud = new THREE.Mesh(new THREE.CapsuleGeometry(0.24,1.1,5,12),cloth);
    shroud.rotation.x=Math.PI/2; shroud.scale.x=1.5; shroud.position.set(0,1.4,0); this.group.add(shroud);
    this.arms=[];
    for(let i=0;i<4;i++) {
      const side=i%2 ? 1:-1, z=i<2 ? -0.7:0.7;
      const a=new THREE.Vector3(side*2,2.8,z), b=new THREE.Vector3(side*1.2,2.1,z), c=new THREE.Vector3(side*0.6,1.7,z);
      rod(a,b,0.1); const arm=rod(b,c,0.07); this.arms.push(arm);
      for(const joint of [a,b,c]) {
        const m=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),steel);m.position.copy(joint);this.group.add(m);
      }
      rod(c,c.clone().add(new THREE.Vector3(0,-0.3,0)),0.018);
    }
    for(let i=0;i<7;i++) {
      const points=[new THREE.Vector3((i-3)*0.16,1.1,0.5),new THREE.Vector3((i-3)*0.3,0.2,1.5),new THREE.Vector3((i-3)*0.4,0.05,2.8)];
      const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),18,0.023,6,false),steel);this.group.add(tube);
    }
    for(const x of [-1.7,1.7]) {box(0.9,1.3,0.6,x,0.65,-2);rod(new THREE.Vector3(x,0,-1),new THREE.Vector3(x,2.5,-1));}
    box(4,0.12,0.2,0,3.3,0);
    rod(new THREE.Vector3(0,3.3,0),new THREE.Vector3(0,2.85,0));
    const lamp=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.1,20),new THREE.MeshStandardMaterial({color:0xa7cbbb,emissive:0x759e89,emissiveIntensity:1.3}));
    lamp.position.set(0,2.8,0);this.group.add(lamp);
    this.light=new THREE.PointLight(0xa6d9c5,5,7,2);this.light.position.set(0,2.65,0);this.group.add(this.light);
    this.camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,60);
    this.camera.position.set(-1.4,2.15,-18.8);this.camera.lookAt(0,1.7,-21);
  }
  update(time) {
    this.light.intensity=8.6+Math.sin(time*17)*0.35;
    this.arms.forEach((arm,i)=>{arm.rotation.z+=Math.sin(time*2+i)*0.0007;});
    this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
  }
}
