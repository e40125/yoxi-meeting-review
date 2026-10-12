const DB_NAME = 'yoxi-city-collection-images';
let opening;
export function openImages(){
  if (!opening) opening = new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore('images');
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{opening=null;reject(req.error)};
    req.onblocked=()=>{opening=null;reject(new Error('請關閉其他收藏頁面後再試。'))};
  });
  return opening;
}
async function transaction(mode,action){const db=await openImages();return new Promise((resolve,reject)=>{const tx=db.transaction('images',mode);let result;const request=action(tx.objectStore('images'));request.onsuccess=()=>{result=request.result};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('儲存未完成。'));});}
export const putImage=(id,data)=>transaction('readwrite',s=>s.put(data,id));
export const getImage=id=>transaction('readonly',s=>s.get(id));
export const deleteImage=id=>transaction('readwrite',s=>s.delete(id));
