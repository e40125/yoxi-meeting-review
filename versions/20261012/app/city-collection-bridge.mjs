import {createStore, STORAGE_KEY} from './core/store.mjs';

export const INSPIRATION_SOURCE = '城市收藏：藍色街角（靈感地點）';
const scenePlaces = Object.freeze({blue: Object.freeze({placeId:'blueprint',name:'藍晒圖文創園區',source:INSPIRATION_SOURCE})});

export function createScenePlaceBridge({store=createStore({storageKey:STORAGE_KEY})}={}) {
  const placeFor = sceneId => scenePlaces[sceneId] || null;
  const saved = sceneId => {
    if(store.getLoadError?.())throw new Error('目前無法讀取收藏。');
    const place=placeFor(sceneId);
    return Boolean(place && store.getState().collections.some(item=>item.placeId===place.placeId));
  };
  function save(sceneId) {
    const place=placeFor(sceneId);
    if(!place)return {ok:false,error:{code:'no_real_place',message:'這是原創場景，沒有對應的實際地點。'}};
    if(store.getState().activeProfileId!=='me')return {ok:false,error:{code:'test_profile',message:'請先在城市生活切回自己，再加入想去清單。'}};
    return store.dispatch({type:'collection.save',placeIds:[place.placeId],sourceInput:place.source});
  }
  return {placeFor,saved,save};
}

export function appendScenePlaceActions(container,sceneId,{bridge}={}) {
  const place=scenePlaces[sceneId];
  if(!place)return;
  const actions=document.createElement('div');
  const save=document.createElement('button');save.type='button';save.className='secondary';
  const status=document.createElement('p');status.setAttribute('role','status');status.hidden=true;
  const showError=()=>{save.disabled=true;status.hidden=false;status.textContent='目前無法讀取收藏，請重新整理後再試。';};
  const update=()=>{const exists=bridge.saved(sceneId);save.textContent=exists?'已在地點收藏中':'把藍晒圖加入想去';save.disabled=exists;};
  save.textContent='把藍晒圖加入想去';
  try{bridge??=createScenePlaceBridge();update();}catch{showError();}
  save.onclick=()=>{
    try{
      const result=bridge.save(sceneId);status.hidden=false;
      const kept=result.ok&&result.value?.[0]?.intent&&result.value[0].intent!=='want';
      status.textContent=result.ok?(kept?'地點已在收藏中，原本的狀態已保留。':'已加入城市生活的想去清單。'):result.error.message;
      if(result.ok)update();
    }catch{showError();}
  };
  const link=document.createElement('a');link.className='text-button';link.href='city.html#place/'+place.placeId;link.textContent='查看真實地點';
  actions.append(save,link,status);container.append(actions);
}
