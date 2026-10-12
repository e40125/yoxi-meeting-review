import { SCHEMA_VERSION, STORAGE_KEY, SCENES, LIGHTING, POSES, PROPS, EQUIPMENT_IDS, createEmptyEquipment, CAPTION_MAX_LENGTH, createDefaultDraft } from './collection-data.mjs';

export class CollectionError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'CollectionError'; this.code = code; this.details = details; }
}
const clone = value => JSON.parse(JSON.stringify(value));
const fail = (code, message, details) => { throw new CollectionError(code, message, details); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const configKeys = ['sceneId','view','lightingId','poseId','propId','equipment','windowOpen','raining','caption'];
function keysOnly(value, keys) {
  if (!object(value)) fail('invalid_input', '資料格式不正確。');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail('unknown_field', '包含不支援的欄位。', { field:key });
}
function enumValue(value, choices, field) {
  if (!choices.some(item => item.id === value)) fail('invalid_selection', '這個選項不存在。', { field, value });
  return value;
}
function text(value) {
  if (typeof value !== 'string') fail('invalid_caption', '紀念文字需要是文字。');
  const result = value.trim();
  if ([...result].length > CAPTION_MAX_LENGTH) fail('caption_too_long', `紀念文字最多 ${CAPTION_MAX_LENGTH} 字。`);
  return result;
}
function reference(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !value.length || value.length > 200 || /^(?:data|https?):/i.test(value)) fail('invalid_image_id', '請提供圖片編號，圖片內容由圖庫保存。');
  return value;
}
function fingerprint(value) {
  if(value === undefined || value === null) return null;
  if(typeof value !== 'string' || !/^[a-fA-F0-9]{64}$/.test(value)) fail('invalid_fingerprint','圖片指紋格式不正確。');
  return value.toLowerCase();
}
function sameContent(a,b,rawFingerprint) { return contentKey(a)===contentKey(b) && (a.rawFingerprint ?? null)===(rawFingerprint ?? null); }
function equipment(value) {
  // This is a visual snapshot, not an ownership grant or a change to the companion's equipment.
  if(value === undefined) return createEmptyEquipment();
  keysOnly(value,Object.keys(EQUIPMENT_IDS));
  const result=createEmptyEquipment();
  for(const [slot,id] of Object.entries(EQUIPMENT_IDS)) {
    const selected=value[slot] ?? null;
    if(selected !== null && selected !== id) fail('invalid_equipment','這件小物不適用於這個位置。',{slot,value:selected});
    result[slot]=selected;
  }
  return result;
}
function config(value, { requireAvailable = true } = {}) {
  const sceneId = enumValue(value.sceneId, SCENES, 'sceneId');
  if (requireAvailable && SCENES.find(s => s.id === sceneId).state !== 'available') fail('scene_unavailable', '這個場景還沒完成。', {sceneId});
  keysOnly(value.view, ['yaw','framing']);
  const framing=value.view.framing??'scene';
  if(!['scene','companion'].includes(framing)) fail('invalid_view','這個構圖不存在。');
  const yaw = value.view.yaw;
  if (typeof yaw !== 'number' || !Number.isFinite(yaw) || yaw < -100 || yaw > 100) fail('invalid_view', '角度超出範圍。');
  for(const key of ['windowOpen','raining']) if(value[key]!==undefined&&typeof value[key]!=='boolean')fail('invalid_setting','場景設定格式不正確。',{field:key});
  return { sceneId, windowOpen:value.windowOpen??false, raining:value.raining??true, view:{yaw:Math.round(yaw * 1000000) / 1000000,framing}, lightingId:enumValue(value.lightingId,LIGHTING,'lightingId'), poseId:enumValue(value.poseId,POSES,'poseId'), propId:enumValue(value.propId,PROPS,'propId'), equipment:equipment(value.equipment), caption:text(value.caption) };
}
function visualKey(value) { const {caption,...rest} = config(value, {requireAvailable:false}); return JSON.stringify(rest); }
function contentKey(value) { return JSON.stringify(config(value, {requireAvailable:false})); }
function mergeConfig(base, patch) {
  if(Object.hasOwn(patch,'view')) keysOnly(patch.view,['yaw','framing']);
  if(Object.hasOwn(patch,'equipment')) keysOnly(patch.equipment,Object.keys(EQUIPMENT_IDS));
  return { ...base, ...patch, view:Object.hasOwn(patch,'view') ? {...base.view,...patch.view} : base.view, equipment:Object.hasOwn(patch,'equipment') ? {...equipment(base.equipment),...patch.equipment} : base.equipment };
}
function validId(value) { return typeof value === 'string' && value.length > 0 && value.length <= 200; }
function validDate(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)); }
function readStored(raw) {
  const parsed = JSON.parse(raw);
  if (!object(parsed) || parsed.schemaVersion !== SCHEMA_VERSION) fail('unsupported_schema', '這份收藏由其他版本建立，原資料已保留。');
  if (!Array.isArray(parsed.cards) || parsed.cards.length > 10000) fail('invalid_storage', '收藏資料格式不正確。');
  const ids = new Set();
  const cards = parsed.cards.map(card => {
    if (!object(card) || !validId(card.id) || ids.has(card.id) || !validDate(card.createdAt) || !validDate(card.updatedAt)) fail('invalid_storage','收藏紀錄不完整。');
    ids.add(card.id);
    return {...config(card,{requireAvailable:false}),id:card.id,createdAt:card.createdAt,updatedAt:card.updatedAt,imageId:reference(card.imageId),rawFingerprint:fingerprint(card.rawFingerprint)};
  });
  if (!object(parsed.draft)) fail('invalid_storage','草稿格式不正確。');
  const draft = {...config(parsed.draft,{requireAvailable:false}),editingCardId:parsed.draft.editingCardId ?? null};
  if (draft.editingCardId !== null && !ids.has(draft.editingCardId)) fail('invalid_storage','草稿找不到對應的紀念卡。');
  return {schemaVersion:SCHEMA_VERSION,draft,cards};
}
function defaultStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }

/** All methods are synchronous. Image bytes belong to an external image database. */
export function createCollectionStore({storage=defaultStorage(),now=()=>new Date(),idFactory=()=>globalThis.crypto?.randomUUID?.() ?? `card-${Date.now()}-${Math.random().toString(36).slice(2)}`}={}) {
  const listeners = new Set();
  let state = {schemaVersion:SCHEMA_VERSION,draft:{...config(createDefaultDraft()),editingCardId:null},cards:[]};
  let storageStatus = storage ? {mode:'persistent',reason:null,message:''} : {mode:'memory',reason:'unavailable',message:'此瀏覽器目前只保留本次開啟的修改。'};
  let writesBlocked = false, lastStoredRaw = null, persistedBase = clone(state);
  if (storage) {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); lastStoredRaw = raw; }
    catch { storageStatus = {mode:'memory',reason:'read_failed',message:'目前無法讀取裝置收藏，這次修改暫存於記憶體。'}; writesBlocked = true; }
    if (raw) {
      try { state = readStored(raw); persistedBase=clone(state); }
      catch (error) {
        writesBlocked = true;
        storageStatus = {mode:'memory',reason:error.code === 'unsupported_schema' ? 'unsupported_schema' : 'corrupt',message:error.code === 'unsupported_schema' ? error.message : '裝置收藏無法讀取，原資料已保留。這次修改暫存於記憶體。'};
      }
    }
  }
  const clock = () => { const value = new Date(now()); if (!Number.isFinite(value.getTime())) fail('invalid_clock','無法取得保存時間。'); return value.toISOString(); };
  const snapshot = () => ({...clone(state),sceneCatalog:clone(SCENES),storageStatus:clone(storageStatus),themes:SCENES.filter(s=>s.state==='available').map(s=>({sceneId:s.id,title:s.title,cardCount:state.cards.filter(c=>c.sceneId===s.id).length,cardIds:state.cards.filter(c=>c.sceneId===s.id).map(c=>c.id)}))});
  const notify = () => { for (const listener of listeners) { try { listener(snapshot()); } catch { /* One view must not prevent other subscribers from receiving a change. */ } } };
  const commit = requested => {
    let next=requested;
    if(storage && !writesBlocked){
      let latestRaw;
      try{latestRaw=storage.getItem(STORAGE_KEY);}catch{
        state=next;storageStatus={mode:'memory',reason:'read_failed',message:'目前無法核對裝置收藏，這次修改尚未存入裝置。'};notify();return;
      }
      if(latestRaw!==lastStoredRaw){
        let remote;
        try{remote=latestRaw?readStored(latestRaw):{schemaVersion:SCHEMA_VERSION,cards:[],draft:createDefaultDraft()};}
        catch{state=next;writesBlocked=true;storageStatus={mode:'memory',reason:'external_schema',message:'另一個分頁已更動收藏格式，這次修改未覆寫原資料。'};notify();return;}
        const base=new Map(persistedBase.cards.map(c=>[c.id,c])),local=new Map(next.cards.map(c=>[c.id,c])),merged=new Map(remote.cards.map(c=>[c.id,c]));
        const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
        let conflict=false;
        for(const id of new Set([...base.keys(),...local.keys()])){
          const before=base.get(id),ours=local.get(id),theirs=merged.get(id);
          if(same(before,ours))continue;
          if(!same(before,theirs)&&!same(ours,theirs)){conflict=true;break;}
          if(ours)merged.set(id,ours);else merged.delete(id);
        }
        lastStoredRaw=latestRaw;persistedBase=clone(remote);
        const draft={...next.draft};if(draft.editingCardId&&!merged.has(draft.editingCardId))draft.editingCardId=null;
        if(conflict){
          state={...remote,draft};storageStatus={mode:'persistent',reason:'conflict',message:'這張收藏已在另一個分頁修改，請重新打開後再儲存。'};notify();fail('conflict',storageStatus.message);
        }
        next={...next,cards:[...merged.values()],draft};
      }
    }
    state=next;
    if(storage && !writesBlocked){
      try{const raw=JSON.stringify(state);storage.setItem(STORAGE_KEY,raw);lastStoredRaw=raw;persistedBase=clone(state);storageStatus={mode:'persistent',reason:null,message:''};}
      catch{storageStatus={mode:'memory',reason:'write_failed',message:'裝置空間或儲存權限不足，這次修改尚未存入裝置。'};}
    }
    notify();
  };
  const requireCard = id => { const card=state.cards.find(item=>item.id===id); if (!card) fail('card_not_found','找不到這張紀念卡。'); return card; };
  const newId = () => { for(let attempt=0;attempt<5;attempt++) { const id=idFactory(); if(validId(id) && !state.cards.some(c=>c.id===id)) return id; } fail('id_collision','無法建立新的紀念卡編號。'); };
  const api = {
    getState:snapshot,
    getCard(id) { const card=state.cards.find(item=>item.id===id); return card ? clone(card) : null; },
    setDraft(patch) {
      keysOnly(patch,configKeys);
      const draft={...config(mergeConfig(state.draft,patch)),editingCardId:state.draft.editingCardId};
      commit({...state,draft}); return clone(draft);
    },
    editCard(id) {
      const card=requireCard(id);
      const draft={...config(card),editingCardId:id};
      commit({...state,draft}); return clone(draft);
    },
    resetDraft({sceneId='blue'}={}) {
      const draft={...config(createDefaultDraft(sceneId)),editingCardId:null};
      commit({...state,draft}); return clone(draft);
    },
    startNewDraft({keepCurrent=true}={}) {
      if(typeof keepCurrent !== 'boolean') fail('invalid_input','是否保留目前構圖需為布林值。');
      const draft={...config(keepCurrent ? state.draft:createDefaultDraft()),editingCardId:null};
      commit({...state,draft}); return clone(draft);
    },
    saveCard(options={}) {
      keysOnly(options,['imageId','caption','rawFingerprint']);
      const current=config({...state.draft,...(Object.hasOwn(options,'caption') ? {caption:options.caption}:{})});
      const original=state.draft.editingCardId ? requireCard(state.draft.editingCardId) : null;
      const newImage=Object.hasOwn(options,'imageId') ? reference(options.imageId) : undefined;
      const rawFingerprint=Object.hasOwn(options,'rawFingerprint') ? fingerprint(options.rawFingerprint) : original && visualKey(original)===visualKey(current) && (newImage===undefined || newImage===original.imageId) ? original.rawFingerprint ?? null : null;
      const duplicate=state.cards.find(card=>sameContent(card,current,rawFingerprint) && card.id!==original?.id);
      if (duplicate) {
        if(original) fail('duplicate_card','收藏中已經有相同的紀念卡。',{cardId:duplicate.id});
        return {card:clone(duplicate),created:false,updated:false,duplicate:true,discardImageId:newImage && newImage!==duplicate.imageId ? newImage:null,replacedImageId:null};
      }
      const unchanged=original && sameContent(original,current,rawFingerprint);
      if (unchanged) return {card:clone(original),created:false,updated:false,duplicate:true,discardImageId:newImage && newImage!==original.imageId ? newImage:null,replacedImageId:null};
      const time=clock();
      const imageId=newImage !== undefined ? newImage : original && visualKey(original)===visualKey(current) ? original.imageId : null;
      const card={...current,id:original?.id ?? newId(),createdAt:original?.createdAt ?? time,updatedAt:time,imageId,rawFingerprint};
      const cards=original ? state.cards.map(c=>c.id===card.id ? card:c) : [...state.cards,card];
      commit({...state,cards,draft:{...current,editingCardId:original ? card.id:null}});
      return {card:clone(card),created:!original,updated:!!original,duplicate:false,discardImageId:null,replacedImageId:original?.imageId && original.imageId!==imageId ? original.imageId:null};
    },
    updateCard(id,patch) {
      keysOnly(patch,[...configKeys,'imageId','rawFingerprint']);
      const original=requireCard(id);
      const {imageId:providedImage,rawFingerprint:providedFingerprint,...configuration}=patch;
      const updated=config(mergeConfig(original,configuration));
      const imageId=Object.hasOwn(patch,'imageId') ? reference(providedImage) : visualKey(original)===visualKey(updated) ? original.imageId : null;
      const rawFingerprint=Object.hasOwn(patch,'rawFingerprint') ? fingerprint(providedFingerprint) : visualKey(original)===visualKey(updated) && imageId===original.imageId ? original.rawFingerprint ?? null : null;
      if(state.cards.some(card=>card.id!==id && sameContent(card,updated,rawFingerprint))) fail('duplicate_card','收藏中已經有相同的紀念卡。');
      const card={...updated,id,createdAt:original.createdAt,updatedAt:clock(),imageId,rawFingerprint};
      // A separately edited draft is never silently overwritten by a card-list edit.
      commit({...state,cards:state.cards.map(c=>c.id===id ? card:c)});
      return {card:clone(card),replacedImageId:original.imageId && original.imageId!==imageId ? original.imageId:null};
    },
    deleteCard(id) {
      const card=requireCard(id);
      const previous=clone(state), hadPersistentReference=persistedBase.cards.some(c=>c.id===id);
      const draft=state.draft.editingCardId===id ? {...state.draft,editingCardId:null} : state.draft;
      commit({...state,cards:state.cards.filter(c=>c.id!==id),draft});
      if(hadPersistentReference&&storageStatus.mode==='memory'){state=previous;notify();return {deleted:false,card:clone(card),imageId:card.imageId};}
      return {deleted:true,card:clone(card),imageId:card.imageId};
    },
    subscribe(listener) { if(typeof listener!=='function') fail('invalid_listener','監聽函式格式不正確。'); listeners.add(listener); return ()=>listeners.delete(listener); },
  };
  return Object.freeze(api);
}
