// Deterministic hard constraints are checked against facts before semantic ranking.
// This is deliberately not a general language understanding model.
import {REQUESTED_FEATURES} from './retrieval-policy.mjs';
export const normalizeText = value => String(value ?? '').normalize('NFKC').replaceAll('臺','台').replaceAll('免费','免費').toLowerCase();
const unique = values => [...new Set(values)];
const negativePrefix = /(?:不想|不要|不是|不去|不能|不接受|不考慮|排除|避免|不喜歡)(?:再|只|找|去|在|是|有|選|的|待在|選擇|參加|需要|地方){0,5}$/;
const optionalPrefix = /(?:不一定|不必|不用|不需要|無須|不限|不限定|不要求)(?:要|是|有|找|去|選|在|的|都){0,4}$/;
function mentions(text, re) {
  return [...text.matchAll(new RegExp(re.source,'g'))].map(m=>{
    const before=text.slice(Math.max(0,m.index-16),m.index).split(/[，,。;；！？!?]/).at(-1);
    const after=text.slice(m.index+m[0].length,m.index+m[0].length+12);
    const doubleNegative=before.match(/(?:不是|並非|沒有說)(?:不想|不要|不能|不去|不接受|不考慮|不喜歡)(?:再|只|找|去|在|是|有|選|的|待在|選擇|參加|需要|地方){0,5}$/);
    const negative=doubleNegative?null:before.match(negativePrefix),optional=doubleNegative??before.match(optionalPrefix),optionalSuffix=after.match(/^(?:最好|優先|也可以|也行|都可|不拘)/);
    return {value:m[0],index:m.index,end:m.index+m[0].length,negative:!!negative,optional:!!optional||!!optionalSuffix,ignoredStart:m.index-(negative?.[0].length??optional?.[0].length??0),ignoredEnd:m.index+m[0].length+(optionalSuffix?.[0].length??0)};
  });
}
// Remove the negated/optional occurrence, not the first matching word elsewhere.
// These terms must not pull the semantic scope towards an expressly unwanted service.
function removeUnrequestedMentions(text,pattern) {
  const ignored=mentions(text,pattern).filter(m=>m.negative||m.optional).sort((a,b)=>b.ignoredStart-a.ignoredStart);
  for(const m of ignored)text=text.slice(0,m.ignoredStart)+' '+text.slice(m.ignoredEnd);
  return text;
}
const activityPatterns=[
 {tag:'看展',re:/看展|逛展|展覽|展館/},
 {tag:'攝影',re:/攝影|拍照|拍照片|拍幾張照片/},
 {tag:'文學',re:/文學|作家的故事/},
 {tag:'藝術',re:/藝術展|畫作|雕塑|美術展|美術館/},
 {tag:'合菜',re:/合菜|一起點一桌菜/},
];
export function extractConstraints(input={}) {
  const query=normalizeText(input.query ?? input.text ?? '');
  const errors=[]; const notes=[];
  let queryForMeaning=query;
  let budget=input.budget===null||input.budget===undefined||input.budget==='' ? null : Number(input.budget);
  if(budget!==null&&(!Number.isFinite(budget)||budget<0)) {errors.push('預算需為0或正數'); budget=null;}
  // An explicit later opening of both settings cancels earlier setting restrictions.
  // Keep all activity/budget text; only setting mentions before that opening are superseded.
  const openSetting=/室內(?:或|和|跟|、)?(?:戶外|室外)(?:都)?(?:可以|可|行|不拘)|(?:戶外|室外)(?:或|和|跟|、)?室內(?:都)?(?:可以|可|行|不拘)|室內外(?:都)?(?:可以|可|行|不拘)|不限(?:室內外|室內|戶外|室外)/g;
  const openings=[...query.matchAll(openSetting)].filter(m=>!/(?:不是|並非|不代表)$/.test(query.slice(Math.max(0,m.index-4),m.index)));
  const resetAt=openings.length?openings.at(-1).index+openings.at(-1)[0].length:0;
  let work=query;for(const m of [...openings].reverse())work=work.slice(0,m.index)+' '.repeat(m[0].length)+work.slice(m.index+m[0].length);
  queryForMeaning=work;
  const settings=[];
  for(const mention of mentions(work,/室內|戶外|室外/)) {
    if(mention.optional||mention.index<resetAt)continue;
    const type=mention.value==='室內'?'indoor':'outdoor';
    settings.push(mention.negative ? (type==='indoor'?'outdoor':'indoor') : type);
  }
  const apiSetting=input.setting ?? input.environment;
  if(apiSetting!==undefined&&apiSetting!==null&&apiSetting!=='any') {
    const value={'室內':'indoor','戶外':'outdoor','室外':'outdoor',indoor:'indoor',outdoor:'outdoor'}[apiSetting];
    if(value)settings.push(value); else errors.push('室內外條件不正確');
  }
  const freePhrases=/(?:不用|不必|不要|不需|不需要)(?:再)?(?:花錢|付錢|花|付|買|支付)?(?:買)?(?:門票|入場費)(?:錢)?|免(?:收)?(?:門票|入場費)|無(?:需)?(?:門票|入場費)|不花錢|不用花錢|不想花錢|零元|(?<![\d.])0元/g;
  const directFree=[...work.matchAll(freePhrases)].length>0;
  const freeWord=mentions(work,/免費/).some(m=>!m.negative&&!m.optional);
  const acceptsPayment=/付費(?:的)?也(?:可以|行|可)|收費(?:的)?也(?:可以|行|可)|門票(?:費用)?不(?:限|拘)/.test(work);
  const freeOnly=input.freeOnly===true || (directFree || freeWord) && !acceptsPayment;
  if(freeOnly)budget=budget===null?0:Math.min(0,budget);
  const budgetPatterns=[/(?:(?:門票|入場費|票價|費用)\s*)?(?:預算|最多|(?:不(?:要|能|得|可)?|別)(?:超過|高於)|上限|以內|至多)\s*(?:新台幣|nt\$|\$)?\s*(\d+(?:\.\d+)?)\s*(?:元|塊)?/g,/(\d+(?:\.\d+)?)\s*(?:元|塊)\s*(?:以內|以下|內)/g];
  for(const re of budgetPatterns)for(const m of work.matchAll(re)){
    const before=work.slice(Math.max(0,m.index-16),m.index).split(/[，,。;；！？!?]/).at(-1),after=work.slice(m.index+m[0].length,m.index+m[0].length+12);
    queryForMeaning=queryForMeaning.replace(m[0],'');
    if(optionalPrefix.test(before)||negativePrefix.test(before)||/^(?:最好|優先|也可以|也行|都可|不拘)/.test(after))continue;
    const amount=Number(m[1]);budget=budget===null?amount:Math.min(budget,amount);
  }
  const mustInclude=Array.isArray(input.mustInclude)?input.mustInclude.map(String):[];
  if(input.mustInclude!==undefined&&!Array.isArray(input.mustInclude))errors.push('必要體驗需為清單');
  const parsedActivities=[];
  for(const feature of activityPatterns) {
    const found=mentions(work,feature.re);
    if(found.some(m=>!m.negative&&!m.optional))parsedActivities.push(feature.tag);
    queryForMeaning=removeUnrequestedMentions(queryForMeaning,feature.re);
  }
  // Explicit alternatives stay alternatives. Other concrete requested activities are all required.
  const anyActivities=/(?:看展|逛展|攝影|拍照|文學|合菜)\s*(?:或|或者|還是)\s*(?:看展|逛展|攝影|拍照|文學|合菜)/.test(work)?parsedActivities:[];
  if(!anyActivities.length)mustInclude.push(...parsedActivities);
  for(const tag of mustInclude)if(tag==='室內')settings.push('indoor');else if(tag==='戶外'||tag==='室外')settings.push('outdoor');
  const requiredSettings=unique(settings);
  // Two settings can be supported by different areas, but a single tag never proves both.
  queryForMeaning=queryForMeaning.replace(freePhrases,'').replace(/(?:不想|不要|不去|不一定|不必|不用|不需要)?(?:要|找|去|待在|在|有|是|的)*(?:室內|戶外|室外|免費)(?:的)?/g,'').replace(/(?:預算|最多|不超過|上限)?\s*\d+(?:\.\d+)?\s*(?:元|塊)(?:以內|以下|內)?/g,'');
  for(const feature of REQUESTED_FEATURES)queryForMeaning=removeUnrequestedMentions(queryForMeaning,feature.re);
  const filler=/我們|我|朋友|一起|想要|想|要|找|去哪|去處|去|一個|一些|可以|方便|適合|地方|地點|哪裡|有沒有|推薦|比較|的|而且|並且|且|或者|還是|或|跟|和|也|只|就|希望|今天|這次|時間|隨便|[,，、。；;!！?？\s]/g;
  const remainder=queryForMeaning.replace(filler,'');
  const conditionsOnly=(freeOnly||budget!==null||requiredSettings.length>0||mustInclude.length>0)&&remainder.length===0;
  let uncovered=queryForMeaning;
  for(const activity of activityPatterns)uncovered=uncovered.replace(new RegExp(activity.re.source,'g'),'');
  uncovered=uncovered.replace(filler,'');
  // A fully understood request is supported by the already-filtered catalog facts.
  // Unknown residual requests still go through semantic scope/unsupported-feature checks.
  const constraintsCoverQuery=(conditionsOnly||parsedActivities.length>0)&&uncovered.length===0;
  return {query,queryForMeaning,conditionsOnly,constraintsCoverQuery,uncoveredMeaning:uncovered,errors,notes,criteria:{...input,budget,freeOnly,requiredSettings,mustInclude:unique(mustInclude.filter(t=>!['室內','戶外','室外'].includes(t))),anyInclude:unique([...(Array.isArray(input.anyInclude)?input.anyInclude:[]),...anyActivities]),includeTestData:input.includeTestData===true},extracted:{freeOnly,budget,requiredSettings,requiredActivities:unique(parsedActivities),budgetScope:'已知必要入場費；不含交通與自行消費'}};
}
export function matchHardConstraints(place,resolved) {
  const {criteria}=resolved;const reasons=[];
  if(resolved.errors.length)return [...resolved.errors];
  if(criteria.city&&normalizeText(place.city)!==normalizeText(criteria.city))reasons.push('不在選定城市');
  const tags=place.tags??[];
  const settings=place.settings??tags.flatMap(t=>t==='室內'?['indoor']:['戶外','室外'].includes(t)?['outdoor']:[]);
  if(criteria.requiredSettings.some(setting=>!settings.includes(setting)))reasons.push('沒有確認符合需要的室內外空間');
  if(criteria.mustInclude.some(tag=>!tags.includes(tag)))reasons.push('沒有全部需要的體驗');
  if(criteria.anyInclude.length&&!criteria.anyInclude.some(tag=>tags.includes(tag)))reasons.push('沒有需要的體驗選項');
  // A venue having indoor space and a photography tag does not establish indoor photography.
  // Every requested activity needs an actual content step in the required environment.
  if(criteria.requiredSettings.length && criteria.requiredSettings.every(setting=>settings.includes(setting))) {
    const eligible=(place.experiences??[]).filter(step=>criteria.requiredSettings.every(setting=>step.settings?.includes(setting)));
    if(!eligible.length)reasons.push('沒有確認在指定空間可做的體驗');
    else if(criteria.mustInclude.some(tag=>!eligible.some(step=>step.tags?.includes(tag))) || (criteria.anyInclude.length&&!criteria.anyInclude.some(tag=>eligible.some(step=>step.tags?.includes(tag)))))reasons.push('沒有確認能在指定空間完成需要的體驗');
  }
  const requiredFees=(place.fees??[]).filter(f=>f.required!==false);
  const known=requiredFees.filter(f=>Number.isFinite(f.amount)).reduce((sum,f)=>sum+f.amount,0);
  if(criteria.budget!==null) {
    if(!requiredFees.length||requiredFees.some(f=>!Number.isFinite(f.amount)||!['verified','example'].includes(f.status)))reasons.push('必要費用尚未確認，無法確認符合預算');
    if(known>criteria.budget)reasons.push('已知費用超過預算');
  }
  if(Array.isArray(criteria.mustExclude)&&criteria.mustExclude.some(tag=>tags.includes(tag)))reasons.push('包含不希望的體驗');
  return reasons;
}
export function requestedFeatureIsPositive(query,pattern) {return mentions(normalizeText(query),pattern).some(m=>!m.negative&&!m.optional);}
