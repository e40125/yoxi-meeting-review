'use strict';

// Passenger views only. app.js continues to own choices, friendship and trip state.
Object.assign(screens, {
  daily() {
    return `${toolbar('一起玩', 'explore', `<button class="icon-btn" data-act="create-question" aria-label="出一題給朋友">${icon('plus')}</button>`)}
      <div class="scroll sv-scroll"><div class="sv-daily">
        <div class="sv-section-head"><h1>好友默契</h1><span>阿睿的題目</span></div>
        <button class="sv-game-feature" data-act="daily-question" aria-label="猜猜阿睿週末想做什麼">
          <img src="assets/v3/taipei-shop-signs.jpg" alt="台北街道的招牌">
          <span class="sv-game-shade"></span>
          <span class="sv-game-author"><span class="sv-rui-avatar" aria-hidden="true">睿</span>阿睿問你</span>
          <span class="sv-game-heading">猜猜阿睿<br>週末想做什麼？</span>
          <span class="sv-start-game"><span>${state.dailyAnswer ? '再看答案' : '猜一題'}</span>${icon('play')}</span>
        </button>
        <div class="sv-section-head sv-section-next"><h2>還可以玩</h2></div>
        <div class="sv-more-games">
          <button data-act="city-question"><img src="assets/v3/dihua-street.jpg" alt="迪化街的小店"><span><strong>猜大家想去哪</strong>${icon('chevron')}</span></button>
          <button data-act="create-question"><img class="sv-cat-photo" src="assets/v3/minsheng-cat.jpg" alt="民生西路的貓"><span><strong>換朋友猜你</strong>${icon('plus')}</span></button>
        </div>
      </div></div>${nav('daily')}`;
  },

  icebreaker() {
    const choices = [
      ['A', '老店的招牌', 'taipei-shop-signs.jpg', '台北街道上的招牌'],
      ['B', '路邊的貓', 'minsheng-cat.jpg', '民生西路的貓'],
      ['C', '街邊小店', 'dihua-street.jpg', '迪化街的小店']
    ];
    return `${toolbar('路上玩一題', 'confirmed', '<button class="sv-skip" data-go="confirmed">先不玩</button>')}
      <div class="sv-trip-strip">${icon('car')}<span>去松菸的路上</span><strong>約 12 分鐘</strong></div>
      <div class="scroll sv-scroll"><div class="sv-quiz">
        <div class="sv-question-author">${avatar()}<div><strong>小安的題目</strong><span>猜猜她會選哪個</span></div></div>
        <h1 id="sv-question">什麼會讓小安<br>路上停下來拍照？</h1>
        <div class="sv-choices" role="group" aria-labelledby="sv-question">
          ${choices.map(([key,label,file,alt]) => `<button class="sv-choice ${state.choice === key ? 'sv-selected' : ''}" data-choice="${key}" aria-pressed="${state.choice === key}"><img class="${key === 'B' ? 'sv-cat-photo' : ''}" src="assets/v3/${file}" alt="${alt}"><span class="sv-choice-copy"><small>${key}</small><strong>${label}</strong></span><span class="sv-radio" aria-hidden="true">${state.choice === key ? icon('check') : ''}</span></button>`).join('')}
        </div>
      </div></div>${bottom(btn('我選這個','quiz-submit','sv-primary',state.choice ? '' : 'disabled'))}`;
  },

  reveal() {
    const picked = {A:'老店的招牌',B:'路邊的貓',C:'街邊小店'}[state.choice];
    return `${toolbar('答案揭曉','icebreaker')}
      <div class="scroll sv-scroll"><div class="sv-reveal">
        <div class="sv-answer-photo"><img src="assets/v3/taipei-shop-signs.jpg" alt="台北街道招牌，作為答案示意"><span class="sv-result-tag">${state.choice === 'A' ? `${icon('check')}猜對了` : '小安選的是'}</span></div>
        <div class="sv-reveal-heading"><h1>老店的招牌</h1>${picked && state.choice !== 'A' ? `<span>你選了${picked}</span>` : ''}</div>
        <div class="sv-answer-message">${avatar()}<div><strong>小安</strong><p>老店的招牌！字體很有趣，逛老街都會拍幾張。</p></div></div>
        <div class="sv-talk-prompt"><span>${icon('message')}換你說說</span><p>你手機裡最多哪種照片？</p></div>
      </div></div>${bottom(btn('回行程','confirmed','sv-primary'))}`;
  },

  arrival() {
    const plan=state.requestSnapshot||state;
    const departure=plan.departure||'14:30';
    const arrival=departure==='15:00'?'15:22':'14:52';
    const friendLabel=state.friend==='accepted'?'已加好友':state.friend==='pending'?'已送出':'加好友';
    return `${toolbar('這趟同行','confirmed')}
      <div class="scroll sv-scroll"><div class="sv-arrival">
        <div class="sv-destination"><img src="assets/v2/songshan-warehouses.jpg" alt="松山文創園區的倉庫建築"><span>${icon('check')}到了</span></div>
        <div class="sv-arrival-heading"><h1>到松菸了</h1><span>10/17（六）</span></div>
        <div class="sv-friend-row">${avatar()}<div><strong>小安</strong><span>${state.friend==='accepted'?'你們是好友了':state.friend==='pending'?'等她接受好友邀請':'這次一起搭車'}</span></div><button class="sv-add-friend ${state.friend!=='none'?'sv-friend-sent':''}" data-act="friend" ${state.friend!=='none'?'disabled':''}>${state.friend==='accepted'?icon('check'):state.friend==='pending'?'':icon('plus')}${friendLabel}</button></div>
        <div class="sv-receipt">
          <div class="sv-receipt-route"><div><span>上車</span><strong>${esc(plan.pickup||'台北車站東三門')}</strong><time>${esc(departure)}</time></div><span class="sv-route-arrow">${icon('arrow')}</span><div><span>抵達</span><strong>松山文創園區</strong><time>${arrival}</time></div></div>
          <div class="sv-ticket-tear" aria-hidden="true"></div>
          <div class="sv-receipt-fare"><span>每人預估</span><strong><small>NT$</small>150</strong></div>
          <div class="sv-fare-detail"><span>每人分攤 $180</span><span>同行優惠 −$30</span></div>
        </div>
        <button class="sv-collection-link" data-go="mine">${icon('bookmark')}<span>我的收藏</span>${icon('chevron')}</button>
      </div></div>${bottom(btn('繼續探索','explore','sv-primary'))}`;
  }
});
