'use strict';

// These are stated ride preferences. They do not infer gender or grant singing consent.
(function () {
  const moods = {
    quiet: {label:'安靜搭車',note:'休息一下，不聊天',icon:'quiet'},
    chat: {label:'輕鬆聊聊',note:'有話題就聊',icon:'chat'},
    listen: {label:'一起聽歌',note:'放幾首喜歡的歌',icon:'listen'},
    sing: {label:'一起唱',note:'大家想唱再開唱',icon:'sing'}
  };
  const candidate = Object.freeze({gender:'female',genderSource:'declared-demo',moods:['quiet','chat','listen'],canRequestSinging:true});
  const drawings = {
    quiet:'<path d="m4 15 6 0 8 7V6l-8 7H4v2Z"/><path d="m25 10 9 12m0-12L25 22"/>',
    chat:'<path d="M5 6h28v20H20l-8 7v-7H5V6Z"/><path d="M12 13h14M12 19h9"/>',
    listen:'<path d="M7 24V17a12 12 0 0 1 24 0v7"/><rect x="4" y="20" width="8" height="13" rx="4"/><rect x="26" y="20" width="8" height="13" rx="4"/>',
    sing:'<rect x="13" y="4" width="12" height="22" rx="6"/><path d="M8 19v2a11 11 0 0 0 22 0v-2M19 32v5m-7 0h14M17 10h4m-4 5h4"/>',
    women:'<circle cx="19" cy="12" r="8"/><path d="M19 20v15m-6-6h12"/>'
  };
  const art = name => `<svg viewBox="0 0 38 40" aria-hidden="true" focusable="false">${drawings[name]||drawings.listen}</svg>`;
  const mood = (plan=state) => plan.rideMood==='any'?'any':Object.hasOwn(moods,plan.rideMood)?plan.rideMood:'listen';
  const label = (plan=state) => mood(plan)==='any'?'都可以':moods[mood(plan)].label;
  const origin = () => state.prefsOrigin && state.prefsOrigin!=='rideprefs' && metadata.some(x=>x.id===state.prefsOrigin)?state.prefsOrigin:'rides';
  const applyDefaults = () => {
    if(!['any',...Object.keys(moods)].includes(state.rideMood))state.rideMood='listen';
    if(typeof state.womenOnly!=='boolean')state.womenOnly=false;
    if(!state.prefsOrigin)state.prefsOrigin='rides';
  };
  applyDefaults();
  const invalidateUnsubmittedTerms = () => {
    if(!['pending','accepted'].includes(state.request)||state.tripStatus==='arrived')state.terms=false;
  };

  window.YoxiRidePrefs = {
    label,
    summary(plan=state){return [label(plan),plan.womenOnly?'女性乘客同行':''].filter(Boolean).join(' · ');},
    badges(plan=state){return `<span class="r6-badge">${art(mood(plan)==='any'?'chat':mood(plan))}${label(plan)}</span>${plan.womenOnly?`<span class="r6-badge r6-badge-women">${art('women')}女性乘客同行</span>`:''}`;},
    open(from=current){state.prefsOrigin=from==='rideprefs'?origin():from;applyDefaults();save();go('rideprefs');},
    compatible(other=candidate,plan=state){
      const requested=mood(plan);
      if(plan.womenOnly && other.gender!=='female')return false;
      return requested==='any'||other.moods?.includes(requested)||(requested==='sing'&&other.canRequestSinging===true);
    },
    routeNote(plan=state){
      const requested=mood(plan);
      if(requested==='quiet')return state.request==='accepted'?'這趟約好安靜搭車':'希望這趟安靜搭車';
      if(requested==='chat')return '想輕鬆聊聊';
      if(requested==='listen')return '想一起聽歌';
      if(requested==='sing')return '一起唱，先問同車的人';
      return '車上氣氛都可以';
    }
  };

  screens.rideprefs = function () {
    applyDefaults();
    const selected=mood();
    return `${toolbar('同行偏好',origin())}<div class="scroll r6-scroll"><div class="r6-page">
      <div class="r6-intro"><span class="r6-eyebrow">這次出門</span><h1>這趟想怎麼搭？</h1><p>把你的偏好告訴同行的人。</p></div>
      <div class="r6-section-head"><h2 id="r6-mood-title">車上氣氛</h2><button class="r6-any ${selected==='any'?'is-selected':''}" data-act="r6-any" aria-pressed="${selected==='any'}">${selected==='any'?icon('check'):''}都可以</button></div>
      <div class="r6-mood-grid" role="radiogroup" aria-labelledby="r6-mood-title">${Object.entries(moods).map(([key,item])=>`<label class="r6-mood r6-mood-${key} ${selected===key?'is-selected':''}"><input type="radio" name="ride-mood" value="${key}" ${selected===key?'checked':''}><span class="r6-mood-inner"><span class="r6-mood-art">${art(item.icon)}</span><span class="r6-radio-mark" aria-hidden="true">${selected===key?icon('check'):''}</span><strong>${item.label}</strong><small>${item.note}</small></span></label>`).join('')}</div>
      <section class="r6-women-card" aria-labelledby="r6-women-title"><div class="r6-women-row"><span class="r6-women-symbol">${art('women')}</span><div><h2 id="r6-women-title">女性乘客同行</h2><p>只找女性乘客一起搭</p></div><button class="r6-switch ${state.womenOnly?'is-on':''}" data-act="r6-togglewomen" role="switch" aria-checked="${state.womenOnly}" aria-label="女性乘客同行"><span></span></button></div><div class="r6-driver-note">${icon('car')}駕駛性別未指定</div><details class="r6-women-details"><summary>這個設定怎麼用 ${icon('down')}</summary><p>只用來篩選同行乘客，不會指定駕駛性別。性別由本人填寫，不從名字或興趣判斷。</p><p class="r6-demo-profile">本示例：小晴與小安均設定為女性。尚未串接身分驗證。</p></details></section>
      <div class="r6-respect-note">${icon('message')}<p>${selected==='sing'?'先分享想唱的歌，同車的人都願意、車輛也開放，才開始唱。':'加入行程時，再一起確認這趟的安排。'}</p></div>
    </div></div>${bottom(btn('完成','r6-save','r6-save'))}`;
  };

  const priorAct=act;
  act=function(action){
    if(action==='m6-open-rideprefs'||action==='r6-open'){window.YoxiRidePrefs.open(current);return;}
    if(action==='r6-any'){if(state.rideMood!=='any')invalidateUnsubmittedTerms();state.rideMood='any';save();render();return;}
    if(action==='r6-togglewomen'){
      const expanded=document.querySelector('.r6-women-details')?.open;
      invalidateUnsubmittedTerms();state.womenOnly=!state.womenOnly;save();render();
      if(expanded&&document.querySelector('.r6-women-details'))document.querySelector('.r6-women-details').open=true;
      return;
    }
    if(action==='r6-save'){applyDefaults();save();go(origin());notify('同行偏好已更新');return;}
    priorAct(action);
  };
  document.addEventListener('change',event=>{
    if(event.target.name!=='ride-mood'||!Object.hasOwn(moods,event.target.value))return;
    if(state.rideMood!==event.target.value)invalidateUnsubmittedTerms();state.rideMood=event.target.value;save();render();
    document.querySelector(`input[name="ride-mood"][value="${state.rideMood}"]`)?.focus({preventScroll:true});
  });
}());
