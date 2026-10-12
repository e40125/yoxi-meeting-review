const DB='yoxi-city-photos-polished-v1';
function openDB(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(new Error('這個瀏覽器不支援照片儲存。'));return;}const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('photos',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function transaction(mode,fn){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode);const request=fn(tx.objectStore('photos'));let value;request.onsuccess=()=>value=request.result;tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function savePhoto(file){if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('請選擇JPG、PNG或WebP照片。');if(file.size>8*1024*1024)throw new Error('照片需小於8MB。');const id=`photo-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;await transaction('readwrite',s=>s.put({id,blob:file,name:file.name??'photo',createdAt:new Date().toISOString()}));return id;}
export const getPhoto=id=>transaction('readonly',s=>s.get(id));
export const removePhoto=id=>transaction('readwrite',s=>s.delete(id));
export const clearPhotos=()=>transaction('readwrite',s=>s.clear());
