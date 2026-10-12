import {createCompanionStore,COLLECTIBLES,COMPANION_KEY} from './companion-core.mjs';
import {launchVelocity} from './game-scene.mjs';
import {createCollectiblePreview} from './art/collectibles.mjs';
const $=s=>document.querySelector(s),emptyEquipment=()=>({bag:null,badge:null,bookmark:null});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const itemCopy={bag:{text:'奶油色帆布、深藍翻蓋與黃銅扣件。帶上旅行包，再把旅途的小物掛在上面。',from:'在任一場景第一次接住紙鳥。'},badge:{text:'把藍牆與白色窗框，收進一枚琺瑯徽章。可以別在旅行包上，陪旅伴走到下一個街角。',from:'在藍色街角接住一次紙鳥。'},bookmark:{text:'用一片葉子，記住今天讀到的地方。旅伴坐下閱讀時，書籤會出現在旅行本上。',from:'讓紙鳥停在雨後書店的書頁上。'}};
export function mountCompanionUI({getWorld,collectionStore,patchDraft,icons,toast,showStudio,reduced}){
 const companion=createCompanionStore();let playing=false,gameState=null,needsInitialAim=false,lastResult=null,itemViewer=null,itemKey=null,turnBack=false,drag=null,rewardItems=[];
 let previewKey='badge',queuedRewards=[],rewardTimer=null,gameSession=0,itemContext=null,itemTrigger=null,itemCloseIntent=null,resumeAim=null,focusAfterPrepare=false;
 const s=()=>companion.getState(),d=()=>collectionStore.getState().draft;
 const stateNames={preparing:'旅伴準備好了，就可以拋出紙鳥。',aiming:'箭頭是出手方向。向後拉，放開就拋出。',outbound:'看看紙鳥會落在哪裡。',caught:'接到了！準備接住旅伴拋回來的紙鳥。',return:'移動下方的位置，接住回來的紙鳥。','awaiting-catch':'調整接取位置，再按「繼續接回」。',result:'調整角度，再試一次。'};
 function restoreGear(){if(!d().editingCardId)patchDraft({equipment:s().equipment});}
 function renderSummary(){const st=s();$('#companion-level').textContent=`旅伴 ${st.level} 級`;$('#progress-label').textContent=st.level===3?'已開啟來回接力':'旅伴成長';$('#progress-value').textContent=st.nextXp?`${st.xp} / ${st.nextXp}`:'3 級';$('#progress-fill').style.width=`${st.nextXp?Math.min(100,st.xp/st.nextXp*100):100}%`;$('#owned-count').textContent=`${Object.values(st.owned).filter(Boolean).length} / 3`;$('#show-bag').hidden=!d().equipment?.bag;
  previewKey=d().sceneId==='bookshop'?'bookmark':'badge';
  $('#next-keepsake-image').src=`assets/item-${previewKey}.png`;
  $('#next-keepsake-title').textContent=COLLECTIBLES[previewKey].name;
  $('#companion-next').textContent=!st.owned[previewKey]?(previewKey==='bookmark'?'讓紙鳥停在書頁上，就能收下。':'在街角接住一次紙鳥，就能收下。'):st.pendingItems.includes(previewKey)?'這次進度尚未保存。':st.equipment[previewKey]?(previewKey==='bookmark'?'書籤已放進旅行本。':'已別在旅行包上，陪旅伴一起走。'):(previewKey==='bookmark'?'已收藏。帶上書籤，坐下讀一會。':'已收藏。別在旅行包上，留下紀念。');
  $('#companion-storage').hidden=st.storageStatus.persistent;$('#companion-storage').textContent=st.storageStatus.message;$('#retry-progress').hidden=st.storageStatus.persistent;
  if($('#companion-dialog').open)renderCompanion();
 }
 function renderCompanion(){const st=s();$('#companion-summary').replaceChildren();const level=document.createElement('strong');level.textContent=`旅伴 ${st.level} 級`;const detail=document.createElement('span');detail.textContent=st.nextXp?`${st.xp} / ${st.nextXp} 成長值`:'來回接力已開啟';$('#companion-summary').append(level,detail);
  $('#keepsake-grid').replaceChildren(...Object.entries(COLLECTIBLES).map(([key,item])=>{const b=document.createElement('button');b.className='keepsake'+(st.owned[key]?'':' unowned');const photo=document.createElement('span');photo.className='keepsake-photo';const im=document.createElement('img');im.src=`assets/item-${key}.png`;im.alt=item.name;im.width=240;im.height=240;photo.append(im);if(st.equipment[key]){const check=document.createElement('i');check.dataset.icon='check';photo.append(check)}const title=document.createElement('strong');title.textContent=item.name;const status=document.createElement('span');status.textContent=st.equipment[key]?'已帶在身上':st.owned[key]?'已收藏，可近看':key==='bag'?'第一次接住紙鳥':key==='badge'?'藍色街角的紀念':'雨後書店的紀念';b.append(photo,title,status);b.onclick=()=>openItem(key);return b;}));icons($('#keepsake-grid'));
  $('#companion-tasks').innerHTML=st.tasks.map(t=>`<div class="task-row"><strong>${t.name}</strong><span class="${t.done?'task-state':''}">${t.done?'已完成':`${t.count} / ${t.total}`}</span></div>`).join('')+`<div class="relay-block"><h3>和旅伴來回接力</h3><p>${st.level>=3?'旅伴會把紙鳥拋回來。看準落點，移動位置接住。':'完成任三項挑戰，旅伴達到 3 級後開啟。'}</p>${st.level>=3?'<label><input type="checkbox" id="stable-catch">接回前暫停，留時間調整位置</label><button class="primary" id="start-relay">開始來回接力</button>':''}</div>`;
  if(st.level>=3)$('#start-relay').onclick=()=>{const stable=$('#stable-catch').checked;$('#companion-dialog').close();start('relay',stable)};
 }
 function openCompanion(tab='items'){renderCompanion();$('#companion-dialog').showModal();chooseCompanionTab(tab);}
 function chooseCompanionTab(tab){document.querySelectorAll('[data-companion-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.companionTab===tab));b.tabIndex=b.dataset.companionTab===tab?0:-1;});$('#keepsake-grid').hidden=tab!=='items';$('#companion-tasks').hidden=tab!=='tasks';}
 $('[data-companion-tab="items"]').onclick=()=>chooseCompanionTab('items');$('[data-companion-tab="tasks"]').onclick=()=>chooseCompanionTab('tasks');
 $('.companion-tabs').onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const tab=$('[data-companion-tab="items"]').getAttribute('aria-selected')==='true'?'tasks':'items';chooseCompanionTab(tab);$(`[data-companion-tab="${tab}"]`).focus();}};
 function focusItemReturn(target){requestAnimationFrame(()=>{const next=target?.isConnected&&!target.closest('[hidden]')?target:$('#start-game');next?.focus({preventScroll:true});});}
 function itemState(){
  const st=s(),acquired=Boolean(itemContext?.keys?.length);
  $('#item-dialog').dataset.acquired=String(acquired);
  $('#item-status').textContent=acquired?'剛收下的小物':st.owned[itemKey]?(st.storageStatus.persistent?'旅行小物':'本次暫存的旅行小物'):'尚未收藏';
  $('#item-title').textContent=COLLECTIBLES[itemKey].name;$('#item-description').textContent=itemCopy[itemKey].text;
  $('#item-source').textContent=st.owned[itemKey]?`來自${st.acquisition[itemKey]?.theme==='blue'?'藍色街角':'雨後書店'}的紙鳥小遊戲。`:itemCopy[itemKey].from;
  $('#equip-item').textContent=!st.owned[itemKey]?'去玩紙鳥小遊戲':st.equipment[itemKey]?'從旅伴身上取下':itemKey==='bookmark'?'帶上書籤，讀一會':'讓旅伴帶上';
  $('#continue-playing').hidden=!itemContext?.resume;
  const choices=$('#acquired-choices');choices.hidden=!acquired||itemContext.keys.length<2;
  choices.replaceChildren(...(itemContext?.keys||[]).map(key=>{const b=document.createElement('button');b.className='acquired-choice';b.setAttribute('aria-pressed',String(key===itemKey));const img=document.createElement('img');img.src=`assets/item-${key}.png`;img.alt='';const label=document.createElement('span');label.textContent=COLLECTIBLES[key].name;b.append(img,label);b.onclick=()=>showItem(key);return b;}));
 }
 function showItem(key){
  itemKey=key;turnBack=false;$('#turn-item').lastChild.textContent='看看背面';itemState();
  const dialog=$('#item-dialog');if(!dialog.open)dialog.showModal();
  itemViewer?.dispose();itemViewer=createCollectiblePreview($('#item-viewer'),{item:key,reducedMotion:reduced,onError:()=>toast('小物未能打開，請重新整理。')});
  $('#item-title').focus({preventScroll:true});
 }
 function openItem(key,context=null){
  itemTrigger=context?$('#start-game'):document.activeElement;
  if(playing)end();itemContext=context;itemCloseIntent=null;showItem(key);
 }
 $('#preview-keepsake').onclick=()=>openItem(previewKey);
 $('#item-dialog').addEventListener('close',()=>{
  itemViewer?.dispose();itemViewer=null;
  const intent=itemCloseIntent,target=intent==='equipped'?$('#capture'):itemTrigger;
  itemContext=null;itemCloseIntent=null;
  if(intent!=='continue')focusItemReturn(target);
 });
 $('#continue-playing').onclick=()=>{
  const resume=itemContext?.resume;if(!resume)return;
  itemCloseIntent='continue';$('#item-dialog').close();$('#companion-dialog').close();
  patchDraft({sceneId:resume.sceneId});start(resume.mode,resume.stableCatch,resume);
 };
 $('#turn-item').onclick=()=>{turnBack=!turnBack;itemViewer?.setAngle(turnBack?Math.PI:0);$('#turn-item').lastChild.textContent=turnBack?'回到正面':'看看背面';};
 $('#equip-item').onclick=()=>{
  const st=s();
  if(!st.owned[itemKey]){const scene=itemKey==='bookmark'?'bookshop':'blue';itemCloseIntent='continue';$('#item-dialog').close();$('#companion-dialog').close();patchDraft({sceneId:scene});start();return;}
  let eq={...st.equipment};
  if(eq[itemKey]){eq[itemKey]=null;if(itemKey==='bag')eq=emptyEquipment();}
  else{eq[itemKey]=COLLECTIBLES[itemKey].id;if(itemKey!=='bag')eq.bag=COLLECTIBLES.bag.id;}
  try{
   const changed=companion.equip(eq),putOn=Boolean(eq[itemKey]),putAwayUmbrella=putOn&&itemKey==='bookmark'&&d().propId==='umbrella';
   const poseId=putOn&&itemKey==='bookmark'?'sit':changed.equipment.bag?'show-bag':d().poseId==='show-bag'?'wave':d().poseId;
   patchDraft({equipment:changed.equipment,poseId,...(putOn?{view:{framing:'companion'}}:{}),...(putAwayUmbrella?{propId:'scarf'}:{})});
   itemState();renderSummary();itemCloseIntent='equipped';$('#item-dialog').close();$('#companion-dialog').close();
   toast(changed.storageStatus.persistent?(putOn?(itemKey==='bookmark'?(putAwayUmbrella?'收起雨傘，打開旅行本。':'書籤放進旅行本了。'):'旅伴帶上了。'):'已收回旅行小物。'):changed.storageStatus.message);
  }catch(e){toast(e.message);}
 };
 function clearRewardTimer(){clearTimeout(rewardTimer);rewardTimer=null;}
 function abandonAutoReveal(){clearRewardTimer();queuedRewards=[];}
 function scheduleAcquisition(){
  if(!playing||!queuedRewards.length||gameState?.phase!=='result'||document.hidden||$('#studio').hidden||rewardTimer)return;
  const session=gameSession;
  rewardTimer=setTimeout(()=>{
   rewardTimer=null;
   if(session!==gameSession||!playing||gameState?.phase!=='result'||document.hidden||$('#studio').hidden||document.querySelector('dialog[open]'))return;
   const st=s();if(!st.storageStatus.persistent){queuedRewards=[];return;}
   const keys=[...new Set(queuedRewards)].filter(key=>st.owned[key]);queuedRewards=[];if(!keys.length)return;
   const preferred=keys.includes('badge')?'badge':keys.includes('bookmark')?'bookmark':keys[0];
   const resume={sceneId:d().sceneId,mode:gameState.mode,stableCatch:gameState.stableCatch,origin:gameState.origin,input:input()};
   openItem(preferred,{keys:[preferred,...keys.filter(k=>k!==preferred)],resume});
  },reduced?150:750);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)abandonAutoReveal();});
 window.addEventListener('pagehide',abandonAutoReveal);
 $('#open-companion').onclick=()=>openCompanion('tasks');$('#open-keepsakes').onclick=()=>openCompanion('items');$('#retry-progress').onclick=()=>{const ok=companion.retry();renderSummary();toast(ok?'進度已保存。':s().storageStatus.message);};
 $('#open-customize').onclick=()=>$('#customize-dialog').showModal();$('#done-customize').onclick=()=>$('#customize-dialog').close();
 function updateAim(){const v=input();getWorld()?.setAimPreview?.(v);const velocity=launchVelocity(v),len=34+v.power*18,flat=Math.hypot(velocity.x,velocity.z),x=velocity.x/flat*len,y=velocity.z/flat*len;$('#aim-vector').setAttribute('x2',x);$('#aim-vector').setAttribute('y2',y);$('#aim-head').setAttribute('d',`M${x-5} ${y+8} ${x} ${y} ${x+5} ${y+8}`);}
 function setInput(v){for(const k of ['direction','elevation','power'])if(Number.isFinite(v?.[k]))$('#aim-'+k).value=v[k];updateAim();}
 for(const key of ['direction','elevation','power'])$('#aim-'+key).addEventListener('input',updateAim);
 function missInstruction(result){
  if(result.leg==='return')return '移動接取位置，看準紙鳥回來的方向。';
  const pass=result.flight?.targetPass;
  if(pass&&result.theme==='bookshop'){
   if(pass.offset.x>pass.radii.x)return '紙鳥從書頁右邊飛過。向右拉一點，讓出手偏左。';
   if(pass.offset.x < -pass.radii.x)return '紙鳥從書頁左邊飛過。向左拉一點，讓出手偏右。';
   if(pass.offset.y>pass.radii.y)return '紙鳥飛過書頁上方。降低出手角度，再試一次。';
   if(pass.offset.y < -pass.radii.y)return '紙鳥低於書頁。提高出手角度，再試一次。';
  }
  return result.reason==='scene-collision'?'紙鳥碰到場景了。圈圈是碰到的位置，換個方向再試。':result.reason==='ground'?'紙鳥落地了。看看落點，再調整高低或力道。':'紙鳥飛遠了。試著減少力道。';
 }
 function input(){return Object.fromEntries(['direction','elevation','power'].map(k=>[k,Number($('#aim-'+k).value)]));}
 function start(mode='single',stableCatch=false,resume=null){const w=getWorld();if(!w?.getGameCapabilities?.()?.[mode]){toast('場景仍在準備，請稍後再試。');return;}if(mode==='relay'&&s().level<3){toast('旅伴 3 級後可以開始來回接力。');return;}
  abandonAutoReveal();gameSession++;resumeAim=resume;focusAfterPrepare=Boolean(resume);showStudio();playing=true;lastResult=null;rewardItems=[];needsInitialAim=true;$('#studio').dataset.playing='true';$('#studio-home-controls').hidden=true;$('#game-controls').hidden=false;$('#game-stage-top').hidden=false;$('#game-mode-label').textContent=mode==='relay'?'來回接力':'紙鳥小遊戲';$('#game-title').textContent=d().sceneId==='bookshop'?'讓紙鳥停在書頁上':'把紙鳥拋給旅伴';$('#game-location').textContent=d().sceneId==='bookshop'?'雨後書店':'藍色街角';$('#game-progress').replaceChildren();$('#game-error').hidden=true;$('#game-window').hidden=d().sceneId!=='bookshop';$('#game-announcement').hidden=true;
  const r=w.enterGame({mode,origin:'center',stableCatch});if(!r?.accepted){end();toast('遊戲未能開始，請重新打開場景。')}requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 }
 function end(){abandonAutoReveal();gameSession++;resumeAim=null;focusAfterPrepare=false;playing=false;getWorld()?.exitGame?.();gameState=null;rewardItems=[];$('#game-progress').replaceChildren();$('#game-error').hidden=true;$('#studio').dataset.playing='false';$('#studio-home-controls').hidden=false;$('#game-controls').hidden=true;$('#game-stage-top').hidden=true;$('#game-announcement').hidden=true;requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));renderSummary();}
 function showGameError(message){const box=$('#game-error');$('#game-error-text').textContent=message;$('#retry-game-progress').hidden=s().storageStatus.persistent;box.hidden=false;requestAnimationFrame(()=>{box.scrollIntoView({block:'center',behavior:'instant'});box.focus({preventScroll:true});});}
 $('#retry-game-progress').onclick=()=>{const ok=companion.retry();renderSummary();if(ok){$('#game-error').hidden=true;announce('進度已保存。');}else showGameError(s().storageStatus.message);};
 function announce(text){$('#game-announcement-text').textContent=text;$('#game-announcement').hidden=!text;}
 function onGameState(st){gameState=st;if(!st){if(playing)end();return;}if(!playing)return;
  const aim=['aiming','result'].includes(st.phase),ret=['return','awaiting-catch','caught'].includes(st.phase);$('#throw-button').disabled=!aim;$('#throw-pad').dataset.disabled=String(!aim);$('#throw-controls').hidden=ret;$('#catch-controls').hidden=!ret;$('#resume-catch').hidden=st.phase!=='awaiting-catch';$('#game-instruction').textContent=stateNames[st.phase]||'';$('#game-window').disabled=!aim;$('#game-window').textContent=st.windowOpen?'關上窗':'推開窗，試試側風';$('#game-wind').hidden=!(st.theme==='bookshop'&&st.windowOpen&&!ret);$('#throw-pad-label').textContent=aim?'向後拉，放開沿箭頭拋出':'飛行中';document.querySelectorAll('[data-origin]').forEach(b=>{b.disabled=!aim;b.setAttribute('aria-pressed',String(st.origin===b.dataset.origin));});
  if(needsInitialAim&&st.phase==='aiming'){
   needsInitialAim=false;const previous=resumeAim;resumeAim=null;setInput(previous?.input||st.suggestedInput);
   if(previous?.origin)getWorld()?.setGameOrigin(previous.origin);
   if(focusAfterPrepare){focusAfterPrepare=false;$('#throw-button').focus({preventScroll:true});}
  }
  if(st.phase==='result')scheduleAcquisition();else clearRewardTimer();
  const reveal=$('#game-progress .reward-reveal');if(reveal)reveal.disabled=st.phase!=='result';
  if(st.phase==='result'&&lastResult){$('#game-instruction').textContent=lastResult.outcome==='caught'?(lastResult.leg==='return'?'接回來了！再換個站位試試。':'接到了！換個位置，再試試不同的角度。'):missInstruction(lastResult);}
 }
 function onGameResult(result){lastResult=result;try{const r=companion.record(result);renderSummary();const text=result.outcome==='caught'?(result.leg==='return'?'漂亮，接回來了！':result.theme==='bookshop'?'紙鳥停在書頁上了。':'旅伴接住了！'):'差一點，再試一次。';announce(text);if(r.saved&&r.storageStatus.persistent&&r.newItems?.length){rewardItems.push(...r.newItems);queuedRewards.push(...r.newItems);const b=document.createElement('button');b.className='reward-reveal';const img=document.createElement('img');const key=r.newItems.includes('badge')?'badge':r.newItems.includes('bookmark')?'bookmark':r.newItems[0];img.src=`assets/item-${key}.png`;img.alt='';img.width=46;img.height=46;const span=document.createElement('span');span.textContent=`收下${r.newItems.map(k=>COLLECTIBLES[k].name).join('、')}`;b.append(img,span);b.disabled=true;b.onclick=()=>{const keys=[...new Set(rewardItems)],resume={sceneId:d().sceneId,mode:gameState.mode,stableCatch:gameState.stableCatch,origin:gameState.origin,input:input()};openItem(key,{keys,resume});};$('#game-progress').replaceChildren(b);}else if(!r.storageStatus.persistent){showGameError(r.storageStatus.message);}else if(!rewardItems.length)$('#game-progress').textContent=r.completedTasks.length?'完成一項挑戰，旅伴又長大了一點。':result.mode==='relay'&&result.outcome==='caught'?`這次已接住 ${result.relayCount} 回。`:'';
  }catch(e){showGameError(e.message);}
 }
 function throwNow(v=input()){if(!playing)return;const r=getWorld()?.throwBird(v);if(r?.accepted){clearRewardTimer();announce('');if(s().storageStatus.persistent)$('#game-error').hidden=true;}else if(r?.reason!=='busy')toast('這次沒有拋出，請再試一次。');}
 $('#start-game').onclick=()=>start();$('#end-game').onclick=end;$('#throw-button').onclick=()=>throwNow();$('#reset-aim').onclick=()=>setInput(getWorld()?.getGameState()?.suggestedInput);$('#resume-catch').onclick=()=>getWorld()?.resumeReturn();$('#catch-position').oninput=e=>getWorld()?.setCatchPosition(Number(e.target.value));
 document.querySelectorAll('[data-origin]').forEach(b=>b.onclick=()=>getWorld()?.setGameOrigin(b.dataset.origin));$('#game-window').onclick=()=>patchDraft({windowOpen:!d().windowOpen});
 $('#throw-pad').onpointerdown=e=>{if(!['aiming','result'].includes(gameState?.phase)||e.button!==0)return;drag={x:e.clientX,y:e.clientY,input:input(),pointerId:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId);};
 $('#throw-pad').onpointermove=e=>{if(!drag||e.pointerId!==drag.pointerId)return;const dx=clamp(e.clientX-drag.x,-75,75),dy=clamp(e.clientY-drag.y,-28,68);$('#throw-bird').style.transform=`translate(${dx*.65}px,${dy*.5}px) rotate(${-dx*.2}deg)`;setInput({direction:clamp(drag.input.direction-dx/180,-1,1),elevation:clamp(drag.input.elevation-dy/600,0,1),power:clamp(drag.input.power+dy/360,0,1)});$('#throw-pad-label').textContent=Math.abs(dx)>14?(dx>0?'向右拉 → 出手偏左':'向左拉 → 出手偏右'):dy>14?'往下拉得越遠，力道越大':'放開沿箭頭拋出';};
 $('#throw-pad').onpointerup=e=>{if(!drag||e.pointerId!==drag.pointerId)return;const moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;drag=null;$('#throw-bird').style.transform='';$('#throw-pad-label').textContent='向後拉，放開沿箭頭拋出';if(moved)throwNow();};$('#throw-pad').onpointercancel=()=>{drag=null;$('#throw-bird').style.transform='';$('#throw-pad-label').textContent='向後拉，放開沿箭頭拋出';};
 window.addEventListener('storage',e=>{if(e.key===COMPANION_KEY){companion.refresh();if(!playing)restoreGear();renderSummary();}});
 renderSummary();return {store:companion,onGameState,onGameResult,refresh:renderSummary,restoreGear,end,get playing(){return playing}};
}
