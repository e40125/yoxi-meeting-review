import {PLACES,SOURCES} from '../data/catalog.mjs';
import {searchPlaces,ok,fail} from './rules.mjs';
export function createAIGateway({endpoint='/api/ai',fetcher=globalThis.fetch,timeout=20000}={}) {
 const unavailable=()=>fail('ai_unavailable','網頁預覽未連接 AI。你仍可自行選條件與安排，AI 操作請看 Demo 影片。');
 async function getCapabilities(){return {mode:'static_preview',tasks:[],generative:{status:'unavailable',preview:true}};}
 async function request(task,input){
  if(task!=='recommend')return unavailable();
  const result=searchPlaces(input);
  return ok({mode:'rules',placeIds:result.places.map(p=>p.id),items:result.places.map(p=>({placeId:p.id,reason:p.reasons.join('；')})),sourceIds:[],summary:'目前沒有符合已收錄條件的地點。'});
 }

 return {getCapabilities,request,extractPlaces:input=>request('extract',input),recommend:input=>request('recommend',input),plan:input=>request('plan',input),askGuide:input=>request('guide',input),hint:input=>request('hint',input)};
}
