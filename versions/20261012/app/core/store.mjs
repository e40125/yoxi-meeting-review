import {PLACES,CHALLENGES,THEMES,ACCESSORIES,TEST_PROFILES,makeSeedInvitations,getPlace,getChallenge} from '../data/catalog.mjs';
import {ok,fail,cleanText,buildSitePlan,validateInvitation,detectConflict,calculateGroupCosts,getGrowth,areProfilesBlocked} from './rules.mjs';
import {isConfirmedPreference,parsePreferenceTerms,profileSettingsSnapshot,SETTINGS_CONSENTS} from './preferences.mjs';
import {validateJointContext} from './joint-plan-handoff.mjs';
export * from './rules.mjs';
export const STORAGE_KEY='yoxi-city-life-polished-v1';
export const CONFIRMATION_WINDOW_MS=30*60*1000;
export const ACTION_TYPES=['profile.update','profile.switch','preferences.update','settings.update','collection.save','collection.preferences','collection.remove','collection.intent','plan.save','plan.start','plan.complete','plan.cancel','group.create','group.invite','group.declineInvite','group.revokeInvite','group.interest','group.join','group.change','group.confirm','group.leave','group.claimHost','group.expire','message.send','game.start','game.answer','game.hint','game.reveal','game.collect','pet.equip','memory.save','memory.remove','notification.read','profile.block','demo.reset'];
const clone=x=>structuredClone(x);
const activeMembers=g=>g.membership.filter(m=>!['left','interested'].includes(m.status));
function seedState(now,withSeed=true) {
 return {schemaVersion:1,seedVersion:1,createdAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),activeProfileId:'me',testProfileBlocks:{},profile:{displayName:'我',city:'台南',interests:[],consents:{useCollections:true,nearbyNotifications:false,invitationNotifications:true,publicInterests:false,publicArea:false},blockedUserIds:[]},collections:[],plans:[],invitations:withSeed?makeSeedInvitations(new Date(now)):[],messages:[],notifications:[],memories:[],game:{attempts:{},ledger:[],equippedAccessoryId:'none'},log:[]};
}
export function validateState(s) {
 if(!s||s.schemaVersion!==1||!s.profile||!s.profile.consents||!s.game||!Array.isArray(s.game.ledger)||!s.game.attempts)return fail('state_invalid','資料格式不符，未覆蓋目前紀錄。');
 for(const k of ['collections','plans','invitations','messages','notifications','memories'])if(!Array.isArray(s[k])||s[k].length>10000)return fail('state_invalid','資料格式或筆數不符。');
 if(!TEST_PROFILES.some(p=>p.id===s.activeProfileId)||!Array.isArray(s.profile.interests)||!Array.isArray(s.profile.blockedUserIds))return fail('state_invalid','個人資料格式不符。');
 if(s.testProfileBlocks!==undefined&&(!s.testProfileBlocks||Array.isArray(s.testProfileBlocks)||typeof s.testProfileBlocks!=='object'||Object.entries(s.testProfileBlocks).some(([uid,ids])=>!TEST_PROFILES.some(p=>p.id===uid)||!Array.isArray(ids)||ids.some(id=>!TEST_PROFILES.some(p=>p.id===id)))))return fail('state_invalid','測試人物設定不符。');
 if(s.notifications.some(n=>n.type==='group_invite'&&(!TEST_PROFILES.some(p=>p.id===n.userId)||!TEST_PROFILES.some(p=>p.id===n.inviterId)||!s.invitations.some(g=>g.id===n.invitationId)||!['pending','accepted','declined','revoked','blocked','expired'].includes(n.status))))return fail('state_invalid','邀請通知資料不符。');
 if(s.collections.some(c=>!getPlace(c.placeId)||!Array.isArray(c.interestIds)))return fail('state_invalid','收藏包含未知地點。');
 if(s.collections.some(c=>c.confirmedPreferences!==undefined&&!isConfirmedPreference(c.confirmedPreferences)))return fail('state_invalid','收藏偏好確認資料不完整。');
 if(s.plans.some(p=>!getPlace(p.placeId)||!Array.isArray(p.steps)))return fail('state_invalid','計畫資料不完整。');
 if(s.plans.some(p=>p.jointContext&&!validateJointContext(p.jointContext,p,{checkCatalog:false}).ok)||s.invitations.some(g=>g?.sourceJointContext&&!validateJointContext(g.sourceJointContext,g.sourceJointContext.selection?.plan,{checkCatalog:false}).ok))return fail('state_invalid','共同安排的條件或來源紀錄不完整，原資料仍保留。');
 const ids=[];for(const g of s.invitations){if(!g||!getPlace(g.placeId)||!Array.isArray(g.membership)||!Array.isArray(g.costItems)||!Number.isInteger(g.revision)||g.revision<1||ids.includes(g.id))return fail('state_invalid','邀約資料不完整。');ids.push(g.id);if(g.membership.some(m=>!TEST_PROFILES.some(p=>p.id===m.userId))||new Set(g.membership.map(m=>m.userId)).size!==g.membership.length)return fail('state_invalid','參加者資料不符。');}
 if(s.game.ledger.some(x=>!getChallenge(x.challengeId)||x.xp!==getChallenge(x.challengeId).xp)||new Set(s.game.ledger.map(x=>x.challengeId)).size!==s.game.ledger.length)return fail('state_invalid','成長紀錄不符，未匯入。');
 return ok(s);
}
function defaultStorage(){try{return globalThis.localStorage;}catch(error){return {getItem(){throw error;},setItem(){throw error;},removeItem(){throw error;}};}}
export function createStore({storage=defaultStorage(),clock=()=>Date.now(),seed=true,storageKey=STORAGE_KEY}={}) {
 let state=seedState(+clock(),seed),loadError=null,lastStorageRaw=null; const listeners=new Set();let seq=0;
 const id=prefix=>`${prefix}-${+clock()}-${++seq}-${Math.random().toString(36).slice(2,7)}`;
 try{const raw=storage?.getItem(storageKey)??null;lastStorageRaw=raw;if(raw){const parsed=JSON.parse(raw);const result=validateState(parsed);if(!result.ok)throw new Error(result.error.message);state=parsed;}}
 catch(e){loadError={code:'storage_recovery',message:'先前紀錄無法讀取，原資料仍保留。可匯出原資料後再重設。',detail:String(e.message)};}
 const notify=()=>listeners.forEach(fn=>{try{fn(clone(state));}catch{}});
 const conflict=()=>fail('storage_conflict','另一個分頁已更新這筆資料。已載入最新內容，請確認後重試。');
 function refreshFromStorage({recovery=false}={}) {
  let raw;try{raw=storage?.getItem(storageKey)??null;}catch{return fail('storage_read_failed','目前無法讀取最新紀錄，這次變更尚未保存。請重試。');}
  if(raw===lastStorageRaw)return ok(false);
  try{
   const latest=raw===null?seedState(+clock(),seed):JSON.parse(raw),r=validateState(latest);
   if(!r.ok)throw new Error(r.error.message);
   // Demo identity belongs to this tab's interaction. Another tab cannot silently change the actor.
   latest.activeProfileId=state.activeProfileId;
   for(const g of latest.invitations)updateStatus(g);
   state=latest;lastStorageRaw=raw;loadError=null;notify();return ok(true);
  }catch(e){
   loadError={code:'storage_recovery',message:'最新紀錄無法讀取，原資料仍保留。請先匯出原資料再重設。',detail:String(e.message)};
   if(recovery){lastStorageRaw=raw;return ok(false);}
   return fail('storage_recovery_required',loadError.message);
  }
 }
 function changedTarget(before,after,a){
  const different=(x,y)=>JSON.stringify(x)!==JSON.stringify(y);
  const by=(s,list,key,value)=>s[list].find(x=>x[key]===value);
  if(['group.change','group.join','group.confirm','group.leave','group.claimHost','group.invite'].includes(a.type)){
   const old=by(before,'invitations','id',a.invitationId??a.id),latest=by(after,'invitations','id',a.invitationId??a.id);
   // Existing consent actions may explicitly carry the revision the user reviewed.
   if(a.revision!==undefined&&latest?.revision===a.revision)return false;
   return different(old,latest);
  }
  if(['collection.remove','collection.intent','collection.preferences'].includes(a.type))return different(by(before,'collections','placeId',a.placeId),by(after,'collections','placeId',a.placeId));
  if(['plan.save','plan.start','plan.complete','plan.cancel'].includes(a.type)&&a.planId)return different(by(before,'plans','id',a.planId),by(after,'plans','id',a.planId));
  if(a.type==='memory.save')return different(by(before,'memories','placeId',a.placeId),by(after,'memories','placeId',a.placeId));
  if(a.type==='memory.remove')return different(by(before,'memories','id',a.memoryId),by(after,'memories','id',a.memoryId));
  if(a.type==='profile.update')return ['displayName','city'].some(k=>a[k]!==undefined&&different(before.profile[k],after.profile[k]));
  if(a.type==='preferences.update')return (a.interests!==undefined&&different(before.profile.interests,after.profile.interests))||Object.keys(a.consents??{}).some(k=>different(before.profile.consents[k],after.profile.consents[k]));
  return false;
 }
 function commit(next,value,action){
  if(loadError&&!['demo.reset','data.import'].includes(action))return fail('storage_recovery_required','先前資料無法讀取。請先匯出原資料，再選擇重新載入或重設。');
  // Check immediately before writing as well as before reducing the action. This is optimistic
  // protection, not an atomic cross-process transaction (localStorage has no compare-and-swap).
  let current;try{current=storage?.getItem(storageKey)??null;}catch{return fail('storage_read_failed','目前無法讀取最新紀錄，這次變更尚未保存。請重試。');}
  if(current!==lastStorageRaw){const r=refreshFromStorage();return r.ok?conflict():r;}
  if(!loadError&&JSON.stringify(next)===JSON.stringify(state))return ok(clone(value??state));
  next.updatedAt=new Date(+clock()).toISOString();next.log??=[];next.log.push({type:action,at:next.updatedAt});next.log=next.log.slice(-300);
  try{const raw=JSON.stringify(next);storage?.setItem(storageKey,raw);lastStorageRaw=storage?.setItem?raw:lastStorageRaw;}catch{return fail('storage_write_failed','目前無法儲存，這次變更尚未保存。請匯出紀錄或釋放空間後重試。');}
  state=next;loadError=null;notify();return ok(clone(value??state));
 }
 function system(s,g,text,type='change',extraRecipientIds=[]){const at=new Date(+clock()).toISOString(),costSnapshot=calculateGroupCosts(g),confirmationDeadlineAt=g.confirmationDeadlineAt??null;s.messages.push({id:id('msg'),roomId:g.id,kind:'system',authorId:null,text,createdAt:at,eventType:type,revision:g.revision,costSnapshot,confirmationDeadlineAt,testData:true});for(const userId of new Set([...activeMembers(g).map(m=>m.userId),...extraRecipientIds])){if(s.profile.consents.invitationNotifications||userId!=='me')s.notifications.push({id:id('note'),type,entityId:g.id,invitationId:g.id,target:{view:'event',id:g.id},revision:g.revision,userId,text,costSnapshot,confirmationDeadlineAt,createdAt:at,readAt:null});}}
 function updateStatus(g){if(['cancelled','completed','expired','in_progress'].includes(g.status))return;const members=activeMembers(g);if(!members.some(m=>m.userId===g.hostId)){g.hostId=null;g.status='needs_host';return;}const n=members.filter(m=>m.status==='confirmed'&&m.acceptedRevision===g.revision).length;g.status=n===members.length&&n>=g.minPeople?'ready':'open';if(n===members.length)g.confirmationDeadlineAt=null;else if(!g.confirmationDeadlineAt)setConfirmationDeadline(g);}
 function setConfirmationDeadline(g){g.confirmationDeadlineAt=new Date(Math.min(+clock()+CONFIRMATION_WINDOW_MS,Date.parse(g.deadlineAt))).toISOString();}
 function revise(s,g,description){g.history??=[];g.history.push({revision:g.revision,costs:calculateGroupCosts(g),arrangement:clone({title:g.title,activity:g.activity,placeId:g.placeId,startAt:g.startAt,endAt:g.endAt,deadlineAt:g.deadlineAt,minPeople:g.minPeople,maxPeople:g.maxPeople,costItems:g.costItems}),at:new Date(+clock()).toISOString(),description});g.revision++;for(const m of activeMembers(g)){m.status='needs_reconfirmation';}setConfirmationDeadline(g);updateStatus(g);}
 // Older saved demos can contain the previous incorrect ready status. Recompute without erasing records.
 for(const g of state.invitations)updateStatus(g);
 function dispatchUnsafe(action={}){
  const a={...action,...action.payload};delete a.payload;
  const before=state,refreshed=refreshFromStorage({recovery:a.type==='demo.reset'&&a.confirm===true});
  if(!refreshed.ok)return refreshed;
  if(refreshed.value&&changedTarget(before,state,a))return conflict();
  const s=clone(state),now=+clock(),at=new Date(now).toISOString(),uid=s.activeProfileId;let value;
  if(uid!=='me'&&['profile.update','preferences.update','settings.update','collection.save','collection.preferences','collection.remove','collection.intent'].includes(a.type))return fail('owner_required','請切回自己，再修改自己的收藏與偏好。',{field:a.type==='collection.preferences'?'other':'interests'});
  const getGroup=()=>s.invitations.find(g=>g.id===(a.invitationId??a.id));
  if(['group.invite','group.join','group.change','group.confirm','group.leave','group.claimHost'].includes(a.type)){
   const g=getGroup();
   if(g?.confirmationDeadlineAt&&now>=Date.parse(g.confirmationDeadlineAt)&&now<Date.parse(g.deadlineAt))return fail('confirmation_expired','這次確認時間已結束，請更新邀約查看新的安排。');
  }
  const readAttempt=()=>{const c=getChallenge(a.challengeId);if(!c)return [null,null];s.game.attempts[c.id]??={status:'active',attempts:0,usedHints:0,revealed:false,rewardClaimed:false};return [c,s.game.attempts[c.id]];};
  switch(a.type){
   case 'profile.update': {if(a.displayName!==undefined)s.profile.displayName=cleanText(a.displayName,30)||'我';if(a.city!==undefined)s.profile.city=cleanText(a.city,30);value=s.profile;break;}
   case 'profile.switch': {if(!TEST_PROFILES.some(x=>x.id===a.userId))return fail('user_missing','找不到這個測試人物。');s.activeProfileId=a.userId;value=a.userId;break;}
   case 'settings.update':
   case 'preferences.update': {
    if(a.type==='settings.update'){
     if(typeof a.expectedSnapshot!=='string'||a.expectedSnapshot!==profileSettingsSnapshot(s.profile))return fail('settings_conflict','偏好已在其他地方更新。請按「重新讀取設定」，確認後再儲存。',{field:'interests'});
     if(typeof a.displayName!=='string'||!Array.isArray(a.interests)||!a.consents||SETTINGS_CONSENTS.some(k=>typeof a.consents[k]!=='boolean'))return fail('settings_invalid','設定內容不完整，請重新開啟後再儲存。',{field:'interests'});
     s.profile.displayName=cleanText(a.displayName,30)||'我';
    }
    if(a.interests!==undefined){if(!Array.isArray(a.interests)||a.interests.some(x=>typeof x!=='string'))return fail('interests_invalid','請提供興趣清單。',{field:'interests'});s.profile.interests=[...new Set(a.interests.map(x=>cleanText(x,40)).filter(Boolean))].slice(0,20);s.profile.interestsConfirmation={version:1,confirmedBy:'me',confirmedAt:at,revision:(s.profile.interestsConfirmation?.revision||0)+1,terms:[...s.profile.interests]};}
    if(a.consents)for(const [k,v]of Object.entries(a.consents)){if(Object.hasOwn(s.profile.consents,k)&&typeof v==='boolean')s.profile.consents[k]=v;}value=s.profile;break;
   }
   case 'profile.block': {
    if(!TEST_PROFILES.some(x=>x.id===a.userId)||a.userId===uid)return fail('user_invalid','無法封鎖這個帳號。');
    s.testProfileBlocks??={};
    if(uid==='me')s.profile.blockedUserIds=[...new Set([...s.profile.blockedUserIds,a.userId])];
    else s.testProfileBlocks[uid]=[...new Set([...(s.testProfileBlocks[uid]??[]),a.userId])];
    for(const n of s.notifications)if(n.type==='group_invite'&&n.status==='pending'&&((n.inviterId===uid&&n.userId===a.userId)||(n.userId===uid&&n.inviterId===a.userId))){n.status='blocked';n.respondedAt=at;}
    value=uid==='me'?s.profile.blockedUserIds:s.testProfileBlocks[uid];break;
   }
   case 'collection.save': {const placeIds=a.placeIds??(a.placeId?[a.placeId]:[]);if(!Array.isArray(placeIds)||!placeIds.length||placeIds.some(x=>!getPlace(x)))return fail('places_invalid','請選擇要收藏的地點。');const items=[];for(const placeId of new Set(placeIds)){let c=s.collections.find(x=>x.placeId===placeId);if(!c){c={id:id('saved'),placeId,interestIds:[],sourceInputs:[],intent:'want',visibility:'private',createdAt:at,updatedAt:at};s.collections.push(c);}c.interestIds=[...new Set([...c.interestIds,...(a.interests??[]).map(x=>cleanText(x,40))])];if(a.sourceInput&&!c.sourceInputs.includes(cleanText(a.sourceInput,5000)))c.sourceInputs.push(cleanText(a.sourceInput,5000));c.updatedAt=at;items.push(c);}value=items;break;}
   case 'collection.preferences': {
    if(uid!=='me')return fail('owner_required','請切回自己，再記下想做的事。',{field:'other'});
    const c=s.collections.find(c=>c.placeId===a.placeId);
    if(!c||getPlace(c.placeId)?.testData)return fail('saved_missing','請先收藏這個地點。',{field:'other'});
    const revision=c.confirmedPreferences?.revision||0;
    if(typeof a.expectedCollectionId!=='string'||a.expectedCollectionId!==c.id||!Number.isInteger(a.expectedRevision)||a.expectedRevision!==revision)return fail('preference_conflict','這份收藏或想做的事已更新，請關閉後重新打開再確認。',{field:'other'});
    if(!Array.isArray(a.terms))return fail('preferences_invalid','請提供這次確認的想做的事。',{field:'other'});
    const parsed=parsePreferenceTerms(a.terms);
    if(!parsed.ok)return parsed;
    c.confirmedPreferences={version:1,confirmedBy:'me',confirmedAt:at,revision:revision+1,terms:parsed.value};
    c.updatedAt=at;value=c;break;
   }
   case 'collection.remove': {s.collections=s.collections.filter(c=>c.placeId!==a.placeId);value=true;break;}
   case 'collection.intent': {const c=s.collections.find(c=>c.placeId===a.placeId);if(!c)return fail('saved_missing','這個地點還沒收藏。');if(!['want','considering','planned','visited'].includes(a.intent))return fail('intent_invalid','請選擇有效狀態。');c.intent=a.intent;c.updatedAt=at;value=c;break;}
   case 'plan.save': {const result=buildSitePlan(a.plan??a);if(!result.ok)return result;let jointContext;if(a.jointContext){const checked=validateJointContext(a.jointContext,result.value,{planInput:a.plan??a});if(!checked.ok)return checked;jointContext=checked.value;}let p=s.plans.find(p=>p.id===a.planId);if(p){Object.assign(p,result.value,{status:'saved',revision:p.revision+1,updatedAt:at});}else{p={...result.value,id:id('plan'),status:'saved',revision:1,createdAt:at,updatedAt:at};s.plans.push(p);}if(jointContext)p.jointContext=jointContext;else delete p.jointContext;value=p;break;}
   case 'plan.start':case 'plan.complete':case 'plan.cancel': {const p=s.plans.find(x=>x.id===a.planId);if(!p)return fail('plan_missing','找不到這份安排。');p.status={'plan.start':'active','plan.complete':'completed','plan.cancel':'cancelled'}[a.type];p.updatedAt=at;value=p;break;}
   case 'group.create': {const d=a.invitation??a;const valid=validateInvitation(d,now);if(!valid.ok)return valid;let sourceJointContext;if(d.sourceJointContext){const recipe=d.sourceJointContext.planInput;const rebuilt=buildSitePlan(recipe);if(!rebuilt.ok)return rebuilt;const checked=validateJointContext(d.sourceJointContext,rebuilt.value);if(!checked.ok)return checked;if(d.placeId!==recipe.placeId)return fail('joint_place_changed','目的地已更改，請先重新安排。');sourceJointContext=checked.value;}const conflict=detectConflict(s,uid,d.startAt,d.endAt);if(conflict)return fail('schedule_conflict','這個時段已有其他邀約。',{invitationId:conflict.id});const g={id:id('group'),placeId:d.placeId,title:cleanText(d.title,80),activity:cleanText(d.activity,1000),description:cleanText(d.description,1000),startAt:d.startAt,endAt:d.endAt,deadlineAt:d.deadlineAt,minPeople:d.minPeople,maxPeople:d.maxPeople,costItems:clone(d.costItems),hostId:uid,revision:1,status:'open',confirmationDeadlineAt:null,testData:true,transportCostKnown:false,membership:[{userId:uid,status:'confirmed',acceptedRevision:1,confirmedAt:at}],history:[]};if(sourceJointContext)g.sourceJointContext=sourceJointContext;updateStatus(g);s.invitations.push(g);system(s,g,'邀約已建立。這是展示用安排，尚未訂位。','created');value=g;break;}
   case 'group.invite': {
    const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');
    if(g.hostId!==uid||!activeMembers(g).some(m=>m.userId===uid))return fail('host_required','只有目前主揪可以邀請。');
    if(!['open','ready'].includes(g.status)||now>=Date.parse(g.deadlineAt))return fail('invite_closed','這個邀約目前無法邀請。');
    if(activeMembers(g).length>=g.maxPeople)return fail('full','這個邀約已滿。');
    if(!Array.isArray(a.userIds)||!a.userIds.length||a.userIds.length>12||a.userIds.some(id=>typeof id!=='string'||id===uid||!TEST_PROFILES.some(p=>p.id===id)))return fail('invite_users_invalid','請選擇要邀請的測試人物。');
    const userIds=[...new Set(a.userIds)];
    if(userIds.some(userId=>activeMembers(g).some(m=>areProfilesBlocked(s,userId,m.userId))))return fail('blocked','邀請對象與目前成員之間有封鎖設定，未發出邀請。');
    const sent=[],skipped=[],inviterName=uid==='me'?s.profile.displayName:TEST_PROFILES.find(p=>p.id===uid).name;
    for(const userId of userIds){
     if(activeMembers(g).some(m=>m.userId===userId)){skipped.push({userId,reason:'already_joined'});continue;}
     const previous=s.notifications.find(n=>n.type==='group_invite'&&n.invitationId===g.id&&n.userId===userId&&n.status!=='revoked');
     if(previous){skipped.push({userId,reason:previous.status==='pending'?'already_invited':'already_responded',notificationId:previous.id,status:previous.status});continue;}
     if(userId==='me'&&!s.profile.consents.invitationNotifications){skipped.push({userId,reason:'notifications_disabled'});continue;}
     const note={id:id('note'),type:'group_invite',entityId:g.id,invitationId:g.id,revision:g.revision,inviterId:uid,inviterName,userId,placeId:g.placeId,eventTitle:g.title,startAt:g.startAt,target:{view:'event',id:g.id},status:'pending',delivery:'local_demo',text:`${inviterName} 邀你參加「${g.title}」。`,createdAt:at,readAt:null,respondedAt:null,testData:true};
     s.notifications.push(note);sent.push(note);
    }
    value={invitationId:g.id,sent,skipped};break;
   }
   case 'group.declineInvite':case 'group.revokeInvite': {
    const note=s.notifications.find(n=>n.id===a.notificationId&&n.type==='group_invite');
    if(!note)return fail('notification_missing','找不到這則邀請。');
    const g=s.invitations.find(g=>g.id===note.invitationId),decline=a.type==='group.declineInvite';
    if(decline?note.userId!==uid:g?.hostId!==uid)return fail('invite_response_forbidden','無法修改這則邀請。');
    const status=decline?'declined':'revoked';
    if(note.status===status)return ok(clone(note));
    if(note.status!=='pending')return fail('invite_already_responded','這則邀請已處理。');
    note.status=status;note.respondedAt=at;if(decline)note.readAt??=at;
    value=note;break;
   }
   case 'group.interest': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(!g.membership.some(m=>m.userId===uid))g.membership.push({userId:uid,status:'interested',acceptedRevision:null,interestAt:at});value=g;break;}
   case 'group.join': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(['cancelled','expired','completed','in_progress','needs_host'].includes(g.status)||now>=Date.parse(g.deadlineAt))return fail('join_closed','這個邀約目前無法加入。');if(a.revision!==undefined&&a.revision!==g.revision)return fail('stale_revision','條件已更新，請先查看最新安排。');if(activeMembers(g).some(m=>areProfilesBlocked(s,uid,m.userId)))return fail('blocked','此邀約含已封鎖的人，無法加入。');let m=g.membership.find(m=>m.userId===uid);if(m&&!['left','interested'].includes(m.status))return ok(clone(g));if(activeMembers(g).length>=g.maxPeople)return fail('full','這個邀約已滿。');const conflict=detectConflict(s,uid,g.startAt,g.endAt,g.id);if(conflict)return fail('schedule_conflict','這個時段已有其他邀約。',{invitationId:conflict.id});revise(s,g,'有新成員加入，請查看人數與費用，再確認參加。');if(!m){m={userId:uid};g.membership.push(m);}Object.assign(m,{status:'confirmed',acceptedRevision:g.revision,confirmedAt:at});for(const note of s.notifications)if(note.type==='group_invite'&&note.invitationId===g.id&&note.userId===uid&&note.status==='pending'){note.status='accepted';note.respondedAt=at;note.acceptedRevision=g.revision;}updateStatus(g);system(s,g,'有新成員加入，請查看人數與費用，再確認參加。','reconfirmation');value=g;break;}
   case 'group.change': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(a.revision!==undefined&&a.revision!==g.revision)return fail('stale_revision','條件已更新，請先查看最新安排。');if(g.hostId!==uid)return fail('host_required','只有目前主揪可以修改安排。');if(['cancelled','expired','completed','in_progress'].includes(g.status))return fail('change_closed','此邀約已不能修改，請建立新邀約。');const patch={};for(const k of ['title','activity','description','placeId','startAt','endAt','deadlineAt','minPeople','maxPeople','costItems'])if(a.changes?.[k]!==undefined)patch[k]=clone(a.changes[k]);const candidate={...g,...patch};const valid=validateInvitation(candidate,now);if(!valid.ok)return valid;if(candidate.maxPeople<activeMembers(g).length)return fail('capacity_too_small','最多人數不能少於目前參加人數。');const labels={title:'邀約名稱',activity:'活動內容',description:'說明',placeId:'目的地',startAt:'時間',endAt:'時間',deadlineAt:'報名截止',minPeople:'人數',maxPeople:'人數',costItems:'費用'};const changed=[...new Set(Object.keys(patch).filter(k=>JSON.stringify(g[k])!==JSON.stringify(patch[k])).map(k=>labels[k]))];const description=changed.length?'已更新'+changed.join('、')+'，請查看新安排並重新確認。':'請重新確認目前安排。';revise(s,g,description);Object.assign(g,patch);setConfirmationDeadline(g);updateStatus(g);system(s,g,description,'reconfirmation');value=g;break;}
   case 'group.confirm': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(['cancelled','expired','completed','in_progress'].includes(g.status)||now>=Date.parse(g.deadlineAt))return fail('confirm_closed','已過可確認時間，請查看其他安排。');if(g.confirmationDeadlineAt&&now>=Date.parse(g.confirmationDeadlineAt))return fail('confirmation_expired','這次確認時間已結束，請更新邀約查看新的安排。');const m=g.membership.find(m=>m.userId===uid);if(!m||['left','interested'].includes(m.status))return fail('not_joined','請先加入這個邀約。');if(a.revision!==g.revision)return fail('stale_revision','條件已更新，請先查看最新安排。');if(detectConflict(s,uid,g.startAt,g.endAt,g.id))return fail('schedule_conflict','新的時間和另一個邀約重疊。');m.status='confirmed';m.acceptedRevision=g.revision;m.confirmedAt=at;updateStatus(g);system(s,g,g.status==='ready'?'所有成員已同意這版安排與試算費用。':'已確認這版安排，等待其他成員確認。','confirmed');value=g;break;}
   case 'group.leave': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(['completed','cancelled','expired','in_progress'].includes(g.status))return fail('leave_closed','這個活動的狀態已不能修改。');const m=g.membership.find(x=>x.userId===uid);if(!m||m.status==='left')return ok(clone(g));const wasActive=!['interested','left'].includes(m.status);if(wasActive)revise(s,g,'有人退出，請查看剩餘人數與費用，再決定是否繼續。');m.status='left';if(g.hostId===uid)g.hostId=null;updateStatus(g);if(wasActive)system(s,g,'有人退出，請查看剩餘人數與費用，再決定是否繼續。','reconfirmation',[uid]);value=g;break;}
   case 'group.claimHost': {const g=getGroup();if(!g)return fail('group_missing','找不到這個邀約。');if(g.hostId||g.status!=='needs_host')return fail('host_exists','這個邀約目前不需要接手。');if(now>=Date.parse(g.deadlineAt))return fail('expired','報名時間已結束。');const m=activeMembers(g).find(x=>x.userId===uid);if(!m)return fail('not_joined','只有已加入的成員可以接手。');g.hostId=uid;updateStatus(g);system(s,g,'已有成員接手主揪，請查看最新安排。','host_changed');value=g;break;}
   case 'group.expire': {
    let n=0;
    for(const g of s.invitations){
     updateStatus(g);
     if(!['open','needs_host'].includes(g.status))continue;
     if(now>=Date.parse(g.deadlineAt)){g.status='expired';g.confirmationDeadlineAt=null;system(s,g,'截止時尚未完成成團確認。你可以改期或另選活動。','expired');n++;continue;}
     if(!g.confirmationDeadlineAt||now<Date.parse(g.confirmationDeadlineAt))continue;
     const pending=activeMembers(g).filter(m=>m.status!=='confirmed'||m.acceptedRevision!==g.revision);
     if(!pending.length){g.confirmationDeadlineAt=null;continue;}
     const removedIds=pending.map(m=>m.userId);
     revise(s,g,'確認時間結束，未確認的成員已退出；剩餘成員需重新確認分攤。');
     for(const m of pending){m.status='left';m.leftAt=at;m.leftReason='confirmation_timeout';}
     if(removedIds.includes(g.hostId))g.hostId=null;
     if(!activeMembers(g).length){g.status='expired';g.confirmationDeadlineAt=null;}else updateStatus(g);
     system(s,g,'確認時間結束，未確認的成員已退出；剩餘成員需重新確認分攤。','confirmation_timeout',removedIds);
     n++;
    }
    for(const note of s.notifications)if(note.type==='group_invite'&&note.status==='pending'){
     const g=s.invitations.find(g=>g.id===note.invitationId);
     if(!g||['cancelled','expired','completed','in_progress'].includes(g.status)||now>=Date.parse(g.deadlineAt)){note.status='expired';note.respondedAt=at;}
    }
    value=n;break;
   }
   case 'message.send': {const g=getGroup();if(!g)return fail('group_missing','找不到這個房間。');const m=g.membership.find(x=>x.userId===uid);if(!m||['interested','left'].includes(m.status))return fail('not_joined','加入後才能在房間留言。');const text=cleanText(a.text,2000);if(!text)return fail('message_empty','請輸入訊息。');const msg={id:id('msg'),roomId:g.id,kind:'user',authorId:uid,text,createdAt:at,testData:true};s.messages.push(msg);value=msg;break;}
   case 'game.start': {const[c,p]=readAttempt();if(!c)return fail('challenge_missing','找不到這個挑戰。');value=p;break;}
   case 'game.answer': {const[c,p]=readAttempt();if(!c)return fail('challenge_missing','找不到這個挑戰。');const option=c.options.find(x=>x.id===a.optionId);if(!option)return fail('answer_invalid','請選擇一個答案。');if(['answered','revealed','collected'].includes(p.status))return ok({correct:p.status==='answered',alreadyFinished:true,progress:clone(p)});p.attempts++;p.lastAnswerId=a.optionId;const correct=a.optionId===c.answerId;if(correct){p.status='answered';p.completedAt=at;}value={correct,feedback:option.feedback,progress:p};break;}
   case 'game.hint': {const[c,p]=readAttempt();if(!c)return fail('challenge_missing','找不到這個挑戰。');p.usedHints=Math.min(c.hints.length,p.usedHints+1);value={hint:c.hints[p.usedHints-1],index:p.usedHints};break;}
   case 'game.reveal': {const[c,p]=readAttempt();if(!c)return fail('challenge_missing','找不到這個挑戰。');if(p.status!=='collected'&&p.status!=='answered'){p.status='revealed';p.revealed=true;p.completedAt=at;}value={answerId:c.answerId,explanation:c.explanation,progress:p};break;}
   case 'game.collect': {const[c,p]=readAttempt();if(!c)return fail('challenge_missing','找不到這個挑戰。');if(!['answered','revealed','collected'].includes(p.status))return fail('challenge_unfinished','完成或查看解答後，就能保存這個發現。');if(!s.game.ledger.some(x=>x.challengeId===c.id)){s.game.ledger.push({id:id('reward'),challengeId:c.id,xp:c.xp,at});}p.rewardClaimed=true;p.status='collected';let mem=s.memories.find(m=>m.placeId===c.placeId);if(!mem){mem={id:id('memory'),placeId:c.placeId,onlineDiscoveryIds:[],photoBlobIds:[],note:'',selfReportedVisitAt:null,visibility:'private',createdAt:at};s.memories.push(mem);}mem.onlineDiscoveryIds=[...new Set([...mem.onlineDiscoveryIds,c.id])];value={progress:getGrowth(s),memory:mem};break;}
   case 'pet.equip': {const ac=ACCESSORIES.find(x=>x.id===a.accessoryId);if(!ac)return fail('accessory_missing','找不到這個配件。');if(ac.requiresAsset)return fail('asset_pending','這件配件還在製作，請選擇已完成的造型。');if(!getGrowth(s).unlockedAccessoryIds.includes(ac.id))return fail('accessory_locked','完成這個主題後，就能換上配件。');s.game.equippedAccessoryId=ac.id;value=ac;break;}
   case 'memory.save': {if(!getPlace(a.placeId))return fail('place_missing','找不到這個地點。');let m=s.memories.find(m=>m.placeId===a.placeId);if(!m){m={id:id('memory'),placeId:a.placeId,onlineDiscoveryIds:[],photoBlobIds:[],visibility:'private',createdAt:at};s.memories.push(m);}if(a.photoBlobIds!==undefined){if(!Array.isArray(a.photoBlobIds)||a.photoBlobIds.some(x=>typeof x!=='string')||a.photoBlobIds.length>12)return fail('photos_invalid','每個地點最多保存12張照片。');m.photoBlobIds=[...new Set(a.photoBlobIds)];}if(a.note!==undefined)m.note=cleanText(a.note,3000);if(a.selfReportedVisitAt!==undefined){if(a.selfReportedVisitAt!==null&&!Number.isFinite(Date.parse(a.selfReportedVisitAt)))return fail('visit_date_invalid','請填寫有效的到訪日期。');m.selfReportedVisitAt=a.selfReportedVisitAt;}m.updatedAt=at;value=m;break;}
   case 'memory.remove': {s.memories=s.memories.filter(m=>m.id!==a.memoryId);value=true;break;}
   case 'notification.read': {const n=s.notifications.find(n=>n.id===a.notificationId&&(!n.userId||n.userId===uid));if(!n)return fail('notification_missing','找不到這則通知。');n.readAt=at;value=n;break;}
   case 'demo.reset': {if(a.confirm!==true)return fail('confirmation_required','請確認是否清除本機展示紀錄。');return commit(seedState(now,a.seed!==false),true,a.type);}
   default:return fail('action_unknown','無法執行這個操作。');
  }
  return commit(s,value,a.type);
 }
 function dispatch(action){try{return dispatchUnsafe(action);}catch{return fail('input_invalid','輸入格式不完整，這次變更尚未保存。');}}
 return {getState:()=>clone(state),getLoadError:()=>loadError?clone(loadError):null,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},dispatch,refresh:()=>refreshFromStorage(),exportState:()=>JSON.stringify(state,null,2),exportRawStorage:()=>storage?.getItem(storageKey)??null,importState:json=>{try{if(String(json).length>5_000_000)return fail('import_large','檔案太大，未匯入。');const next=JSON.parse(json);const r=validateState(next);if(!r.ok)return r;const fresh=refreshFromStorage({recovery:true});if(!fresh.ok)return fresh;for(const g of next.invitations)updateStatus(g);return commit(next,true,'data.import');}catch{return fail('import_invalid','無法讀取這份JSON，原紀錄保留。');}},resetDemo:()=>dispatch({type:'demo.reset',confirm:true})};
}
