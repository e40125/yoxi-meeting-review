import {getPlace} from '../data/catalog.mjs';
import {ok,fail} from './rules.mjs';
export const OFFICIAL_YOXI_URL='https://yoxi.go.link/aG0qg';
export function prepareHandoff({placeId,arrivalTime=null,pickupLabel=null}={}){const p=getPlace(placeId);if(!p||p.testData||!p.address)return fail('destination_unconfirmed','這個活動尚無可確認的地址。');return ok({status:'prepared_not_submitted',placeId,destination:p.name,address:p.address,arrivalTime,pickupLabel,officialURL:OFFICIAL_YOXI_URL,text:`${p.name}\n${p.address}`,notice:'複製目的地後，在yoxi確認上車地點、車資與叫車。'});}
// Preserve the existing focus and selection when a browser supports selection-based copy.
export function copySelectedText(text,doc=globalThis.document){
 if(!doc?.body||typeof doc.execCommand!=='function')return false;
 const previous=doc.activeElement,selection=doc.getSelection?.(),ranges=[];
 if(selection)for(let n=0;n<selection.rangeCount;n++)ranges.push(selection.getRangeAt(n));
 const field=doc.createElement('textarea');field.value=text;field.readOnly=true;
 field.setAttribute('aria-hidden','true');field.tabIndex=-1;
 Object.assign(field.style,{position:'fixed',top:'0',left:'0',width:'1px',height:'1px',opacity:'0'});
 doc.body.appendChild(field);
 try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,text.length);return doc.execCommand('copy')===true;}
 catch{return false;}
 finally{field.remove();previous?.focus?.({preventScroll:true});if(selection){selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}}
}
export async function copyDestination(data,clipboard=globalThis.navigator?.clipboard,doc=globalThis.document){
 const r=prepareHandoff(data);if(!r.ok)return r;
 // Run within the copy button's user gesture; the browser decides whether it permits the copy.
 if(copySelectedText(r.value.text,doc))return r;
 if(!clipboard?.writeText)return fail('clipboard_unavailable','請手動複製目的地。',r.value);
 try{await clipboard.writeText(r.value.text);return r;}
 catch{return fail('clipboard_denied','無法複製，請手動選取目的地。',r.value);}
}
