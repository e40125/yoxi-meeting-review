import * as THREE from 'three';
import { createCollectibleModel, disposeCollectibleModel } from './collection-original.mjs';


const PALETTE={ink:0x293438,cream:0xf4dfbd,blue:0x27768f,blueDark:0x24586e,navy:0x183b59,red:0xc7473c,brick:0xb5624b,ivory:0xf8eed9,green:0x4d795b};
const themes=new Set(['blue','bookshop','dinner']);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const normalAngle=v=>Math.atan2(Math.sin(v),Math.cos(v));
function seedRand(seed=17){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function texture(kind='plaster'){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),r=seedRand(kind.length*71);
 ctx.fillStyle='#dedbd4';ctx.fillRect(0,0,256,256);
 for(let n=0;n<26000;n++){const value=120+r()*125;ctx.fillStyle=`rgba(${value},${value},${value},${kind==='wood'?.13:.18})`;ctx.fillRect(r()*256,r()*256,kind==='wood'?8+r()*15:1+r()*1.6,1+r()*1.1);}
 if(kind==='wood'){for(let n=0;n<38;n++){ctx.strokeStyle=`rgba(90,80,65,${.03+r()*.06})`;ctx.beginPath();let x=r()*256;ctx.moveTo(x,0);for(let y=0;y<270;y+=12)ctx.lineTo(x+Math.sin(y*.028+n)*3,y);ctx.stroke();}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.NoColorSpace;return t;
}
function roundedShape(w,h,r){r=Math.min(r,w/2,h/2);const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function roundedBox(w,h,d,r=.06){const b=Math.min(r*.38,d*.23,w*.2,h*.2);const g=new THREE.ExtrudeGeometry(roundedShape(w-2*b,h-2*b,Math.max(.005,r-b)),{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:4,curveSegments:10,steps:1});g.translate(0,0,-(d-2*b)/2);return g;}
function mesh(g,m,parent,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,mat,w,h,d,x,y,z,r=.035){return mesh(roundedBox(w,h,d,r),mat,parent,x,y,z);}
function sphere(parent,mat,x,y,z,sx,sy,sz){const o=mesh(new THREE.SphereGeometry(1,28,20),mat,parent,x,y,z);o.scale.set(sx,sy,sz);return o;}
function tube(parent,mat,points,r=.03){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(14,points.length*5),r,8,false),mat,parent);}
function bar(parent,mat,a,b,r=.025){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,v.length(),10),mat,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
function bodyGeometry(rings,segments=48){
 const interp=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 const dense=[];for(let i=0;i<rings.length-1;i++)for(let k=0;k<6;k++){const t=k/6;dense.push([0,1,2,3].map(j=>{const a=rings[Math.max(0,i-1)][j]??0,b=rings[i][j]??0,c=rings[i+1][j]??0,d=rings[Math.min(rings.length-1,i+2)][j]??0;const v=interp(a,b,c,d,t);return j===1||j===2?Math.max(.0005,v):v;}));}dense.push(rings.at(-1));
 const positions=[],uvs=[],indices=[];for(let i=0;i<dense.length;i++){const [y,rx,rz,z=0]=dense[i];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz+z);uvs.push(j/segments,i/(dense.length-1));}}for(let i=0;i<dense.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}

function sculptHead(){const rows=30,rings=[];for(let i=0;i<=rows;i++){const a=i/rows*Math.PI,y=-Math.cos(a)*.42;const radius=Math.pow(Math.sin(a),.62);const cheeks=1+.08*Math.exp(-Math.pow((y+.1)*6,2));rings.push([y,.45*radius*cheeks,.35*radius,.018+Math.max(0,-y)*.075]);}return bodyGeometry(rings,48);}
function leaf(parent,mat,x,y,z,size,ry=0,rz=0){const pos=[],ind=[],rows=12,sides=10;for(let i=0;i<=rows;i++){const t=i/rows,w=Math.pow(Math.sin(t*Math.PI),.82)*.33,depth=Math.sin(t*Math.PI)*.036;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;pos.push(Math.cos(a)*w,t,Math.sin(t*Math.PI)*.09+Math.sin(a)*depth);}}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ind.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();const o=mesh(g,mat,parent,x,y,z);o.scale.setScalar(size);o.rotation.set(-.45,ry,rz);return o;}
function circleShadow(parent,r,x,z,opacity=.14){const mat=new THREE.MeshBasicMaterial({color:0x152b32,transparent:true,opacity,depthWrite:false});const o=mesh(new THREE.CircleGeometry(r,50),mat,parent,x,.037,z);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;}

function makeBear(materials,{scale=1,outfit='scarf'}={}){
 const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);g.scale.setScalar(scale);
 const {fur,cream,eye,navy,red,white,brass,rose}=materials;
 const torso=mesh(bodyGeometry([[.15,.09,.085],[.19,.23,.18],[.27,.31,.23],[.45,.34,.245],[.66,.29,.22],[.84,.22,.18],[.9,.13,.12],[.92,.01,.01]]),fur,rig);
 const hips=new THREE.Group();rig.add(hips);
 const feet=[];for(const sign of [-1,1]){const foot=new THREE.Group();foot.position.set(sign*.19,.12,.08);hips.add(foot);mesh(bodyGeometry([[-.1,.07,.08],[-.07,.13,.15],[.025,.135,.165],[.13,.09,.1],[.16,.01,.01]]),fur,foot);sphere(foot,cream,0,-.104,.025,.075,.013,.083);feet.push(foot);}
 const arms=[];for(const sign of [-1,1]){const pivot=new THREE.Group();pivot.position.set(sign*.26,.74,0);rig.add(pivot);const arm=mesh(bodyGeometry([[-.42,.04,.05],[-.39,.105,.1],[-.26,.105,.11],[-.1,.085,.1],[0,.05,.06],[.04,.005,.005]]),fur,pivot);pivot.rotation.z=sign*.16;arms.push(pivot);sphere(pivot,cream,sign*.005,-.315,.108,.055,.068,.014);}
 const head=new THREE.Group();head.position.set(0,1.14,.016);rig.add(head);mesh(sculptHead(),fur,head);
 for(const sign of [-1,1]){const ear=sphere(head,fur,sign*.325,.315,-.01,.17,.17,.095);ear.rotation.z=-sign*.13;sphere(head,cream,sign*.325,.327,.067,.092,.088,.023);}
 // The muzzle is a flattened sculpted pad, not a round ball.
 const muzzle=mesh(bodyGeometry([[-.2,.055,.015],[-.178,.15,.065],[-.1,.21,.085],[0,.195,.07],[.054,.11,.032],[.07,.012,.003]]),cream,head,0,-.05,.303);
 sphere(head,eye,0,-.08,.407,.073,.05,.025);
 tube(head,eye,[[0,-.125,.39],[0,-.163,.386],[-.05,-.175,.382]],.008);
 tube(head,eye,[[0,-.161,.386],[.052,-.171,.383]],.008);
 const eyes=[];for(const sign of [-1,1]){const e=sphere(head,eye,sign*.164,.022,.326,.049,.06,.025);eyes.push(e);sphere(head,white,sign*.157,.042,.35,.011,.011,.006);tube(head,fur,[[sign*.11,.123,.319],[sign*.16,.136,.326],[sign*.209,.114,.316]],.02);sphere(head,rose,sign*.258,-.08,.302,.063,.028,.013);}
 // Raised white V follows the torso curvature, with separated forked tips.
 tube(rig,white,[[-.19,.75,.18],[-.105,.65,.228],[0,.57,.249],[.107,.65,.228],[.19,.75,.18]],.041);
 const accessories=new THREE.Group();rig.add(accessories);
 const scarf=new THREE.Group();scarf.position.y=-.04;accessories.add(scarf);tube(scarf,navy,[[-.21,.86,.1],[-.17,.835,.225],[0,.82,.257],[.18,.84,.205],[.22,.88,.03],[0,.91,-.155],[-.21,.86,.1]],.065);
 const tail=mesh(bodyGeometry([[.47,.032,.027],[.51,.07,.029],[.63,.09,.032],[.76,.065,.029],[.86,.025,.02]]),navy,scarf,.17,0,.245);tail.rotation.z=-.18;
 for(let n=0;n<3;n++)tube(scarf,cream,[[.17+n*.018,.495,.279],[.162+n*.018,.473,.279]],.004);
 const bag=new THREE.Group();bag.position.set(0,.53,-.23);accessories.add(bag);box(bag,red,.42,.48,.2,0,0,-.025,.09);box(bag,red,.3,.2,.045,0,-.08,-.137,.035);tube(bag,brass,[[-.13,.07,-.137],[0,.087,-.145],[.13,.07,-.137]],.008);tube(bag,red,[[-.085,.22,-.06],[-.085,.29,-.06],[.085,.29,-.06],[.085,.22,-.06]],.025);
 const backpackStraps=[];for(const sign of [-1,1])backpackStraps.push(tube(accessories,red,[[sign*.18,.82,-.11],[sign*.245,.8,.055],[sign*.245,.66,.19],[sign*.25,.42,.17],[sign*.22,.34,-.1]],.025));
 const camera=new THREE.Group();camera.position.set(0,.55,.29);accessories.add(camera);box(camera,navy,.34,.24,.14,0,0,0,.045);const lens=mesh(new THREE.CylinderGeometry(.085,.085,.075,28),brass,camera,0,0,.1);lens.rotation.x=Math.PI/2;const glass=mesh(new THREE.CylinderGeometry(.059,.059,.01,24),eye,camera,0,0,.143);glass.rotation.x=Math.PI/2;box(camera,cream,.065,.04,.015,-.11,.061,.078,.01);const cameraStrap=tube(accessories,navy,[[-.15,.62,.31],[-.26,.84,.17],[0,.9,-.04],[.26,.84,.17],[.15,.62,.31]],.013);
 const umbrella=new THREE.Group();umbrella.position.set(-.335,.31,.14);accessories.add(umbrella);bar(umbrella,brass,[0,0,0],[0,1.67,0],.016);tube(umbrella,navy,[[0,.02,0],[0,-.08,0],[.04,-.11,0],[.085,-.08,0],[.085,-.04,0]],.022);
 const ugeom=new THREE.SphereGeometry(.64,56,28,0,Math.PI*2,0,Math.PI*.43);ugeom.scale(1,.7,1);mesh(ugeom,navy,umbrella,0,1.23,0);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,pts=[];for(let n=0;n<=18;n++){const theta=n/18*Math.PI*.43;pts.push([Math.cos(a)*Math.sin(theta)*.647,1.23+Math.cos(theta)*.64*.7+.006,Math.sin(a)*Math.sin(theta)*.647]);}tube(umbrella,cream,pts,.006);}
 const rim=[];for(let i=0;i<=56;i++){const a=i/56*Math.PI*2;rim.push([Math.cos(a)*.625,1.23+Math.cos(Math.PI*.43)*.448,Math.sin(a)*.625]);}tube(umbrella,navy,rim,.012);sphere(umbrella,brass,0,1.705,0,.024,.047,.024);

 const readingBook=new THREE.Group();readingBook.position.set(0,.48,.37);readingBook.rotation.x=-1.27;rig.add(readingBook);
 for(const sign of [-1,1]){const page=new THREE.Group();page.position.x=sign*.124;page.rotation.y=sign*.12;readingBook.add(page);box(page,navy,.244,.33,.032,0,0,0,.009);box(page,cream,.226,.314,.012,0,0,.02,.006);for(let n=0;n<4;n++)bar(page,white,[-.105,-.13+n*.081,.027],[.105,-.13+n*.081,.027],.0015);}
 const sketchMat=new THREE.MeshBasicMaterial({color:0x446b85});const sketch=new THREE.Group();sketch.position.set(.125,0,.031);readingBook.add(sketch);for(const x of [-.07,.07])bar(sketch,sketchMat,[x,-.09,0],[x,.054,0],.002);bar(sketch,sketchMat,[-.07,.054,0],[0,.102,0],.002);bar(sketch,sketchMat,[[0,.102,0]][0],[.07,.054,0],.002);for(const y of [-.09,-.01,.054])bar(sketch,sketchMat,[-.07,y,0],[.07,y,0],.002);readingBook.scale.setScalar(.001);
 const equipmentGroup=new THREE.Group();rig.add(equipmentGroup);let travelBag=null,readingBookmark=null;
 function setEquipment(value){
 for(const child of [...equipmentGroup.children]){equipmentGroup.remove(child);if(child.userData.item)disposeCollectibleModel(child);else child.traverse(o=>o.geometry?.dispose());}if(readingBookmark){readingBook.remove(readingBookmark);disposeCollectibleModel(readingBookmark);readingBookmark=null;}
 bag.visible=!value.bag;backpackStraps.forEach(o=>o.visible=!value.bag);travelBag=null;
 if(value.bag==='canvas-travel'){travelBag=createCollectibleModel('bag',{badge:value.badge==='blue-house',bookmark:value.bookmark==='leaf'});travelBag.scale.setScalar(.44);travelBag.position.set(0,.53,-.235);travelBag.rotation.y=Math.PI;equipmentGroup.add(travelBag);
 // Front shoulder straps belong to the replacement pack and do not erase other clothing.
 for(const sign of [-1,1])tube(equipmentGroup,navy,[[sign*.18,.84,-.12],[sign*.26,.8,.055],[sign*.26,.65,.19],[sign*.26,.4,.16],[sign*.22,.33,-.11]],.027);
 }
 if(value.badge==='blue-house'&&!value.bag){const pin=createCollectibleModel('badge');pin.scale.setScalar(.19);pin.position.set(-.23,.69,.207);pin.rotation.y=-.18;equipmentGroup.add(pin);}
 if(value.bookmark==='leaf'){readingBookmark=createCollectibleModel('bookmark');readingBookmark.scale.setScalar(.24);readingBookmark.position.set(.087,.105,.057);readingBookmark.rotation.z=-.18;readingBook.add(readingBookmark);}
 }
 function updateEquipmentPose(reading){if(travelBag)travelBag.traverse(o=>{if(o.userData.item==='bookmark')o.visible=!reading;});if(readingBookmark)readingBookmark.visible=reading;}
 function setOutfit(value){scarf.visible=value==='scarf';camera.visible=value==='camera';cameraStrap.visible=value==='camera';umbrella.visible=value==='umbrella';}
 setOutfit(outfit);
 return {group:g,rig,torso,head,arms,feet,eyes,readingBook,setOutfit,setEquipment,updateEquipmentPose,disposeEquipment(){setEquipment({});}};
}


export {makeBear};
