// Local companion progress. This is not a server-authoritative reward or a redeemable balance.
export const COMPANION_KEY='yoxi.city-companion.v1';
export const COLLECTIBLES=Object.freeze({bag:{id:'canvas-travel',name:'旅行包'},badge:{id:'blue-house',name:'藍屋徽章'},bookmark:{id:'leaf',name:'葉片書籤'}});
const emptyEquipment=()=>({bag:null,badge:null,bookmark:null});
const clone=x=>structuredClone(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const empty=()=>({version:1,events:[],equipment:emptyEquipment(),equipmentUpdatedAt:null});
const fail=(code,message,details)=>{const e=new Error(message);e.code=code;e.details=details;throw e};
function vector(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&['x','y','z'].every(k=>Number.isFinite(value[k]));}
function flightRecord(value){
 if(value===null||value===undefined)return null;
 if(!value||typeof value!=='object'||Array.isArray(value)||!['start','velocity','acceleration','landing'].every(k=>vector(value[k]))||!Number.isFinite(value.duration)||value.duration<0||![null,'target','scene','ground','range'].includes(value.collision))fail('invalid_event','飛行紀錄格式不正確。');
 const inspect=(v,depth=0)=>{if(depth>10)fail('invalid_event','飛行紀錄層次過深。');if(v===null||typeof v==='boolean'||typeof v==='string')return;if(typeof v==='number'&&Number.isFinite(v))return;if(v&&typeof v==='object'){for(const x of Object.values(v))inspect(x,depth+1);return;}fail('invalid_event','飛行紀錄格式不正確。');};
 inspect(value);const raw=JSON.stringify(value);if(raw.length>20000)fail('invalid_event','飛行紀錄過大。');return JSON.parse(raw);
}
function event(value){
 if(!value||typeof value!=='object'||typeof value.attemptId!=='string'||!value.attemptId||value.attemptId.length>200)fail('invalid_event','無法讀取這次遊戲結果。');
 if(!['blue','bookshop'].includes(value.theme)||!['single','relay'].includes(value.mode)||!['left','center','right'].includes(value.origin)||!['caught','miss'].includes(value.outcome)||typeof value.windowOpen!=='boolean'||typeof value.stableCatch!=='boolean')fail('invalid_event','遊戲結果格式不正確。');
 if(!Number.isFinite(Date.parse(value.at))||!Number.isInteger(value.relayCount)||value.relayCount<0||value.relayCount>100000)fail('invalid_event','遊戲結果缺少時間或紀錄。');
 const leg=value.leg??'outbound',eventId=value.eventId??`${value.attemptId}:${leg}`;
 if(!['outbound','return'].includes(leg)||eventId!==`${value.attemptId}:${leg}`||(leg==='return'&&value.mode!=='relay'))fail('invalid_event','去程與回程紀錄不符。');
 const expectedHit=leg==='return'?'player-catch':value.theme==='blue'?'hands':'book';
 const hitKind=value.hitKind??(value.outcome==='caught'?expectedHit:null);
 if(value.outcome==='caught'&&hitKind!==expectedHit)fail('invalid_event','成功接取的位置與遊戲模式不符。');
 if(value.outcome==='miss'&&hitKind!==null)fail('invalid_event','失手結果不能帶有成功接取種類。');
 const hit=value.hit??null,reason=value.reason??null;
 if(hit!==null&&!vector(hit))fail('invalid_event','接取位置不正確。');
 if(value.outcome==='miss'&&hit!==null)fail('invalid_event','失手結果不能帶有成功接取位置。');
 if(reason!==null&&!['target','scene-collision','ground','out-of-range','missed-catch'].includes(reason))fail('invalid_event','飛行結束原因不正確。');
 const input=value.input;
 if(!input||!Number.isFinite(input.direction)||Math.abs(input.direction)>1||!Number.isFinite(input.elevation)||input.elevation<0||input.elevation>1||!Number.isFinite(input.power)||input.power<0||input.power>1)fail('invalid_event','遊戲輸入超出範圍。');
 return {eventId,attemptId:value.attemptId,leg,hitKind,hit:hit===null?null:{x:hit.x,y:hit.y,z:hit.z},reason,flight:flightRecord(value.flight),theme:value.theme,mode:value.mode,origin:value.origin,outcome:value.outcome,windowOpen:value.windowOpen,stableCatch:value.stableCatch,relayCount:value.relayCount,input:{direction:input.direction,elevation:input.elevation,power:input.power},at:new Date(value.at).toISOString()};
}
const ordered=events=>events.slice().sort((a,b)=>a.at.localeCompare(b.at)||a.attemptId.localeCompare(b.attemptId));
function validate(raw){
 let s;try{s=JSON.parse(raw)}catch{fail('unreadable','旅伴資料無法讀取，原始資料已保留。')}if(s?.version!==1||!Array.isArray(s.events)||s.events.length>10000)fail('unreadable','旅伴資料無法讀取，原始資料已保留。');
 const ids=new Set();s.events=s.events.map(v=>{const e=event(v);if(ids.has(e.eventId))fail('duplicate_event','旅伴紀錄重複。');ids.add(e.eventId);return e});
 if(!s.equipment||typeof s.equipment!=='object'||Array.isArray(s.equipment)||Object.keys(s.equipment).some(k=>!Object.hasOwn(COLLECTIBLES,k)))fail('invalid_equipment','旅伴裝備資料無法讀取。');
 if(s.equipmentUpdatedAt!==null&&s.equipmentUpdatedAt!==undefined&&!Number.isFinite(Date.parse(s.equipmentUpdatedAt)))fail('invalid_equipment','旅伴裝備時間無法讀取。');
 s.events=ordered(s.events);s.equipment=equipment(s.equipment,s.events);return {version:1,events:s.events,equipment:s.equipment,equipmentUpdatedAt:s.equipmentUpdatedAt??null};
}
export function progressFor(events){
 const caught=ordered(events.filter(e=>e.outcome==='caught'&&(e.leg??'outbound')==='outbound')),blue=caught.filter(e=>e.theme==='blue'),book=caught.filter(e=>e.theme==='bookshop');
 const origins=[...new Set(blue.map(e=>e.origin))],wind=book.filter(e=>e.windowOpen);
 const tasks=[{id:'blue-first',name:'在街角接住一次',done:blue.length>0,count:Math.min(1,blue.length),total:1},{id:'blue-origins',name:'從三個位置都接住',done:origins.length===3,count:origins.length,total:3},{id:'book-first',name:'讓紙鳥停在書頁上',done:book.length>0,count:Math.min(1,book.length),total:1},{id:'book-wind',name:'開窗後成功兩次',done:wind.length>=2,count:Math.min(2,wind.length),total:2}];
 const xp=Math.min(60,tasks.filter(t=>t.done).length*20),level=xp>=60?3:xp>=20?2:1;
 const owned={bag:caught.length>0,badge:blue.length>0,bookmark:book.length>0};
 const acquired={bag:caught[0]?.at??null,badge:blue[0]?.at??null,bookmark:book[0]?.at??null};
 const first={bag:caught[0],badge:blue[0],bookmark:book[0]};
 const acquisition=Object.fromEntries(Object.entries(first).map(([key,e])=>[key,e?{at:e.at,theme:e.theme,attemptId:e.attemptId,eventId:e.eventId,method:e.theme==='blue'?'街角第一次接住':'書店第一次停在書頁上'}:null]));
 const best={standard:0,stable:0};for(const e of events.filter(e=>e.mode==='relay')){const key=e.stableCatch?'stable':'standard';best[key]=Math.max(best[key],e.relayCount)}
 return {xp,level,nextXp:level===1?20:level===2?60:null,tasks,owned,acquired,acquisition,best,attempts:new Set(events.map(e=>e.attemptId)).size,eventCount:events.length,origins};
}
function equipment(value,events){
 if(!value||typeof value!=='object'||Array.isArray(value))fail('invalid_equipment','請選擇旅伴的小物。');
 const owned=progressFor(events).owned,next=emptyEquipment();for(const [key,item]of Object.entries(COLLECTIBLES)){const v=value[key]??null;if(v!==null&&(v!==item.id||!owned[key]))fail('not_owned','還沒有取得這件小物。');next[key]=v}if((next.badge||next.bookmark)&&!next.bag)fail('bag_required','先帶上旅行包，再裝上小物。');return next;
}
const changes=(before,after)=>({newItems:Object.keys(after.owned).filter(k=>after.owned[k]&&!before.owned[k]),completedTasks:after.tasks.filter(t=>t.done&&!before.tasks.find(x=>x.id===t.id).done).map(t=>t.id),previousLevel:before.level});
export function createCompanionStore({storage=globalThis.localStorage,now=()=>new Date().toISOString()}={}){
 let state=empty(),pending=[],equipmentPending=false,baseEquipment=emptyEquipment(),committedEvents=[],lastSavedChange=null;
 let status={persistent:!!storage,message:storage?'':'這次進度只保留到關閉頁面。',code:null};
 const listeners=new Set();
 const snapshot=()=>({...clone(state),...progressFor(state.events),pendingEventCount:pending.length,pendingItems:changes(progressFor(committedEvents),progressFor(state.events)).newItems,lastSavedChange:clone(lastSavedChange),storageStatus:clone(status)});
 const notify=()=>listeners.forEach(f=>{try{f(snapshot())}catch{}});
 try{const raw=storage?.getItem(COMPANION_KEY);if(raw)state=validate(raw);baseEquipment=clone(state.equipment);committedEvents=clone(state.events)}catch{status={persistent:false,code:'unreadable',message:'旅伴資料無法讀取，原始資料已保留。本次進度暫存於記憶體。'}}
 function mergeLatest(){
  if(!storage)return {next:clone(state),raw:null};
  const raw=storage.getItem(COMPANION_KEY)??null,remote=raw?validate(raw):empty();committedEvents=clone(remote.events);
  const map=new Map(remote.events.map(e=>[e.eventId,e])),conflicts=[];
  for(const e of pending){const previous=map.get(e.eventId);if(previous&&!same(previous,e)){conflicts.push(e.eventId);continue;}map.set(e.eventId,e)}
  const events=ordered([...map.values()]);
  if(events.length>10000)fail('history_full','遊戲紀錄已滿，這次無法保存新的結果。');
  if(conflicts.length)fail('event_conflict','另一個分頁已保存不同的遊戲結果，已保留該筆紀錄。',{remote,events,conflicts});
  if(equipmentPending&&!same(remote.equipment,baseEquipment)&&!same(remote.equipment,state.equipment))fail('equipment_conflict','另一個分頁已更換旅伴裝備，已顯示最新裝備。請重新選擇。',{remote,events});
  return {next:{version:1,events,equipment:equipment(equipmentPending?state.equipment:remote.equipment,events),equipmentUpdatedAt:equipmentPending?state.equipmentUpdatedAt:remote.equipmentUpdatedAt},raw};
 }
 function handleFailure(e){
  if(['equipment_conflict','event_conflict'].includes(e.code)&&e.details){
   const {remote,events,conflicts=[]}=e.details;
   pending=pending.filter(x=>!conflicts.includes(x.eventId));
   state={...clone(remote),events:clone(events)};equipmentPending=false;baseEquipment=clone(remote.equipment);
  }
  status={persistent:false,code:e.code??'storage_write_failed',message:e.code==='equipment_conflict'||e.code==='event_conflict'||e.code==='history_full'?e.message:'這次進度尚未存入裝置。請重試儲存。'};notify();
 }
 function persist(){
  lastSavedChange=null;
  if(!storage){status={persistent:false,code:'memory_only',message:'這次進度只保留到關閉頁面。'};notify();return false}
  try{
   const {next,raw}=mergeLatest();
   if((storage.getItem(COMPANION_KEY)??null)!==raw)fail('storage_conflict','另一個分頁剛更新進度，請重試儲存。');
   const delta=changes(progressFor(committedEvents),progressFor(next.events));
   storage.setItem(COMPANION_KEY,JSON.stringify(next));state=next;pending=[];equipmentPending=false;baseEquipment=clone(state.equipment);committedEvents=clone(state.events);lastSavedChange=delta;status={persistent:true,message:'',code:null};notify();return true;
  }catch(e){handleFailure(e);return false}
 }
 function refresh(){
  if(pending.length||equipmentPending){persist();return snapshot()}
  if(storage){try{const raw=storage.getItem(COMPANION_KEY);state=raw?validate(raw):empty();baseEquipment=clone(state.equipment);committedEvents=clone(state.events);status={persistent:true,message:'',code:null};notify()}catch{status={persistent:false,code:'unreadable',message:'另一個分頁的旅伴資料無法讀取。'}}}
  return snapshot();
 }
 return {
  getState:snapshot,subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)},
  record(result){
   refresh();
   const incomingId=result?.eventId??`${result?.attemptId}:${result?.leg??'outbound'}`;
   const existing=state.events.find(x=>x.eventId===incomingId);
   const raw={...result,at:result?.at??existing?.at??now(),stableCatch:result?.stableCatch??false,relayCount:result?.relayCount??0},e=event(raw);
   const previous=state.events.find(x=>x.eventId===e.eventId);
   if(previous){if(!same(previous,e))fail('event_conflict','同一投擲已有不同結果，未改寫紀錄。');return {duplicate:true,newItems:[],completedTasks:[],...snapshot()};}
   if(e.mode==='relay'&&progressFor(state.events).level<3)fail('relay_locked','旅伴達到3級後才能開始來回接力。');
   if(state.events.length>=10000)fail('history_full','遊戲紀錄已滿，這次無法保存新的結果。');
   const before=progressFor(state.events);state.events.push(e);pending.push(e);const saved=persist(),after=snapshot();
   return {duplicate:false,saved,newItems:saved?lastSavedChange.newItems:[],completedTasks:saved?lastSavedChange.completedTasks:[],previousLevel:saved?lastSavedChange.previousLevel:before.level,...after};
  },
  equip(next){refresh();state.equipment=equipment(next,state.events);state.equipmentUpdatedAt=now();equipmentPending=true;persist();return snapshot()},
  retry:persist,refresh
 };
}
