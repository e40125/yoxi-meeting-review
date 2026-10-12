import {extractConstraints,matchHardConstraints} from './constraints.mjs';
import {PLACES,CHALLENGES,THEMES,ACCESSORIES,getPlace} from '../data/catalog.mjs';
export const ok=value=>({ok:true,value});
export const fail=(code,message,details)=>({ok:false,error:{code,message,details}});
export const cleanText=(x,max=500)=>String(x??'').trim().slice(0,max);
const normalize=x=>String(x??'').replaceAll('臺','台').toLowerCase();
function safelyDecode(text){return String(text).replace(/(?:%[\da-f]{2})+/gi,part=>{try{return decodeURIComponent(part);}catch{return part;}});}
export function parsePlaceInput(text) {
 const input=String(text??'').slice(0,20000),links=[],parts=[];
 const plain=input.replace(/https?:\/\/[^\s<>"']+/gi,raw=>{
  const value=raw.replace(/[，。；！？、）)]*$/u,'');
  let url;try{url=new URL(value);}catch{links.push({url:value,status:'invalid_url',networkResolved:false});return '';}
  const host=url.hostname.toLowerCase();
  if(['maps.app.goo.gl','goo.gl'].includes(host)){links.push({url:value,status:'short_link_unresolved',networkResolved:false});return '';}
  const google=['google.com','www.google.com','maps.google.com','google.com.tw','www.google.com.tw','maps.google.com.tw'].includes(host)&&(url.pathname.startsWith('/maps')||host.startsWith('maps.'));
  const apple=host==='maps.apple.com';
  if(!google&&!apple){links.push({url:value,status:'unsupported_url',networkResolved:false});return '';}
  const fields=[];
  for(const key of ['query','q','destination','origin','waypoints','name','address'])for(const v of url.searchParams.getAll(key))fields.push(safelyDecode(v));
  const segments=url.pathname.split('/');
  if(google)for(let i=0;i<segments.length-1;i++)if(['place','search','dir'].includes(segments[i]))fields.push(...segments.slice(i+1).filter(x=>x&&!x.startsWith('@')&&!x.startsWith('data=')).map(x=>safelyDecode(x).replaceAll('+',' ')));
  const decoded=fields.join(' '),entry={url:value,status:'no_known_place_name',networkResolved:false};links.push(entry);parts.push({text:normalize(decoded),method:'map_url_name',link:entry});return '';
 });
 parts.unshift({text:normalize(plain),method:'name_match'});
 const candidates=PLACES.filter(p=>!p.testData).flatMap(p=>{
  const names=[p.name,...p.aliases??[]].map(normalize),matches=parts.filter(part=>names.some(name=>part.text.includes(name)));
  if(!matches.length)return [];for(const part of matches)if(part.link)part.link.status='name_extracted';
  return [{placeId:p.id,name:p.name,city:p.city,selected:true,method:matches[0].method,needsConfirmation:true}];
 });
 return {candidates,links,networkResolved:false};
}
export const parsePlaceCandidates=text=>parsePlaceInput(text).candidates;
export function searchPlaces(input={}) {
 const resolved=extractConstraints(input),criteria=resolved.criteria,rejected=[];
 const interest=normalize([criteria.query,...criteria.interests??[]].join(' '));
 const places=PLACES.filter(p=>!p.testData||criteria.includeTestData).filter(p=>{
  const reasons=matchHardConstraints(p,resolved);
  if(reasons.length){rejected.push({placeId:p.id,reasons});return false;}return true;
 }).map(p=>{const matched=p.tags.filter(t=>interest.includes(normalize(t)));return {...p,score:matched.length,reasons:matched.length?matched.map(t=>`有你想找的${t}`):['可以先看看這個地方'],costStatus:p.fees.some(f=>f.amount===null)?'incomplete':'known'};}).sort((a,b)=>b.score-a.score);
 return {places,rejected,mode:'rules',constraints:resolved.extracted,constraintErrors:resolved.errors,resolved};
}
export function buildSitePlan({placeId,siteMinutes=60,travelIncluded=false,budget=null,interests=[],participants=[],mustInclude=[],setting=null,freeOnly=false,query=''}={}) {
 const place=getPlace(placeId);if(!place)return fail('place_missing','找不到這個地點。');
 if(!Number.isInteger(siteMinutes)||siteMinutes<1||siteMinutes>720)return fail('duration_invalid','請填入1到720分鐘的現場時間。');
 if(budget!==null&&(!Number.isFinite(budget)||budget<0))return fail('budget_invalid','預算需為0或正數。');
 const knownCost=place.fees.filter(f=>Number.isFinite(f.amount)).reduce((n,f)=>n+f.amount,0);
 if(budget!==null&&knownCost>budget)return fail('over_budget','已知費用超過預算。',{knownCost,budget});
 const resolved=extractConstraints({query,budget,mustInclude,setting,freeOnly});
 const constraintFailures=matchHardConstraints(place,resolved);
 if(constraintFailures.length)return fail('constraints_no_match','這個地點無法確認符合你的必要條件。',{reasons:constraintFailures});
 const availableSteps=place.experiences.filter(step=>resolved.criteria.requiredSettings.every(value=>step.settings?.includes(value)));
 if(!availableSteps.length)return fail('plan_content_missing','目前沒有符合條件的現場安排。');
 const requiredTags=resolved.criteria.mustInclude;
 if(requiredTags.some(tag=>!availableSteps.some(step=>step.tags.includes(tag))))return fail('plan_content_missing','目前安排沒有包含全部需要的體驗。',{requiredTags});
 const allInterests=[...interests,...participants.flatMap(p=>p.interests??[]),...requiredTags];
 const required=availableSteps.filter(s=>s.priority===1||s.tags.some(t=>allInterests.includes(t)));
 const requiredMinutes=required.reduce((n,s)=>n+s.minutes,0);
 if(requiredMinutes>siteMinutes)return fail('time_short','這些想做的事需要更多現場時間。',{requiredMinutes,availableMinutes:siteMinutes});
 const steps=[...required];let total=requiredMinutes;
 for(const s of availableSteps.filter(s=>!required.includes(s)).sort((a,b)=>a.priority-b.priority)){if(total+s.minutes<=siteMinutes){steps.push(s);total+=s.minutes;}}
 const unknownCostItems=[...place.fees.filter(f=>f.amount===null).map(f=>f.label),'交通'];
 return ok({placeId,siteMinutes,travelIncluded,budget:resolved.criteria.budget,constraints:resolved.extracted,interests,participants,steps:steps.map(x=>({...x})),totalMinutes:total,knownCost,unknownCostItems,status:'draft',feasibility:travelIncluded?'travel_unverified':unknownCostItems.length?'cost_unverified':'ready',notice:travelIncluded?'目前是現場安排；往返交通時間需另查。':'交通與未確認费用另計。',sourceRefs:place.sourceIds});
}
export function calculateGroupCosts(invitation,memberIds) {
 const active=(invitation.membership??[]).filter(m=>!['left','interested'].includes(m.status));
 const ids=memberIds??active.map(m=>m.userId);
 const costs=Object.fromEntries(ids.map(id=>[id,0]));let knownTotal=0;const unknown=[];
 for(const item of invitation.costItems??[]){if(!Number.isInteger(item.amount)||item.amount<0){unknown.push(item.label);continue;}
  if(item.basis==='per_person'){for(const id of ids)costs[id]+=item.amount;knownTotal+=item.amount*ids.length;}
  else if(ids.length){const q=Math.floor(item.amount/ids.length),r=item.amount%ids.length;ids.forEach((id,i)=>costs[id]+=q+(i<r?1:0));knownTotal+=item.amount;}
 }
 if(!invitation.transportCostKnown)unknown.push('交通');
 const confirmedMemberIds=active.filter(m=>m.status==='confirmed'&&m.acceptedRevision===invitation.revision).map(m=>m.userId);
 const pendingMemberIds=active.filter(m=>!confirmedMemberIds.includes(m.userId)).map(m=>m.userId);
 // Alternate rosters are estimates. Consent applies only to the exact current roster and revision.
 const currentRoster=ids.length===active.length&&ids.every(id=>active.some(m=>m.userId===id));
 const agreed=currentRoster&&active.length>0&&pendingMemberIds.length===0&&active.length>=invitation.minPeople&&active.some(m=>m.userId===invitation.hostId)&&!['cancelled','expired'].includes(invitation.status);
 return {count:ids.length,perPerson:costs,knownTotal,unknownItems:unknown,isTotalKnown:unknown.length===0,revision:invitation.revision??null,agreementStatus:agreed?'agreed':'provisional',agreedPerPerson:agreed?{...costs}:null,provisionalMemberIds:ids,confirmedMemberIds,pendingMemberIds};
}
export function getInvitationView(state,id) {
 const item=state.invitations.find(x=>x.id===id);if(!item)return null;
 const confirmed=item.membership.filter(m=>m.status==='confirmed'&&m.acceptedRevision===item.revision).length;
 const committed=item.membership.filter(m=>!['left','interested'].includes(m.status)).length;
 return {...item,confirmedCount:confirmed,committedCount:committed,pendingConfirmationCount:committed-confirmed,allMembersConfirmed:committed>0&&confirmed===committed,missingCount:Math.max(0,item.minPeople-confirmed),remainingSeats:Math.max(0,item.maxPeople-committed),costs:calculateGroupCosts(item),myMembership:item.membership.find(m=>m.userId===state.activeProfileId)??null};
}
export const getSavedPlaces=state=>state.activeProfileId==='me'?state.collections.map(c=>({...getPlace(c.placeId),...c})):[];
export const getMyPlans=state=>state.activeProfileId==='me'?state.plans:[];
export const getNotifications=state=>state.notifications.filter(n=>n.userId===state.activeProfileId||!n.userId);
export function areProfilesBlocked(state,a,b){
 const blockedBy=id=>id==='me'?state.profile.blockedUserIds:state.testProfileBlocks?.[id]??[];
 return blockedBy(a).includes(b)||blockedBy(b).includes(a);
}
export function getRoomMessages(state,invitationId){
 const g=state.invitations.find(g=>g.id===invitationId);
 if(!g?.membership.some(m=>m.userId===state.activeProfileId&&!['interested','left'].includes(m.status)))return [];
 return state.messages.filter(m=>m.roomId===invitationId);
}
export const getChallengeProgress=(state,id)=>state.game.attempts[id]??{status:'not_started',attempts:0,usedHints:0,revealed:false,rewardClaimed:false};
export function getGrowth(state,{challenges=CHALLENGES,themes:availableThemes=THEMES}={}) {
 const xp=state.game.ledger.reduce((n,r)=>n+r.xp,0),thresholds=[0,60,150,270,420,600];let index=thresholds.findLastIndex(x=>xp>=x); if(index<0)index=0;
 const completed=state.game.ledger.map(x=>x.challengeId);const themes=availableThemes.map(t=>({...t,completed:t.challengeIds.filter(id=>completed.includes(id)).length,total:t.challengeIds.length}));
 const remaining=challenges.filter(c=>!completed.includes(c.id));
 const availableXp=remaining.reduce((n,c)=>n+c.xp,0),maxReachableXp=xp+availableXp;
 const threshold=thresholds[index+1]??null,nextLevel=threshold!==null&&threshold<=maxReachableXp?threshold:null;
 const contentExhausted=remaining.length===0;
 const nextGoal=contentExhausted?{kind:'content_complete',label:'目前的挑戰都完成了'}:nextLevel!==null?{kind:'level',label:`累積 ${nextLevel} 探索經驗`,targetXp:nextLevel,remainingXp:nextLevel-xp}:{kind:'challenge',label:'繼續下一個發現',challengeId:remaining[0].id};
 return {xp,level:index+1,levelStart:thresholds[index],nextLevel,availableXp,maxReachableXp,contentExhausted,remainingChallengeIds:remaining.map(c=>c.id),nextGoal,completedChallengeIds:completed,themes,unlockedAccessoryIds:['none',...themes.filter(t=>t.total>0&&t.completed===t.total).flatMap(t=>t.rewardOptions)],equippedAccessoryId:state.game.equippedAccessoryId,unit:'探索經驗',redeemable:false};
}
export function detectConflict(state,userId,startAt,endAt,excludeId) {
 const a=Date.parse(startAt),b=Date.parse(endAt);
 return state.invitations.find(x=>x.id!==excludeId&&!['cancelled','expired','completed'].includes(x.status)&&x.membership.some(m=>m.userId===userId&&!['left','interested'].includes(m.status))&&a<Date.parse(x.endAt)&&b>Date.parse(x.startAt));
}
export function validateInvitation(d,now) {
 if(!getPlace(d.placeId))return fail('place_missing','請選擇一個目的地。');
 if(!cleanText(d.title,80))return fail('title_missing','請填寫活動名稱。');
 for(const [field,max,label] of [['title',80,'活動名稱'],['activity',1000,'想做的事與參加條件'],['description',1000,'活動說明']]) {
  if(d[field]!==undefined&&d[field]!==null&&typeof d[field]!=='string')return fail(field+'_invalid',label+'需為文字。');
  if(String(d[field]??'').length>max)return fail(field+'_too_long',label+'最多'+max+'字，請調整後再保存。',{field,max,length:String(d[field]).length});
 }
 const start=Date.parse(d.startAt),end=Date.parse(d.endAt),deadline=Date.parse(d.deadlineAt);
 if(![start,end,deadline].every(Number.isFinite)||end<=start||deadline>=start||deadline<=now)return fail('time_invalid','請確認活動起訖與報名截止時間；截止需早於開始。');
 if(!Number.isInteger(d.minPeople)||!Number.isInteger(d.maxPeople)||d.minPeople<1||d.maxPeople<d.minPeople||d.maxPeople>12)return fail('people_invalid','人數需介於1到12人，最多人數不能少於成團人數。');
 if(!Array.isArray(d.costItems)||d.costItems.some(c=>c.amount!==null&&(!Number.isInteger(c.amount)||c.amount<0)))return fail('cost_invalid','費用請填非負整數元，未知費用留空。');return ok(true);
}
