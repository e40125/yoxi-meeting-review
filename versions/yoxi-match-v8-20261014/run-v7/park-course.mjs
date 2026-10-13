import * as T from 'three';

// A permanent park-inspired scene. This is a stylized route, not a geographic reconstruction.
export function buildPark({scene,M,mesh,box,ball,cylinder,line,makeTree,lamp,textPanel,chunks}){
 const grass=new T.MeshStandardMaterial({color:0x92b78b,roughness:.95});
 const lawn=new T.MeshStandardMaterial({color:0xa3c394,roughness:.97});
 const sage=new T.MeshStandardMaterial({color:0x397b69,roughness:.76});
 const pink=new T.MeshStandardMaterial({color:0xdc8094,roughness:.6});
 const butter=new T.MeshStandardMaterial({color:0xf3d681,roughness:.62});
 const lilac=new T.MeshStandardMaterial({color:0x9499bc,roughness:.65});
 const earth=new T.MeshStandardMaterial({color:0x6e7655,roughness:.95});
 const water=new T.MeshStandardMaterial({color:0x8fc6c0,roughness:.36,metalness:.05});
 const sky=0xe7efdf;scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,35,92);
 box(scene,lawn,88,.40,350,0,-.42,-145);
 // Soft distant tree line makes the park read as open green space.
 for(let i=0;i<18;i++){const x=i%2?18:-18,z=-8-i*6;ball(scene,i%3?grass:lawn,x,1.6,z,2.4,2.3,3.1);}
 function flowerCluster(p,x,z,color,scale=1){
  const g=new T.Group();g.position.set(x,.13,z);g.scale.setScalar(scale);p.add(g);
  for(let n=0;n<3;n++){const dx=Math.cos(n*2.4)*.15,dz=Math.sin(n*2.4)*.15,h=.30+(n%2)*.12;
   cylinder(g,sage,.014,h,dx,h/2,dz);
   const leaf=ball(g,sage,dx+.07,h*.52,dz,.105,.035,.045);leaf.rotation.z=.42;
   for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const petal=ball(g,color,dx+Math.cos(a)*.065,h+Math.sin(a)*.05,dz+.014,.060,.060,.035);petal.rotation.z=a;}
   ball(g,butter,dx,h,dz+.045,.031,.031,.028);
  }
 }
 function flowerBed(p,x,z,length=4){
  box(p,M.ivory,1.42,.20,length,x,.04,z);box(p,earth,1.22,.16,length-.2,x,.13,z);
  for(let i=0;i<Math.floor(length*2);i++)flowerCluster(p,x+(i%2?-.31:.31),z-length/2+.30+i*.48,[pink,butter,lilac][i%3],.86+(i%2)*.14);
 }
 function parkBench(p,x,z,rot=0){
  const b=new T.Group();p.add(b);b.position.set(x,0,z);b.rotation.y=rot;
  for(const dz of [-.24,0,.24])box(b,M.trunk,1.8,.07,.18,0,.48,dz);
  for(const y of [.78,.98])box(b,M.trunk,1.8,.16,.07,0,y,-.30);
  for(const xx of [-.65,.65]){box(b,M.ink,.08,.51,.56,xx,.25,0);box(b,M.ink,.065,.50,.06,xx,.75,-.3);}
 }
 function pavilion(p,x,z){
  const g=new T.Group();p.add(g);g.position.set(x,0,z);g.rotation.y=.13;
  const platform=mesh(g,new T.CylinderGeometry(2.9,3.1,.24,8),M.ivory,0,.04,0);
  const inner=mesh(g,new T.CylinderGeometry(2.68,2.68,.065,8),M.cream,0,.195,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const xx=Math.cos(a)*2.25,zz=Math.sin(a)*2.25;cylinder(g,M.ivory,.115,2.75,xx,1.57,zz);cylinder(g,sage,.15,.12,xx,.29,zz);}
  // Sculpted shallow roof, bright rim and radial ribs; an evergreen garden landmark.
  const roofGeo=new T.CylinderGeometry(.48,3.12,.82,8,1,false);const roof=mesh(g,roofGeo,sage,0,3.30,0);roof.rotation.y=Math.PI/8;
  const edge=mesh(g,new T.CylinderGeometry(3.16,3.21,.115,8),M.ivory,0,2.88,0);edge.rotation.y=Math.PI/8;
  const crown=mesh(g,new T.CylinderGeometry(.42,.58,.17,8),M.ivory,0,3.76,0);crown.rotation.y=Math.PI/8;
  for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;line(g,M.ivory,[[Math.cos(a)*.47,3.70,Math.sin(a)*.47],[Math.cos(a)*1.8,3.25,Math.sin(a)*1.8],[Math.cos(a)*3.1,2.96,Math.sin(a)*3.1]],.031);}
  cylinder(g,M.trunk,.10,.50,0,.47,0);cylinder(g,M.cream,.75,.10,0,.75,0);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;cylinder(g,M.trunk,.29,.40,Math.cos(a)*1.4,.41,Math.sin(a)*1.4);}
 }
 function arbor(p,x,z){
  const g=new T.Group();g.position.set(x,0,z);p.add(g);g.rotation.y=Math.PI/2;
  for(const xx of [-1.25,1.25])box(g,M.ivory,.13,2.65,.13,xx,1.325,0);
  const a=mesh(g,new T.TorusGeometry(1.25,.075,7,26,Math.PI),M.ivory,0,2.65,0);
  for(let i=0;i<8;i++){const a=i*Math.PI/7;ball(g,i%2?sage:grass,Math.cos(a)*1.27,2.65+Math.sin(a)*1.27,0,.23,.22,.18);}
  for(const xx of [-1.25,1.25])for(const y of [.55,1.3,2.05])ball(g,sage,xx,y,0,.17,.29,.16);
 }
 function greenhouse(p,x,z){
  const g=new T.Group();g.position.set(x,0,z);p.add(g);g.rotation.y=.23;
  const glass=new T.MeshStandardMaterial({color:0xa5cbc2,roughness:.22,metalness:.03,transparent:true,opacity:.72});
  box(g,M.ivory,5.5,.22,3.3,0,.1,0);box(g,glass,4.9,2.7,2.6,0,1.55,0);
  for(const xx of [-2.5,-1.25,0,1.25,2.5]){box(g,M.ivory,.07,2.75,.07,xx,1.6,1.34);box(g,M.ivory,.07,2.75,.07,xx,1.6,-1.34);line(g,M.ivory,[[xx,2.97,-1.36],[xx,3.77,0],[xx,2.97,1.36]],.055);}
  for(const yy of [.35,1.6,2.98]){box(g,M.ivory,5.05,.065,.07,0,yy,1.35);box(g,M.ivory,5.05,.065,.07,0,yy,-1.35);}
  box(g,M.ivory,5.05,.07,.07,0,3.77,0);
  for(const z0 of [-.55,.55])for(const x0 of [-1.7,0,1.7]){cylinder(g,M.cream,.27,.34,x0,.36,z0);ball(g,sage,x0,.96,z0,.31,.68,.31);}
 }
 function chunk(start,index){
  const g=new T.Group();scene.add(g);g.userData.base=start;g.position.z=start;chunks.push(g);
  box(g,grass,25,.08,40,0,-.15,-20);box(g,M.cream,6.1,.09,40,0,-.07,-20);box(g,M.stone,5,.025,40,0,-.012,-20);
  for(let i=0;i<32;i++){const z=-i*1.28;box(g,M.ivory,4.9,.012,.02,0,.008,z);if(i%2===0)for(const x of [-.84,.84])box(g,M.ivory,.025,.016,.36,x,.010,z);}
  for(const x of [-2.72,2.72])box(g,M.ivory,.14,.10,40,x,.024,-20);
  for(const z of [-8,-23,-36]){makeTree(g,-4.2,z,3.7+(index%2)*.3);makeTree(g,4.1,z-3,3.5);lamp(g,-2.97,z+3);}
  flowerBed(g,-3.2,-3,4.1);flowerBed(g,3.2,-12,4.5);flowerBed(g,-3.2,-30,4.2);flowerBed(g,3.2,-34,3.5);
  parkBench(g,3.85,-18,Math.PI/2);parkBench(g,-4,-16,-Math.PI/2);
  if(index===0){pavilion(g,-8.1,-10);greenhouse(g,8.7,-24);arbor(g,5.8,-3);}
  if(index===1){greenhouse(g,-8.3,-7);pavilion(g,8.1,-25);arbor(g,-5.5,-31);}
  if(index===2){pavilion(g,-8.1,-21);arbor(g,5.8,-9);}
  // A low reflective pond sits beside the path, never on the playable lanes.
  const pond=mesh(g,new T.CircleGeometry(3.6,48),water,8,-.08,-10);pond.rotation.x=-Math.PI/2;pond.scale.set(1,.67,1);pond.castShadow=false;
  const ring=mesh(g,new T.TorusGeometry(3.65,.075,8,48),M.ivory,8,-.055,-10);ring.rotation.x=Math.PI/2;ring.scale.set(1,.67,1);
  const sign=new T.Group();g.add(sign);sign.position.set(-2.9,0,-.5);cylinder(sign,sage,.045,2.3,0,1.15,0);box(sign,textPanel('圓山公園',{background:'#3c7363',color:'#fff6df'}),1.1,.37,.06,0,2.22,0);
  return g;
 }
 for(let i=0;i<3;i++)chunk(-40*i,i);
 // Batch static geometry by material within each recycled segment. This keeps
 // flowers and tree canopies detailed without hundreds of per-flower draw calls.
 for(const g of chunks){
  g.updateMatrixWorld(true);const inv=new T.Matrix4().copy(g.matrixWorld).invert(), batches=new Map();
  g.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+':'+o.material.uuid;let b=batches.get(key);if(!b){b={geometry:o.geometry,material:o.material,matrices:[],cast:o.castShadow};batches.set(key,b);}b.matrices.push(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));});
  g.clear();for(const b of batches.values()){const inst=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));inst.instanceMatrix.needsUpdate=true;inst.castShadow=b.cast;inst.receiveShadow=true;inst.computeBoundingSphere();g.add(inst);}
 }
 return{theme:'yuanshan',name:'圓山公園'};
}
