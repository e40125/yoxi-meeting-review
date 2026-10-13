'use strict';
(() => {
 const D=()=>window.YoxiV7.data(), number=n=>Number(n||0).toLocaleString('en-US');
 const bearImage='assets/v7/bear.png';
 const add=(id,name,chapter,purpose,points,note)=>metadata.push({id,name,chapter,purpose,points,copy:name,note,n:metadata.length+1});
 add('run','Yoxi Run','P7 · 城市互動','帶自己的熊跑一段城市。',['常設大稻埕路線','不用搭車也能玩','裝扮沿用自己的收藏'],'大稻埕主題改編場景；非實際道路重建。30 秒可操作遊戲，分數保存在此瀏覽器。');
 add('runplay','跑一趟','P7 · 遊玩','左右換道、跳過障礙，收集星星。',['觸控與鍵盤可玩','可暫停與重新開始','實際收集與碰撞計分'],'單機 WebGL 遊戲。星星 × 50＋完成秒數 × 10－碰撞 × 50；沒有後端排行榜或防作弊服務。');
 add('runresult','這次成績','P7 · 遊戲後','看到進步，再決定要重玩或找朋友挑戰。',['結果由實際遊戲產生','更新個人最高分','完成首次 Run 可取得葉片書籤'],'沒有遊玩時顯示空狀態，不預填自己的得分。遊戲不改動真實搭乘公里。');
 add('leaderboard','好友榜','P7 · 好友互動','比較相同路線的成績，也看好友本月出行。',['Run 和里程分開','自己的分數可更新','對手資料明確為示例'],'朋友與本場玩家為固定示例；自己的 Run 成績由本機遊戲產生。里程榜使用同一份示例搭乘資料。');
 add('tripmemory','這趟留下來','P9 · 出行累積','從抵達接到新的城市足跡與旅程收藏。',['同一筆抵達只新增一次','公里、區域與旅程卡連動','可前往熊的收藏或城市遊戲'],'示例抵達：台北車站到圓山，3.8 公里、15 分鐘。新增中山區足跡；不代表偵測了真實搭乘。');
 const row=(iconName,title,sub,target)=>`<button class="v7-linkrow" data-go="${target}"><span class="v7-link-icon">${icon(iconName)}</span><span><b>${title}</b><small>${sub}</small></span>${icon('chevron')}</button>`;
 const runTeaser=()=>`<button class="v7-run-teaser" data-go="run"><span><small>Yoxi Run</small><b>來跑一段大稻埕</b><em>30 秒 · 帶你的熊一起</em></span><img src="${bearImage}" alt="你的 yoxi 熊">${icon('play')}</button>`;
 const best=()=>Number(D().scores.dadaocheng||0);
 const scoreRows=()=>{
  const others=D().board==='all'?[{name:'阿睿',score:950,tone:'sky'},{name:'家寧',score:1150,tone:'peach'},{name:'小安',score:800,tone:'green'},{name:'文宇',score:1050,tone:'yellow'},{name:'小林',score:650,tone:'lilac'}]:[{name:'阿睿',score:950,tone:'sky'},{name:'小安',score:800,tone:'green'},{name:'小林',score:650,tone:'lilac'}];
  if(D().runs.length)others.push({name:'你',score:best(),tone:'self',self:true});
  return others.sort((a,b)=>b.score-a.score||Number(b.self||0)-Number(a.self||0));
 };
 screens.run=()=>`${toolbar('Yoxi Run','journey',`<button class="icon-btn" data-go="leaderboard" aria-label="查看好友榜">${icon('trophy')}</button>`)}<div class="scroll v7-run-scroll"><div class="v7-run-hero"><iframe src="run-v7/index.html?mode=preview&outfit=${encodeURIComponent(D().outfit)}" title="大稻埕三維城市場景" tabindex="-1"></iframe><div class="v7-hero-top"><span>台北 · 大稻埕</span><span>${icon('clock')}30 秒</span></div><div class="v7-run-word"><span>yoxi <b>RUN</b></span><h1>沿著河邊，<br>跑一趟。</h1></div><div class="v7-scene-caption">大稻埕主題場景</div></div><div class="v7-run-body"><div class="v7-course-line"><div><h2>大稻埕河岸</h2><p>換道、跳躍，收集沿途星星。</p></div><span class="v7-course-distance">30<small>秒挑戰</small></span></div><div class="v7-run-record"><span>${icon('trophy')}你的最佳成績</span><b>${best()?number(best())+' 分':'還沒跑過'}</b></div>${row('user','用自己的熊出發','換件配件，再來跑一趟','bear')}${row('people','阿睿跑了 950 分','看看好友成績 · 示例','leaderboard')}<button class="v7-place-save ${D().savedPlace?'is-saved':''}" data-act="v7-save-place">${icon(D().savedPlace?'check':'bookmark')}<span>${D().savedPlace?'大稻埕已加入想去':'想真的去逛逛？收藏大稻埕'}</span>${icon('chevron')}</button></div></div>${bottom(btn(`${icon('play')}開始跑`,'v7-start-run','v7-run-primary'))}`;
 screens.runplay=()=>`<div class="v7-play-wrapper"><iframe id="v7-game-frame" src="run-v7/index.html?mode=play&outfit=${encodeURIComponent(D().outfit)}" title="Yoxi Run 可操作遊戲" allow="fullscreen" tabindex="0"></iframe></div>`;
 screens.runresult=()=>{
  const r=D().runs.at(-1);
  if(!r)return `${toolbar('這次成績','run')}<div class="scroll"><div class="v7-no-result"><img src="${bearImage}" alt="等待出發的 yoxi 熊"><h1>先跑一趟吧</h1><p>收集星星，留下你的第一筆成績。</p>${btn('開始跑','v7-start-run')}</div></div>`;
  const rank=1+scoreRows().filter(x=>x.score>best()).length;
  return `${toolbar('這次成績','run')}<div class="scroll"><div class="v7-result-hero"><span class="v7-result-label">大稻埕河岸 · 30 秒</span><div class="v7-result-score"><strong>${number(r.score)}</strong><span>分</span></div><span class="v7-best-label">${r.score===best()?'個人最佳成績':'最高 '+number(best())+' 分'}</span><iframe src="run-v7/index.html?mode=bear&outfit=${encodeURIComponent(D().outfit)}" title="完成挑戰的 yoxi 熊與目前配件" tabindex="-1"></iframe><div class="v7-result-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div><div class="v7-result-body"><div class="v7-game-stats"><span><b>${r.stars}</b><small>收集星星</small></span><span><b>${r.hits}</b><small>碰到障礙</small></span><span><b>${rank||'—'}</b><small>示例榜名次</small></span></div><button class="v7-reward-row" data-go="bear"><span class="v7-leaf">${icon('bookmark')}</span><span><b>葉片書籤${r.first?'，收到了！':'已收藏'}</b><small>完成第一趟 Run 的紀念</small></span>${icon('chevron')}</button><div class="v7-result-actions">${btn('看看好友榜','leaderboard','outline')}${btn('再跑一次','v7-start-run')}</div><button class="v7-text-action" data-act="v7-challenge">傳給朋友，換他挑戰 ${icon('share')}</button><p class="v7-local-note">成績保存在此瀏覽器</p></div></div>`;
 };
 screens.leaderboard=()=>{
  const mileage=D().boardMetric==='mileage',ownKm=window.YoxiJourney?.summary('oct')?.km||66.9;
  const rows=mileage?[{name:'阿睿',score:86.4,tone:'sky'},{name:'你',score:ownKm,tone:'self',self:true},{name:'小安',score:62.5,tone:'green'},{name:'小林',score:41.2,tone:'lilac'}].sort((a,b)=>b.score-a.score):scoreRows();
  const me=rows.findIndex(x=>x.self),above=me>0?rows[me-1]:null;
  const gap=above?(mileage?(above.score-ownKm).toFixed(1):above.score-best()):0;
  return `${toolbar('好友榜','run',`<button class="icon-btn" data-act="v7-challenge" aria-label="分享挑戰">${icon('share')}</button>`)}<div class="scroll v7-board-scroll"><div class="v7-board-heading"><h1>${mileage?'這個月，去了多遠？':'換你刷新紀錄。'}</h1><p>${mileage?'10 月出行紀錄':'大稻埕河岸 · 單次最高分'}</p></div><div class="v7-board-metrics" role="tablist" aria-label="排行榜類型"><button role="tab" aria-selected="${!mileage}" data-act="v7-board-run">${icon('game')}Run 成績</button><button role="tab" aria-selected="${mileage}" data-act="v7-board-mileage">${icon('car')}本月里程</button></div><div class="v7-podium">${[1,0,2].map(i=>{const x=rows[i];return x?`<div class="v7-podium-person place-${i+1}"><span class="v7-podium-place">${i===0?icon('trophy'):i+1}</span><span class="v7-podium-avatar ${x.tone}">${x.self?`<img src="${bearImage}" alt="你的熊">`:x.name.slice(-1)}</span><b>${x.name}</b><strong>${mileage?x.score.toFixed(1):number(x.score)}<small>${mileage?'km':'分'}</small></strong><div class="v7-podium-block"></div></div>`:''}).join('')}</div><div class="v7-board-body"><div class="v7-board-scope"><span>${mileage?'好友里程':'10/12–10/18'}</span>${!mileage?`<div role="group" aria-label="比較對象"><button data-act="v7-board-friends" aria-pressed="${D().board!=='all'}">好友</button><button data-act="v7-board-all" aria-pressed="${D().board==='all'}">本場玩家</button></div>`:'<span>同期間比較</span>'}</div><div class="v7-board-list">${rows.map((x,i)=>`<div class="v7-board-row ${x.self?'is-you':''}"><span class="v7-rank">${1+rows.filter(o=>o.score>x.score).length}</span><span class="v7-board-avatar ${x.tone}">${x.self?`<img src="${bearImage}" alt="你的熊">`:x.name.slice(-1)}</span><span><b>${x.name}</b><small>${x.self?(mileage?'你的示例旅程':'本機遊玩成績'):'示例'+(D().board==='all'&&!['阿睿','小安','小林'].includes(x.name)?'玩家':'好友')}</small></span><strong>${mileage?x.score.toFixed(1):number(x.score)}<small>${mileage?' km':' 分'}</small></strong></div>`).join('')}</div><div class="v7-your-position"><span>${icon(mileage?'pin':'flag')}</span><div><b>${me<0?'你的第一筆成績，從這裡開始':above?`差 ${gap} ${mileage?'公里':'分'}，就追平${above.name}`:'目前排第一！'}</b><small>${mileage?'里程反映出行量，遊戲分數另外計算。':'所有人挑戰相同路線，取單次最高分。'}</small></div></div><p class="v7-local-note">對手與里程為示例資料，沒有即時連線排名。</p></div></div>${bottom(btn(mileage?'查看我的足跡':'再跑一趟',mileage?'v7-open-journey':'v7-start-run'))}`;
 };
 screens.tripmemory=()=>{
  const done=D().arrived;
  return `${toolbar('這趟留下來','arrival')}<div class="scroll v7-memory-scroll"><div class="v7-memory-ticket"><div class="v7-ticket-top"><img src="assets/yoxi-logo.svg" alt="yoxi"><span>10.17 SAT</span></div><h1>台北車站<span>到</span>圓山</h1><p>和小安一起出門</p><div class="v7-ticket-art">${(window.YoxiJourney?.mapSvg?.({period:'oct',selected:'zhongshan',compact:true})||'').replace('viewBox="0 0 420 430"','viewBox="25 105 370 200"').replace('preserveAspectRatio="none"','preserveAspectRatio="xMidYMid slice"')}<span class="v7-ticket-stamp">${done?'已加入足跡':'旅程紀念'}</span></div><div class="v7-ticket-stats"><div><b>3.8<small> km</small></b><span>這趟里程</span></div><div><b>15<small> min</small></b><span>乘車時間</span></div><div><b>中山區</b><span>${done?'新的城市足跡':'抵達區域'}</span></div></div><div class="v7-ticket-perforation"></div><div class="v7-ticket-bears"><img src="${bearImage}" alt="小晴的旅伴熊"><span><b>${done?'這趟，留在你的地圖上了。':'把這趟加入你的地圖。'}</b><small>${done?'到過的區域、累積的里程，接著看。':'示例行程 · 完成後累積一次'}</small></span></div></div><div class="v7-memory-links">${row('music','這趟的歌','看看一起點過的歌','musicmemory')}${row('user','我的熊與收藏','挑一件今天想帶的配件','bear')}${row('game','下一段，跑大稻埕','玩常設城市路線','run')}</div></div>${bottom(btn(done?'查看我的足跡':'加入我的足跡',done?'v7-open-journey':'v7-complete-trip'))}`;
 };
 function insert(html,selector,content,position='beforeend'){const t=document.createElement('template');t.innerHTML=html;const el=t.content.querySelector(selector);if(el)el.insertAdjacentHTML(position,content);return t.innerHTML;}
 const mineBefore=screens.mine;
 screens.mine=()=>insert(mineBefore(),'.profile-header',`<div class="v7-mine-hub">${window.YoxiJourney?.entryCard?.()||row('chart','我的足跡','里程、到過的地方和旅程紀念','journey')}<div class="v7-mine-shortcuts"><button data-go="bear"><img src="${bearImage}" alt="我的熊"><span>我的熊</span>${icon('chevron')}</button><button data-go="leaderboard">${icon('trophy')}<span>好友榜</span>${icon('chevron')}</button></div></div>`,'afterend');
 const exploreBefore=screens.explore;
 screens.explore=()=>insert(exploreBefore(),'.scroll',`<div class="v7-explore-extension"><div class="v7-section-line"><h2>換個方式逛城市</h2><button data-go="journey">我的足跡 ${icon('chevron')}</button></div>${runTeaser()}</div>`);
 const dailyBefore=screens.daily;
 screens.daily=()=>insert(dailyBefore(),'.s4-daily',`<div class="v7-friend-challenge"><div>${avatar('','rui')}<span><small>阿睿的城市挑戰 · 示例</small><b>我跑了 950 分，換你！</b></span></div><button data-go="run">大稻埕河岸 ${icon('play')}</button><button class="v7-board-text" data-go="leaderboard">看好友榜 ${icon('chevron')}</button></div>`,'afterbegin');
 const arrivalBefore=screens.arrival;
 screens.arrival=()=>{
  let html=insert(arrivalBefore(),'.s5-arrived-stamp',`<button class="v7-arrival-gain" data-go="tripmemory"><span>${icon('pin')}</span><div><b>${D().arrived?'這趟已加入足跡':'這趟，可以留下來'}</b><small>3.8 公里 · 新增中山區足跡</small></div>${icon('chevron')}</button>`,'afterend');
  html=html.replace(/<div class="bottom-action">[\s\S]*?<\/div>\s*$/,bottom(btn(D().arrived?'查看這趟紀念':'收藏這趟旅程','tripmemory')));return html;
 };
 const prevAct=act;
 act=function(a){
  if(a==='v7-start-run'){D().runOrigin=current;save();go('runplay');return;}
  if(a==='v7-open-journey'){D().period='oct';save();go('journey');return;}
  if(a==='v7-complete-trip'){D().period='oct';D().arrived=true;state.tripStatus='arrived';save();go('tripmemory');notify('已新增 3.8 公里與中山區足跡');return;}
  if(a==='v7-save-place'){D().savedPlace=!D().savedPlace;save();render();notify(D().savedPlace?'大稻埕已加入想去':'已移除想去');return;}
  if(a==='v7-board-run'||a==='v7-board-mileage'){D().boardMetric=a.endsWith('mileage')?'mileage':'run';save();render();return;}
  if(a==='v7-board-friends'||a==='v7-board-all'){D().board=a.endsWith('all')?'all':'friends';save();render();return;}
  if(a==='v7-challenge'){modal(`<div class="v7-challenge-modal"><img src="${bearImage}" alt="你的旅伴熊"><h2>換你來跑一趟</h2><p>大稻埕河岸 · 30 秒挑戰${best()?'<br>我的最高分：'+number(best())+' 分':''}</p>${btn('複製挑戰連結','v7-copy-challenge')}<p class="tiny">複製後傳給朋友。這版不會自動傳送訊息。</p></div>`);return;}
  if(a==='v7-copy-challenge'){const u=new URL(location.href);u.search='?mode=app';u.hash='run';navigator.clipboard?.writeText(u.href).then(()=>notify('已複製挑戰連結')).catch(()=>notify('請複製網址列的連結'));return;}
  if(a==='v7-data'){modal(`<h2>這版的資料與互動</h2><table class="evidence-table"><tr><th>可以操作</th><td>月份切換、區域查看、熊的配件穿戴、30 秒 Run、碰撞計分、暫停、重跑、最高分和本機收藏。</td></tr><tr><th>示例資料</th><td>小晴的 9–10 月行程、好友與對手。里程與區域由同一份示例行程計算，非官方乘客紀錄。</td></tr><tr><th>完成抵達</th><td>點選加入足跡後，新增 3.8 公里、15 分鐘和中山區；同筆行程只算一次。</td></tr><tr><th>官方 CSV 可用</th><td>行程次數、距離、時間、起訖區域、時段與月度比較。沒有沿途軌跡或同行者資料。</td></tr><tr><th>城市場景</th><td>大稻埕主題 3D 改編，非實際導航。玩過不會增加到訪區域或真實里程。</td></tr><tr><th>尚未接入</th><td>官方搭乘同步、多人遊戲、線上排行榜、帳號、實際獎勵及核銷。</td></tr></table>`);return;}
  prevAct(a);
 };
 let acceptedFrame=null;
 window.addEventListener('message',e=>{
  const iframe=document.querySelector('#v7-game-frame');
  if(e.origin!==location.origin||!iframe||e.source!==iframe.contentWindow||current!=='runplay')return;
  if(e.data?.type==='yoxi-run-exit'){go('run');return;}
  const r=e.data;if(r?.type!=='yoxi-run-complete'||r.course!=='dadaocheng'||acceptedFrame===e.source)return;
  if(!Number.isFinite(r.score)||r.score<0||r.score>10000||!Number.isInteger(r.stars)||r.stars<0||!Number.isInteger(r.hits)||r.hits<0||r.duration<29.9)return;
  acceptedFrame=e.source;
  const first=!D().runs.length;
  const result={score:r.score,stars:r.stars,hits:r.hits,duration:r.duration,course:r.course,first,at:new Date().toISOString()};
  D().runs.push(result);D().runs=D().runs.slice(-30);D().scores.dadaocheng=Math.max(best(),r.score);
  if(!D().unlocked.includes('bookmark'))D().unlocked.push('bookmark');save();go('runresult');
 });
 const priorInspector=renderInspector;
 renderInspector=function(m){priorInspector(m);const label=$('#inspector .v2-review-label');if(label)label.textContent=`v7 · 畫面 ${m.n}`;if(['journey','footprints','bear','run','runplay','runresult','leaderboard','tripmemory'].includes(m.id))$('#inspector').insertAdjacentHTML('beforeend',`<a class="reference-tile" href="integration.html">${icon('link')}功能怎麼接在一起 ${icon('chevron')}</a><button class="reference-tile" data-act="v7-data">${icon('chart')}數據與遊戲狀態 ${icon('chevron')}</button><a class="reference-tile" href="pdf-placement.html">${icon('book')}放進簡報的哪裡 ${icon('chevron')}</a>`);};
 const ord=['explore','import','organized','interests','music','event','rideprefs','rides','person','terms','pending','host','confirmed','playlist','karaoke','daily','icebreaker','reveal','arrival','tripmemory','musicmemory','mine','journey','footprints','bear','run','runplay','runresult','leaderboard','openride'];
 metadata.sort((a,b)=>ord.indexOf(a.id)-ord.indexOf(b.id));metadata.forEach((m,i)=>m.n=i+1);
 document.querySelector('.rail-bottom p').textContent='v7 · 2026.10\n城市足跡・可玩的 Yoxi Run';
})();
