'use strict';

// Song metadata and covers come from the linked music catalogue. Audio opens at its source.
// Picks, fellow passenger choices and the shared queue are local prototype state.
const m6Catalogue=()=>Array.isArray(window.YOXI_MUSIC_CATALOG)?window.YOXI_MUSIC_CATALOG:[];
const m6Song=id=>m6Catalogue().find(song=>song.id===id);
const m6PeerPicks=['night-life','sunny-love','love-ing'];
const m6Defaults={musicPicks:['night-life','my-jinji'],musicQueue:[{id:'night-life',by:'self'},{id:'sunny-love',by:'an'}],musicLikes:[],musicOrigin:'confirmed',musicReady:false,musicPeerReady:true,musicKaraokeSong:'night-life',musicKaraokeBy:'an',musicMemorySaved:false,musicSavedMemory:null,musicSavedTrip:null,musicVehicleAllowed:false};
function m6Ensure(){for(const [key,value] of Object.entries(m6Defaults)){if(state[key]===undefined)state[key]=Array.isArray(value)?value.map(v=>typeof v==='object'?{...v}:v):value}state.musicPicks=state.musicPicks.filter(id=>m6Song(id)).slice(0,3);state.musicQueue=state.musicQueue.filter(entry=>m6Song(entry.id));state.musicMemorySaved=m6HasMemory();}
function m6HasMemory(){return Array.isArray(state.musicSavedMemory)&&state.musicSavedMemory.some(entry=>m6Song(entry.id))}
function m6MemoryEntries(){m6Ensure();return (m6HasMemory()?state.musicSavedMemory:state.musicQueue).filter(entry=>m6Song(entry.id))}
let m6Query='',m6QueueEdit=false;
function m6Icon(name){const p={external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',headphones:'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H3v-9Zm14 0h4v9h-4v-9Z',mic:'M8 4a4 4 0 0 1 8 0v8a4 4 0 0 1-8 0V4Zm-4 6v2a8 8 0 0 0 16 0v-2M12 20v3M8 23h8',pause:'M8 5v14M16 5v14',minus:'M5 12h14',more:'M4 12h.01M12 12h.01M20 12h.01',wave:'M4 9v6M9 4v16M14 7v10M19 10v4'}[name];return p?`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`:icon(name)}
const m6Initial=(name='self')=>`<span class="m6-avatar m6-avatar-${name}" aria-label="${name==='an'?'小安':'小晴'}">${name==='an'?'安':'晴'}</span>`;
const m6External=(song,label='開啟歌曲',cls='')=>`<a class="m6-external ${cls}" href="${esc(song.trackUrl)}" target="_blank" rel="noopener" aria-label="在 Apple Music 開啟 ${esc(song.title)}">${m6Icon('external')}<span>${label}</span></a>`;
const m6Back=()=>['music','playlist','karaoke','musicmemory'].includes(state.musicOrigin)?'confirmed':state.musicOrigin||'confirmed';
function m6Common(){m6Ensure();return state.musicPicks.filter(id=>m6PeerPicks.includes(id)).map(m6Song)}
function m6Match(){const songs=m6Common();return songs.length?`你們都在聽${songs[0].artist}`:'看看同行的人都聽什麼'}
function m6Entry(context='trip'){m6Ensure();const song=m6Common()[0]||m6Song(state.musicQueue[0]?.id)||m6Catalogue()[0];if(!song)return '';return `<button class="m6-entry" data-act="${context==='profile'?'m6-open-profile':context==='memory'?'m6-open-memory':'m6-open-trip'}"><img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><span><strong>${context==='profile'?'最近都在聽什麼？':context==='memory'?'這趟點的歌':m6Match()}</strong><small>${context==='profile'?'選幾首最近常聽的歌':context==='memory'?'把一起選的歌留下來':'一起選幾首，路上聽'}</small></span>${icon('chevron')}</button>`}
window.YoxiMusic={catalog:m6Catalogue,commonSongs:m6Common,memorySongs:()=>m6MemoryEntries().map(entry=>m6Song(entry.id)),hasSavedMemory:m6HasMemory,matchSnippet:m6Match,musicEntry:m6Entry,setContext(context){state.musicOrigin=context;save()},openPreview(id){const song=m6Song(id);if(song)window.open(song.trackUrl,'_blank','noopener')}};

function m6PickerRows(mode='picks'){
  m6Ensure();const query=m6Query.trim().toLocaleLowerCase();const songs=m6Catalogue().filter(song=>`${song.title} ${song.artist}`.toLocaleLowerCase().includes(query));
  if(!songs.length)return '<div class="m6-empty"><strong>沒有找到這首歌</strong><span>試試歌名或歌手</span></div>';
  return songs.map(song=>{const selected=mode==='picks'?state.musicPicks.includes(song.id):state.musicQueue.some(entry=>entry.id===song.id);return `<button class="m6-song-pick ${selected?'is-picked':''}" data-act="${mode==='picks'?'m6-pick':'m6-add'}" data-song="${song.id}" aria-pressed="${selected}" ${mode==='add'&&selected?'disabled':''}><img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><span><strong>${esc(song.title)}</strong><small>${esc(song.artist)}</small></span><i class="m6-pick-circle">${selected?icon('check'):icon('plus')}</i></button>`}).join('')
}
function m6QueueRows(memory=false){
  m6Ensure();const entries=memory?m6MemoryEntries():state.musicQueue;if(!entries.length)return '<div class="m6-empty"><strong>還沒選歌</strong><span>各加一首，組成這趟歌單。</span></div>';
  return entries.map((entry,index)=>{const song=m6Song(entry.id),liked=state.musicLikes.includes(entry.id);return `<article class="m6-queue-row"><span class="m6-track-number">${String(index+1).padStart(2,'0')}</span><img class="m6-track-cover" src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><div class="m6-track-info"><strong>${esc(song.title)}</strong><small>${esc(song.artist)}</small><span class="m6-added-by">${entry.by==='an'?'小安':'你'}加的</span></div>${m6QueueEdit&&!memory?`<button class="m6-row-action m6-remove" data-act="m6-remove" data-song="${entry.id}" aria-label="移除 ${esc(song.title)}">${icon('close')}</button>`:`<button class="m6-row-action ${liked?'is-liked':''}" data-act="m6-like" data-song="${entry.id}" aria-pressed="${liked}" aria-label="${liked?'取消喜歡':'喜歡'} ${esc(song.title)}">${icon('heart')}</button>`}</article>`}).join('')
}
function m6AddModal(mode='queue'){
  m6Query='';m6Ensure();
  const content=mode==='karaoke'?`<div class="m6-modal-list">${m6Catalogue().map(song=>`<button class="m6-song-pick ${song.id===state.musicKaraokeSong?'is-picked':''}" data-act="m6-karaoke-song" data-song="${song.id}"><img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><span><strong>${esc(song.title)}</strong><small>${esc(song.artist)}</small></span>${song.id===state.musicKaraokeSong?icon('check'):icon('plus')}</button>`).join('')}</div>`:`<div class="m6-modal-list">${m6PickerRows('add')}</div>`;
  modal(`<div class="m6-add-modal"><h2>${mode==='karaoke'?'換你點一首':'加一首到歌單'}</h2><p>${mode==='karaoke'?'點好歌，再問對方要不要一起唱。':'你加的歌，小安也看得到。'}</p>${content}</div>`)
}

Object.assign(screens,{
  music(){
    m6Ensure();return `${toolbar('我的音樂',m6Back())}<div class="scroll m6-scroll"><section class="m6-picks-page"><div class="m6-page-heading"><h1>最近都在聽什麼？</h1><p>選 1–3 首</p></div><div class="m6-selected-strip" aria-label="已選的歌曲">${[0,1,2].map(i=>{const song=m6Song(state.musicPicks[i]);return song?`<button data-act="m6-pick" data-song="${song.id}" aria-label="移除 ${esc(song.title)}"><img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><span>${icon('close')}</span></button>`:`<span class="m6-empty-slot">${icon('music')}</span>`}).join('')}<div><b>${state.musicPicks.length}<span> / 3</span></b><small>讓同行的人聽聽看</small></div></div><label class="m6-search" for="m6-search-input">${icon('search')}<input id="m6-search-input" type="search" placeholder="歌名或歌手" value="${esc(m6Query)}" autocomplete="off"><button type="button" data-act="m6-clear-search" aria-label="清除搜尋" ${m6Query?'':'hidden'}>${icon('close')}</button></label><div class="m6-catalogue">${m6PickerRows()}</div></section></div>${bottom(btn('選好了','m6-save-picks','m6-primary',state.musicPicks.length?'':'disabled'))}`
  },
  playlist(){
    m6Ensure();const lead=m6Song(state.musicQueue[0]?.id),shared=m6Common();return `${toolbar('這趟聽什麼',m6Back(),`<button class="m6-text-button" data-act="m6-edit-queue">${m6QueueEdit?'完成':'編輯'}</button>`)}<div class="scroll m6-scroll"><section class="m6-playlist-page"><div class="m6-trip-line">${icon('car')}<span>台北車站 ${icon('arrow')} 花博</span><span>10/17</span></div><div class="m6-playlist-hero">${lead?`<img class="m6-hero-album" src="${esc(lead.cover)}" alt="${esc(lead.album)}專輯封面">`:`<div class="m6-hero-empty">${icon('music')}</div>`}<div class="m6-playlist-title"><span class="m6-yellow-label">你和小安的歌單</span><h1>一路上，<br>一起聽。</h1><div class="m6-people">${m6Initial()}${m6Initial('an')}<span>${state.musicQueue.length} 首</span></div></div></div>${shared.length?`<div class="m6-common-note">${m6Icon('headphones')}<span>你們都選了《${esc(shared[0].title)}》</span></div>`:''}<div class="m6-list-heading"><h2>一起選的歌</h2><button data-act="m6-add-modal">${icon('plus')}加一首</button></div><div class="m6-queue">${m6QueueRows()}</div>${lead?`<div class="m6-source-listen">${m6External(lead,'在 Apple Music 開啟')}<span>開啟第一首歌曲</span></div>`:''}<button class="m6-karaoke-entry" data-act="m6-open-karaoke"><span>${m6Icon('mic')}</span><div><strong>這首，你也會唱？</strong><small>問問小安，要不要一起唱</small></div>${icon('chevron')}</button></section></div>${bottom(btn(m6Back()==='reveal'?'回聊天':m6Back()==='confirmed'?'回行程':'完成選歌',m6Back(),'m6-primary'))}`
  },
  karaoke(){
    m6Ensure();const song=m6Song(state.musicKaraokeSong)||m6Catalogue()[0],both=state.musicReady&&state.musicPeerReady;
    if(!song)return `${toolbar('一起唱','playlist')}<div class="scroll"><div class="m6-empty">還沒有可以選的歌</div></div>`;
    return `${toolbar('一起唱','playlist',`<button class="m6-text-button" data-act="m6-change-song">換首歌</button>`)}<div class="scroll m6-scroll m6-karaoke-scroll"><section class="m6-karaoke-page"><div class="m6-karaoke-invitation">${m6Initial(state.musicKaraokeBy==='an'?'an':'self')}<span>${state.musicKaraokeBy==='an'?'小安問：這首一起唱？':'你點了這首，等小安回覆'}</span></div><div class="m6-record-stage"><div class="m6-record-circle" aria-hidden="true"></div><img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面"><span class="m6-record-badge">${m6Icon('mic')}</span></div><div class="m6-karaoke-track"><h1>${esc(song.title)}</h1><p>${esc(song.artist)}</p></div><div class="m6-ready-list"><div>${m6Initial()}<strong>你</strong><span class="${state.musicReady?'ready':''}">${state.musicReady?icon('check'):''}${state.musicReady?'想一起唱':'還沒選'}</span></div><div>${m6Initial('an')}<strong>小安</strong><span class="${state.musicPeerReady?'ready':''}">${state.musicPeerReady?icon('check'):''}${state.musicPeerReady?'想一起唱':'等回覆'}</span></div></div>${both?`<div class="m6-ready-message">${m6Icon('wave')}<strong>你們都想唱這首</strong></div>${state.musicVehicleAllowed?m6External(song,'到 Apple Music 開啟歌曲','m6-karaoke-listen'):`<div class="m6-vehicle-state">${icon('car')}等車內播放確認</div>`}`:`<p class="m6-karaoke-note">選好同一首，再一起開口。</p>`}<button class="m6-quiet-button" data-act="m6-just-listen">我想聽就好</button></section></div>${bottom(state.musicReady?btn(state.musicPeerReady?'換你點下一首':'已送出，等小安回覆',state.musicPeerReady?'m6-change-song':'m6-waiting','m6-primary',state.musicPeerReady?'':'disabled'):btn('好啊，一起唱','m6-ready','m6-primary'))}`
  },
  musicmemory(){
    m6Ensure();const memory=m6MemoryEntries(),savedTrip=m6HasMemory()?state.musicSavedTrip:null,departure=savedTrip?.departure||state.requestSnapshot?.departure||'13:30',arrival=savedTrip?.arrival||(departure==='14:00'?'14:15':'13:45'),pickup=savedTrip?.pickup||'台北車站',destination=savedTrip?.destination||'花博圓山園區';const covers=memory.slice(0,3).map(entry=>m6Song(entry.id));return `${toolbar('這趟點的歌',m6Back())}<div class="scroll m6-scroll"><section class="m6-memory-page"><div class="m6-memory-header"><span>10.17</span><div><small>和小安一起選的歌</small><h1>去花博的路上</h1></div></div><div class="m6-memory-covers" aria-label="這趟歌單的專輯封面">${covers.map((song,i)=>`<img src="${esc(song.cover)}" alt="${esc(song.album)}專輯封面" style="--m6-index:${i}">`).join('')}${covers.length?'':`<span>${icon('music')}</span>`}<div class="m6-memory-mark">${m6Icon('headphones')}<span>${memory.length} 首歌</span></div></div><div class="m6-memory-route"><div><span>${esc(departure)}</span><strong>${esc(pickup)}</strong></div>${icon('arrow')}<div><span>${arrival}</span><strong>${esc(destination)}</strong></div></div><div class="m6-list-heading"><h2>你和小安的歌單</h2><span>${m6Initial()}${m6Initial('an')}</span></div><div class="m6-queue">${m6QueueRows(true)}</div><button class="m6-next-outing" data-go="daily">下次約去哪？${icon('arrow')}</button></section></div>${bottom(btn(`${icon(state.musicMemorySaved?'check':'bookmark')}${state.musicMemorySaved?'已收藏歌單':'收藏這份歌單'}`,'m6-save-memory','m6-primary',memory.length&&!m6HasMemory()?'':'disabled'))}`
  }
});

const m6PreviousAct=act;
act=function(action){
  if(!action.startsWith('m6-'))return m6PreviousAct(action);
  m6Ensure();
  switch(action){
    case 'm6-open-profile':if(document.querySelector('#modal')?.open)closeModal();state.musicOrigin=current;m6Query='';save();go('music');return;
    case 'm6-open-trip':if(document.querySelector('#modal')?.open)closeModal();state.musicOrigin=current;m6QueueEdit=false;save();go('playlist');return;
    case 'm6-open-memory':if(document.querySelector('#modal')?.open)closeModal();state.musicOrigin=current;save();go('musicmemory');return;
    case 'm6-save-picks':if(!state.musicPicks.length)return;save();go(m6Back());notify('最近常聽的歌已更新');return;
    case 'm6-clear-search':m6Query='';render();document.querySelector('#m6-search-input')?.focus();return;
    case 'm6-add-modal':m6AddModal();return;
    case 'm6-edit-queue':m6QueueEdit=!m6QueueEdit;render();return;
    case 'm6-open-karaoke':go('karaoke');return;
    case 'm6-change-song':m6AddModal('karaoke');return;
    case 'm6-ready':state.musicReady=true;save();render();return;
    case 'm6-demo-vehicle-allow':state.musicVehicleAllowed=true;save();if(document.querySelector('#modal')?.open)closeModal();render();return;
    case 'm6-demo-peer-ready':state.musicPeerReady=true;save();if(document.querySelector('#modal')?.open)closeModal();render();return;
    case 'm6-just-listen':state.musicReady=false;save();go('playlist');notify('回到一起聽的歌單');return;
    case 'm6-save-memory':{if(!state.musicQueue.length||m6HasMemory())return;const departure=state.requestSnapshot?.departure||'13:30';state.musicSavedMemory=state.musicQueue.map(entry=>({...entry}));state.musicSavedTrip={departure,arrival:departure==='14:00'?'14:15':'13:45',pickup:state.requestSnapshot?.pickup||'台北車站',destination:'花博圓山園區',date:'10.17',peer:'小安'};state.musicMemorySaved=true;save();render();notify('已收藏這趟歌單');return;}
  }
};
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-song]');if(!target||target.disabled)return;
  const id=target.dataset.song,song=m6Song(id),action=target.dataset.act;if(!song)return;
  m6Ensure();
  if(action==='m6-pick'){
    if(state.musicPicks.includes(id))state.musicPicks=state.musicPicks.filter(key=>key!==id);
    else if(state.musicPicks.length>=3){notify('最多選 3 首，先移除一首再加');return}
    else state.musicPicks=[...state.musicPicks,id];
    save();render();document.querySelector(`.m6-song-pick[data-song="${id}"]`)?.focus({preventScroll:true});
  }else if(action==='m6-add'){
    if(!state.musicQueue.some(entry=>entry.id===id))state.musicQueue=[...state.musicQueue,{id,by:'self'}];
    save();closeModal();render();notify('已加到這趟歌單');
  }else if(action==='m6-remove'){
    state.musicQueue=state.musicQueue.filter(entry=>entry.id!==id);save();render();notify('已從歌單移除');
  }else if(action==='m6-like'){
    state.musicLikes=state.musicLikes.includes(id)?state.musicLikes.filter(key=>key!==id):[...state.musicLikes,id];save();render();
  }else if(action==='m6-karaoke-song'){
    if(id!==state.musicKaraokeSong){state.musicKaraokeSong=id;state.musicKaraokeBy='self';state.musicReady=true;state.musicPeerReady=false}
    save();closeModal();go('karaoke');
  }
});
// Reset transient UI state before the shared reset handler renders the initial screen.
document.querySelector('#reset')?.addEventListener('click',()=>{m6QueueEdit=false;m6Query='';},true);
document.addEventListener('input',event=>{if(event.target.id!=='m6-search-input')return;const position=event.target.selectionStart;m6Query=event.target.value;render();const input=document.querySelector('#m6-search-input');if(input){input.focus();try{input.setSelectionRange(position,position)}catch{}}});
