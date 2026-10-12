import {describeJointBenefit,describeJointFit,remainingJointUnknowns} from './joint-benefit-display.mjs';
import {buildSitePlan,ok,fail} from './rules.mjs';
const clone=value=>structuredClone(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const comparable=p=>({placeId:p.placeId,siteMinutes:p.siteMinutes,budget:p.budget,totalMinutes:p.totalMinutes,knownCost:p.knownCost,unknownCostItems:p.unknownCostItems,steps:p.steps,sourceRefs:p.sourceRefs});
export function plansAgree(a,b){return Boolean(a&&b&&same(comparable(a),comparable(b)));}
const recipeFields=p=>({placeId:p?.placeId,siteMinutes:p?.siteMinutes,budget:p?.budget??null,interests:p?.interests??[],mustInclude:p?.mustInclude??[],setting:p?.setting??null});
export function validateJointContext(context,plan,{planInput,checkCatalog=true}={}){
 const invalid=message=>fail('joint_context_invalid',message);
 if(!context||context.version!==1||!Array.isArray(context.input?.people)||context.input.people.length!==2||!Array.isArray(context.intent?.people)||context.intent.people.length!==2||!context.selection?.plan||!context.planInput)return invalid('共同安排的條件不完整，請回去重新選擇。');
 const ids=context.input.people.map(p=>p?.id),intentIds=context.intent.people.map(p=>p?.id);
 if(new Set(ids).size!==2||new Set(intentIds).size!==2||context.input.people.some(p=>!p||typeof p.id!=='string'||typeof p.text!=='string'||!p.text.trim()||p.text.length>1200)||typeof context.input.sharedText!=='string'||context.input.sharedText.length>1200||intentIds.some(id=>!ids.includes(id)))return invalid('兩人的條件不完整，請回去重新選擇。');
 if(!plan||!Array.isArray(plan.steps)||plan.steps.some(s=>!s||typeof s.title!=='string'||typeof s.detail!=='string'||!Number.isInteger(s.minutes))||!Array.isArray(plan.unknownCostItems)||plan.unknownCostItems.some(x=>typeof x!=='string')||!Array.isArray(context.selection.sourceIds)||context.selection.sourceIds.some(x=>typeof x!=='string'))return invalid('安排步驟或來源不完整，請重新安排。');
 const benefits=context.selection.benefits;
 if(!Array.isArray(benefits)||benefits.length!==2||new Set(benefits.map(b=>b?.personId)).size!==2||benefits.some(b=>!b||!ids.includes(b.personId)||typeof b.reason!=='string')||context.intent.people.some(p=>!Array.isArray(p.desires)||p.desires.some(d=>typeof d!=='string')||!['any','indoor','outdoor'].includes(p.setting)||!['site','total','unknown'].includes(p.timeScope)||p.minutes!==null&&(!Number.isInteger(p.minutes)||p.minutes<1||p.minutes>720)||p.budget!==null&&(!Number.isFinite(p.budget)||p.budget<0)||['requiredTags','preferredTags','avoidTags','unverifiedNeeds'].some(k=>!Array.isArray(p[k])||p[k].some(x=>typeof x!=='string'))))return invalid('兩人的安排說明不完整，請重新安排。');
 if(context.selection.unverifiedPreferences!==undefined&&(!Array.isArray(context.selection.unverifiedPreferences)||context.selection.unverifiedPreferences.some(u=>!u||!ids.includes(u.personId)||typeof u.detail!=='string')))return invalid('待確認事項格式不完整，請重新安排。');
 if(!context.previous||context.previous.status!=='needs_confirmation'||!same(context.previous.intent,context.intent)||!same(context.previous.selection,[context.selection]))return invalid('原安排紀錄不完整，請回去重新選擇。');
 const rebuilt=checkCatalog?buildSitePlan(context.planInput):null;
 if(checkCatalog&&(!rebuilt.ok||!plansAgree(rebuilt.value,plan))||!plansAgree(plan,context.selection.plan)||!same(recipeFields(context.planInput),recipeFields(context.selection.plan.planInput))||planInput&&!same(recipeFields(planInput),recipeFields(context.planInput)))return fail('joint_plan_changed','地點資料或安排已變動，請回去重新安排後再確認。');
 if(JSON.stringify(context).length>100000)return fail('joint_context_large','這份安排內容過長，請回去整理後再確認。');
 return ok(clone(context));
}
export function prepareJointHandoff(bundle,{displayNames={me:'我',friend:'朋友'},confirmedAt=new Date().toISOString()}={}){
 if(!bundle?.selection||bundle.result?.status!=='needs_confirmation')return fail('joint_missing','請先選擇這次的共同安排。');
 const {selection,input,intent,result}=bundle,recipe=selection.plan?.planInput;
 if(!recipe)return fail('joint_recipe_missing','這份舊結果缺少完整安排條件，請回去重新找一次。');
 const rebuilt=buildSitePlan(recipe);if(!rebuilt.ok)return rebuilt;
 if(!plansAgree(rebuilt.value,selection.plan))return fail('joint_plan_changed','地點資料或安排已變動，請回去重新安排後再確認。');
 const context={version:1,input:clone(input),intent:clone(intent),selection:clone(selection),planInput:clone(recipe),displayNames:clone(displayNames),confirmedAt,
  previous:{original:clone(result.original),intent:clone(intent),selection:[clone(selection)],status:result.status,questions:clone(result.questions??[]),catalogPlaceCount:result.catalogPlaceCount,sourceIds:clone(result.sourceIds??[]),mode:result.mode,provider:result.provider,model:result.model,outputKind:result.outputKind,externalBooking:false},
  provenance:{mode:result.mode,provider:result.provider,model:result.model,outputKind:result.outputKind,sourceIds:clone(selection.sourceIds??[])}};
 const valid=validateJointContext(context,rebuilt.value);if(!valid.ok)return valid;
 return ok({planInput:clone(recipe),plan:rebuilt.value,jointContext:context});
}
export function restoreJointSession(context){return {input:clone(context.input),acceptedInput:clone(context.input),result:clone(context.previous),lastOptions:clone(context.previous),resultFresh:true,revision:{personId:context.input.people[0].id,text:''}};}
export function invitationPlanDefaults(plan,{startAt}={}){
 const minutes=plan?.totalMinutes??90;
 if(!Number.isInteger(minutes)||minutes<1||minutes>720||!Number.isFinite(Date.parse(startAt)))return fail('invitation_plan_invalid','安排的時間不完整，請重新確認。');
 return ok({endAt:new Date(Date.parse(startAt)+minutes*60000).toISOString(),minutes,costLabel:plan?'已知入場費用':'活動費用',costAmount:plan?.knownCost??null,costBasis:plan?'per_person':'shared',unknownCostItems:(plan?.unknownCostItems??[]).filter(x=>x!=='交通')});
}
export function jointInviteDescription(context){if(!context)return '';const names=context.displayNames??{};const lines=context.selection.benefits.map(b=>{const view=describeJointBenefit(b,context.intent.people.find(p=>p.id===b.personId));return (names[b.personId]??b.personId)+'（'+(view.type==='supported'?'安排':view.label)+'）：'+view.reason+(view.note?' '+view.note:'');});const fit=describeJointFit(context.selection,context.intent);if(fit.title)lines.unshift(fit.title,...fit.entries.map(row=>(names[row.personId]??row.personId)+'：'+row.text));if(context.selection.tradeoff&&!context.selection.tradeoffBasis)lines.push('需確認：'+context.selection.tradeoff);if(context.selection.tradeoffBasis)for(const step of context.selection.plan.steps.filter(s=>s.requiresConfirmation))lines.push(step.title+'：當期內容與開放情況需再確認。');for(const u of remainingJointUnknowns(context.selection,context.intent))lines.push((names[u.personId]??u.personId)+'的「'+u.detail+'」尚無資料確認。');return lines.join('\n');}
