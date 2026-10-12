// Read-only projection of the two existing stores. No ownership, visit or reward is created here.
const dateValue=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
const safeText=value=>typeof value==='string'?value:'';
export function buildMemoryGroups({cityState,cards=[],placeId=null,placeForScene=()=>null,getPlace=()=>null}={}){
 if(cityState?.activeProfileId!=='me')return {available:false,reason:'not-self',groups:[]};
 const groups=new Map();
 function placeGroup(id){const p=getPlace(id);if(!p||p.testData)return null;const key='place:'+id;if(!groups.has(key))groups.set(key,{key,kind:'place',placeId:id,title:p.name,cards:[],photos:[],notes:[]});return groups.get(key);}
 for(const card of cards){
  if(!card||typeof card.id!=='string')continue;
  const link=placeForScene(card.sceneId);let group;
  if(link){if(placeId&&link.placeId!==placeId)continue;group=placeGroup(link.placeId);}
  else{if(placeId)continue;const title=card.sceneId==='bookshop'?'雨後書店':null;if(!title)continue;const key='original:'+card.sceneId;if(!groups.has(key))groups.set(key,{key,kind:'original-scene',placeId:null,title,cards:[],photos:[],notes:[]});group=groups.get(key);}
  if(!group)continue;
  group.cards.push({key:'card:'+card.id,kind:'card',cardId:card.id,sceneId:card.sceneId,placeId:link?.placeId??null,title:card.sceneId==='blue'?'藍色街角':'雨後書店',caption:safeText(card.caption),imageId:typeof card.imageId==='string'?card.imageId:null,createdAt:card.createdAt,updatedAt:card.updatedAt,relation:link?'inspiration':'original',imageRevision:[card.imageId,card.rawFingerprint,card.updatedAt].join('|')});
 }
 for(const memory of cityState.memories||[]){
  if(!memory||typeof memory.id!=='string'||placeId&&memory.placeId!==placeId)continue;
  const photos=Array.isArray(memory.photoBlobIds)?[...new Set(memory.photoBlobIds.filter(x=>typeof x==='string'&&x.length))]:[];
  const note=safeText(memory.note);if(!photos.length&&!note)continue;
  const group=placeGroup(memory.placeId);if(!group)continue;
  if(note)group.notes.push({key:'note:'+memory.id,memoryId:memory.id,placeId:memory.placeId,text:note,updatedAt:memory.updatedAt||memory.createdAt});
  for(const photoId of photos)group.photos.push({key:'photo:'+memory.id+':'+photoId,kind:'photo',photoId,memoryId:memory.id,placeId:memory.placeId,title:group.title,caption:note,createdAt:memory.createdAt,updatedAt:memory.updatedAt,imageRevision:photoId});
 }
 const result=[...groups.values()];
 for(const group of result){group.cards.sort((a,b)=>dateValue(b.createdAt)-dateValue(a.createdAt));group.latestAt=Math.max(0,...[...group.cards,...group.photos,...group.notes].map(x=>dateValue(x.updatedAt||x.createdAt)));}
 result.sort((a,b)=>b.latestAt-a.latestAt||a.title.localeCompare(b.title,'zh-TW'));
 return {available:true,reason:null,groups:result};
}
export const assetKey=entry=>entry.key+'|'+entry.imageRevision;
const dataImage=value=>typeof value==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value);
export function probeBrowserImage(url,{timeout=8000}={}){return new Promise((resolve,reject)=>{const image=new Image();const timer=setTimeout(()=>{image.src='';reject(new Error('image-timeout'));},timeout);image.onload=()=>{clearTimeout(timer);image.naturalWidth&&image.naturalHeight?resolve():reject(new Error('empty-image'));};image.onerror=()=>{clearTimeout(timer);reject(new Error('image-decode'));};image.src=url;});}
export async function resolveMemoryAsset(entry,{readCardImage,readPhoto,probe=probeBrowserImage,createURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url)}={}){
 const unavailable=reason=>({status:'unavailable',reason,url:null,release(){}});
 if(entry.kind==='card'){
  if(!entry.imageId)return unavailable('missing');
  let image;try{image=await readCardImage(entry.imageId);}catch{return unavailable('read-error');}
  if(!image)return unavailable('missing');
  for(const field of ['rendered','raw']){const url=image[field];if(!dataImage(url))continue;try{await probe(url);return {status:'ready',url,source:field,release(){}};}catch{}}
  return unavailable('damaged');
 }
 let photo;try{photo=await readPhoto(entry.photoId);}catch{return unavailable('read-error');}
 if(!photo?.blob)return unavailable('missing');
 if(!(photo.blob instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(photo.blob.type))return unavailable('damaged');
 let url;try{url=createURL(photo.blob);await probe(url);}catch{if(url)revokeURL(url);return unavailable('damaged');}
 let released=false;return {status:'ready',url,source:'own-photo',release(){if(!released){released=true;revokeURL(url);}}};
}
