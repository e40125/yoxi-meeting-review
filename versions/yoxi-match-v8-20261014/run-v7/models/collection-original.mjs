import * as THREE from 'three';

function rounded(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function shapeMesh(shape,depth,mat,bevel=.012){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:4,bevelSize:bevel,bevelThickness:bevel,steps:1,curveSegments:24});g.translate(0,0,-depth/2);const m=new THREE.Mesh(g,mat);m.castShadow=m.receiveShadow=true;return m;}
function box(g,m,w,h,d,x=0,y=0,z=0,r=.025){const o=shapeMesh(rounded(w,h,Math.min(r,w/2,h/2)),d,m,Math.min(.015,d/4));o.position.set(x,y,z);g.add(o);return o;}
function tube(g,m,p,r=.008){const curve=new THREE.CatmullRomCurve3(p.map(a=>new THREE.Vector3(...a)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,p.length*7),r,9,false),m);g.add(o);o.castShadow=true;return o;}
function stroke(g,m,p,r=.008){const curve=new THREE.CurvePath();for(let i=1;i<p.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...p[i-1]),new THREE.Vector3(...p[i])));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(64,p.length*12),r,10,false),m);g.add(o);o.castShadow=true;return o;}
function studioMap(){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#f5f5ed');g.addColorStop(.35,'#c2cfce');g.addColorStop(.6,'#657780');g.addColorStop(1,'#d2c0a2');x.fillStyle=g;x.fillRect(0,0,1024,512);x.fillStyle='#fffefa';x.fillRect(100,90,200,190);x.fillRect(630,65,90,190);x.fillStyle='#293947';x.fillRect(430,180,90,200);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;return t;}
function sphere(g,m,x,y,z,sx,sy,sz){const o=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function clothTexture(){const c=document.createElement('canvas'),a=document.createElement('canvas');c.width=c.height=a.width=a.height=512;const bump=c.getContext('2d'),color=a.getContext('2d');bump.fillStyle='#737373';bump.fillRect(0,0,512,512);color.fillStyle='#d8c9ac';color.fillRect(0,0,512,512);for(let y=0;y<512;y+=8)for(let x=0;x<512;x+=8){const horizontal=((x+y)/8)%2===0;const g=bump.createLinearGradient(horizontal?x:x+1,horizontal?y+1:y,horizontal?x:x+7,horizontal?y+7:y);g.addColorStop(0,'#777');g.addColorStop(.4,'#dfdfdf');g.addColorStop(.65,'#c8c8c8');g.addColorStop(1,'#797979');bump.fillStyle=g;bump.fillRect(x+(horizontal?0:1),y+(horizontal?1:0),horizontal?8:6,horizontal?6:8);color.fillStyle=horizontal?'#e8dcc4':'#dfd1b5';color.fillRect(x+(horizontal?0:1),y+(horizontal?1:0),horizontal?8:6,horizontal?6:8);color.fillStyle='#eee4ce';color.fillRect(x+(horizontal?0:2),y+(horizontal?2:0),horizontal?8:1,horizontal?1:8);}const height=new THREE.CanvasTexture(c),albedo=new THREE.CanvasTexture(a);albedo.colorSpace=THREE.SRGBColorSpace;for(const t of [height,albedo]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.1,1.1);t.anisotropy=4;}return {height,albedo};}
function mat(color,roughness=.7,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
export function createCollectibleModel(item,{badge=false,bookmark=false}={}){
 const env=studioMap(),g=new THREE.Group(),brass=mat(0xc6a164,.28,.88,{envMap:env,envMapIntensity:.8}),cream=mat(0xf1e8d1,.85),navy=mat(0x284f74,.78),enamel=mat(0x294e87,.27,.05,{envMap:env,envMapIntensity:.55}),ivory=mat(0xf7f1de,.4),green=mat(0x315f4d,.6),red=mat(0xaa5947,.9);
 if(item==='badge'){
 const s=new THREE.Shape();s.moveTo(-.365,-.335);s.lineTo(.365,-.335);s.lineTo(.365,.135);s.lineTo(0,.445);s.lineTo(-.365,.135);s.closePath();g.add(shapeMesh(s,.065,brass,.017));const inside=s.clone();const face=shapeMesh(inside,.013,enamel,.01);face.scale.set(.915,.915,1);face.position.z=.048;g.add(face);
 const frame=[[-.288,-.255,.068],[-.288,.11,.068],[0,.36,.068],[.288,.11,.068],[.288,-.255,.068],[-.288,-.255,.068]];stroke(g,ivory,frame,.023);
 function insetFrame(w,h,x,y){const s=rounded(w,h,.009);s.holes.push(rounded(w-.025,h-.025,.003));const f=shapeMesh(s,.01,ivory,.002);f.position.set(x,y,.076);g.add(f);}
 insetFrame(.14,.17,-.09,.01);insetFrame(.14,.17,.10,.01);insetFrame(.145,.138,.09,-.199);box(g,ivory,.118,.012,.013,-.09,.01,.087,.002);
 tube(g,brass,[[-.20,-.015,-.078],[.19,-.015,-.078]],.012);box(g,brass,.065,.085,.045,-.22,-.015,-.065,.02);tube(g,brass,[[.18,-.05,-.066],[.23,-.05,-.09],[.23,.025,-.09],[.195,.025,-.06]],.013);
 g.userData.item='badge';
 }else if(item==='bookmark'){
 const s=new THREE.Shape();s.moveTo(0,-.28);s.bezierCurveTo(-.32,-.05,-.27,.45,0,.68);s.bezierCurveTo(.28,.45,.29,.02,0,-.28);s.closePath();const leaf=shapeMesh(s,.018,green,.006);g.add(leaf);
 tube(g,brass,[[0,-.265,.027],[.015,-.04,.034],[.012,.18,.039],[0,.61,.031]],.009);
 for(const [y,w]of [[-.1,.16],[.05,.22],[.22,.2],[.38,.14]])for(const sign of [-1,1])tube(g,brass,[[.01,y,.032],[sign*w*.6,y+.10,.032],[sign*w,y+.155,.026]],.006);
 const eye=new THREE.Mesh(new THREE.TorusGeometry(.043,.012,10,32),brass);eye.position.set(0,-.30,0);g.add(eye);
 tube(g,red,[[0,-.34,.01],[-.06,-.47,.024],[.018,-.58,.018],[.075,-.67,.02],[.032,-.79,.018]],.016);
 for(let i=0;i<6;i++)tube(g,red,[[.03+(i-2.5)*.005,-.765,.02],[.03+(i-2.5)*.009,-.91-.018*Math.cos(i),.018]],.005);
 // A fine sprung clip on the back is visible when the reader rotates the object.
 tube(g,brass,[[0,.38,-.045],[.064,.30,-.046],[.06,-.035,-.045],[0,-.10,-.042],[-.055,-.03,-.041],[-.05,.22,-.045]],.012);
 g.userData.item='bookmark';
 }else if(item==='bag'){
 const weave=clothTexture();const canvas=mat(0xfffdf6,.94,0,{map:weave.albedo,bumpMap:weave.height,bumpScale:.016});const leather=mat(0x73513d,.74);const seam=mat(0xc5ae84,.85);
 box(g,canvas,1.12,1.10,.33,0,-.02,0,.15);box(g,canvas,.89,.52,.06,0,-.27,.2,.085);box(g,navy,1.145,.5,.067,0,.38,.215,.105);
 // Soft flap seam, practical fastening and canvas side gussets.
 tube(g,seam,[[-.455,.52,.256],[-.47,.21,.261],[-.38,.145,.263],[.38,.145,.263],[.47,.21,.261],[.455,.52,.256]],.008);
 box(g,leather,.145,.41,.021,0,.13,.263,.025);box(g,brass,.178,.156,.035,0,.14,.286,.025);box(g,leather,.10,.104,.006,0,.14,.308,.011);tube(g,brass,[[-.079,.14,.318],[.079,.14,.318]],.009);
 for(const x of [-.525,.525]){tube(g,seam,[[x,-.39,.11],[x,-.46,0],[x,-.39,-.12],[x,.4,-.12]],.008);const ring=new THREE.Mesh(new THREE.TorusGeometry(.049,.012,10,28),brass);ring.position.set(x,.34,.04);ring.rotation.y=Math.PI/2;g.add(ring);}
 // Padded shoulder straps, a carrying handle and real back details.
 for(const sign of [-1,1])tube(g,navy,[[sign*.32,.51,-.145],[sign*.4,.40,-.29],[sign*.36,-.33,-.31],[sign*.3,-.43,-.15]],.052);
 tube(g,navy,[[-.19,.49,-.04],[-.16,.73,-.04],[.16,.73,-.04],[.19,.49,-.04]],.046);
 tube(g,seam,[[-.45,-.45,.244],[0,-.455,.248],[.45,-.45,.244]],.007);
 for(let j=0;j<11;j++){const x=-.41+j*.082;tube(g,cream,[[x,-.46,.25],[x+.023,-.46,.25]],.003);}
 if(badge){const b=createCollectibleModel('badge');b.scale.setScalar(.57);b.position.set(.18,-.22,.247);b.rotation.z=-.06;g.add(b);}
 if(bookmark){const b=createCollectibleModel('bookmark');b.scale.setScalar(.43);b.position.set(-.43,-.18,.278);b.rotation.z=-.14;g.add(b);}
 g.userData.item='bag';
 }
 return g;
}
export function disposeCollectibleModel(model){const geoms=new Set(),mats=new Set(),maps=new Set();model?.traverse(o=>{if(o.geometry)geoms.add(o.geometry);for(const m of [].concat(o.material||[])){mats.add(m);for(const key of ['map','bumpMap','normalMap','roughnessMap','envMap'])if(m[key])maps.add(m[key]);}});geoms.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());maps.forEach(x=>x.dispose());}
export function createCollectiblePreview(container,{item='badge',onReady=()=>{},onError=()=>{},reducedMotion=false}={}){
 let renderer,scene,camera,model,frame,drag=null,angle=.35,target=.35,disposed=false;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;container.appendChild(renderer.domElement);renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;';renderer.domElement.setAttribute('aria-label','可轉動的小物模型');scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(31,1,.1,30);camera.position.set(0,.17,3.5);camera.lookAt(0,0,0);scene.add(new THREE.HemisphereLight(0xebf4ff,0xab9474,2.4));const key=new THREE.DirectionalLight(0xffecd6,3.2);key.position.set(-3,4,5);scene.add(key);const fill=new THREE.DirectionalLight(0xb5d1ed,1.3);fill.position.set(4,1,-2);scene.add(fill);
 function setItem(id){if(!['badge','bag','bookmark'].includes(id))return;if(model){scene.remove(model);disposeCollectibleModel(model);}item=id;model=createCollectibleModel(id);if(id==='badge')model.scale.setScalar(1.45);if(id==='bookmark'){model.scale.setScalar(1.04);model.position.y=.1;}scene.add(model);}
 function resize(){const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function tick(){if(disposed)return;angle+=(target-angle)*.13;model.rotation.y=angle;renderer.render(scene,camera);frame=requestAnimationFrame(tick);}
 function down(e){if(e.button!==0)return;drag={x:e.clientX,angle:target,id:e.pointerId,moved:false};}function move(e){if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>8){drag.moved=true;renderer.domElement.setPointerCapture(e.pointerId);target=drag.angle+dx*.012;}}function up(){drag=null;}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);const ro=new ResizeObserver(resize);ro.observe(container);setItem(item);resize();tick();onReady({item});return{setItem,setAngle(v){if(Number.isFinite(v)){target=v;if(reducedMotion)angle=v;}},capture(){model.rotation.y=target;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);disposeCollectibleModel(model);renderer.dispose();renderer.domElement.remove();}};
 }catch(e){onError(e);return{setItem(){},setAngle(){},capture(){return null;},dispose(){disposed=true;renderer?.dispose();renderer?.domElement?.remove();}};}
}
