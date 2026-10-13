'use strict';

// Four passenger views. Data and transitions remain owned by app.js.
Object.assign(screens, {
  daily() {
    return `${toolbar('一起玩', 'explore', `<button class="icon-btn" data-act="create-question" aria-label="出一題給朋友">${icon('plus')}</button>`)}
      <div class="scroll sv-scroll">
        <div class="sv-daily">
          <div class="sv-section-head"><h1>好友默契</h1><span>阿睿出的題目</span></div>
          <button class="sv-game-feature" data-act="daily-question" aria-label="猜猜阿睿的週末計畫">
            <span class="sv-game-author"><span class="sv-rui-avatar" aria-hidden="true">睿</span><span>阿睿的週末計畫</span></span>
            <span class="sv-game-heading">你猜他<br>會選哪個？</span>
            <span class="sv-game-deck" aria-hidden="true">
              <span class="sv-option-card sv-option-cafe">${icon('coffee')}<span>咖啡店</span></span>
              <span class="sv-option-card sv-option-sea">${icon('sun')}<span>海邊</span></span>
              <span class="sv-option-card sv-option-home">${icon('music')}<span>家裡</span></span>
            </span>
            <span class="sv-start-game">${icon('play')}<span>${state.dailyAnswer ? '查看答案' : '猜一題'}</span></span>
          </button>
          <div class="sv-section-head sv-section-next"><h2>更多玩法</h2></div>
          <button class="sv-game-link" data-act="city-question">
            <span class="sv-game-icon sv-game-icon-blue">${icon('compass')}</span>
            <span><strong>城市預測</strong><small>這週末，大家想去哪？</small></span>${icon('chevron')}
          </button>
          <button class="sv-game-link" data-act="create-question">
            <span class="sv-game-icon sv-game-icon-red">${icon('message')}</span>
            <span><strong>換朋友猜你</strong><small>出一題</small></span>${icon('chevron')}
          </button>
        </div>
      </div>${nav('daily')}`;
  },

  icebreaker() {
    const choices = [['A', '一束剛好的光'], ['B', '路邊的貓'], ['C', '好看的老招牌']];
    return `${toolbar('路上聊一題', 'confirmed', '<button class="sv-skip" data-go="confirmed">略過</button>')}
      <div class="sv-trip-strip">${icon('car')}<span>前往松菸</span><strong>約 12 分鐘</strong></div>
      <div class="scroll sv-scroll">
        <div class="sv-quiz">
          <div class="sv-question-author">${avatar()}<div><strong>小安的題目</strong><span>猜猜她怎麼選</span></div></div>
          <h1 id="sv-question">什麼讓小安<br>停下來拍照？</h1>
          <div class="sv-choices" role="group" aria-labelledby="sv-question">
            ${choices.map(([key, label]) => `<button class="sv-choice ${state.choice === key ? 'sv-selected' : ''}" data-choice="${key}" aria-pressed="${state.choice === key}"><span class="sv-choice-letter">${key}</span><span>${label}</span><span class="sv-radio" aria-hidden="true">${state.choice === key ? icon('check') : ''}</span></button>`).join('')}
          </div>
          <div class="sv-answer-origin">${icon('user')}<span>小安已選好答案</span></div>
        </div>
      </div>${bottom(btn('確認答案', 'quiz-submit', 'sv-primary', state.choice ? '' : 'disabled'))}`;
  },

  reveal() {
    const picked = { A: '一束剛好的光', B: '路邊的貓', C: '好看的老招牌' }[state.choice];
    return `${toolbar('答案揭曉', 'icebreaker')}
      <div class="scroll sv-scroll">
        <div class="sv-reveal">
          <div class="sv-reveal-author">${avatar()}<span>小安的答案</span><span class="sv-result-tag">${state.choice === 'A' ? `${icon('check')}猜對了` : '來聊聊'}</span></div>
          <div class="sv-answer-feature">
            <span class="sv-light-symbol" aria-hidden="true">${icon('sun')}</span>
            <h1>一束剛好的光</h1>
            <blockquote>「我常為了一束光，<br>多走一條街。」</blockquote>
          </div>
          ${picked && state.choice !== 'A' ? `<div class="sv-your-answer"><span>你選了</span><strong>${picked}</strong></div>` : ''}
          <div class="sv-talk-prompt"><span>${icon('message')}接著聊</span><p>最近最喜歡<br>哪一張照片？</p></div>
        </div>
      </div>${bottom(btn('回到行程', 'confirmed', 'sv-primary'))}`;
  },

  arrival() {
    const plan = state.requestSnapshot || state;
    const departure = plan.departure || '14:30';
    const arrival = departure === '15:00' ? '15:22' : '14:52';
    const friendLabel = state.friend === 'accepted' ? '已是好友' : state.friend === 'pending' ? '已送出' : '加好友';
    return `${toolbar('這趟同行', 'confirmed')}
      <div class="scroll sv-scroll">
        <div class="sv-arrival">
          <div class="sv-destination"><img src="assets/v2/songshan-warehouses.jpg" alt="松山文創園區的倉庫建築"><span>${icon('check')}已抵達</span></div>
          <div class="sv-arrival-heading"><h1>松山文創園區</h1><span>10/17（六）</span></div>
          <div class="sv-receipt">
            <div class="sv-receipt-route"><div><span>上車</span><strong>${esc(plan.pickup || '台北車站東三門')}</strong><time>${esc(departure)}</time></div><span class="sv-route-arrow">${icon('arrow')}</span><div><span>抵達</span><strong>松菸</strong><time>${arrival}</time></div></div>
            <div class="sv-receipt-fare"><span>預估費用</span><strong><small>NT$</small>150</strong></div>
            <div class="sv-fare-detail"><span>每人分攤 $180</span><span>同行優惠 −$30</span></div>
          </div>
          <div class="sv-friend-row">${avatar()}<div><strong>小安</strong><span>${state.friend === 'accepted' ? '你們已成為好友' : state.friend === 'pending' ? '等待好友回覆' : '這次的同行者'}</span></div><button class="sv-add-friend ${state.friend !== 'none' ? 'sv-friend-sent' : ''}" data-act="friend" ${state.friend !== 'none' ? 'disabled' : ''}>${state.friend === 'accepted' ? icon('check') : state.friend === 'pending' ? '' : icon('plus')}${friendLabel}</button></div>
          <button class="sv-collection-link" data-go="mine">${icon('bookmark')}<span>我的收藏</span>${icon('chevron')}</button>
        </div>
      </div>${bottom(btn('繼續探索', 'explore', 'sv-primary'))}`;
  }
});
