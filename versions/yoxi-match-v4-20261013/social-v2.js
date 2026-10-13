'use strict';

// Shared prompts use each person's own voluntary answer, without a score or a match rank.
const socialQuestions = {
  before: {
    label:'出發前', title:'到市集，<br>你想先逛什麼？', short:'到市集，你想先逛什麼？',
    choices:[
      ['A','插畫','assets/v4/illustration.svg','插畫作品示意'],
      ['B','小誌','assets/v4/zines.svg','小誌書冊示意'],
      ['C','文具小物','assets/v4/stationery.svg','筆記本與紙膠帶示意']
    ],
    reply:'我想看看插畫攤，順便買幾張明信片。', prompt:'逛市集最容易買什麼回家？'
  },
  ride: {
    label:'路上聊', title:'什麼會讓你<br>路上停下來拍照？', short:'什麼會讓你路上停下來拍照？',
    choices:[
      ['A','老店的招牌','assets/v3/taipei-shop-signs.jpg','台北街道上的招牌'],
      ['B','路邊的貓','assets/v3/minsheng-cat.jpg','民生西路的貓'],
      ['C','街邊小店','assets/v3/dihua-street.jpg','迪化街的小店']
    ],
    reply:'逛老街都會拍招牌，字體很有趣。', prompt:'你手機裡最多哪種照片？'
  }
};
const socialRound = () => state.socialRound === 'ride' ? 'ride' : 'before';
const socialChoice = () => (state.socialAnswers || {})[socialRound()] || null;
const socialExit = () => state.socialOrigin === 'daily' ? 'daily' : 'confirmed';
const socialPeer = () => state.socialPeer === 'rui' ? {name:'阿睿',initial:'睿'} : {name:'小安',initial:'安'};
const socialCaption = () => state.socialPeer === 'rui' ? '和阿睿聊聊' : socialRound()==='ride' && state.tripStatus==='riding' ? '去松菸的路上' : socialRound()==='before' ? '出發前' : '一起聊聊';
const socialInitial = (name='小安',char='安') => `<span class="s4-initial ${char==='睿'?'s4-rui':char==='哲'?'s4-self':''}" aria-label="${name}">${char}</span>`;

Object.assign(screens, {
  daily() {
    return `${toolbar('一起出門','explore',`<button class="icon-btn" data-act="v4-invite" aria-label="邀朋友一起去">${icon('plus')}</button>`)}
      <div class="scroll s4-scroll"><div class="s4-daily">
        <div class="s4-section-label">朋友的邀約</div>
        <article class="s4-outing">
          <div class="s4-outing-author">${socialInitial('阿睿','睿')}<div><strong>阿睿</strong><span>想找朋友一起去</span></div><span class="s4-date-stamp"><b>17</b>OCT</span></div>
          <h1>週六去松菸<br>逛市集？</h1>
          <button class="s4-outing-poster" data-go="event" aria-label="查看紙上散步市集"><img src="assets/v4/paper-walk-poster.svg" alt="紙上散步，小誌與插畫市集海報"><span>看活動 ${icon('arrow')}</span></button>
          <div class="s4-outing-facts"><span>${icon('calendar')}10/17（六）</span><span>${icon('pin')}松山文創園區</span></div>
          <div class="s4-plan-actions"><button class="s4-plan-interest ${state.planInterest?'is-interested':''}" data-act="v4-plan-interest" aria-pressed="${!!state.planInterest}">${icon(state.planInterest?'check':'plus')}${state.planInterest?'已記下想去':'我也想去'}</button><button class="s4-invite" data-act="v4-invite">${icon('people')}邀朋友</button></div>
        </article>
        <button class="s4-prompt-entry" data-act="v4-friend-round"><span class="s4-prompt-icon">${icon('message')}</span><span><strong>和阿睿聊聊</strong><small>到市集，想先逛什麼？</small></span>${icon('chevron')}</button>
      </div></div>${nav('daily')}`;
  },

  icebreaker() {
    const round=socialRound(),q=socialQuestions[round],selected=socialChoice(),peer=socialPeer(),inRide=state.socialPeer!=='rui'&&state.request==='accepted'&&state.tripStatus==='riding'&&round==='ride';
    return `${toolbar('你選哪個？',socialExit(),`<button class="s4-skip" data-go="${socialExit()}">先跳過</button>`)}
      <div class="scroll s4-scroll"><div class="s4-question">
        <div class="s4-round-label"><span>${icon(inRide?'car':'message')}${socialCaption()}</span><span>${round==='before'?'01':'02'} / 02</span></div>
        <h1 id="social-question">${q.title}</h1>
        <p class="s4-question-guide">選你自己的答案</p>
        <div class="s4-choices" role="group" aria-labelledby="social-question">${q.choices.map(([key,label,file,alt])=>`<button class="s4-choice ${selected===key?'is-selected':''}" data-social-choice="${key}" aria-pressed="${selected===key}"><img src="${file}" alt="${alt}" class="${round==='ride'&&key==='B'?'s4-cat':''} ${round==='before'&&key==='A'?'s4-poster-choice':''}"><span class="s4-check" aria-hidden="true">${selected===key?icon('check'):''}</span><strong>${label}</strong></button>`).join('')}</div>
        <div class="s4-ready">${socialInitial(peer.name,peer.initial)}<span>${peer.name}已選好</span><span class="s4-ready-dot" aria-hidden="true"></span></div>
      </div></div>${bottom(btn('一起看答案','v4-social-reveal','s4-primary',selected?'':'disabled'))}`;
  },

  reveal() {
    const round=socialRound(),q=socialQuestions[round],selected=socialChoice(),peer=socialPeer();
    if(!selected) return `${toolbar('你選哪個？','icebreaker')}<div class="scroll s4-scroll"><div class="s4-question"><h1>${q.title}</h1><p class="s4-question-guide">先選你自己的答案</p></div></div>${bottom(btn('選答案','icebreaker','s4-primary'))}`;
    const own=q.choices.find(c=>c[0]===selected),other=q.choices[0];
    return `${toolbar('各自的答案','icebreaker')}
      <div class="scroll s4-scroll"><div class="s4-reveal">
        <div class="s4-round-label"><span>${socialCaption()}</span><span>${round==='before'?'01':'02'} / 02</span></div>
        <h1>${selected==='A'?'你們都選了':round==='before'?peer.name+'想先逛':peer.name+'會拍'}<br>${other[1]}</h1>
        <div class="s4-answer-pair">
          <article><div class="s4-answer-person">${socialInitial('阿哲','哲')}<strong>你</strong></div><img src="${own[2]}" alt="${own[3]}" class="${round==='ride'&&selected==='B'?'s4-cat':''}"><strong>${own[1]}</strong></article>
          <article><div class="s4-answer-person">${socialInitial(peer.name,peer.initial)}<strong>${peer.name}</strong></div><img src="${other[2]}" alt="${other[3]}"><strong>${other[1]}</strong></article>
        </div>
        <div class="s4-reply"><span>${peer.name}</span><p>${q.reply}</p></div>
        <div class="s4-talk"><span>${icon('message')}接著聊</span><h2>${q.prompt}</h2></div>
      </div></div>${bottom(`<div class="s4-reveal-actions">${btn('換一題','v4-social-next','s4-primary')}${btn(socialExit()==='confirmed'?'回行程':'回邀約',socialExit(),'secondary s4-secondary')}</div>`)}`;
  },

  arrival() {
    const plan=state.requestSnapshot||state,departure=plan.departure||'14:30',arrival=departure==='15:00'?'15:22':'14:52';
    const friendLabel=state.friend==='accepted'?'已加好友':state.friend==='pending'?'已送出':'加好友';
    return `${toolbar('抵達松菸','confirmed')}
      <div class="scroll s4-scroll"><div class="s4-arrival">
        <div class="s4-arrival-photo"><img src="assets/v2/songshan-warehouses.jpg" alt="松山文創園區倉庫建築"><span>${icon('check')}到了</span></div>
        <div class="s4-arrival-heading"><div><span>10/17（六）</span><h1>走，逛市集！</h1></div>${icon('arrow')}</div>
        <button class="s4-event-row" data-go="event"><img src="assets/v4/paper-walk-poster.svg" alt="紙上散步市集海報"><span><strong>紙上散步</strong><small>松山文創園區 · 到 18:00</small></span>${icon('chevron')}</button>
        <div class="s4-arrival-label">這趟一起搭的人</div>
        <div class="s4-friend-row">${socialInitial()}<div><strong>小安</strong><span>${state.friend==='accepted'?'已加為好友':state.friend==='pending'?'好友邀請已送出':'插畫 · 攝影'}</span></div><button data-act="friend" ${state.friend!=='none'?'disabled':''}>${state.friend==='accepted'?icon('check'):state.friend==='none'?icon('plus'):''}${friendLabel}</button></div>
        <details class="s4-trip-receipt"><summary>${icon('car')}這趟行程<span>每人預估 $150</span>${icon('down')}</summary><div class="s4-receipt-stops"><span><time>${esc(departure)}</time>${esc(plan.pickup||'台北車站東三門')}</span><span><time>${arrival}</time>松山文創園區</span></div><div class="s4-receipt-fare"><span>每人分攤 $180</span><span>同行優惠 −$30</span></div></details>
      </div></div>${bottom(btn(`${icon('bookmark')}我的收藏`,'mine','s4-primary'))}`;
  }
});

const previousSocialAct=act;
act=function(a){
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
