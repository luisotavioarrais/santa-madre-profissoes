import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const JOBS={
 escritor:{coat:0x9f7348,shirt:0xefd6b0,tie:0x5b3725},
 advogado:{coat:0x1e2737,shirt:0xeaedf5,tie:0x846e41},
 medico:{coat:0xeff7fc,shirt:0xaadceb,tie:0x2697b9},
 empresario:{coat:0x2f4671,shirt:0xf5f5fa,tie:0xcd9e2e}
};
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-360,360,640,-640,0.1,2000);
camera.position.set(0,0,950);
camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(720,1280,false);
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000,0);
scene.add(new THREE.HemisphereLight(0xffffff,0x576070,2.1));
const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-200,400,500);scene.add(light);
const group=new THREE.Group();scene.add(group);
const pieces={};
function part(name,color){
  const material=new THREE.MeshStandardMaterial({color,roughness:.74,metalness:.03,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);
  mesh.name=name;group.add(mesh);pieces[name]=mesh;return mesh;
}
for(const name of ['torso','shirt','leftLap','rightLap','tie','upperL','foreL','upperR','foreR','pocketL','pocketR','badge']) part(name,0xffffff);
function vec(p,w,h,s,ox,oy,front){
  const x=p.x*w*s-ox;
  return new THREE.Vector3((front?720-x:x)-360,640-(p.y*h*s-oy),0);
}
function placeBox(mesh,a,b,width,depth,z=0){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  mesh.position.set((a.x+b.x)/2,(a.y+b.y)/2,z);
  mesh.rotation.z=Math.atan2(-dx,dy);
  mesh.scale.set(width,Math.max(length,1),depth);
}
function rect(mesh,x,y,z,width,height,depth,color){
  mesh.visible=true;mesh.material.color.setHex(color);
  mesh.position.set(x,y,z);mesh.scale.set(Math.max(width,1),Math.max(height,1),depth);mesh.rotation.z=0;
}
let active='';
function render(job,pose,vw,vh,scale,ox,oy,front){
  if(!JOBS[job]||!pose)return null;
  const ids=[11,12,13,14,15,16,23,24];
  if(ids.some(id=>!pose[id]||pose[id].visibility<.35))return null;
  let P=id=>vec(pose[id],vw,vh,scale,ox,oy,front);
  let [ls,rs,le,re,lw,rw,lh,rh]=ids.map(P);
  const shoulder=Math.hypot(ls.x-rs.x,ls.y-rs.y);
  const hip=((lh.y+rh.y)/2),neck=((ls.y+rs.y)/2);
  if(shoulder<25||Math.abs(hip-neck)<30)return null;
  const c=JOBS[job];
  const center=(a,b)=>new THREE.Vector3((a.x+b.x)/2,(a.y+b.y)/2,0);
  const shoulderC=center(ls,rs),hipC=center(lh,rh);
  const torsoH=Math.hypot(shoulderC.x-hipC.x,shoulderC.y-hipC.y);
  const torsoW=shoulder*1.12;
  const torso=pieces.torso;torso.material.color.setHex(c.coat);placeBox(torso,shoulderC,hipC,torsoW,shoulder*.18);
  const shirt=pieces.shirt;shirt.material.color.setHex(c.shirt);placeBox(shirt,shoulderC,hipC,torsoW*.30,shoulder*.17,shoulder*.14);
  for(const [prefix,a,b,d] of [['upperL',ls,le,shoulder*.28],['foreL',le,lw,shoulder*.23],['upperR',rs,re,shoulder*.28],['foreR',re,rw,shoulder*.23]]){
    const m=pieces[prefix];m.material.color.setHex(c.coat);m.visible=true;placeBox(m,a,b,d,shoulder*.18,shoulder*.06);
  }
  const x=shoulderC.x,y=shoulderC.y,z=shoulder*.20;
  rect(pieces.leftLap,x-torsoW*.19,y-torsoH*.22,z,torsoW*.24,torsoH*.38,10,c.shirt);
  rect(pieces.rightLap,x+torsoW*.19,y-torsoH*.22,z,torsoW*.24,torsoH*.38,10,c.shirt);
  rect(pieces.tie,x,y-torsoH*.36,z+6,torsoW*.10,torsoH*.47,10,c.tie);
  const doctor=job==='medico';
  pieces.pocketL.visible=doctor;pieces.pocketR.visible=doctor;pieces.badge.visible=doctor;
  if(doctor){
    rect(pieces.pocketL,x-torsoW*.27,y-torsoH*.68,z+9,torsoW*.19,torsoH*.15,8,0xc7e7f6);
    rect(pieces.pocketR,x+torsoW*.27,y-torsoH*.68,z+9,torsoW*.19,torsoH*.15,8,0xc7e7f6);
    rect(pieces.badge,x+torsoW*.28,y-torsoH*.24,z+12,torsoW*.12,torsoW*.12,8,c.tie);
  }
  renderer.render(scene,camera);
  return renderer.domElement;
}
window.outfit3D={render,version:'1.5'};
