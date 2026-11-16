import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// True volumetric meshes: tapered torso, rounded sleeves, lapels and pockets.
// Each limb has an independent transform driven by MediaPipe skeleton landmarks.
const outfits={
 escritor:{fabric:0x987752,shirt:0xf3debe,detail:0x65462b,trim:0xc6a579},
 advogado:{fabric:0x252a37,shirt:0xffffff,detail:0x6f2638,trim:0xa79570},
 medico:{fabric:0xe8f4fa,shirt:0xb3dfe8,detail:0x1488ae,trim:0x79b4d0},
 empresario:{fabric:0x25456f,shirt:0xffffff,detail:0xc99b36,trim:0x527ab2}
};
const scene=new THREE.Scene();
const cam=new THREE.OrthographicCamera(-360,360,640,-640,1,3000);
cam.position.set(0,0,1400);cam.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:"low-power"});
renderer.setSize(720,1280,false);renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0x000000,0);
scene.add(new THREE.HemisphereLight(0xe5f4ff,0x445068,2.15));
const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-400,560,850);scene.add(key);
const rim=new THREE.DirectionalLight(0xd2e8ff,1.2);rim.position.set(350,-250,400);scene.add(rim);
const root=new THREE.Group();scene.add(root);
const fabric=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.84,metalness:0,side:THREE.DoubleSide});
const shirt=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,side:THREE.DoubleSide});
const trim=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.65,side:THREE.DoubleSide});
const detail=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,side:THREE.DoubleSide});
const buttonsMat=new THREE.MeshStandardMaterial({color:0xd0ad77,roughness:.36,metalness:.25});
function mesh(geom,material){const m=new THREE.Mesh(geom,material);root.add(m);return m}
// A real tapered mesh, rather than a flat rectangle. Radius is along X/Z.
const torso=mesh(new THREE.CylinderGeometry(0.65,0.53,1,14,1,false),fabric);
const central=mesh(new THREE.CylinderGeometry(.30,.25,1,14,1,false),shirt);
const leftLap=mesh(new THREE.BoxGeometry(1,1,1),trim);
const rightLap=mesh(new THREE.BoxGeometry(1,1,1),trim);
const neckTie=mesh(new THREE.ConeGeometry(1,1,4),detail);
const arms=[mesh(new THREE.CylinderGeometry(1,1,1,12),fabric),mesh(new THREE.CylinderGeometry(1,1,1,12),fabric),mesh(new THREE.CylinderGeometry(1,1,1,12),fabric),mesh(new THREE.CylinderGeometry(1,1,1,12),fabric)];
const cuffs=[mesh(new THREE.CylinderGeometry(1,1,1,12),shirt),mesh(new THREE.CylinderGeometry(1,1,1,12),shirt)];
const pockets=[mesh(new THREE.BoxGeometry(1,1,1),trim),mesh(new THREE.BoxGeometry(1,1,1),trim)];
const buttons=Array.from({length:4},()=>mesh(new THREE.SphereGeometry(1,10,8),buttonsMat));
const stethoscope=mesh(new THREE.TorusGeometry(1,.09,6,28),detail);
const up=new THREE.Vector3(0,1,0);
const midpoint=(a,b)=>new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
function segment(m,a,b,radiusA,radiusB,z=0){
  const start=a.clone();const end=b.clone();start.z=z;end.z=z;
  const delta=end.clone().sub(start);
  m.position.copy(start.add(end).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(up,delta.clone().normalize());
  m.scale.set(radiusA,delta.length(),radiusB);
  m.visible=true;
}
function at(p,sourceW,sourceH,scale,ox,oy,front){
  const rawX=p.x*sourceW*scale-ox,rawY=p.y*sourceH*scale-oy;
  return new THREE.Vector3((front?720-rawX:rawX)-360,640-rawY,0);
}
function render(job,p,sourceW,sourceH,scale,ox,oy,front){
  if(!outfits[job] || !p)return null;
  const ids=[11,12,13,14,15,16,23,24];
  if(ids.some(i=>!p[i]||p[i].visibility<.4))return null;
  const j=i=>at(p[i],sourceW,sourceH,scale,ox,oy,front);
  const [ls,rs,le,re,lw,rw,lh,rh]=ids.map(j);
  const shoulderWidth=ls.distanceTo(rs);
  const top=midpoint(ls,rs),bottom=midpoint(lh,rh),torsoLength=top.distanceTo(bottom);
  if(shoulderWidth<25||torsoLength<30)return null;
  const c=outfits[job];
  fabric.color.setHex(c.fabric);shirt.color.setHex(c.shirt);trim.color.setHex(c.trim);detail.color.setHex(c.detail);
  // Torso is an elliptical cylinder with visible side depth and surface shading.
  const angle=Math.atan2(bottom.y-top.y,bottom.x-top.x)-Math.PI/2;
  torso.position.copy(midpoint(top,bottom));torso.position.z=0;
  torso.rotation.set(0,0,angle);
  torso.scale.set(shoulderWidth*.86,torsoLength*1.05,shoulderWidth*.27);
  central.position.copy(midpoint(top,bottom));central.position.z=shoulderWidth*.17;
  central.rotation.z=angle;
  central.scale.set(shoulderWidth*.27,torsoLength*.95,shoulderWidth*.055);
  for(const [index,a,b,r] of [[0,ls,le,.15],[1,le,lw,.126],[2,rs,re,.15],[3,re,rw,.126]]){
    const radius=shoulderWidth*r;
    segment(arms[index],a,b,radius,radius*.8,shoulderWidth*.045);
  }
  for(const [k,a,b] of [[0,le,lw],[1,re,rw]]){
    segment(cuffs[k],b.clone().lerp(a,.12),b,shoulderWidth*.13,shoulderWidth*.11,shoulderWidth*.06);
  }
  // Raised lapels, necktie and buttons sit in front of the jacket.
  for(const [m,side] of [[leftLap,-1],[rightLap,1]]){
    m.visible=true;m.position.set(top.x+side*shoulderWidth*.21,top.y-torsoLength*.19,shoulderWidth*.26);
    m.scale.set(shoulderWidth*.27,torsoLength*.37,shoulderWidth*.07);
    m.rotation.z=side*.26+angle;
  }
  neckTie.position.set(top.x,top.y-torsoLength*.37,shoulderWidth*.33);
  neckTie.rotation.set(Math.PI,0,0);
  neckTie.scale.set(shoulderWidth*.10,torsoLength*.46,shoulderWidth*.07);
  for(let i=0;i<buttons.length;i++){
    const m=buttons[i];
    m.position.set(top.x+shoulderWidth*.16,top.y-torsoLength*(.37+i*.15),shoulderWidth*.36);
    m.scale.setScalar(shoulderWidth*.024);
  }
  for(const [i,side] of [-1,1].entries()){
    const m=pockets[i];m.position.set(top.x+side*shoulderWidth*.22,top.y-torsoLength*.70,shoulderWidth*.29);
    m.scale.set(shoulderWidth*.23,torsoLength*.15,shoulderWidth*.07);
    m.rotation.z=angle;
    m.visible=job==="medico";
  }
  stethoscope.visible=job==="medico";
  if(stethoscope.visible){
    stethoscope.position.set(top.x+shoulderWidth*.19,top.y-torsoLength*.42,shoulderWidth*.34);
    stethoscope.scale.set(shoulderWidth*.14,torsoLength*.20,1);
  }
  renderer.render(scene,cam);
  return renderer.domElement;
}
window.outfit3D={render,version:"1.6",mode:"volumetric"};
window.dispatchEvent(new Event("outfit3d-ready"));
