import * as THREE from './vendor/three/three.module.js';
import { createCollectibleModel, disposeCollectibleModel } from './art/collectibles.mjs';
import { createPaperGame } from './game-scene.mjs';

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
function bodyGeometry(rings,segments=40){const positions=[],uvs=[],indices=[];for(let i=0;i<rings.length;i++){const [y,rx,rz,z=0]=rings[i];for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz+z);uvs.push(j/segments,i/(rings.length-1));}}for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}
function sculptHead(){const rows=30,rings=[];for(let i=0;i<=rows;i++){const a=i/rows*Math.PI,y=-Math.cos(a)*.42;const radius=Math.pow(Math.sin(a),.62);const cheeks=1+.08*Math.exp(-Math.pow((y+.1)*6,2));rings.push([y,.45*radius*cheeks,.35*radius,.018+Math.max(0,-y)*.075]);}return bodyGeometry(rings,48);}
function leaf(parent,mat,x,y,z,size,ry=0,rz=0){const pos=[],ind=[],rows=12,sides=10;for(let i=0;i<=rows;i++){const t=i/rows,w=Math.pow(Math.sin(t*Math.PI),.82)*.33,depth=Math.sin(t*Math.PI)*.036;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;pos.push(Math.cos(a)*w,t,Math.sin(t*Math.PI)*.09+Math.sin(a)*depth);}}for(let i=0;i<rows;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;ind.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();const o=mesh(g,mat,parent,x,y,z);o.scale.setScalar(size);o.rotation.set(-.45,ry,rz);return o;}
function circleShadow(parent,r,x,z,opacity=.14){const mat=new THREE.MeshBasicMaterial({color:0x152b32,transparent:true,opacity,depthWrite:false});const o=mesh(new THREE.CircleGeometry(r,50),mat,parent,x,.037,z);o.rotation.x=-Math.PI/2;o.castShadow=false;return o;}

function makeBear(materials,{scale=1,outfit='scarf'}={}){
 const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);g.scale.setScalar(scale);
 const {fur,cream,eye,navy,red,white,brass,rose}=materials;
 const torso=mesh(bodyGeometry([[.15,.09,.085],[.19,.23,.18],[.27,.31,.23],[.45,.34,.245],[.66,.29,.22],[.84,.22,.18],[.9,.13,.12],[.92,.01,.01]]),fur,rig);
 const hips=new THREE.Group();rig.add(hips);
 const feet=[];for(const sign of [-1,1]){const foot=new THREE.Group();foot.position.set(sign*.19,.12,.08);hips.add(foot);mesh(bodyGeometry([[-.1,.07,.08],[-.07,.13,.15],[.025,.135,.165],[.13,.09,.1],[.16,.01,.01]]),fur,foot);box(foot,cream,.13,.015,.15,0,-.082,.025,.03);feet.push(foot);}
 const arms=[];for(const sign of [-1,1]){const pivot=new THREE.Group();pivot.position.set(sign*.26,.74,0);rig.add(pivot);const arm=mesh(bodyGeometry([[-.42,.04,.05],[-.39,.105,.1],[-.26,.105,.11],[-.1,.085,.1],[0,.05,.06],[.04,.005,.005]]),fur,pivot);pivot.rotation.z=sign*.16;arms.push(pivot);sphere(pivot,cream,sign*.005,-.315,.081,.066,.08,.02);}
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
 const scarf=new THREE.Group();accessories.add(scarf);tube(scarf,navy,[[-.21,.86,.1],[-.17,.835,.225],[0,.82,.257],[.18,.84,.205],[.22,.88,.03],[0,.91,-.155],[-.21,.86,.1]],.065);
 const tail=mesh(bodyGeometry([[.47,.032,.027],[.51,.07,.029],[.63,.09,.032],[.76,.065,.029],[.86,.025,.02]]),navy,scarf,.17,0,.245);tail.rotation.z=-.18;
 for(let n=0;n<3;n++)tube(scarf,cream,[[.17+n*.018,.495,.279],[.162+n*.018,.473,.279]],.004);
 const bag=new THREE.Group();bag.position.set(0,.53,-.23);accessories.add(bag);box(bag,red,.42,.48,.2,0,0,-.025,.09);box(bag,red,.3,.2,.045,0,-.08,-.137,.035);tube(bag,brass,[[-.13,.07,-.137],[0,.087,-.145],[.13,.07,-.137]],.008);tube(bag,red,[[-.085,.22,-.06],[-.085,.29,-.06],[.085,.29,-.06],[.085,.22,-.06]],.025);
 const backpackStraps=[];for(const sign of [-1,1])backpackStraps.push(tube(accessories,red,[[sign*.18,.82,-.11],[sign*.245,.8,.055],[sign*.245,.66,.19],[sign*.25,.42,.17],[sign*.22,.34,-.1]],.025));
 const camera=new THREE.Group();camera.position.set(0,.55,.29);accessories.add(camera);box(camera,navy,.34,.24,.14,0,0,0,.045);const lens=mesh(new THREE.CylinderGeometry(.085,.085,.075,28),brass,camera,0,0,.1);lens.rotation.x=Math.PI/2;const glass=mesh(new THREE.CylinderGeometry(.059,.059,.01,24),eye,camera,0,0,.143);glass.rotation.x=Math.PI/2;box(camera,cream,.065,.04,.015,-.11,.061,.078,.01);tube(accessories,navy,[[-.15,.62,.31],[-.26,.84,.17],[0,.9,-.04],[.26,.84,.17],[.15,.62,.31]],.013);
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
 function setOutfit(value){scarf.visible=value==='scarf';camera.visible=value==='camera';umbrella.visible=value==='umbrella';}
 setOutfit(outfit);
 return {group:g,rig,torso,head,arms,feet,eyes,readingBook,setOutfit,setEquipment,updateEquipmentPose,disposeEquipment(){setEquipment({});}};
}

export function framingParameters({theme='blue',framing='scene',aspect=1,bearPosition={x:0,y:.095,z:0},bearScale=1,outfit='scarf'}={}){
 const close=framing==='companion',base=close?(outfit==='umbrella'?3.4:2.45):(theme==='bookshop'?7.55:6.65);
 const safeAspect=Math.max(.1,aspect),span=Math.max(base,base/safeAspect);
 return {span,focus:close?{x:bearPosition.x,y:bearPosition.y+.85*bearScale,z:bearPosition.z+.04*bearScale}:{x:0,y:1.2,z:0}};
}

export function createWorld(container,{theme='blue',onReady=()=>{},onError=()=>{},onChange=()=>{},onInteraction=()=>{},onGameState=()=>{},onGameResult=()=>{},reducedMotion=false}={}){
 let renderer,scene,camera,world,frame,observer,disposed=false,active=true,elapsed=0,poseStarted=performance.now(),last=performance.now(),angle=.52,targetAngle=.52,pose='wave',framing='scene',lightMode='day',outfit='scarf',themeId=theme,equipment={bag:null,badge:null,bookmark:null};
 const materials={},textures=[],bears=[],animated=[],raycaster=new THREE.Raycaster();let pointer=null,dragged=false,lightTween=null,hasRendered=false,bookshopRig=null,windowOpen=false,raining=true,game=null,gameRestore=null,catchReaction=null;
 const cameraFocus=new THREE.Vector3(0,1.2,0);let cameraSpan=6.65;
 try {
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.setClearColor(0x000000,0);container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','可轉動的城市微縮收藏');renderer.domElement.setAttribute('role','img');renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:pan-y;';
 scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,80);camera.position.set(7,6,10);camera.lookAt(0,1.05,0);
 const noise=texture('plaster'),woodNoise=texture('wood');textures.push(noise,woodNoise);
 function mat(name,color,rough=.8,kind='clay',extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0,bumpMap:kind==='wood'?woodNoise:noise,bumpScale:kind==='wood'?.012:.007,...extra});materials[name]=m;return m;}
 mat('fur',PALETTE.ink,.91);mat('cream',PALETTE.cream);mat('white',PALETTE.ivory);mat('blue',0x294e87,.92);mat('baseEdge',0x293e52,.8);mat('stoneWarm',0xa9987b,.96);mat('blueWall',0x294c83,.94);mat('blueDark',0x243f66,.92);mat('navy',PALETTE.navy,.87);mat('red',PALETTE.red,.78);mat('brick',PALETTE.brick,.93);mat('brickLight',0xc97b61,.92);mat('brickDark',0xa25847,.93);mat('base',0xe8d8ba,.86);mat('ground',0xd6c9ac,.94);mat('stone',0xc2c2b3,.82);mat('green',PALETTE.green,.87,'clay',{side:THREE.DoubleSide});mat('greenLight',0x7fa374,.87,'clay',{side:THREE.DoubleSide});mat('wood',0x946746,.79,'wood');mat('woodLight',0xd4ae77,.8,'wood');mat('brass',0xc69855,.47,'clay',{metalness:.45});mat('eye',0x101c21,.25);mat('rose',0xab6e65,.9);mat('lamp',0xffe4a3,.35,'clay',{emissive:0xffbd58,emissiveIntensity:.8});mat('glass',0xefbd78,.32,'clay',{transparent:true,opacity:.66,emissive:0xffc276,emissiveIntensity:.25});
 const hemi=new THREE.HemisphereLight(0xdceeff,0xb49b76,1.9);scene.add(hemi);const ambient=new THREE.AmbientLight(0xffffff,.3);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0xffe7c5,4.5);sun.position.set(-3.5,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.camera.near=.1;sun.shadow.camera.far=25;sun.shadow.normalBias=.035;sun.shadow.bias=-.0004;sun.shadow.radius=5;sun.shadow.blurSamples=10;scene.add(sun);sun.target.position.set(0,.5,0);scene.add(sun.target);
 const fill=new THREE.DirectionalLight(0xd6efff,1.2);fill.position.set(4,3,-3);scene.add(fill);
 world=new THREE.Group();scene.add(world);
 function base(){const small=themeId==='blue',w=small?5.13:5.7,d=small?3.95:4.5;box(world,materials.baseEdge,w,.32,d,0,-.155,0,.18);box(world,materials.brass,w+.015,.024,d+.015,0,-.041,0,.16);box(world,materials.stoneWarm,w-.055,.08,d-.055,0,.025,0,.17);box(world,materials.brass,.83,.115,.024,.01,-.18,d/2+.014,.018);box(world,materials.navy,.69,.075,.006,.01,-.18,d/2+.03,.01);const label=document.createElement('canvas');label.width=1024;label.height=192;const lc=label.getContext('2d');lc.fillStyle='#ecd09d';lc.font='600 100px "PingFang TC", sans-serif';lc.textAlign='center';lc.textBaseline='middle';lc.fillText(themeId==='blue'?'藍色街角':themeId==='bookshop'?'雨後書店':'燈下小聚',512,97);const lt=new THREE.CanvasTexture(label);lt.colorSpace=THREE.SRGBColorSpace;textures.push(lt);const lm=new THREE.MeshBasicMaterial({map:lt,transparent:true,depthWrite:false});const lo=mesh(new THREE.PlaneGeometry(.67,.125),lm,world,.01,-.18,d/2+.034);lo.castShadow=false;}

 function potted(x,z,size=.4){const pot=new THREE.Group();pot.position.set(x,.04,z);world.add(pot);mesh(new THREE.CylinderGeometry(size*.46,size*.34,size*.65,24),materials.brick,pot,0,size*.325,0);const soil=mesh(new THREE.CylinderGeometry(size*.39,size*.39,.04,22),materials.wood,pot,0,size*.65,0);for(let i=0;i<9;i++){const a=i*2.399;const px=Math.cos(a)*size*.15,pz=Math.sin(a)*size*.15;bar(pot,materials.green,[0,size*.58,0],[px,size*(1+Math.sin(i)*.18),pz],.012);const l=leaf(pot,i%2?materials.greenLight:materials.green,px,size*.73,pz,size*(.6+(i%3)*.11),a,Math.sin(a)*.65);}}
 function stool(x,z,r=.28,height=.57){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const top=mesh(new THREE.CylinderGeometry(r,r*.97,.09,40),materials.woodLight,g,0,height,0);for(const a of [0,Math.PI*2/3,Math.PI*4/3])bar(g,materials.wood,[Math.cos(a)*r*.62,height-.03,Math.sin(a)*r*.62],[Math.cos(a)*r*.82,.075,Math.sin(a)*r*.82],.044);bar(g,materials.wood,[-r*.6,height*.45,0],[r*.6,height*.45,0],.025);return g;}
 function paving(){for(let row=0;row<7;row++)for(let col=0;col<6;col++){let x=-1.8+col*.55+(row%2)*.255,z=-1.62+row*.5;if(x>1.55)continue;const b=box(world,[materials.brick,materials.brickLight,materials.brickDark][(col+row*2)%3],.51,.045,.45,x,.064,z,.018);b.rotation.y=(col%2-.5)*.012;}}
 function addBear(x,z,scale=1,rotation=0){const b=makeBear(materials,{scale,outfit});b.setEquipment(equipment);b.group.position.set(x,.095,z);b.group.rotation.y=rotation;world.add(b.group);b.base={x,z,rotation};bears.push(b);circleShadow(world,.33*scale,x,z,.08);return b;}
 function buildBlue(){
 base();paving();
 // Back wall has thickness, a recessed window and a cream cap, visible from all angles.
 box(world,materials.blueWall,2.85,2.88,.24,-.82,1.51,-1.56,.095);box(world,materials.blueDark,2.9,.12,.38,-.82,.13,-1.54,.05);box(world,materials.white,2.97,.09,.35,-.82,2.965,-1.55,.04);
 // Painted indigo depth: the wall is brushed, not uniformly flat blue.
 const paint=document.createElement('canvas');paint.width=paint.height=512;const pc=paint.getContext('2d'),pr=seedRand(101);pc.fillStyle='#294d83';pc.fillRect(0,0,512,512);for(let i=0;i<1400;i++){pc.fillStyle=`rgba(${30+pr()*22},${60+pr()*25},${111+pr()*29},${.018+pr()*.025})`;pc.fillRect(pr()*512,pr()*512,35+pr()*90,1+pr()*5);}const wash=pc.createLinearGradient(0,0,512,512);wash.addColorStop(0,'rgba(69,99,139,.22)');wash.addColorStop(.6,'rgba(12,28,74,.05)');wash.addColorStop(1,'rgba(13,32,68,.2)');pc.fillStyle=wash;pc.fillRect(0,0,512,512);const paintMap=new THREE.CanvasTexture(paint);paintMap.colorSpace=THREE.SRGBColorSpace;textures.push(paintMap);materials.blueWall.map=paintMap;materials.blueWall.color.setHex(0xffffff);materials.blueWall.needsUpdate=true;
 // The reverse is a finished miniature backboard: wood planks, battens and flush fasteners.
 for(let i=0;i<7;i++){box(world,i%2?materials.wood:materials.woodLight,.383,2.75,.024,-2.035+i*.402,1.51,-1.696,.012);}for(const y of [.38,2.6])box(world,materials.wood,2.72,.11,.06,-.82,y,-1.731,.025);for(const x of [-2.03,.39])for(const y of [.38,2.6])sphere(world,materials.brass,x,y,-1.767,.022,.022,.009);
 const backingMark=box(world,materials.navy,.72,.45,.035,-.82,1.5,-1.75,.045);for(const x of [-1.07,-.57])bar(world,materials.brass,[x,1.34,-1.78],[x,1.63,-1.78],.012);bar(world,materials.brass,[-1.07,1.63,-1.78],[-.82,1.78,-1.78],.012);bar(world,materials.brass,[-.82,1.78,-1.78],[-.57,1.63,-1.78],.012);bar(world,materials.brass,[-1.07,1.34,-1.78],[-.57,1.34,-1.78],.012);
 const frame=new THREE.Group();frame.position.set(-.83,.1,-.9);world.add(frame);
 for(const x of [-1.05,1.05])bar(frame,materials.white,[x,0,0],[x,2.43,0],.046);
 for(const y of [.09,1.23,2.4])bar(frame,materials.white,[-1.05,y,0],[1.05,y,0],.039);
 bar(frame,materials.white,[-1.05,2.43,0],[0,3.08,0],.046);bar(frame,materials.white,[[0,3.08,0]][0],[1.05,2.43,0],.046);
 // Open wire house projects out from blue wall, with window and roof depth.
 for(const x of [-1.05,1.05]){bar(frame,materials.white,[x,2.43,0],[x,2.43,.57],.036);bar(frame,materials.white,[x,2.43,.57],[0,3.08,.57],.036);}bar(frame,materials.white,[0,3.08,0],[0,3.08,.57],.036);bar(frame,materials.white,[-1.05,2.43,.57],[1.05,2.43,.57],.03);
 for(const x of [-.7,.23])bar(frame,materials.white,[x,1.45,.025],[x,2.13,.025],.026);for(const y of [1.45,1.79,2.13])bar(frame,materials.white,[-.7,y,.025],[.23,y,.025],.026);bar(frame,materials.white,[-.235,1.45,.025],[-.235,2.13,.025],.025);
 for(const x of [-.7,-.12])bar(frame,materials.white,[x,.12,.03],[x,1.06,.03],.027);bar(frame,materials.white,[-.7,1.06,.03],[-.12,1.06,.03],.027);
 const window=box(world,materials.blueDark,.57,.49,.025,-.92,1.05,-1.421,.014);for(let i=0;i<5;i++)box(world,materials.blue,.47,.035,.036,-.92,.9+i*.075,-1.397,.009);
 // Small shelf with books, glazed ceramic, and a sprig grounds the scale.
 box(world,materials.woodLight,1.05,.055,.32,-1.03,.72,-1.25,.018);for(let i=0;i<3;i++){const b=box(world,[materials.red,materials.cream,materials.navy][i],.073,.2+i*.03,.12,-1.33+i*.095,.835+i*.015,-1.26,.007);b.rotation.z=i===2?-.09:0;}
 const vase=mesh(new THREE.LatheGeometry([new THREE.Vector2(.035,0),new THREE.Vector2(.065,.03),new THREE.Vector2(.07,.11),new THREE.Vector2(.04,.16),new THREE.Vector2(.04,.2)],24),materials.white,world,-.91,.76,-1.26);tube(world,materials.green,[[-.91,.9,-1.26],[-.93,1.11,-1.27],[-.85,1.27,-1.27]],.009);leaf(world,materials.greenLight,-.93,1.035,-1.24,.18,.2,-.7);
 // Tree is an authored branched silhouette with clusters of individual leaves.
 const tree=new THREE.Group();tree.position.set(1.76,.04,-1.16);tree.scale.set(.91,.96,.91);world.add(tree);tube(tree,materials.wood,[[0,0,0],[.07,.65,-.02],[-.03,1.25,.02],[.12,2.04,0]],.095);tube(tree,materials.wood,[[0,1,0],[-.4,1.65,.04],[-.58,2,.04]],.05);tube(tree,materials.wood,[[.02,1.36,0],[.42,1.88,-.02],[.59,2.1,.06]],.049);
 const rand=seedRand(81),clusters=[[-.48,2.16,.04,.42,.35,.36],[.04,2.49,0,.4,.32,.34],[.52,2.26,-.02,.38,.32,.34],[.2,2.06,.34,.36,.27,.31]];
 for(const [cx,cy,cz,sx,sy,sz]of clusters){
 tube(tree,materials.wood,[[.06,1.72,0],[cx*.6,cy-.26,cz*.6],[cx,cy,cz]],.032);
 const crownGeometry=new THREE.SphereGeometry(1,36,24),position=crownGeometry.attributes.position;for(let i=0;i<position.count;i++){const x=position.getX(i),y=position.getY(i),z=position.getZ(i),sculpt=1+.06*Math.sin(x*7+y*4)*Math.cos(z*6-y*3);position.setXYZ(i,x*sculpt*sx,y*sculpt*sy,z*sculpt*sz);}crownGeometry.computeVertexNormals();const crown=mesh(crownGeometry,materials.green,tree,cx,cy,cz);
 for(let i=0;i<5;i++){const a=i*2.399,r=.18,x=cx+Math.cos(a)*r,y=cy+sy*.35,z=cz+sz*.7;const l=leaf(tree,i%3?materials.green:materials.greenLight,x,y,z,.22+rand()*.04,a,(rand()-.5)*1.5);l.rotation.x=-.7;}
 }

 stool(-.3,.34,.39,.5);potted(-2.13,.65,.51);potted(.5,-1.15,.32);potted(2.05,-.38,.4);potted(-1.75,.98,.28);
 // A small glazed cup, an open sketchbook and a pencil are intentionally placed on the stool.
 const cup=new THREE.Group();cup.position.set(-.65,.76,-1.28);world.add(cup);mesh(new THREE.LatheGeometry([new THREE.Vector2(.045,0),new THREE.Vector2(.064,.012),new THREE.Vector2(.065,.115),new THREE.Vector2(.058,.127),new THREE.Vector2(.05,.115),new THREE.Vector2(.049,.022)],24),materials.cream,cup);const coffee=mesh(new THREE.CylinderGeometry(.048,.048,.006,24),materials.wood,cup,0,.105,0);const handle=mesh(new THREE.TorusGeometry(.035,.009,8,20),materials.cream,cup,.07,.071,0);handle.rotation.y=Math.PI/2;
 const crate=new THREE.Group();crate.position.set(-1.2,.08,.8);world.add(crate);box(crate,materials.wood,.5,.21,.38,0,.105,0,.028);for(const yy of [.035,.1,.165])box(crate,materials.woodLight,.49,.045,.025,0,yy,.198,.008);const journal=new THREE.Group();journal.position.set(-1.2,.305,.8);journal.rotation.y=-.35;world.add(journal);box(journal,materials.navy,.41,.045,.31,0,.025,0,.009);box(journal,materials.cream,.39,.027,.29,0,.061,0,.005);bar(journal,materials.red,[-.08,.084,-.07],[.15,.084,.11],.008);
 // Warm practical lamp; its emitter remains visible in daylight.
 const lamp=new THREE.Group();lamp.position.set(-.84,.09,.96);lamp.userData.interactive='light';world.add(lamp);mesh(new THREE.CylinderGeometry(.16,.21,.06,30),materials.navy,lamp,0,.03,0);bar(lamp,materials.brass,[0,.05,0],[0,1.06,0],.023);tube(lamp,materials.brass,[[0,1.02,0],[.07,1.16,0],[.27,1.12,0]],.025);const shade=mesh(new THREE.ConeGeometry(.2,.18,36,1,true),materials.navy,lamp,.27,1.055,0);sphere(lamp,materials.lamp,.27,1.013,0,.064,.043,.064);const glow=new THREE.PointLight(0xffc075,2,3.5,2);glow.position.set(.27,.88,0);lamp.add(glow);animated.push({type:'lamp',object:glow});
 const bear=addBear(.93,.39,1.32,.34);bear.group.userData.interactive='bear';bear.head.rotation.z=-.07;
 // Fallen leaves and a small camera case are intentional close-up details.
 for(const [x,z,a] of [[1.55,.9,.5],[-1.84,1.31,1.2]]){const l=leaf(world,materials.woodLight,x,.114,z,.235,0,0);l.rotation.set(-Math.PI/2,0,a);tube(world,materials.wood,[[x+Math.sin(a)*.036,.115,z+Math.cos(a)*.036],[x,.116,z],[x-Math.sin(a)*.19,.118,z-Math.cos(a)*.19]],.0035);}

 }
 function buildBookshop(){
 base();
 // An original bookshop miniature: carved timber, readable covers, a hinged window and wet stone.
 const jade=mat('shopJade',0x38534e,.76,'wood'),jadeEdge=mat('shopJadeEdge',0x233e3b,.82,'wood'),plaster=mat('shopPlaster',0xddcfb2,.92),walnut=mat('shopWalnut',0x684832,.81,'wood'),oak=mat('shopOak',0xb68756,.76,'wood'),paper=mat('shopPaper',0xf1e5c8,.93),slate=mat('shopSlate',0x65777b,.42,'clay',{metalness:.04}),tileAlt=mat('shopSlateAlt',0x788785,.49),roof=mat('shopRoof',0x355050,.72);
 const glazing=new THREE.MeshPhysicalMaterial({color:0xa8c9c4,transparent:true,opacity:.16,roughness:.12,metalness:.02,depthWrite:false,side:THREE.DoubleSide});materials.shopGlass=glazing;
 const paperTurn=new THREE.MeshStandardMaterial({color:0xf5e9ce,roughness:.95,side:THREE.DoubleSide});materials.shopPageTurn=paperTurn;
 for(let row=0;row<8;row++)for(let col=0;col<9;col++){const x=-2.48+col*.61+(row%2)*.08,z=-1.83+row*.535;if(x>2.55)continue;const tile=box(world,(row+col)%4?slate:tileAlt,.565,.046,.49,x,.069,z,.035);tile.rotation.y=Math.sin(row*7+col)*.011;}
 // Rear wall and actual recessed shelves; all exposed sides have finished panels.
 box(world,plaster,4.18,2.79,.21,-.13,1.46,-1.76,.08);
 box(world,jadeEdge,4.25,.19,.32,-.13,.2,-1.7,.025);
 box(world,oak,4.34,.12,.33,-.13,2.87,-1.69,.035);
 for(let i=0;i<10;i++)box(world,i%3?walnut:oak,.405,2.64,.036,-2.02+i*.424,1.45,-1.89,.012);
 for(const y of [.4,2.5]){box(world,walnut,4.13,.12,.065,-.13,y,-1.939,.024);for(const x of [-2.04,1.78])sphere(world,materials.brass,x,y,-1.98,.021,.021,.012);}
 // A book medallion completes the reverse without pretending to be an actual shop sign.
 const rear=box(world,jade,.85,.62,.028,-.13,1.48,-1.933,.065);
 for(const sign of [-1,1]){const pg=box(world,paper,.255,.29,.014,-.13+sign*.13,1.48,-1.953,.025);pg.rotation.z=sign*.08;}
 bar(world,materials.brass,[-.13,1.32,-1.977],[-.13,1.64,-1.977],.009);
 const shelf=new THREE.Group();shelf.position.set(-1.18,.08,-1.4);world.add(shelf);
 box(shelf,walnut,1.58,2.43,.19,0,1.28,-.11,.03);
 for(const x of [-.82,.82])box(shelf,oak,.1,2.57,.57,x,1.34,.08,.02);
 const colors=[materials.red,materials.navy,materials.cream,materials.green,materials.brickLight,jade];
 for(let row=0;row<4;row++){
 const y=.18+row*.58;box(shelf,oak,1.72,.075,.62,0,y,.105,.02);
 for(let j=0;j<10;j++){const height=.29+((j*3+row)%5)*.035,x=-.66+j*.14,w=.105+(j%3)*.005;const book=new THREE.Group();book.position.set(x,y+.042,.06);shelf.add(book);book.rotation.z=j===9?-.13:j===8?.05:0;box(book,colors[(j+row*2)%colors.length],w,height,.32,0,height/2,0,.007);box(book,paper,w*.67,height-.035,.015,0,height/2,-.166,.002);for(const yy of [height*.19,height*.81])box(book,materials.brass,w*.74,.009,.013,0,yy,.167,.001);if(j%3===0)box(book,paper,w*.54,.055,.01,0,height*.54,.17,.002);}
 }
 // Three face-out books create deliberate cover illustrations, instead of blank rectangular spines.
 function cover(kind,color){const c=document.createElement('canvas');c.width=256;c.height=340;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,340);ctx.strokeStyle='#eadbbd';ctx.lineWidth=3;ctx.strokeRect(14,14,228,312);ctx.fillStyle='#f5e4bf';ctx.font='500 24px "PingFang TC",sans-serif';ctx.textAlign='center';ctx.fillText(['城市散步','雨的形狀','一頁風景'][kind],128,67);ctx.lineWidth=4;if(kind===0){for(let i=0;i<4;i++){const x=40+i*47,y=126+(i%2)*28;ctx.strokeRect(x,y,36,119-(i%2)*28);ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+18,y-24);ctx.lineTo(x+39,y);ctx.stroke();for(let j=0;j<3;j++)ctx.strokeRect(x+11,y+13+j*24,12,13);}}else if(kind===1){for(let i=0;i<6;i++){const x=48+(i%3)*80,y=127+Math.floor(i/3)*80;ctx.beginPath();ctx.moveTo(x,y-20);ctx.bezierCurveTo(x-32,y+17,x-19,y+30,x,y+31);ctx.bezierCurveTo(x+26,y+31,x+25,y+7,x,y-20);ctx.stroke();}}else{ctx.beginPath();ctx.arc(165,151,27,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(30,252);ctx.lineTo(91,178);ctx.lineTo(137,236);ctx.lineTo(175,204);ctx.lineTo(226,254);ctx.stroke();}ctx.font='14px "PingFang TC",sans-serif';ctx.fillText('城市原創藏書',128,304);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);return new THREE.MeshStandardMaterial({map:t,roughness:.92});}
 const display=new THREE.Group();display.position.set(-1.15,.73,-.735);world.add(display);box(display,oak,1.62,.07,.26,0,0,0,.02);
 for(let i=0;i<3;i++){const b=new THREE.Group();b.position.set(-.49+i*.49,.27,.03);b.rotation.z=(i-1)*-.055;display.add(b);box(b,colors[i],.39,.52,.068,0,0,0,.012);const cv=cover(i,['#415b66','#b3624b','#657951'][i]);materials['shopCover'+i]=cv;mesh(new THREE.PlaneGeometry(.375,.503),cv,b,0,0,.035);}
 // Right window bay has a warm niche and a working casement. It opens toward the viewer.
 const winX=1.03;box(world,walnut,1.62,1.71,.09,winX,1.71,-1.619,.025);box(world,plaster,1.4,1.45,.035,winX,1.73,-1.56,.02);
 for(const x of [winX-.88,winX+.88])box(world,jade,.13,1.96,.44,x,1.73,-1.38,.026);
 for(const y of [.77,2.69])box(world,jade,1.88,.13,.47,winX,y,-1.375,.027);
 box(world,oak,2.02,.09,.59,winX,.745,-1.2,.025);box(world,walnut,1.88,.11,.46,winX,.59,-1.35,.025);
 // The glazed bay reveals a small interior desk, books and pendant, with real depth behind the sash.
 box(world,oak,1.48,.065,.36,winX,1.12,-1.33,.014);
 for(let i=0;i<4;i++){const b=box(world,colors[(i+2)%colors.length],.09,.29+i*.034,.17,.52+i*.115,1.155+(.29+i*.034)/2,-1.36,.005);b.rotation.z=i===3?-.1:0;}
 const innerShade=mesh(new THREE.ConeGeometry(.17,.15,32,1,true),jade,world,1.27,2.26,-1.33);bar(world,materials.brass,[1.27,2.31,-1.33],[1.27,2.52,-1.33],.009);sphere(world,materials.lamp,1.27,2.195,-1.33,.07,.026,.07);
 const frameInside=box(world,walnut,.41,.47,.038,1.26,1.66,-1.52,.016);box(world,paper,.36,.42,.007,1.26,1.66,-1.496,.008);tube(world,materials.green,[[1.22,1.49,-1.488],[1.26,1.65,-1.488],[1.23,1.81,-1.488]],.009);for(const [x,y,z,a]of [[1.26,1.6,-1.483,-.8],[1.25,1.71,-1.483,.7]]){const l=leaf(world,materials.greenLight,x,y,z,.12,0,a);l.rotation.x=0;}
 const fixed=new THREE.Group();fixed.position.set(winX-.415,1.72,-1.105);world.add(fixed);
 function sash(g,w){for(const x of [-w/2,w/2])box(g,jade,.049,1.68,.065,x,0,0,.01);for(const y of [-.84,0,.84])box(g,jade,w,.044,.065,0,y,0,.012);box(g,jade,.039,1.68,.065,0,0,0,.006);const pane=box(g,glazing,w-.045,1.6,.014,0,0,.005,.005);pane.castShadow=false;for(const [x,y]of [[-.19,.56],[.08,.3],[.21,-.43],[-.1,-.24]]){const drop=sphere(g,glazing,x,y,.023,.015,.043,.013);drop.castShadow=false;}}
 sash(fixed,.815);
 const hinge=new THREE.Group();hinge.position.set(winX+.84,1.72,-1.08);world.add(hinge);const sashLeaf=new THREE.Group();sashLeaf.position.x=-.4025;hinge.add(sashLeaf);sash(sashLeaf,.805);sashLeaf.userData.interactive='window';fixed.userData.interactive='window';
 const catchHandle=new THREE.Group();catchHandle.position.set(-.71,-.15,.055);hinge.add(catchHandle);bar(catchHandle,materials.brass,[0,-.05,0],[0,.07,0],.014);sphere(catchHandle,materials.brass,0,.065,.013,.025,.025,.015);catchHandle.userData.interactive='window';
 for(const y of [-.61,.61])mesh(new THREE.CylinderGeometry(.025,.025,.1,18),materials.brass,hinge,0,y,0);
 // Small sill details do not sit in the character's path.
 const vase=mesh(new THREE.LatheGeometry([new THREE.Vector2(.055,0),new THREE.Vector2(.08,.025),new THREE.Vector2(.085,.14),new THREE.Vector2(.048,.22),new THREE.Vector2(.045,.27)],28),materials.cream,world,.62,.8,-.95);tube(world,materials.green,[[.62,1.01,-.95],[.59,1.19,-.95],[.65,1.3,-.94]],.009);leaf(world,materials.greenLight,.59,1.13,-.94,.21,.3,-.68);
 const sillBook=box(world,materials.red,.38,.055,.24,1.06,.825,-1.04,.01);sillBook.rotation.y=.16;
 // Shaped metal awning, copper gutter and a rain chain. No low roof obstructs the bear.
 const canopy=new THREE.Group();canopy.position.set(-.08,2.99,-1.34);world.add(canopy);for(let i=0;i<14;i++){const strip=box(canopy,i%2?jade:roof,.315,.055,1.3,-2.045+i*.315,0,0,.025);strip.rotation.x=.15;bar(canopy,jadeEdge,[-2.185+i*.315,-.027,-.62],[-2.185+i*.315,-.215,.64],.01);}
 const gutter=new THREE.Group();gutter.position.set(-.08,2.855,-.67);gutter.userData.interactive='rain';world.add(gutter);tube(gutter,materials.brass,[[-2.19,0,0],[0,0,0],[2.18,0,0]],.038);for(const x of [-2.2,2.19])sphere(gutter,materials.brass,x,0,0,.047,.047,.047);
 tube(world,jadeEdge,[[-2.27,2.855,-.67],[-2.42,2.82,-.65],[-2.45,2.57,-.65]],.031);
 for(let i=0;i<28;i++){const ring=mesh(new THREE.TorusGeometry(.052,.009,7,18),materials.brass,world,-2.45,2.54-i*.086,-.65);ring.rotation.y=i%2?Math.PI/2:0;ring.userData.interactive='rain';}
 const bowl=mesh(new THREE.LatheGeometry([new THREE.Vector2(.08,0),new THREE.Vector2(.14,.028),new THREE.Vector2(.21,.15),new THREE.Vector2(.215,.18),new THREE.Vector2(.198,.18),new THREE.Vector2(.12,.055)],30),jade,world,-2.45,.12,-.65);bowl.userData.interactive='rain';
 // Bench has curved ends and a vacant seat sized for the bear.
 const bench=new THREE.Group();bench.position.set(.55,.055,.48);world.add(bench);
 for(let i=0;i<4;i++)box(bench,oak,1.73,.073,.12,0,.5,-.205+i*.135,.017);
 for(const x of [-.72,.72]){bar(bench,jade,[x,.49,-.16],[x*.95,.04,-.22],.039);bar(bench,jade,[x,.49,.2],[x*.95,.04,.27],.039);tube(bench,jade,[[x,.25,-.18],[x,.76,-.21],[x,.88,-.13],[x,.82,.02]],.032);}
 for(const y of [.63,.78])box(bench,oak,1.68,.1,.065,0,y,-.22,.014);
 bar(bench,jade,[-.73,.26,-.16],[.73,.26,-.16],.027);
 // Stacked pocket books sit on a separate crate, never on the occupied seat.
 const crate=new THREE.Group();crate.position.set(1.92,.105,.4);world.add(crate);box(crate,walnut,.46,.37,.42,0,.19,0,.025);for(let j=0;j<3;j++)box(crate,oak,.465,.075,.026,0,.065+j*.115,.225,.008);for(let i=0;i<3;i++){const b=box(crate,colors[i],.35,.059,.28,0,.415+i*.064,0,.01);b.rotation.y=.08+i*.08;box(crate,paper,.32,.035,.009,0,.42+i*.064,.145,.001);}
 potted(-2.35,.63,.45);potted(2.24,-1.41,.46);
 const lantern=new THREE.Group();lantern.position.set(-.08,2.29,-.81);lantern.userData.interactive='light';world.add(lantern);tube(world,jade,[[-.08,2.61,-1.47],[-.08,2.68,-1.22],[-.08,2.54,-.81]],.026);bar(lantern,materials.brass,[0,.17,0],[0,.26,0],.012);box(lantern,materials.lamp,.18,.26,.18,0,0,0,.015);for(const x of [-.11,.11])for(const z of [-.11,.11])bar(lantern,jade,[x,-.165,z],[x,.165,z],.012);box(lantern,jade,.27,.045,.27,0,.18,0,.02);box(lantern,jade,.25,.045,.25,0,-.18,0,.02);
 const glow=new THREE.PointLight(0xffc582,2,3.1,2);glow.position.set(-.08,1.9,-.3);world.add(glow);animated.push({type:'lamp',object:glow});
 const warm=new THREE.PointLight(0xffcf8e,1.8,2.6,2);warm.position.set(.98,1.65,-1.19);world.add(warm);animated.push({type:'lamp',object:warm});
 const shopFill=new THREE.DirectionalLight(0xc4d8e8,.65);shopFill.position.set(2.5,4,6);world.add(shopFill);
 // Puddles and soft amber reflections are painted geometry on the wet stone, not fake photos.
 const puddleMat=new THREE.MeshPhysicalMaterial({color:0x91acb1,roughness:.12,metalness:.26,transparent:true,opacity:.49,depthWrite:false});materials.shopPuddle=puddleMat;
 const reflectMat=new THREE.MeshBasicMaterial({color:0xf2c78a,transparent:true,opacity:.13,depthWrite:false});materials.shopReflection=reflectMat;
 for(const [x,z,sx,sz]of [[-1.18,1.58,.71,.29],[1.65,1.55,.56,.22],[-1.23,-.02,.41,.2]]){const puddle=mesh(new THREE.CircleGeometry(1,60),puddleMat,world,x,.102,z);puddle.rotation.x=-Math.PI/2;puddle.scale.set(sx,sz,1);puddle.castShadow=false;}
 for(let i=0;i<7;i++){const r=box(world,reflectMat,.21+i*.027,.001,.018,-.1+(i%2)*.025,.105,.02+i*.078,.002);r.castShadow=false;}
 const rainMat=new THREE.MeshBasicMaterial({color:0xb8d5dc,transparent:true,opacity:.52,depthWrite:false});materials.shopRain=rainMat;
 const rainDrops=new THREE.InstancedMesh(new THREE.CylinderGeometry(.007,.007,.07,5),rainMat,28);rainDrops.castShadow=false;rainDrops.frustumCulled=false;world.add(rainDrops);const rainSeed=seedRand(94),drops=[];for(let i=0;i<28;i++)drops.push({x:i<8?-2.45+(rainSeed()-.5)*.018:-2.1+rainSeed()*4.1,z:-.65+(rainSeed()-.5)*.026,phase:rainSeed(),speed:.43+rainSeed()*.22});
 const rippleMat=new THREE.MeshBasicMaterial({color:0xb3cfd0,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide});materials.shopRipple=rippleMat;const ripples=[];for(const [x,z]of [[-1.17,-.65],[1.65,-.65],[-2.45,-.65]]){const r=mesh(new THREE.RingGeometry(.065,.074,32),rippleMat.clone(),world,x,x===-2.45?.27:.11,z);r.rotation.x=-Math.PI/2;r.castShadow=false;ripples.push(r);}
 const bear=addBear(.68,1.15,1.27,.35);bear.group.userData.interactive='bear';
 // A true turning page is attached only to this scene's book, leaving the accepted first scene intact.
 const pageHinge=new THREE.Group();pageHinge.position.set(0,0,.046);bear.readingBook.add(pageHinge);const pageGeom=new THREE.PlaneGeometry(.221,.298,14,10);pageGeom.translate(.111,0,0);const attr=pageGeom.attributes.position;for(let i=0;i<attr.count;i++){const x=attr.getX(i);attr.setZ(i,Math.sin(x/.222*Math.PI)*.011);}pageGeom.computeVertexNormals();const turnPage=mesh(pageGeom,paperTurn,pageHinge);turnPage.castShadow=false;bear.pageHinge=pageHinge;
 bookshopRig={hinge,rainDrops,drops,ripples,rainMatrix:new THREE.Object3D(),rainAmount:raining?1:0,pageHinge};hinge.rotation.y=windowOpen?1.15:0;
 }
 function buildDinner(){
 base();
 for(let row=0;row<8;row++)for(let col=0;col<5;col++){box(world,row%2?materials.wood:materials.woodLight,1.04,.035,.48,-2.18+col*1.09,.069,-1.72+row*.5,.011);}
 // The courtyard is framed by a low wall and lit from an overhead timber rail.
 box(world,materials.blueDark,5.18,.72,.18,0,.44,-1.85,.04);box(world,materials.white,5.29,.085,.27,0,.845,-1.85,.032);
 for(const x of [-2.25,2.25])bar(world,materials.wood,[x,.1,-1.29],[x,3.05,-1.29],.064);bar(world,materials.wood,[-2.3,3.05,-1.29],[2.3,3.05,-1.29],.067);
 tube(world,materials.navy,[[-2.24,3,-1.27],[-1.15,2.82,-1.25],[0,2.76,-1.25],[1.15,2.82,-1.25],[2.24,3,-1.27]],.012);
 for(let i=0;i<7;i++){const x=-2.0+i*.66,y=2.78+Math.pow(x/2,2)*.17;bar(world,materials.navy,[x,y,-1.25],[x,y-.13,-1.25],.009);sphere(world,materials.lamp,x,y-.18,-1.25,.049,.061,.049);}
 for(const x of [-1.6,1.6]){const lg=new THREE.Group();lg.position.set(x,2.35,-1.22);world.add(lg);bar(lg,materials.navy,[0,.36,0],[0,.53,0],.014);sphere(lg,materials.red,0,0,0,.25,.35,.25);for(let i=0;i<12;i++){const a=i*Math.PI/6;const pts=[];for(let n=0;n<=12;n++){const t=n/12*Math.PI;pts.push([Math.cos(a)*Math.sin(t)*.253,Math.cos(t)*.35,Math.sin(a)*Math.sin(t)*.253]);}tube(lg,materials.brickLight,pts,.007);}mesh(new THREE.CylinderGeometry(.095,.095,.045,24),materials.brass,lg,0,.34,0);mesh(new THREE.CylinderGeometry(.095,.095,.045,24),materials.brass,lg,0,-.34,0);for(let i=0;i<7;i++)bar(lg,materials.red,[(i-3)*.011,-.35,0],[(i-3)*.012,-.54,0],.006);const glow=new THREE.PointLight(0xffc280,2.4,4,2);glow.position.set(x,2.1,-.92);world.add(glow);animated.push({type:'lamp',object:glow});}
 const table=new THREE.Group();table.position.set(0,0,.33);world.add(table);box(table,materials.wood,2.35,.15,1.48,0,.98,0,.24);box(table,materials.woodLight,2.33,.044,1.46,0,1.075,0,.23);for(const x of [-.84,.84])for(const z of [-.46,.46])bar(table,materials.wood,[x,.94,z],[x*.94,.1,z*.94],.067);
 function plate(x,z,r=.28){const profile=[new THREE.Vector2(0,0),new THREE.Vector2(r*.6,0),new THREE.Vector2(r*.87,.019),new THREE.Vector2(r,.06),new THREE.Vector2(r,.082),new THREE.Vector2(r*.87,.049),new THREE.Vector2(r*.57,.028),new THREE.Vector2(0,.028)];mesh(new THREE.LatheGeometry(profile,40),materials.white,table,x,1.11,z);return 1.14;}
 // Bamboo steamer and pleated dumplings, soup with sliced garnish, greens.
 const steamer=new THREE.Group();steamer.position.set(-.55,1.12,-.02);table.add(steamer);mesh(new THREE.CylinderGeometry(.33,.32,.135,40,1,true),materials.woodLight,steamer,0,.065,0);for(const y of [.012,.1,.13]){const ring=mesh(new THREE.TorusGeometry(.324,.014,7,40),materials.wood,steamer,0,y,0);ring.rotation.x=Math.PI/2;}mesh(new THREE.CylinderGeometry(.312,.312,.016,40),materials.wood,steamer,0,.014,0);
 for(const [x,z]of [[-.13,-.08],[.13,-.07],[0,.14]]){sphere(steamer,materials.cream,x,.13,z,.107,.09,.1);for(let i=0;i<8;i++){const a=i*Math.PI/4;tube(steamer,materials.white,[[x+Math.cos(a)*.09,.124,z+Math.sin(a)*.085],[x+Math.cos(a)*.055,.187,z+Math.sin(a)*.05],[x,.206,z]],.005);}}
 plate(.35,-.14,.34);const soupMat=new THREE.MeshStandardMaterial({color:0xce8849,roughness:.27});materials.soup=soupMat;mesh(new THREE.CylinderGeometry(.283,.283,.025,40),soupMat,table,.35,1.16,-.14);for(let i=0;i<5;i++){const a=i*2.4;const slice=box(table,materials.cream,.18,.032,.07,.35+Math.cos(a)*.14,1.19,-.14+Math.sin(a)*.14,.022);slice.rotation.y=a;}for(let i=0;i<6;i++)sphere(table,materials.green,.35+Math.sin(i)*.18,1.215,-.14+Math.cos(i*2)*.13,.026,.011,.017);
 plate(.63,.4,.25);for(let i=0;i<9;i++){const a=i*2.399;const l=leaf(table,i%2?materials.green:materials.greenLight,.63+Math.cos(a)*.13,1.19,.4+Math.sin(a)*.1,.18,a,Math.PI/3);l.rotation.x=-.9;}
 for(const [x,z]of [[-.89,.43],[.88,-.48]]){const bowl=new THREE.Group();bowl.position.set(x,1.115,z);table.add(bowl);mesh(new THREE.LatheGeometry([new THREE.Vector2(.065,0),new THREE.Vector2(.08,.035),new THREE.Vector2(.13,.09),new THREE.Vector2(.14,.16),new THREE.Vector2(.135,.17)],30),materials.white,bowl);sphere(bowl,materials.cream,0,.143,0,.122,.045,.122);for(let i=0;i<17;i++){const a=i*2.399,r=Math.sqrt(i/17)*.1;sphere(bowl,materials.white,Math.cos(a)*r,.169-Math.pow(r,2),Math.sin(a)*r,.022,.009,.009);}for(const d of [-.018,.018])bar(table,materials.wood,[x+.16+d,1.137,z-.16],[x+.16+d,1.137,z+.18],.008);}
 // Visible translucent wisps rise from the shared soup rather than opaque cartoon puffs.
 const steamMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.2,depthWrite:false});materials.steam=steamMat;for(let i=0;i<3;i++){const st=tube(table,steamMat,[[.3+i*.06,1.25,-.12],[.26+i*.06,1.39,-.12],[.33+i*.06,1.51,-.12],[.3+i*.06,1.63,-.12]],.008);st.castShadow=false;animated.push({type:'steam',object:st,phase:i});}
 stool(-1.67,.28,.27,.54);stool(1.67,.3,.27,.54);stool(-.7,-.88,.25,.48);stool(.6,1.42,.25,.48);
 const a=addBear(-1.64,.38,.98,.76),b=addBear(1.65,.1,.99,-.61);b.setOutfit('camera');b.group.userData.partner=true;
 potted(-2.33,-1.3,.47);potted(2.32,1.36,.48);potted(2.31,-1.47,.45);
 }
 function clearWorld(){bears.forEach(b=>b.disposeEquipment());for(const c of [...world.children]){c.traverse(o=>o.geometry?.dispose());world.remove(c);}bears.length=0;animated.length=0;bookshopRig=null;}
 function build(value){if(game){game.exit(false);game.dispose();game=null;}gameRestore=null;clearWorld();themeId=value;if(value==='blue')buildBlue();else if(value==='bookshop')buildBookshop();else if(value==='dinner')buildDinner();setLight(lightMode);resize();initGame();}
 function updateCamera({aspect=Math.max(1,container.clientWidth)/Math.max(1,container.clientHeight),dt=0,snap=false}={}){
 const mode=game?.active?'scene':framing,params=framingParameters({theme:themeId,framing:mode,aspect,bearPosition:bears[0]?.group.position,bearScale:bears[0]?.group.scale.x,outfit});
 const k=snap||reducedMotion||!hasRendered?1:Math.min(1,dt*9);
 cameraFocus.lerp(new THREE.Vector3(params.focus.x,params.focus.y,params.focus.z),k);cameraSpan+=(params.span-cameraSpan)*k;
 camera.position.set(cameraFocus.x+Math.sin(angle)*10,cameraFocus.y+5.6,cameraFocus.z+Math.cos(angle)*10);camera.lookAt(cameraFocus);
 camera.left=-cameraSpan*aspect/2;camera.right=cameraSpan*aspect/2;camera.top=cameraSpan/2;camera.bottom=-cameraSpan/2;camera.updateProjectionMatrix();
 }
 function resize(){if(disposed)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h,false);updateCamera({aspect:w/h,snap:true});}
 function setFraming(value){if(['scene','companion'].includes(value))framing=value;}
 function applyLight(t){if(!lightTween)return;const a=lightTween.from,b=lightTween.to,k=t*t*(3-2*t);sun.color.copy(a.sunColor).lerp(b.sunColor,k);hemi.color.copy(a.skyColor).lerp(b.skyColor,k);hemi.groundColor.copy(a.groundColor).lerp(b.groundColor,k);for(const [o,key,from,to]of [[sun,'intensity',a.sun,b.sun],[hemi,'intensity',a.hemi,b.hemi],[ambient,'intensity',a.ambient,b.ambient],[fill,'intensity',a.fill,b.fill],[renderer,'toneMappingExposure',a.exposure,b.exposure]])o[key]=from+(to-from)*k;sun.position.copy(a.position).lerp(b.position,k);for(const entry of lightTween.lamps)entry.object.intensity=entry.from+(b.lamp-entry.from)*k;materials.lamp.emissiveIntensity=a.emissive+(b.emissive-a.emissive)*k;if(t>=1)lightTween=null;}
 function setLight(mode){if(!['day','sunset','night'].includes(mode))return;lightMode=mode;const c={day:[0xffe7d0,3.3,1.8,.27,1.0],sunset:[0xffc594,2.8,1.35,.26,1.01],night:[0xa9c9fa,1.2,1.4,.29,1.04]}[mode];lightTween={start:performance.now(),from:{sunColor:sun.color.clone(),skyColor:hemi.color.clone(),groundColor:hemi.groundColor.clone(),sun:sun.intensity,hemi:hemi.intensity,ambient:ambient.intensity,fill:fill.intensity,exposure:renderer.toneMappingExposure,position:sun.position.clone(),emissive:materials.lamp.emissiveIntensity},to:{sunColor:new THREE.Color(c[0]),skyColor:new THREE.Color(mode==='night'?0x96b6dd:0xdceeff),groundColor:new THREE.Color(mode==='night'?0x675b62:0xb49b76),sun:c[1],hemi:c[2],ambient:c[3],exposure:c[4],fill:mode==='night'?.38:1.2,position:new THREE.Vector3(mode==='sunset'?-5:-3.5,mode==='sunset'?3.5:7,5),lamp:mode==='night'?4.2:mode==='sunset'?1.7:.55,emissive:mode==='night'?.8:.4},lamps:animated.filter(a=>a.type==='lamp').map(a=>({object:a.object,from:a.object.intensity}))};if(reducedMotion||!hasRendered)applyLight(1);}

 function gameTarget(){const b=bears[0];if(!b)return {center:{x:0,y:1,z:0},radii:{x:.2,y:.2,z:.2}};b.group.updateMatrixWorld(true);if(themeId==='bookshop'){const pt=b.readingBook.localToWorld(new THREE.Vector3(0,0,.045)),q=b.readingBook.getWorldQuaternion(new THREE.Quaternion());return {center:{x:pt.x,y:pt.y,z:pt.z},radii:{x:.27,y:.15,z:.24},quaternion:q.toArray()};}const points=b.arms.map(a=>a.localToWorld(new THREE.Vector3(0,-.315,.09))),pt=points[0].add(points[1]).multiplyScalar(.5);return {center:{x:pt.x,y:pt.y,z:pt.z},radii:{x:.31,y:.19,z:.15}};}
 function gameCollision(a,b,{leg,time}){const from=new THREE.Vector3(a.x,a.y,a.z),delta=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),length=delta.length();if(length<1e-8)return null;const ray=new THREE.Raycaster(from,delta.normalize(),.0001,length);for(const hit of ray.intersectObjects(world.children,true)){let o=hit.object,skip=false;while(o){if(!o.visible||o.userData.game||o.isInstancedMesh||o.type==='Points')skip=true;if(bears[0]&&(o===bears[0].arms[0]||o===bears[0].arms[1]||o===bears[0].readingBook||(leg==='return'&&time<.27&&o===bears[0].group)))skip=true;o=o.parent;}if(!skip&&hit.object.isMesh&&hit.object.material?.opacity!==0)return {t:hit.distance/length,point:hit.point};}return null;}
 function initGame(){game=createPaperGame({world,getTarget:gameTarget,collide:gameCollision,reducedMotion,onState:onGameState,onResult:onGameResult,onCatch:e=>{catchReaction={...e,start:performance.now()};}});}
 function enterGame(options={}){if(!['blue','bookshop'].includes(themeId))return {accepted:false,reason:'unsupported-theme'};if(game?.active)exitGame();gameRestore={angle:targetAngle};catchReaction=null;bears.forEach(b=>b.setOutfit('scarf'));targetAngle=.2;onCancel();return game.enter({...options,theme:themeId,windowOpen});}
 function exitGame(){if(!game?.active)return;game.exit();bears.forEach(b=>b.setOutfit(outfit));if(gameRestore)targetAngle=gameRestore.angle;gameRestore=null;catchReaction=null;}
 function setPose(value,{restart=false}={}){if(game?.active)return;if(!['wave','sit','walk','show-bag'].includes(value)||value==='show-bag'&&!equipment.bag||value===pose&&!restart)return;pose=value;elapsed=0;poseStarted=performance.now();}
 function setOutfit(value){if(!['scarf','camera','umbrella'].includes(value))return;outfit=value;bears.forEach(b=>b.setOutfit(game?.active?'scarf':value));}
 function setEquipment(value={}){equipment={bag:value.bag==='canvas-travel'?'canvas-travel':null,badge:value.badge==='blue-house'?'blue-house':null,bookmark:value.bookmark==='leaf'?'leaf':null};bears.forEach(b=>b.setEquipment(equipment));if(pose==='show-bag'&&!equipment.bag){pose='wave';elapsed=0;poseStarted=performance.now();}}
 function setWindow(value){if(game?.flying)return;if(themeId==='bookshop'){windowOpen=Boolean(value);game?.setEnvironment({windowOpen});if(reducedMotion&&bookshopRig)bookshopRig.hinge.rotation.y=windowOpen?1.15:0;}}
 function setRain(value){if(themeId==='bookshop')raining=Boolean(value);}
 function setAngle(value){if(Number.isFinite(value))targetAngle=angle+normalAngle(value-angle);}
 function onDown(e){if(e.button!==0||game?.active)return;pointer={x:e.clientX,y:e.clientY,angle:targetAngle,id:e.pointerId};dragged=false;}
 function onMove(e){if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(!dragged&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)){dragged=true;renderer.domElement.setPointerCapture(e.pointerId);}if(dragged){targetAngle=pointer.angle-dx*.008;e.preventDefault();}}
 function onUp(e){if(pointer&&dragged){onChange({angle:normalAngle(targetAngle)});}else if(pointer&&e){const r=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);for(const hit of raycaster.intersectObjects(world.children,true).slice(0,1)){let obj=hit.object;while(obj&&!obj.userData.interactive)obj=obj.parent;if(obj?.userData.interactive==='bear'){setPose('wave',{restart:true});onInteraction({type:'pose',value:'wave'});break;}if(obj?.userData.interactive==='window'){setWindow(!windowOpen);onInteraction({type:'window',value:windowOpen});break;}if(obj?.userData.interactive==='rain'){setRain(!raining);onInteraction({type:'rain',value:raining});break;}if(obj?.userData.interactive==='light'){const value=lightMode==='night'?'day':'night';setLight(value);onInteraction({type:'light',value});break;}}}pointer=null;dragged=false;}
 function onCancel(){pointer=null;dragged=false;}
 function setActive(value){active=Boolean(value);if(!active){exitGame();cancelAnimationFrame(frame);frame=null;onCancel();}else if(!disposed&&!frame){last=performance.now();frame=requestAnimationFrame(tick);}}
 renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',onCancel);
 function tick(now){frame=null;if(disposed||!active)return;const dt=Math.min(.05,(now-last)/1000);last=now;elapsed=(now-poseStarted)/1000;if(lightTween)applyLight(clamp((now-lightTween.start)/500,0,1));angle+= (targetAngle-angle)*Math.min(1,dt*9);
 for(const a of animated)if(a.type==='steam')a.object.visible=!reducedMotion||a.phase===1;
 if(bookshopRig){const rig=bookshopRig;rig.hinge.rotation.y+=( (windowOpen?1.15:0)-rig.hinge.rotation.y)*(reducedMotion?1:Math.min(1,dt*6));rig.rainAmount+=((raining?1:0)-rig.rainAmount)*Math.min(1,dt*5);rig.rainDrops.visible=raining&&!reducedMotion;const tm=now/1000;rig.drops.forEach((d,i)=>{const y=2.78-((tm*d.speed+d.phase)%1)*2.68;rig.rainMatrix.position.set(d.x,y,d.z);rig.rainMatrix.rotation.set(0,0,-.065);rig.rainMatrix.scale.setScalar(rig.rainAmount);rig.rainMatrix.updateMatrix();rig.rainDrops.setMatrixAt(i,rig.rainMatrix.matrix);});rig.rainDrops.instanceMatrix.needsUpdate=true;rig.ripples.forEach((r,i)=>{r.visible=raining&&!reducedMotion;const v=(tm*.8+i*.33)%1;r.scale.setScalar(.45+v*2);r.material.opacity=(1-v)*.34*rig.rainAmount;});}
 for(const b of bears){
 const t=reducedMotion?10:elapsed+(b.group.userData.partner?.7:0),smooth=reducedMotion?1:Math.min(1,dt*8);
 let px=b.base.x,py=.095,pz=b.base.z,ry=b.base.rotation,bodyY=0,headY=0,headX=0,headZ=-.035,armLz=-.16,armRz=.16,armLx=0,armRx=0,footX=0,footZ=.08;
 if(pose==='wave'){armLz=-1.78-Math.sin(t*3.4)*.15;armLx=-.2;headZ=-.06+Math.sin(t*1.2)*.023;}
 else if(pose==='show-bag'){pz=b.base.z+.3;ry=b.base.rotation+Math.PI+.2;headY=-.68;headX=-.06;armLx=-.25;armRx=-.25;headZ=.035;}
 else if(pose==='sit'){
 if(themeId==='blue'){px=-.26;pz=.5;py=.32;ry=.62;}else if(themeId==='bookshop'){px=.56;pz=.67;py=.355;ry=.43;}else{px=b.base.x;pz=b.base.z;py=.29;}
 footX=-1.18;footZ=.22;armLx=-.78;armRx=-.78;armLz=-.1;armRz=.1;headZ=.015;headX=.21;headY=Math.sin(t*.7)*.055;
 }else if(pose==='walk'){
 const progress=clamp(t/3.5,0,1),q=progress*progress*(3-2*progress),moving=progress<1?1:0;
 if(themeId==='blue'&&outfit==='umbrella'){const phase=progress<.22?clamp(progress/.22,0,1):clamp((progress-.22)/.78,0,1),ease=phase*phase*(3-2*phase);if(progress<.22){px=b.base.x;pz=b.base.z+(.89-b.base.z)*ease;ry=b.base.rotation;}else{px=b.base.x+(.38-b.base.x)*ease;pz=.89+.08*ease;ry=progress<.82?-.68:b.base.rotation;}}else if(themeId==='blue'){px=b.base.x+(-.53-b.base.x)*q;pz=b.base.z+(-.58-b.base.z)*q+.23*Math.sin(q*Math.PI);ry=progress<.82?-1.99:b.base.rotation;}
 else if(themeId==='bookshop'){if(outfit==='umbrella'){px=b.base.x+(-.75-b.base.x)*q;pz=b.base.z+.18*q;ry=progress<.82?-1.4:.35;}else{const segment=progress<.46?clamp(progress/.46,0,1):clamp((progress-.46)/.54,0,1),ease=segment*segment*(3-2*segment);if(progress<.46){px=b.base.x+(-.98-b.base.x)*ease;pz=b.base.z+.03*ease;ry=-1.55;}else{px=-.98;pz=b.base.z+.03+(-.13-b.base.z-.03)*ease;ry=progress<.91?Math.PI:.38;}}}
 else{px=b.base.x-(.5*q);pz=b.base.z-.52*q;ry=progress<.82?-2.05:b.base.rotation;}
 armLx=Math.sin(t*6)*.35*moving;armRx=-Math.sin(t*6)*.35*moving;footX=-Math.sin(t*6)*.25*moving;bodyY=Math.abs(Math.sin(t*6))*.021*moving;headY=progress>.8?.14:0;
 }
 if(themeId==='bookshop'&&pose==='sit'&&outfit!=='umbrella'){const cycle=t%9,turn=clamp((cycle-2)/1.35,0,1);if(b.pageHinge){b.pageHinge.rotation.y=cycle<2?0:cycle<3.35?-Math.PI*turn:0;b.pageHinge.visible=cycle<3.35;}if(cycle>2&&cycle<3.4){armRx=-.78-Math.sin(turn*Math.PI)*.22;armRz=.1-Math.sin(turn*Math.PI)*.29;}if(cycle>5.5&&cycle<8){const look=Math.sin((cycle-5.5)/2.5*Math.PI);ry=.43+.78*look;headY=1.3*look;headX=.21-.25*look;}}
 if(!game?.active&&outfit==='umbrella'){armLx=-.2;armLz=-.22;if(pose==='wave'){armRz=1.78+Math.sin(t*3.4)*.15;armRx=-.2;}if(pose==='sit'){armRx=-.2;armRz=.16;headX=.035;}}
 if(game?.active){const st=game.getState(),paper=game.bird.position;px=themeId==='bookshop'?.56:b.base.x;py=themeId==='bookshop'?.355:.095;pz=themeId==='bookshop'?.67:b.base.z;ry=0;bodyY=0;headZ=0;headX=.08;headY=clamp((paper.x-px)*.35,-.4,.4);armLz=-.06;armRz=.06;armLx=themeId==='bookshop'?-.78:-1.35;armRx=armLx;footX=themeId==='bookshop'?-1.18:0;footZ=themeId==='bookshop'?.22:.08;if(catchReaction&&catchReaction.leg==='outbound'&&themeId==='blue'){const v=clamp((performance.now()-catchReaction.start)/500,0,1);headX=.08+.12*Math.sin(v*Math.PI);armLz=-.06+.10*Math.sin(v*Math.PI);armRz=.06-.10*Math.sin(v*Math.PI);}if(st.phase==='return'&&st.flight?.time<.4){const follow=Math.sin(clamp(st.flight.time/.4,0,1)*Math.PI);armLx-=.35*follow;armRx-=.35*follow;headX-=.1*follow;}if(b.pageHinge)b.pageHinge.visible=false;}
 b.group.position.lerp(new THREE.Vector3(px,py,pz),smooth);let da=ry-b.group.rotation.y;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;b.group.rotation.y+=da*smooth;
 const isReading=game?.active?themeId==='bookshop':pose==='sit'&&outfit!=='umbrella';b.updateEquipmentPose(isReading);b.rig.position.y+=(bodyY-b.rig.position.y)*smooth;const bookScale=isReading?1:.001;b.readingBook.scale.setScalar(b.readingBook.scale.x+(bookScale-b.readingBook.scale.x)*smooth);b.torso.rotation.x+=((pose==='sit'?.035:0)-b.torso.rotation.x)*smooth;b.head.rotation.x+=(headX-b.head.rotation.x)*smooth;b.head.rotation.y+=(headY-b.head.rotation.y)*smooth;b.head.rotation.z+=(headZ-b.head.rotation.z)*smooth;
 for(const [arm,x,z]of [[b.arms[0],armLx,armLz],[b.arms[1],armRx,armRz]]){arm.rotation.x+=(x-arm.rotation.x)*smooth;arm.rotation.z+=(z-arm.rotation.z)*smooth;}
 b.feet.forEach((f,i)=>{const fx=!game?.active&&pose==='walk'&&i===1?-footX:footX;f.rotation.x+=(fx-f.rotation.x)*smooth;f.position.z+=(footZ-f.position.z)*smooth;});
 const blink=!reducedMotion&&Math.sin(t*.63)>.998;b.eyes.forEach(e=>e.scale.y=blink?.009:.06);
 }

 if(game?.active)world.updateMatrixWorld(true);game?.update(dt);updateCamera({dt});renderer.render(scene,camera);hasRendered=true;frame=requestAnimationFrame(tick);}
 build(theme);resize();observer=new ResizeObserver(resize);observer.observe(container);frame=requestAnimationFrame(tick);requestAnimationFrame(()=>onReady({theme:themeId}));
 return {getGameCapabilities(){return {version:'paper-bird-v1',single:true,relay:true,stableCatch:true,themes:['blue','bookshop']};},enterGame,exitGame,setAimPreview(input){return game.setAimPreview(input);},throwBird(input){return game.throwBird(input);},setCatchPosition(value){return game.setCatchPosition(value);},resumeReturn(){return game.resumeReturn();},getGameState(){return game.getState();},setGameOrigin(value){return game.setOrigin(value);},setTheme(value){if(value===themeId)return;if(!themes.has(value))return;build(value);},setLight,setOutfit,setPose,setAngle,setFraming,setActive,setWindow,setRain,setEquipment,getState(){return {theme:themeId,angle:normalAngle(targetAngle),framing,effectiveFraming:game?.active?'scene':framing,light:lightMode,outfit,pose,equipment:{...equipment},...(themeId==='bookshop'?{windowOpen,raining}:{} )};},getAngle(){return normalAngle(targetAngle);},capture({width,height}={}){if(lightTween)applyLight(1);if(bookshopRig)bookshopRig.hinge.rotation.y=windowOpen?1.15:0;angle=targetAngle;updateCamera({snap:true});const oldSize=renderer.getSize(new THREE.Vector2()),oldRatio=renderer.getPixelRatio();try{if(width||height){const w=clamp(Math.round(width||height),1,4096),h=clamp(Math.round(height||width),1,4096),aspect=w/h;renderer.setPixelRatio(1);renderer.setSize(w,h,false);updateCamera({aspect,snap:true});}renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}finally{renderer.setPixelRatio(oldRatio);renderer.setSize(oldSize.x,oldSize.y,false);updateCamera({aspect:oldSize.x/oldSize.y,snap:true});renderer.render(scene,camera);}},dispose(){if(disposed)return;disposed=true;game?.dispose();bears.forEach(b=>b.disposeEquipment());cancelAnimationFrame(frame);observer?.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointercancel',onCancel);scene.traverse(o=>o.geometry?.dispose());Object.values(materials).forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}};
 }catch(error){onError(error);renderer?.dispose();renderer?.domElement?.remove();return {getGameCapabilities(){return {single:false,relay:false,stableCatch:false};},enterGame(){return {accepted:false,reason:'render-unavailable'};},exitGame(){},setAimPreview(){return false;},throwBird(){return {accepted:false,reason:'render-unavailable'};},getGameState(){return null;},setCatchPosition(){},resumeReturn(){return {accepted:false,reason:'render-unavailable'};},setGameOrigin(){},setTheme(){},setLight(){},setOutfit(){},setPose(){},setAngle(){},setFraming(){},setActive(){},setWindow(){},setRain(){},setEquipment(){},getState(){return null;},getAngle(){return null;},capture(){return null;},dispose(){disposed=true;observer?.disconnect();cancelAnimationFrame(frame);}};}
}
