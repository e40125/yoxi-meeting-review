'use strict';

// Each person shares their own answer. The demo does not score people or infer their preferences.
const socialQuestions = {
  before: {
    label:'出發前', title:'到現場，<br>你想先做什麼？', short:'到現場，你想先做什麼？',
    choices:[
      ['A','聽音樂','music','喇叭與音符'],
      ['B','逛市集','market','市集購物袋'],
      ['C','找地方坐','chair','草地上的折疊椅']
    ],
    reply:'我想先聽音樂，市集可以晚點逛。', prompt:'最近有聽到什麼好聽的歌？'
  },
  ride: {
    label:'路上聊', title:'聽到喜歡的歌，<br>你會？', short:'聽到喜歡的歌，你會？',
    choices:[
      ['A','跟著唱','sing','麥克風與音符'],
      ['B','跟著點頭','headphones','耳機與節拍'],
      ['C','先找歌名','record','唱片與放大鏡']
    ],
    reply:'我會跟著唱，歌詞忘了就亂唱。', prompt:'最近哪首歌一直重播？'
  }
};
const socialRound = () => state.socialRound === 'ride' ? 'ride' : 'before';
const socialChoice = () => (state.socialAnswers || {})[socialRound()] || null;
const socialExit = () => state.socialOrigin === 'daily' ? 'daily' : 'confirmed';
const socialPeer = () => state.socialPeer === 'rui' ? {name:'阿睿',initial:'睿'} : {name:'小安',initial:'安'};
const socialCaption = () => state.socialPeer === 'rui' ? '和阿睿聊聊' : socialRound()==='ride' && state.tripStatus==='riding' ? '去花博的路上' : socialRound()==='before' ? '出發前' : '一起聊聊';
const socialInitial = (name='小安',char='安') => `<span class="s4-initial ${char==='睿'?'s4-rui':char==='晴'?'s4-self':''}" aria-label="${name}">${char}</span>`;

// Original, code-native illustrations keep choices legible without borrowing unrelated photos.
const socialArt = kind => {
  const drawings = {
    music:'<ellipse cx="62" cy="122" rx="36" ry="6" fill="#A7C4B4"/><g transform="rotate(-7 59 82)"><rect x="28" y="42" width="65" height="77" rx="8" fill="#173E35"/><rect x="34" y="48" width="53" height="65" rx="4" fill="#FFEE99"/><circle cx="60.5" cy="89" r="19" fill="#EB5B40"/><circle cx="60.5" cy="89" r="7" fill="#173E35"/><rect x="43" y="56" width="18" height="5" rx="2.5" fill="#173E35"/><circle cx="75" cy="58" r="3" fill="#173E35"/></g><path d="M83 27v-12l15-4v12" fill="none" stroke="#EB5B40" stroke-width="4" stroke-linecap="round"/><ellipse cx="79" cy="28" rx="6" ry="4" fill="#EB5B40"/><ellipse cx="94" cy="24" rx="6" ry="4" fill="#EB5B40"/>',
    market:'<ellipse cx="63" cy="124" rx="35" ry="6" fill="#E7BF79"/><path d="M29 50h60l8 68H22z" fill="#E9573C"/><path d="M43 56V37a16 16 0 0 1 32 0v19" fill="none" stroke="#1C493B" stroke-width="7" stroke-linecap="round"/><path d="M28 80q14-15 28 0t36 0v17q-16 15-32 0T26 97z" fill="#FFE9A3"/><path d="M41 109h39" stroke="#FFDDB3" stroke-width="3" stroke-linecap="round"/><circle cx="102" cy="28" r="6" fill="#F5B343"/><path d="M16 40v10m-5-5h10" stroke="#1C493B" stroke-width="3" stroke-linecap="round"/>',
    chair:'<ellipse cx="61" cy="124" rx="42" ry="7" fill="#A9C6AA"/><path d="m25 73 18 50m48-50-20 50M43 123l44-43M73 123 32 82" stroke="#264D40" stroke-width="5" fill="none" stroke-linecap="round"/><path d="m23 43 59-3 10 42-57 5z" fill="#F3B544"/><path d="m32 80 61-3 6 13-59 7z" fill="#DC5E3D"/><path d="m27 55 57-3m-53 14 56-3" stroke="#FDE5A1" stroke-width="4"/><circle cx="92" cy="23" r="10" fill="#F7D37A"/><path d="m12 118 4-9 3 9m81 4 4-11 4 11" fill="none" stroke="#477B58" stroke-width="2.5" stroke-linecap="round"/>',
    sing:'<ellipse cx="61" cy="124" rx="33" ry="6" fill="#E8B9AD"/><g transform="rotate(23 62 64)"><rect x="48" y="52" width="23" height="55" rx="7" fill="#1A4C3C"/><rect x="38" y="23" width="43" height="42" rx="20" fill="#F4C955"/><path d="M43 36h32M41 46h36M45 56h28" stroke="#AB732A" stroke-width="2.5"/><rect x="52" y="73" width="15" height="5" rx="2.5" fill="#D4E4BD"/><path d="M59 107v12" stroke="#1A4C3C" stroke-width="4"/></g><path d="M93 59V43l13-3v14" stroke="#E45A3D" stroke-width="3" fill="none"/><ellipse cx="89" cy="59" rx="5" ry="4" fill="#E45A3D"/><ellipse cx="102" cy="54" rx="5" ry="4" fill="#E45A3D"/><path d="m20 25-3-8m13 3 2-7" stroke="#E45A3D" stroke-width="3" stroke-linecap="round"/>',
    headphones:'<ellipse cx="62" cy="124" rx="35" ry="6" fill="#B7C9BB"/><path d="M29 85V66a33 33 0 0 1 66 0v19" fill="none" stroke="#173E35" stroke-width="12"/><path d="M29 63a33 33 0 0 1 66 0" fill="none" stroke="#F2BD47" stroke-width="5"/><rect x="19" y="70" width="23" height="39" rx="11" fill="#E75C41"/><rect x="82" y="70" width="23" height="39" rx="11" fill="#E75C41"/><path d="M28 82v15m62-15v15" stroke="#FFC98D" stroke-width="4" stroke-linecap="round"/><path d="M52 74v9m10-17v25m10-17v9" stroke="#1E6047" stroke-width="4" fill="none" stroke-linecap="round"/><path d="m20 26-4-7m84 7 4-7" stroke="#47735B" stroke-width="3" stroke-linecap="round"/>',
    record:'<ellipse cx="61" cy="124" rx="40" ry="6" fill="#C6B8DA"/><circle cx="53" cy="68" r="38" fill="#204D3F"/><circle cx="53" cy="68" r="29" fill="none" stroke="#477968" stroke-width="2"/><circle cx="53" cy="68" r="22" fill="none" stroke="#477968" stroke-width="2"/><circle cx="53" cy="68" r="13" fill="#EEC45F"/><circle cx="53" cy="68" r="3" fill="#254C3F"/><circle cx="82" cy="91" r="19" fill="#FCF4D0" fill-opacity=".9" stroke="#E45B43" stroke-width="7"/><path d="m95 105 14 15" stroke="#E45B43" stroke-width="9" stroke-linecap="round"/><path d="M95 26v10m-5-5h10" stroke="#865BAA" stroke-width="3" stroke-linecap="round"/>'
  };
  return `<span class="s5-art s5-art-${kind}" aria-hidden="true"><svg viewBox="0 0 124 144" focusable="false">${drawings[kind]||drawings.music}</svg></span>`;
};
const socialGuides = {
  music:{title:'先聽一場現場',body:'滾草皮音樂市集有現場音樂演出。約好碰面時間，再一起找喜歡的表演。',icon:'music'},
  market:{title:'逛逛市集',body:'音樂、市集一起逛。先看看攤位，再找朋友一起吃點東西。',icon:'market'},
  chair:{title:'找個地方坐坐',body:'逛累了就坐一下，聊聊剛才聽到的歌。',icon:'chair'}
};

Object.assign(screens, {
  daily() {
    return `${toolbar('朋友約去哪','explore',`<button class="icon-btn" data-act="v4-invite" aria-label="邀朋友一起去">${icon('plus')}</button>`)}
      <div class="scroll s4-scroll"><div class="s4-daily">
        <article class="s4-outing s5-outing">
          <div class="s4-outing-author">${socialInitial('阿睿','睿')}<div><strong>阿睿</strong><span>約你一起去</span></div><span class="s4-date-stamp"><b>17</b>OCT</span></div>
          <h1>週六去花博<br>聽音樂？<span class="s5-title-note" aria-hidden="true">${icon('music')}</span></h1>
          <button class="s4-outing-poster s5-outing-photo" data-go="event" aria-label="查看滾草皮音樂市集"><img src="assets/v5/event-hero.jpg" alt="華山場滾草皮音樂市集的草地野餐區"><small class="s5-photo-credit">華山場活動照</small><span class="s5-photo-event"><strong>滾草皮音樂市集</strong><small>音樂 · 市集 · 野餐</small></span><span class="s5-photo-arrow">${icon('arrow')}</span></button>
          <div class="s4-outing-facts"><span>${icon('clock')}14:00–19:00</span><span>${icon('pin')}花博圓山園區</span><b>免費</b></div>
          <div class="s4-plan-actions"><button class="s4-plan-interest ${state.planInterest?'is-interested':''}" data-act="v4-plan-interest" aria-pressed="${!!state.planInterest}">${icon(state.planInterest?'check':'plus')}${state.planInterest?'已加入想去':'我也想去'}</button><button class="s4-invite" data-act="v4-invite">${icon('people')}邀朋友</button></div>
        </article>
        <div class="s5-activity-guide" aria-label="活動可以做什麼">${[['music','music','聽音樂'],['market','ticket','逛市集'],['chair','sun','坐下聊聊']].map(([key,ic,label])=>`<button data-act="v5-guide-${key}"><span>${icon(ic)}</span><strong>${label}</strong>${icon('chevron')}</button>`).join('')}</div>
        <button class="s4-prompt-entry" data-act="v4-friend-round"><span class="s4-prompt-icon">${icon('message')}</span><span><strong>出發前，選一個</strong><small>阿睿問：到現場想先做什麼？</small></span>${icon('chevron')}</button>
      </div></div>${nav('daily')}`;
  },

  icebreaker() {
    const round=socialRound(),q=socialQuestions[round],selected=socialChoice(),peer=socialPeer(),inRide=state.socialPeer!=='rui'&&state.request==='accepted'&&state.tripStatus==='riding'&&round==='ride';
    return `${toolbar('你選哪個？',socialExit(),`<button class="s4-skip" data-go="${socialExit()}">先跳過</button>`)}
      <div class="scroll s4-scroll"><div class="s4-question s5-question">
        <div class="s4-round-label"><span>${icon(inRide?'car':'message')}${socialCaption()}</span><span>${round==='before'?'01':'02'} / 02</span></div>
        <h1 id="social-question">${q.title}</h1>
        <p class="s4-question-guide">選你自己的答案</p>
        <div class="s4-choices s5-choices" role="group" aria-labelledby="social-question">${q.choices.map(([key,label,art])=>`<button class="s4-choice ${selected===key?'is-selected':''}" data-social-choice="${key}" aria-pressed="${selected===key}">${socialArt(art)}<span class="s4-check" aria-hidden="true">${selected===key?icon('check'):''}</span><strong>${label}</strong></button>`).join('')}</div>
        <div class="s4-ready">${socialInitial(peer.name,peer.initial)}<span>${peer.name}已選好</span><span class="s4-ready-dot" aria-hidden="true"></span></div>
        <div class="s5-question-context">${icon(round==='before'?'pin':'music')}<span>${round==='before'?'週六 · 滾草皮音樂市集':'去花博，先聊聊音樂'}</span></div>
      </div></div>${bottom(btn('一起看答案','v4-social-reveal','s4-primary',selected?'':'disabled'))}`;
  },

  reveal() {
    const round=socialRound(),q=socialQuestions[round],selected=socialChoice(),peer=socialPeer();
    if(!selected) return `${toolbar('你選哪個？','icebreaker')}<div class="scroll s4-scroll"><div class="s4-question"><h1>${q.title}</h1><p class="s4-question-guide">先選你自己的答案</p></div></div>${bottom(btn('選答案','icebreaker','s4-primary'))}`;
    const own=q.choices.find(c=>c[0]===selected),other=q.choices[0];
    return `${toolbar('各自的答案','icebreaker')}
      <div class="scroll s4-scroll"><div class="s4-reveal s5-reveal">
        <div class="s4-round-label"><span>${socialCaption()}</span><span>${round==='before'?'01':'02'} / 02</span></div>
        <h1>${selected==='A'?'你們都選了':round==='before'?peer.name+'想先':peer.name+'會'}<br>${other[1]}</h1>
        <div class="s4-answer-pair s5-answer-pair">
          <article><div class="s4-answer-person">${socialInitial('小晴','晴')}<strong>你</strong></div>${socialArt(own[2])}<strong>${own[1]}</strong></article>
          <article><div class="s4-answer-person">${socialInitial(peer.name,peer.initial)}<strong>${peer.name}</strong></div>${socialArt(other[2])}<strong>${other[1]}</strong></article>
        </div>
        <div class="s4-reply"><span>${peer.name}</span><p>${q.reply}</p></div>
        <div class="s4-talk"><span>${icon('message')}接著聊</span><h2>${q.prompt}</h2></div>${v6RevealMusic()}
      </div></div>${bottom(`<div class="s4-reveal-actions">${btn('換一題','v4-social-next','s4-primary')}${btn(socialExit()==='confirmed'?'回行程':'回邀約',socialExit(),'secondary s4-secondary')}</div>`)}`;
  },

  arrival() {
    const plan=state.requestSnapshot||state,departure=plan.departure||'13:30',arrival=departure==='14:00'?'14:15':'13:45';
    const friendLabel=state.friend==='accepted'?'已加好友':state.friend==='pending'?'已送出':'加好友';
    return `${toolbar('抵達花博','confirmed')}
      <div class="scroll s4-scroll"><div class="s4-arrival s5-arrival">
        <div class="s5-arrived-stamp"><span>${icon('check')}</span><div><small>10/17（六）· ${arrival}</small><h1>花博，到了！</h1></div></div>
        <div class="s4-arrival-photo"><img src="assets/v5/venue.jpg" alt="花博公園入口與園區照片"><span>${icon('pin')}花博圓山園區</span></div>
        <div class="s4-arrival-heading"><div><span>今天的活動</span><h2>走，去聽音樂！</h2></div>${icon('arrow')}</div>
        <button class="s4-event-row" data-go="event"><img src="assets/v5/official-poster.jpg" alt="滾草皮音樂市集官方海報"><span><strong>滾草皮音樂市集</strong><small>14:00–19:00 · 免費入場</small></span>${icon('chevron')}</button>
        ${v6MemoryEntry()}<div class="s4-arrival-label">這趟一起搭的人</div>
        <div class="s4-friend-row">${socialInitial()}<div><strong>小安</strong><span>${state.friend==='accepted'?'已加為好友':state.friend==='pending'?'好友邀請已送出':'音樂 · 攝影'}</span></div><button data-act="friend" ${state.friend!=='none'?'disabled':''}>${state.friend==='accepted'?icon('check'):state.friend==='none'?icon('plus'):''}${friendLabel}</button></div>
        <details class="s4-trip-receipt"><summary>${icon('car')}這趟行程<span>每人預估 $120</span>${icon('down')}</summary><div class="s4-receipt-stops"><span><time>${esc(departure)}</time>${esc(plan.pickup||'台北車站東三門')}</span><span><time>${arrival}</time>花博圓山園區</span></div><div class="s4-receipt-fare"><span>每人分攤 $150</span><span>同行優惠 −$30</span></div></details>
      </div></div>${bottom(btn(`${icon('bookmark')}我的收藏`,'mine','s4-primary'))}`;
  }
});

const previousSocialAct=act;
act=function(a){
  if(a.startsWith('v5-guide-')){
    const guide=socialGuides[a.slice(9)];
    if(guide)modal(`<div class="s5-guide-modal">${socialArt(guide.icon)}<h2>${guide.title}</h2><p>${guide.body}</p><div class="s5-guide-facts">10/17（六）14:00–19:00<br>花博圓山園區 · 免費入場</div>${btn('看完整活動','event','s4-primary')}</div>`);
    return;
  }
  if(a==='v4-plan-interest'){
    state.planInterest=!state.planInterest;
    if(state.planInterest)state.saved=true;
    save();render();notify(state.planInterest?'已加入想去的活動':'已取消想去');return;
  }
  if(a==='v4-friend-round'||a==='v4-pre-round'||a==='v4-ride-round'){
    state.socialPeer=a==='v4-friend-round'?'rui':'an';
    state.socialOrigin=a==='v4-friend-round'?'daily':'confirmed';
    state.socialRound=a==='v4-ride-round'?'ride':'before';
    state.socialAnswers={before:null,ride:null,...state.socialAnswers};save();go('icebreaker');return;
  }
  if(a==='v4-social-reveal'){
    if(!socialChoice())return;
    save();go('reveal');return;
  }
  if(a==='v4-social-next'){
    state.socialRound=socialRound()==='before'?'ride':'before';save();go('icebreaker');return;
  }
  previousSocialAct(a);
};
document.addEventListener('click',e=>{
  const target=e.target.closest('[data-social-choice]');
  if(!target||target.disabled)return;
  const choice=target.dataset.socialChoice;
  if(!['A','B','C'].includes(choice))return;
  state.socialAnswers={before:null,ride:null,...state.socialAnswers,[socialRound()]:choice};save();render();
  document.querySelector(`[data-social-choice="${choice}"]`)?.focus({preventScroll:true});
});
