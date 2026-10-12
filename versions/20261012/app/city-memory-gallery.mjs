import {createCollectionStore} from './collection-core.mjs';
import {STORAGE_KEY as CARD_KEY} from './collection-data.mjs';
import {createStore,STORAGE_KEY as CITY_KEY} from './core/store.mjs';
import {getImage} from './image-store.mjs';
import {getPhoto} from './core/photo-store.mjs';
import {getPlace} from './data/catalog.mjs';
import {createScenePlaceBridge} from './city-collection-bridge.mjs';
import {buildMemoryGroups,assetKey,resolveMemoryAsset} from './city-memory-gallery-core.mjs';
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
const date=value=>Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'numeric',day:'numeric',timeZone:'Asia/Taipei'}).format(new Date(value)):'';
const unavailableText={missing:'圖片不在這個裝置',damaged:'圖片無法開啟','read-error':'目前無法讀取圖片'};

/** Mount in a place page (placeId) or personal memories page (null). Read-only; dispose before replacing the host page. */
export function mountCityMemoryGallery(container,{placeId=null,cityStore=createStore({seed:false}),collectionStore=null,title='我的紀念',hideEmpty=false,showHeading=true,readCardImage=getImage,readPhoto=getPhoto,probe,windowTarget=globalThis.window}={}){
 if(!container?.replaceChildren)throw new TypeError('需要提供紀念區的容器。');
 let disposed=false,version=0,scheduled=false,model=null,selectedKey=null,trigger=null,dialog=null;
 const assets=new Map(),visibleLimits=new Map();
 const root=node('section','cmg');root.tabIndex=-1;root.setAttribute('aria-label',title);container.replaceChildren(root);
 const heading=node('div','cmg-heading'),h2=node('h2','',title);h2.tabIndex=-1;heading.append(h2);root.append(heading);heading.hidden=!showHeading;
 const status=node('p','cmg-status','正在讀取紀念…');status.setAttribute('role','status');root.append(status);const body=node('div','cmg-groups');root.append(body);
 const bridge=createScenePlaceBridge({store:cityStore});
 function releaseMissing(keys){for(const [key,record]of assets)if(!keys.has(key)){record.retired=true;record.result?.release();assets.delete(key);}}
 function asset(entry){const key=assetKey(entry);if(!assets.has(key)){const record={result:null,retired:false};record.promise=resolveMemoryAsset(entry,{readCardImage,readPhoto,...(probe?{probe}:{})}).then(result=>{if(record.retired||disposed){result.release();return result;}record.result=result;return result;});assets.set(key,record);}return assets.get(key).promise;}
 function entries(){return model?.groups.flatMap(g=>[...g.cards,...g.photos])||[];}
 function fallback(host,entry,reason){host.replaceChildren(node('span','cmg-missing-mark','—'),node('span','cmg-missing-text',unavailableText[reason]||'圖片無法開啟'));host.classList.add('cmg-unavailable');host.setAttribute('aria-label',entry.kind==='card'?'場景紀念卡圖片無法開啟':'自己的照片無法開啟');}
 async function fillImage(host,entry,ticket){const result=await asset(entry);if(disposed||ticket!==version||!host.isConnected)return;if(result.status!=='ready'){fallback(host,entry,result.reason);return;}const img=node('img');img.src=result.url;img.alt=entry.kind==='card'?`${entry.title}場景紀念卡`: `${entry.title}的自己照片`;img.decoding='async';host.replaceChildren(img);host.classList.remove('cmg-unavailable');}
 function sourceLink(entry){const a=node('a','cmg-source-link',entry.kind==='card'?'打開收藏冊':'查看原紀念');a.href=entry.kind==='card'?'index.html#album':'city.html#memory/'+encodeURIComponent(entry.placeId);return a;}
 function closeViewer(){if(dialog?.open)dialog.close();}
 function restoreFocus(){
  if(trigger?.isConnected&&!root.hidden){trigger.focus({preventScroll:true});return;}
  if(root.isConnected&&!root.hidden){(showHeading?h2:root).focus({preventScroll:true});return;}
  const pageHeading=document.querySelector('main h1')||document.querySelector('h1');
  if(pageHeading){pageHeading.tabIndex=-1;pageHeading.focus({preventScroll:true});}
 }
 function ensureDialog(){if(dialog)return;dialog=node('dialog','cmg-dialog');dialog.setAttribute('aria-label','紀念近看');const close=node('button','cmg-close','關閉');close.type='button';close.onclick=closeViewer;const content=node('div','cmg-dialog-content');dialog.append(close,content);document.body.append(dialog);dialog.addEventListener('close',()=>{selectedKey=null;restoreFocus();});}
 function renderViewer(entry){ensureDialog();const content=dialog.querySelector('.cmg-dialog-content');content.replaceChildren();const visual=node('div','cmg-view-image');visual.dataset.kind=entry.kind;const copy=node('div','cmg-view-copy');copy.append(node('p','cmg-type',entry.kind==='card'?'場景紀念卡':'自己的照片'),node('h2','',entry.title));if(entry.caption)copy.append(node('p','cmg-caption',entry.caption));if(entry.kind==='card')copy.append(node('p','cmg-detail',entry.relation==='inspiration'?'以藍晒圖為靈感的原創場景':'原創城市場景'));const saved=date(entry.createdAt);if(saved)copy.append(node('p','cmg-detail','保存於 '+saved));copy.append(sourceLink(entry));content.append(visual,copy);fillImage(visual,entry,version);}
 function openViewer(entry,event){trigger=event.currentTarget;selectedKey=entry.key;renderViewer(entry);if(!dialog.open)dialog.showModal();dialog.querySelector('.cmg-close').focus();}
 function tile(entry,ticket){const item=node('article','cmg-item'),button=node('button','cmg-open');button.type='button';button.setAttribute('aria-label',(entry.kind==='card'?'近看場景紀念卡：':'近看自己的照片：')+entry.title+(entry.caption?'，'+entry.caption.slice(0,60):''));const photo=node('span','cmg-image');photo.dataset.kind=entry.kind;photo.append(node('span','cmg-loading','讀取圖片'));button.append(photo);button.onclick=e=>openViewer(entry,e);item.append(button);if(entry.kind==='card'){const caption=node('p','cmg-tile-caption',entry.caption||entry.title);item.append(caption);}fillImage(photo,entry,ticket);return item;}
 function section(group,kind,items,ticket){const part=node('section','cmg-kind-section');part.append(node('h3','',kind==='card'?'場景紀念卡':'自己的照片'));if(kind==='card')part.append(node('p','cmg-origin',group.kind==='place'?'以這個地點為靈感的原創場景。':'原創城市場景。'));const list=node('div','cmg-grid');list.dataset.kind=kind;const key=group.key+':'+kind,limit=visibleLimits.get(key)||6;for(const entry of items.slice(0,limit))list.append(tile(entry,ticket));part.append(list);if(items.length>limit){const more=node('button','cmg-more',`查看其餘 ${items.length-limit} 張`);more.type='button';more.onclick=()=>{visibleLimits.set(key,items.length);render();};part.append(more);}return part;}
 function render(){if(disposed||!model)return;const ticket=++version;body.replaceChildren();if(!model.available){root.hidden=true;closeViewer();return;}root.hidden=hideEmpty&&!model.groups.length;if(!model.groups.length){status.hidden=false;status.textContent='這裡還沒有自己的紀念。';closeViewer();return;}status.hidden=true;for(const group of model.groups){const wrap=node('section','cmg-place');if(!placeId){const line=node('div','cmg-place-heading');line.append(node('h3','',group.title));if(group.kind==='place'){const link=node('a','cmg-place-link','查看地點');link.href='city.html#place/'+encodeURIComponent(group.placeId);line.append(link);}else line.append(node('span','cmg-original-label','原創場景'));wrap.append(line);}const kinds=node('div','cmg-kind-layout'+(group.cards.length&&group.photos.length?' has-both':''));if(group.cards.length)kinds.append(section(group,'card',group.cards,ticket));if(group.photos.length)kinds.append(section(group,'photo',group.photos,ticket));wrap.append(kinds);for(const note of group.notes){const text=node('p','cmg-note',note.text);if(!group.photos.length){const label=node('h3','cmg-note-label','自己的筆記');wrap.append(label);}wrap.append(text);if(!group.photos.length&&group.placeId)wrap.append(sourceLink({kind:'note',placeId:group.placeId}));}body.append(wrap);}if(selectedKey){const current=entries().find(e=>e.key===selectedKey);if(current)renderViewer(current);else closeViewer();}}
 let sourceRefreshError=null;
 function refreshSource(){const result=cityStore.refresh?.();sourceRefreshError=result?.ok===false?result.error:null;}
 function refresh(){if(disposed)return;for(const [key,record] of assets){if(record.result&&record.result.status!=='ready'){record.retired=true;record.result.release();assets.delete(key);}}const cardsStore=collectionStore||createCollectionStore(),cardState=cardsStore.getState(),cityState=cityStore.getState();model=buildMemoryGroups({cityState,cards:cardState.cards,placeId,placeForScene:bridge.placeFor,getPlace});releaseMissing(new Set(entries().map(assetKey)));render();const sourceError=sourceRefreshError||cityStore.getLoadError?.()||cardState.storageStatus?.reason&&['unavailable','corrupt','read_failed','unsupported_schema','external_schema'].includes(cardState.storageStatus.reason);if(sourceError&&model.available){root.hidden=false;status.hidden=false;status.textContent='部分紀念暫時無法讀取，原資料仍保留。';}}
 function schedule(){if(disposed||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;refresh();});}
 const unsubCity=cityStore.subscribe(schedule),unsubCards=collectionStore?.subscribe(schedule);
 function onStorage(event){if(event.key===CITY_KEY||event.key===null)refreshSource();if([CARD_KEY,CITY_KEY,null].includes(event.key))schedule();}
 function onFocus(){refreshSource();schedule();}
 windowTarget?.addEventListener('storage',onStorage);windowTarget?.addEventListener('focus',onFocus);windowTarget?.addEventListener('pageshow',onFocus);
 refresh();
 return {refresh,dispose(){if(disposed)return;disposed=true;version++;unsubCity?.();unsubCards?.();windowTarget?.removeEventListener('storage',onStorage);windowTarget?.removeEventListener('focus',onFocus);windowTarget?.removeEventListener('pageshow',onFocus);for(const record of assets.values()){record.retired=true;record.result?.release();}assets.clear();if(dialog){dialog.remove();dialog=null;}root.remove();},getModel(){return structuredClone(model);}};
}
