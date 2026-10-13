'use strict';
const v6Song=id=>(window.YOXI_MUSIC_CATALOG||[]).find(t=>t.id===id);
const v6SharedSongs=()=> (state.musicPicks||[]).filter(id=>['night-life','sunny-love','love-ing'].includes(id)).map(v6Song).filter(Boolean);
function v6Prefs(){const search=['rides','person','terms'].includes(current),trip=['pending','host','confirmed','playlist','karaoke','arrival','musicmemory'].includes(current);return state.requestSnapshot&&['pending','accepted'].includes(state.request)&&(trip||(search&&activeTrip()))?{rideMood:state.requestSnapshot.rideMood||'listen',womenOnly:!!state.requestSnapshot.womenOnly}:state;}
const v6MoodLabel=(m)=>({any:'都可以',quiet:'安靜搭車',chat:'輕鬆聊聊',listen:'一起聽歌',sing:'一起唱'}[m]||'都可以');
const v6MoodIcon=(m)=>({any:'car',quiet:'moon',chat:'message',listen:'headphones',sing:'mic'}[m]||'car');
Object.assign(paths,{headphones:'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H3v-9Zm14 0h4v9h-4v-9Z',mic:'M8 6a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0V6ZM5 11v2a7 7 0 0 0 14 0v-2M12 20v3m-4 0h8',moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z'});
function v6PreferenceEntry(origin='rides'){
 return `<button class="v6-pref-entry" data-act="m6-open-rideprefs"><span class="v6-pref-icon">${icon(v6MoodIcon(state.rideMood))}</span><span><small>${origin==='openride'?'這趟的同行設定':activeTrip()?'下一趟的偏好':'我的同行偏好'}</small><b>${v6MoodLabel(state.rideMood)}${state.womenOnly?' <span>女性同行</span>':''}</b></span><span class="v6-edit">修改 ${icon('chevron')}</span></button>`;
}
function v6RideBadges(){const p=v6Prefs();return `<div class="v6-ride-badges"><span>${icon(v6MoodIcon(p.rideMood))}${v6MoodLabel(p.rideMood)}</span>${p.womenOnly?`<span class="v6-women-badge">${icon('people')}女性乘客同行</span>`:''}${p.rideMood==='sing'?'<small>一起唱前，會再確認大家的意願</small>':''}</div>`;}
function v6MusicMatch(where='rides'){
 if(v6Prefs().rideMood==='quiet')return '';
 const matches=v6SharedSongs(),song=matches[0];
 if(!song)return `<button class="v6-match-empty" data-act="m6-open-profile">${icon('music')}選幾首常聽的，看看有沒有共同喜好${icon('chevron')}</button>`;
 return `<button class="v6-song-match ${where==='person'?'v6-song-match-large':''}" data-act="m6-shared-song"><img src="${song.cover}" alt="${esc(song.album)}專輯封面"><span><small>${where==='person'?'你和小安都選了':'你們都選了這首'}</small><b>${esc(song.title)}</b><em>${esc(song.artist)}</em></span><span class="v6-shared-symbol">${icon('chevron')}</span></button>`;
}
function v6AgreedConditions(){const p=v6Prefs();return `<div class="v6-agreed"><div><span>${icon(v6MoodIcon(p.rideMood))}${v6MoodLabel(p.rideMood)}</span>${p.womenOnly?`<span>${icon('people')}女性乘客同行</span>`:''}</div>${p.womenOnly?'<p>限女性乘客加入 · 駕駛性別未指定</p>':''}${p.rideMood==='sing'?'<p>一起唱前，需同車乘客同意並確認車內播放許可。</p>':''}</div>`;}
function v6RideExperience(){const mode=v6Prefs().rideMood;
 if(mode==='quiet')return '';
 if(mode==='chat'||mode==='any')return `<button class="v4-conversation-link" data-act="${state.tripStatus==='riding'?'v4-ride-round':'v4-pre-round'}"><span class="v4-talk-icon">${icon('message')}</span><span><b>${state.tripStatus==='riding'?'路上聊聊':'出發前選一題'}</b><small>到現場，你想先做什麼？</small></span>${icon('chevron')}</button>`;
 const songs=(state.musicQueue||[]).map(x=>v6Song(x.id)).filter(Boolean);
 return `<button class="v6-trip-music" data-act="m6-open-trip"><span class="v6-cover-pair">${songs.slice(0,2).map(t=>`<img src="${t.cover}" alt="${esc(t.title)}封面">`).join('')}</span><span><b>${mode==='sing'?'找首歌，一起唱':'這趟聽什麼？'}</b><small>${songs.length?songs.length+' 首 · 看看大家點了什麼':'一人加一首，路上聽'}</small></span>${icon('chevron')}</button>`;
}
function v6MusicProfileEntry(compact=false){const songs=(state.musicPicks||[]).map(v6Song).filter(Boolean);return `<button class="v6-music-profile ${compact?'compact':''}" data-act="m6-open-profile"><span class="v6-cover-stack">${songs.length?songs.slice(0,3).map(t=>`<img src="${t.cover}" alt="${esc(t.title)}封面">`).join(''):icon('headphones')}</span><span><b>最近常聽的歌</b><small>${songs.length?songs.map(t=>t.artist).filter((x,i,a)=>a.indexOf(x)===i).join('、'):'選幾首你喜歡的'}</small></span>${icon('chevron')}</button>`;}
function v6RevealMusic(){const trip=state.socialPeer!=='rui';return `<button class="v6-reveal-song" data-act="${trip?'m6-open-trip':'m6-open-profile'}"><span>${icon('music')}</span><div><b>${trip?'加一首到這趟歌單':'選一首你最近常聽的'}</b><small>${trip?'換你點歌':'放到自己的興趣裡'}</small></div>${icon('plus')}</button>`;}
function v6MemoryEntry(){const saved=window.YoxiMusic.hasSavedMemory();if(v6Prefs().rideMood==='quiet'&&!saved)return '';const songs=window.YoxiMusic.memorySongs();if(!songs.length)return '';return `<button class="v6-memory-entry" data-act="m6-open-memory"><span class="v6-cover-pair">${songs.slice(0,2).map(t=>`<img src="${t.cover}" alt="${esc(t.title)}封面">`).join('')}</span><span><small>台北車站 → 花博</small><b>這趟點的歌</b></span>${icon('chevron')}</button>`;}
const v6PriorAct=act;
act=function(a){
 if(a==='find-ride'&&!activeTrip()){state.terms=false;save();}
 if(a==='m6-shared-song'){const s=v6SharedSongs()[0];if(s)modal(`<div class="v6-shared-modal"><img src="${s.cover}" alt="${esc(s.album)}封面"><h2>你和小安都選了這首</h2><h3>${esc(s.title)}</h3><p>${esc(s.artist)}</p><a class="btn outline" href="${s.trackUrl}" target="_blank" rel="noopener">在 Apple Music 開啟 ${icon('share')}</a>${btn('看看自己的歌','m6-open-profile','secondary')}</div>`);return}
 if(a==='m6-demo-vehicle-allow'){state.musicVehicleAllowed=true;save();render();notify('已載入車內允許播放的示例狀態');return}
 if(a==='demo-start'&&v6Prefs().rideMood!=='chat'&&v6Prefs().rideMood!=='any'){if($('#modal').open)closeModal();state.tripStatus='riding';state.musicOrigin='confirmed';save();go(v6Prefs().rideMood==='quiet'?'confirmed':'playlist');return;}
 if(a==='request'){
  if(activeTrip()){v6PriorAct(a);return;}
  if(!window.YoxiRidePrefs.compatible()||(state.womenOnly&&state.selfGender!=='woman')){notify('這趟的同行條件不符，請修改條件');return}
  v6PriorAct(a);if(state.request==='pending'&&state.requestSnapshot){state.requestSnapshot={...state.requestSnapshot,rideMood:state.rideMood,womenOnly:!!state.womenOnly};state.musicReady=false;state.musicVehicleAllowed=false;save();render()}return;
 }
 if(a==='seed-request'){v6PriorAct(a);if(state.requestSnapshot){state.requestSnapshot={...state.requestSnapshot,rideMood:state.rideMood,womenOnly:!!state.womenOnly};state.musicReady=false;state.musicVehicleAllowed=false;save();render()}return;}
 if(a==='r6-save'){if(!['pending','accepted'].includes(state.request))state.terms=false;v6PriorAct(a);return;}
 v6PriorAct(a);
};
const v6PriorSeed=seedPreview;
seedPreview=function(id){v6PriorSeed(id);
 if(['pending','host','confirmed','icebreaker','reveal','arrival'].includes(id)&&state.requestSnapshot){state.requestSnapshot={...state.requestSnapshot,rideMood:state.rideMood||'listen',womenOnly:!!state.womenOnly};}
 if(['playlist','karaoke','musicmemory'].includes(id)){
  state.request='accepted';state.terms=true;state.requestSnapshot={departure:'13:30',pickup:'台北車站東三門',price:120,rideMood:id==='karaoke'?'sing':'listen',womenOnly:!!state.womenOnly};state.tripStatus=id==='musicmemory'?'arrived':'riding';
  if(!(state.musicQueue||[]).length)state.musicQueue=[{id:'night-life',by:'self'},{id:'sunny-love',by:'an'}];
  state.musicOrigin=id==='musicmemory'?'arrival':'confirmed';
  if(id==='karaoke'){state.musicPeerReady=true;state.musicVehicleAllowed=true;state.musicKaraokeSong='night-life';state.musicKaraokeBy='an';}
 }
 save();
};
const v6PriorInspector=renderInspector;
renderInspector=function(m){v6PriorInspector(m);const el=$('#inspector');if(current==='karaoke')el.insertAdjacentHTML('beforeend',`<div class="v6-review-actions"><span>展示者情境控制</span><button class="review-button" data-act="m6-demo-peer-ready">示範小安同意一起唱</button><button class="review-button" data-act="m6-demo-vehicle-allow">示範車內允許播放</button></div>`);if(['music','playlist','karaoke','musicmemory'].includes(current))el.insertAdjacentHTML('beforeend','<p class="v2-prototype-note">歌曲與封面採官方資料。<br>開啟 Apple Music 聽歌；此稿不串流歌曲、顯示歌詞或錄音。</p>');if(current==='rideprefs')el.insertAdjacentHTML('beforeend','<p class="v2-prototype-note">示例帳號：小晴，女性乘客。<br>身分及派車驗證未接入；女性同行不代表女性駕駛或安全保證。</p>');};
// The result keeps its price/action visible while route and shared interests can scroll.
screens.rides=function(){
 const existing=activeTrip(),found=existing||(state.departure==='13:30'&&state.pickup==='台北車站東三門'&&window.YoxiRidePrefs.compatible());
 return `${toolbar('找順路的車','event',`<button class="icon-btn" data-go="openride" aria-label="開放我的座位">${icon('plus')}</button>`)}<div class="scroll"><div class="map-wrap v6-result-map">${map(true)}<div class="map-controls"><button class="map-label" data-act="ride-filters">${icon('calendar')}10/17 · ${esc(existing&&state.requestSnapshot?state.requestSnapshot.departure:state.departure)}${icon('down')}</button><button class="icon-btn light" data-act="map-info" aria-label="地圖資訊">${icon('pin')}</button></div></div><div class="v6-result-body">${v6PreferenceEntry()}<div class="v6-result-heading"><h1>${existing?(state.request==='accepted'?'已加入這趟行程':'這趟正在確認'):found?'去花博，還有 1 個位子':'沒有符合的行程'}</h1></div>${found?`${v6RideBadges()}${v6MusicMatch()}<div class="v6-result-route">${v2Timeline()}<span>約 15 分鐘 · 接人約多 3 分鐘</span></div><button class="v6-result-person" data-go="person">${avatar()}<span><b>發起人 小安</b><small>${v6Prefs().womenOnly?'女性乘客 · ':''}也去花博聽音樂</small></span><span>看介紹 ${icon('chevron')}</span></button>`:`<div class="empty">${icon('car')}<p>換個時間或上車地點試試。</p>${btn('修改條件','ride-filters','secondary')}</div>`}</div></div>${found?bottom(`<div class="v6-result-booking">${priceFoot()}${btn(existing?(state.request==='accepted'?'查看行程':'查看申請'):'看這趟行程',existing?(state.request==='accepted'?'confirmed':'pending'):'terms')}</div>`):''}${nav('rides')}`;
};
