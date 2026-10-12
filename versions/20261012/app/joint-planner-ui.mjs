import {createGenerativeClient,createJointSession,appendOwnInterests} from './core/generative-client.mjs';
import {getPlace,SOURCES} from './data/catalog.mjs';
import {renderJointBenefit,renderJointFit} from './joint-benefit-ui.mjs';
import {visibleJointChanges,jointResultsTitle,remainingJointUnknowns} from './core/joint-benefit-display.mjs';
import {esc as e,icon as i,money} from './city-ui.mjs';

let sequence=0;
const example={people:[{id:'me',text:'我喜歡建築前後重疊的線條，想找幾個角度拍。'},{id:'friend',text:'想花時間逛展，可以一起拍幾張，但不想一直站著等按快門。'}],sharedText:'到場後有 60 分鐘，門票每人 200 元以內。'};
const safeUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
const phaseText=(phase,name)=>({connecting:'正在連線',understanding:'正在整理兩人的想法',reading_change:`正在理解${name(phase.personId)}的調整`,understood:'已整理兩人的想法',matching:Number.isInteger(phase.candidateCount)?`正在比較 ${phase.candidateCount} 個去處`:'正在比較共同去處',complete:'正在整理結果',failed:'這次安排未完成'}[phase.phase]??'正在處理安排');
const fieldNames={budget:'入場預算',minutes:'現場時間',timeScope:'時間範圍',setting:'室內外條件',desires:'想做的事',requiredTags:'必要活動',preferredTags:'偏好活動',avoidTags:'不想做的事',unverifiedNeeds:'需查證的條件'};
function formatted(field,value){if(value===null)return '未指定';if(Array.isArray(value))return value.length?value.join('、'):'未指定';if(field==='budget')return money(value);if(field==='minutes')return value+' 分鐘';return ({site:'現場',total:'含往返',unknown:'待確認',any:'不限室內外',indoor:'室內',outdoor:'戶外'})[value]??String(value);}
export function mountJointPlanner(container,{
 profileInterests=[],getProfileInterests,displayName='我',friendName='朋友',initialInput,sessionState,
 capabilities,client=createGenerativeClient(),onSelect=()=>{},onStateChange=()=>{},onManual,
 showHeading=true,selectLabel='用這個安排',
}={}){
 if(!container?.ownerDocument)throw new TypeError('A mount container is required.');
 const doc=container.ownerDocument,win=doc.defaultView,uid='joint-'+(++sequence);
 if(!doc.querySelector('link[data-joint-planner-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./joint-planner-ui.css',import.meta.url).href;link.dataset.jointPlannerStyle='';doc.head.append(link);}
 const names={me:displayName.trim()||'我',friend:friendName.trim()||'朋友'},name=id=>names[id]??id;
 const input=sessionState?.input??initialInput??example.people.reduce((v,p)=>{v.people.push({id:p.id,text:''});return v;},{people:[],sharedText:''});
 let disposed=false,cap=capabilities?.generative??capabilities??{status:'loading'},capAbort=null,timer=null,view=null,lastIntent='',lastResult='',lastFeedback='',selectBusy=false;
 container.classList.add('joint-planner');
 const ids=input.people.map(p=>p.id);if(ids.length!==2)throw new TypeError('Two participant IDs are required.');
 names[ids[0]]=names.me;names[ids[1]]=names.friend;
 container.innerHTML=`${showHeading?`<header class="jp-heading"><p class="jp-kicker">一起去</p><h1>和朋友一起找</h1></header>`:''}
  <form class="jp-form" novalidate>
   <div class="jp-people">${ids.map((id,n)=>`<section class="jp-person ${n?'jp-friend':''}"><div class="jp-person-top"><label for="${uid}-${n}"><span class="jp-person-mark" aria-hidden="true">${n?'友':'我'}</span>${e(name(id))}想做什麼</label>${n===0&&(getProfileInterests||profileInterests.length)?'<button class="jp-text-button" type="button" data-jp="interests">帶入我的興趣</button>':''}</div><textarea id="${uid}-${n}" data-person="${e(id)}" rows="3" maxlength="1200" required placeholder="${n?'想慢慢逛展，也能一起拍幾張，但不想整趟都在等拍照。':'想拍建築的線條和層次，多找幾個不同的角度。'}"></textarea><p class="jp-field-error" id="${uid}-${n}-error" role="alert" hidden></p></section>`).join('')}</div>
   <div class="jp-shared"><label for="${uid}-shared">共同條件 <span>選填</span></label><textarea id="${uid}-shared" data-shared rows="2" maxlength="1200" placeholder="例如：到場後有 60 分鐘，門票每人 200 元以內。"></textarea></div>
   <div class="jp-form-footer"><button class="jp-button jp-primary" type="submit">找共同去處 ${i('chevron',17)}</button><button type="button" class="jp-text-button" data-jp="example">試填一個例子</button></div>
  </form>
  <div class="jp-capability" aria-live="polite"></div>
  <section class="jp-progress" hidden aria-label="安排進度"><div class="jp-progress-main"><span class="jp-pulse" aria-hidden="true"></span><span class="jp-phase" role="status"></span><span class="jp-seconds" aria-hidden="true"></span></div><button type="button" class="jp-text-button" data-jp="cancel">取消</button></section>
  <div class="jp-feedback" aria-live="polite"></div>
  <section class="jp-understanding" hidden aria-label="理解到的需求"></section>
  <section class="jp-results" aria-label="共同去處"></section>
  <details class="jp-revise" hidden><summary>調整其中一人的想法 ${i('plus',16)}</summary><form class="jp-revision-form" novalidate><div class="jp-revision-top"><label for="${uid}-person">要調整誰</label><select id="${uid}-person">${ids.map(id=>`<option value="${e(id)}">${e(name(id))}</option>`).join('')}</select></div><label class="jp-sr" for="${uid}-change">這次要調整的內容</label><textarea id="${uid}-change" rows="2" maxlength="1200" placeholder="例如：我現在只剩 40 分鐘，其他條件不變。"></textarea><div class="jp-revision-footer"><button type="submit" class="jp-button jp-primary">依這次調整重排</button><button type="button" class="jp-text-button" data-jp="discard-change">清除這次修改</button></div></form></details>
  <span class="jp-sr jp-announcement" role="status" aria-live="polite"></span>`;
 const $=s=>container.querySelector(s),$$=s=>[...container.querySelectorAll(s)];
 const mainForm=$('.jp-form'),revisionForm=$('.jp-revision-form'),resultNode=$('.jp-results'),intentNode=$('.jp-understanding');
 const session=createJointSession({client,initialInput:input,sessionState,onChange:s=>{view=s;render(s);onStateChange(session.getState());}});
 function readInput(){return {people:ids.map(id=>({id,text:$$('[data-person]').find(x=>x.dataset.person===id).value})),sharedText:$('[data-shared]').value};}
 function syncFields(s){
  for(const p of s.input.people){const el=$$('[data-person]').find(x=>x.dataset.person===p.id);if(el&&el.value!==p.text)el.value=p.text;}
  if($('[data-shared]').value!==s.input.sharedText)$('[data-shared]').value=s.input.sharedText;
  if($('#'+uid+'-change').value!==s.revision.text)$('#'+uid+'-change').value=s.revision.text;
  $('#'+uid+'-person').value=s.revision.personId;
 }
 function announce(text){$('.jp-announcement').textContent=text;}
 function renderCapabilities(){
  const el=$('.jp-capability');
  el.innerHTML=cap.status==='ready'?'':cap.status==='loading'?'<p>正在確認 AI 服務…</p>':cap.preview?`<p>網頁預覽未連接 AI。<a href="../index.html#demo">看 Demo 影片</a></p>${onManual?'<button class="jp-text-button" type="button" data-jp="manual">自行選條件</button>':''}`:`<p>AI 暫時無法使用。</p><button class="jp-text-button" type="button" data-jp="check-service">重新確認</button>${onManual?'<button class="jp-text-button" type="button" data-jp="manual">自行選條件</button>':''}`;
  mainForm.querySelector('[type=submit]').disabled=cap.status!=='ready'||view?.pending;
 }
 function renderIntent(intent,pending){
  if(!intent){intentNode.hidden=true;return;}
  intentNode.hidden=false;
  intentNode.innerHTML=`<div class="jp-section-label"><h2>${pending?'理解到的需求':'這次想做的事'}</h2><span>${pending?'仍在比較去處':'可在下方調整'}</span></div><div class="jp-intent-people">${intent.people.map((p,n)=>{
   const conditions=[p.minutes!==null&&p.minutes!==undefined?`${p.timeScope==='site'?'現場':p.timeScope==='total'?'含往返':'時間範圍待確認'} ${p.minutes} 分鐘`:null,p.budget!==null&&p.budget!==undefined?'入場 '+money(p.budget)+' 以內':null,p.setting!=='any'?formatted('setting',p.setting):null].filter(Boolean);
   return `<div class="jp-intent-person ${n?'jp-friend':''}"><h3>${e(name(p.id))}</h3><p>${p.desires.map(e).join('；')||'想做的事待補充'}</p>${conditions.length?`<div class="jp-condition-list">${conditions.map(x=>`<span>${e(x)}</span>`).join('')}</div>`:''}${p.requiredTags?.length?`<p class="jp-intent-rule">一定要有：${e(p.requiredTags.join('、'))}</p>`:''}${p.avoidTags?.length?`<p class="jp-intent-rule">不安排：${e(p.avoidTags.join('、'))}</p>`:''}${p.unverifiedNeeds?.length?`<p class="jp-intent-rule">需查證：${e(p.unverifiedNeeds.join('、'))}</p>`:''}</div>`;
  }).join('')}</div>`;
 }
 function sourceDetails(choice,place){const refs=[...new Set([...(choice.sourceIds??[]),...(place?.sourceIds??[])])].map(id=>SOURCES.find(s=>s.id===id)).filter(Boolean);
  return `<details class="jp-sources"><summary>資料與照片來源 ${i('plus',15)}</summary><div>${refs.map(s=>{const url=safeUrl(s.url);return `<p>${url?`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(s.title)} ${i('external',12)}</a>`:e(s.title)}<span>${e(s.publisher)}${s.checkedAt?' · '+e(s.checkedAt):''}${s.status==='needs_refresh'?' · 需再次確認':''}</span></p>`;}).join('')}${place?.imageCredit?`<p>${e(place.imageCredit)}</p>`:''}<p>現場分鐘為內容編輯估計；展覽及開放狀態以現場公告為準。</p></div></details>`;
 }
 function rejectionCopy(result){
  const reasons=[];
  for(const r of result?.rejected??[]){
   if(r.code==='time_short'&&r.details?.requiredMinutes)reasons.push(`${getPlace(r.placeId)?.name??'這個地點'}的必要活動約需 ${r.details.requiredMinutes} 分鐘。`);
   else if(r.code==='over_budget')reasons.push(`${getPlace(r.placeId)?.name??'這個地點'}的已知入場費超過預算。`);
   else if(r.code==='person_no_activity')reasons.push('目前的活動資料無法同時回應兩人的興趣。');
   else if(r.code==='avoided_experience')reasons.push('安排會包含其中一人不想做的活動。');
   else if(r.details?.reasons)reasons.push(...r.details.reasons);
  }
  return [...new Set(reasons)].slice(0,4);
 }
 function questionText(text){let out=String(text);for(const id of [...ids].sort((a,b)=>b.length-a.length))out=out.split(id).join(name(id));return out;}
 function renderResults(s){
  const current=s.result,shown=s.displayResult;
  let html='';
  if(!s.pending&&current?.status==='clarify')html+=`<section class="jp-clarify"><h2>還有條件需要確認</h2><ul>${(current.questions??[]).map(q=>`<li>${e(questionText(q))}</li>`).join('')}</ul><button type="button" class="jp-text-button" data-jp="edit-input">補充上方條件 ${i('arrow',15)}</button></section>`;
  if(!s.pending&&current?.status==='no_match')html+=`<section class="jp-clarify"><h2>目前資料裡沒有同時符合的安排</h2><ul>${[...(current.questions??[]).map(questionText),...rejectionCopy(current)].map(q=>`<li>${e(q)}</li>`).join('')}</ul><button type="button" class="jp-text-button" data-jp="edit-input">調整上方條件 ${i('arrow',15)}</button></section>`;
  if(shown?.selection?.length){
   const stale=!s.canSelect,changes=visibleJointChanges(current?.changes);
   html+=`<div class="jp-result-heading"><h2 tabindex="-1">${stale?'前一次的安排':jointResultsTitle(shown.selection)}</h2>${stale?'<span>尚未套用這次調整</span>':''}</div>`;
   if(changes.length&&!stale)html+=`<div class="jp-changes">${changes.map(c=>`<span>${e(name(c.personId))}的${e(fieldNames[c.field]??c.field)}：${e(formatted(c.field,c.before))} → <strong>${e(formatted(c.field,c.after))}</strong></span>`).join('')}</div>`;
   html+=shown.selection.map((choice,n)=>{
    const p=getPlace(choice.placeId),plan=choice.plan;if(!p||!plan)return '';
    const pendingCosts=plan.unknownCostItems??[];
    const confirmations=plan.steps.filter(x=>x.requiresConfirmation);
    const unverified=remainingJointUnknowns(choice,shown.intent);
    const caveats=[choice.tradeoffBasis?null:choice.tradeoff,...unverified.map(u=>`${name(u.personId)}想要的「${u.detail}」尚無資料確認。`)].filter(Boolean);
    return `<article class="jp-place ${stale?'jp-previous':''}" data-choice="${n}"><div class="jp-photo"><img src="${e(p.image)}" alt="${e(p.name)}" loading="lazy"><span>${e(p.city)} · ${e(p.area??'')}</span></div><div class="jp-place-body"><h3>${e(p.name)}</h3>${renderJointFit(choice,shown.intent,names,{adjust:!stale})}<div class="jp-benefits">${choice.benefits.map((benefit,k)=>{const person=shown.intent.people.find(x=>x.id===benefit.personId);return `<div class="jp-benefit ${k?'jp-friend':''}"><strong>${e(name(benefit.personId))}</strong>${renderJointBenefit(benefit,person)}</div>`;}).join('')}</div>
      <div class="jp-plan-facts"><div>${i('clock',18)}<span>現場約 <strong>${e(plan.totalMinutes)} 分鐘</strong><small>不含往返；依活動內容估計</small></span></div><div>${i('wallet',18)}<span>已知入場費 <strong>${money(plan.knownCost)}／人</strong>${pendingCosts.length?`<small>${e(pendingCosts.join('、'))}費用另查</small>`:''}</span></div></div>
      <p class="jp-plan-overview">${e(plan.steps.map(step=>step.title).join(" → "))}</p><details class="jp-itinerary"><summary>現場怎麼安排 ${i('plus',15)}</summary><ol>${plan.steps.map(step=>`<li><span class="jp-step-time">${e(step.minutes)}<small>分鐘</small></span><div><h4>${e(step.title)}</h4><p>${e(step.detail)}</p>${step.requiresConfirmation?'<span class="jp-step-note">開放與內容待確認</span>':''}</div></li>`).join('')}</ol></details>
      ${caveats.length||confirmations.length?`<div class="jp-limitations"><strong>選擇前先確認</strong>${caveats.map(x=>`<p>${e(x)}</p>`).join('')}${confirmations.length?`<p>${e(confirmations.map(x=>x.title).join('、'))}：當期內容與開放情況需再確認。</p>`:''}</div>`:''}
      <button type="button" class="jp-button jp-primary jp-select" data-jp="select" data-index="${n}" ${stale?'disabled':''}>${e(selectLabel)} ${i('chevron',16)}</button>${sourceDetails(choice,p)}</div></article>`;
   }).join('');
   html+=`<p class="jp-coverage">依目前收錄的 ${e(shown.catalogPlaceCount??'?')} 個地點安排。</p>`;
  }
  const openKeys=[...resultNode.querySelectorAll('details[open]')].map(d=>`${d.closest('[data-choice]')?.dataset.choice??'none'}:${d.className}`);
  resultNode.innerHTML=html;
  for(const d of resultNode.querySelectorAll('details'))if(openKeys.includes(`${d.closest('[data-choice]')?.dataset.choice??'none'}:${d.className}`))d.open=true;
 }
 function render(s){
  if(disposed)return;syncFields(s);renderCapabilities();
  for(const [n,field] of $$('[data-person]').entries()){
   const invalid=s.error?.field==='person'&&s.error.personId===field.dataset.person,message=invalid?(s.error.kind==='empty'?`請填寫${n?name(field.dataset.person):'自己'}想做的事。`:s.error.message):'',errorNode=$('#'+uid+'-'+n+'-error');
   field.setAttribute('aria-invalid',String(invalid));errorNode.hidden=!invalid;errorNode.textContent=message;
   if(invalid)field.setAttribute('aria-describedby',errorNode.id);else field.removeAttribute('aria-describedby');
  }

  $('[data-jp=example]').hidden=s.input.people.some(p=>p.text.trim())||!!s.input.sharedText.trim();
  const progress=$('.jp-progress');progress.hidden=!s.pending;
  if(s.pending){$('.jp-phase').textContent=phaseText(s.phase??{phase:'connecting'},name);startTimer();}else stopTimer();
  const feedback=JSON.stringify([s.error,s.notice,s.dirty,!!s.revision.text.trim(),!!s.acceptedInput]);
  if(feedback!==lastFeedback){lastFeedback=feedback;$('.jp-feedback').innerHTML=`${s.error&&!s.error.personId?`<p class="jp-error" role="alert">${e(s.error.message)}</p>`:s.notice?`<p>${e(s.notice)}</p>`:''}${s.acceptedInput&&(s.dirty||s.revision.text.trim()||s.error||s.notice==='已取消。')?'<button type="button" class="jp-text-button" data-jp="restore">回到上次條件</button>':''}`;}
  const intent=s.pendingIntent??s.result?.intent,intentKey=JSON.stringify([intent,!!s.pendingIntent]);
  if(intentKey!==lastIntent){lastIntent=intentKey;renderIntent(intent,!!s.pendingIntent);}
  const resultKey=JSON.stringify([s.result,s.displayResult,s.canSelect,s.pending]);
  if(resultKey!==lastResult){lastResult=resultKey;renderResults(s);}
  $('.jp-revise').hidden=!s.result?.intent;
  revisionForm.querySelector('[type=submit]').disabled=!s.canRevise||cap.status!=='ready';
  $$('.jp-select').forEach(x=>x.disabled=!s.canSelect||selectBusy);
 }
 function startTimer(){if(timer)return;const update=()=>{$('.jp-seconds').textContent=Math.max(0,Math.floor((Date.now()-view.startedAt)/1000))+' 秒';};update();timer=win.setInterval(update,1000);}
 function stopTimer(){if(timer){win.clearInterval(timer);timer=null;}}
 async function checkService(){capAbort?.abort();const currentAbort=new AbortController();capAbort=currentAbort;cap={status:'loading'};renderCapabilities();try{const next=await client.capabilities({signal:currentAbort.signal});if(!disposed&&capAbort===currentAbort&&!currentAbort.signal.aborted){cap=next;render(session.getState());}}catch{if(!disposed&&capAbort===currentAbort&&!currentAbort.signal.aborted){cap={status:'unavailable'};render(session.getState());}}}
 async function run(task){
  if(cap.status!=='ready')return;
  const result=await session.run(task);
  if(disposed)return;
  if(result){announce(result.selection.length?jointResultsTitle(result.selection)+'。':'條件已整理，還需確認。');const target=resultNode.querySelector('.jp-result-heading h2,.jp-clarify h2');if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'});}}
  else if(session.getState().error){const error=session.getState().error,field=error.personId?$$('[data-person]').find(el=>el.dataset.person===error.personId):error.field==='shared'?$('[data-shared]'):null;if(field){field.focus({preventScroll:true});field.scrollIntoView({block:'center',behavior:'auto'});}else $('.jp-feedback')?.scrollIntoView({block:'nearest',behavior:'auto'});}
 }
 const onMainInput=()=>session.setInput(readInput());
 const onMainSubmit=ev=>{ev.preventDefault();ev.stopPropagation();session.setInput(readInput());run('joint');};
 const onRevisionInput=()=>session.setRevision({personId:$('#'+uid+'-person').value,text:$('#'+uid+'-change').value});
 const onRevisionSubmit=ev=>{ev.preventDefault();ev.stopPropagation();onRevisionInput();run('revise');};
 mainForm.addEventListener('input',onMainInput);mainForm.addEventListener('submit',onMainSubmit);revisionForm.addEventListener('input',onRevisionInput);revisionForm.addEventListener('submit',onRevisionSubmit);
 const onClick=async event=>{
  const target=event.target.closest('[data-jp]');if(!target||!container.contains(target))return;event.stopPropagation();
  switch(target.dataset.jp){
   case 'interests':{try{const terms=getProfileInterests?await getProfileInterests():profileInterests;if(disposed)return;const result=appendOwnInterests(session.getState().input,terms);if(result.changed){session.setInput(result.input);$$('[data-person]')[0].focus();}$('.jp-feedback').textContent=result.message;announce(result.message);}catch(error){if(disposed)return;$('.jp-feedback').innerHTML='<p class="jp-error" role="alert">'+e(error.message||'目前無法讀取興趣，請再試一次。')+'</p>';}break;}
   case 'example':{const s=session.getState();if(s.input.people.some(p=>p.text.trim())||s.input.sharedText.trim()){announce('上方已有內容，請保留或先清空再試填。');break;}const ex=structuredClone(example);ex.people.forEach((p,n)=>p.id=ids[n]);session.setInput(ex);announce('已填入示例，可以再修改。');break;}
   case 'cancel':session.cancel();mainForm.querySelector('[type=submit]').focus({preventScroll:true});break;
   case 'restore':session.restore();announce('已回到上次條件。');break;
   case 'discard-change':session.setRevision({text:''});$('#'+uid+'-change').focus();break;
   case 'edit-input':$('[data-shared]').focus();break;
   case 'adjust-fit':{const details=$('.jp-revise'),field=$('#'+uid+'-change');details.open=true;field.focus({preventScroll:true});field.scrollIntoView({block:'center',behavior:'auto'});break;}
   case 'check-service':checkService();break;
   case 'manual':onManual?.();break;
   case 'select':{const selected=session.select(Number(target.dataset.index));if(!selected||selectBusy)break;selectBusy=true;render(session.getState());try{await onSelect(selected);}catch(error){if(!disposed){$('.jp-feedback').innerHTML='<p class="jp-error" role="alert">'+e(error.message||'這個安排未能開啟，請再試一次。')+'</p>';}}finally{selectBusy=false;if(!disposed)render(session.getState());}break;}
  }
 };
 container.addEventListener('click',onClick);
 view=session.getState();render(view);if(cap.status==='loading')checkService();
 function dispose(){if(disposed)return;disposed=true;session.dispose();capAbort?.abort();stopTimer();container.removeEventListener('click',onClick);mainForm.removeEventListener('input',onMainInput);mainForm.removeEventListener('submit',onMainSubmit);revisionForm.removeEventListener('input',onRevisionInput);revisionForm.removeEventListener('submit',onRevisionSubmit);}
 return {dispose,getState:()=>session.getState(),setCapabilities(next){capAbort?.abort();cap=next?.generative??next;render(session.getState());},focus:()=>$$('[data-person]')[0].focus()};
}
