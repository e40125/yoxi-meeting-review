/** Browser transport and a DOM-free session. No profile/store writes. */
export class GenerativeError extends Error {
 constructor(code,message){super(message);this.name='GenerativeError';this.code=code;}
}
const cancelled=()=>new GenerativeError('cancelled','已取消。');
const abortCheck=signal=>{if(signal?.aborted)throw cancelled();};
export function createGenerativeClient({endpoint='/api/generative',capabilitiesEndpoint='/api/capabilities',fetcher=globalThis.fetch,timeoutMs=48000}={}){
 async function capabilities(){return {status:'unavailable',preview:true};}
 async function request(){throw new GenerativeError('preview_only','網頁預覽未連接 AI，完整操作請看 Demo 影片。');}

 return {capabilities,request};
}
const copy=x=>structuredClone(x);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function validateJointFields(input){
 if(!Array.isArray(input?.people)||input.people.length!==2||new Set(input.people.map(p=>p?.id)).size!==2)return {message:'請提供兩人的想法。'};
 for(const [index,p] of input.people.entries()){
  if(!p||typeof p.text!=='string'||!p.text.trim())return {message:index?'請填寫朋友想做的事。':'請填寫自己想做的事。',personId:p?.id,field:'person',kind:'empty'};
  if(p.text.length>1200)return {message:index?'朋友的內容最多 1200 字。':'自己的內容最多 1200 字。',personId:p.id,field:'person',kind:'length'};
 }
 if(typeof input.sharedText!=='string'||input.sharedText.length>1200)return {message:'共同條件最多 1200 字。',field:'shared'};
 return null;
}
export function validateJointInput(input){return validateJointFields(input)?.message??null;}
export function createJointSession({client=createGenerativeClient(),initialInput,sessionState,onChange=()=>{}}={}){
 const blank={people:[{id:'me',text:''},{id:'friend',text:''}],sharedText:''};
 let s={input:copy(initialInput??blank),acceptedInput:null,result:null,lastOptions:null,pending:false,resultFresh:true,phase:null,pendingIntent:null,elapsedMs:0,startedAt:null,error:null,notice:'',revision:{personId:'me',text:''}};
 if(sessionState){for(const key of ['input','acceptedInput','result','lastOptions','revision','resultFresh'])if(sessionState[key]!==undefined)s[key]=copy(sessionState[key]);}
 if(!s.input.people.some(p=>p.id===s.revision.personId))s.revision.personId=s.input.people[0]?.id;
 let generation=0,controller=null,disposed=false;
 const getState=()=>{const dirty=!s.acceptedInput||!same(s.input,s.acceptedInput);return copy({...s,dirty,displayResult:s.result?.selection?.length?s.result:s.lastOptions,canSelect:s.resultFresh&&!s.pending&&!dirty&&!s.revision.text.trim()&&s.result?.status==='needs_confirmation'&&!!s.result?.selection?.length,canRevise:!s.pending&&!dirty&&!!s.result?.original&&!!s.result?.intent});};
 const emit=()=>{if(!disposed)onChange(getState());};
 function stop(){generation++;controller?.abort();controller=null;s.pending=false;s.pendingIntent=null;s.phase=null;}
 function setInput(input){if(same(input,s.input))return;const wasBusy=s.pending;stop();s.input=copy(input);s.error=null;s.notice=wasBusy?'條件已修改，請重新找。':'';emit();}
 function setRevision(update){if(s.pending)stop();s.revision={...s.revision,...update};s.error=null;s.notice='';emit();}
 function cancel(){if(!s.pending)return;stop();s.notice='已取消。';s.error=null;emit();}
 function restore(){if(!s.acceptedInput)return;stop();s.input=copy(s.acceptedInput);s.resultFresh=true;s.revision.text='';s.notice='';s.error=null;emit();}
 async function run(task='joint'){
  if(disposed||s.pending)return null;
  let input,nextInput=copy(s.input);
  if(task==='joint'){
   const error=validateJointFields(s.input);if(error){s.error={code:'input_invalid',...error};emit();return null;}
   input=copy(s.input);
  }else{
   if(!getState().canRevise){s.error={code:'stale_result',message:'上方條件已變更，請先重新找共同去處。'};emit();return null;}
   const update=copy(s.revision),person=nextInput.people.find(p=>p.id===update.personId);
   if(!person||!update.text.trim()||update.text.length>1200){s.error={code:'input_invalid',message:'請填寫這次要調整的內容，最多 1200 字。'};emit();return null;}
   const combined=person.text+'\n後來調整：'+update.text.trim();
   if(combined.length>1200){s.error={code:'input_invalid',message:'這位的內容已達上限。請在上方整理後重新找。'};emit();return null;}
   person.text=combined;input={previous:copy(s.result),update};
  }
  stop();const id=generation;controller=new AbortController();s.pending=true;s.resultFresh=false;s.startedAt=Date.now();s.elapsedMs=0;s.phase={phase:'connecting'};s.pendingIntent=null;s.error=null;s.notice='';emit();
  try{
   const result=await client.request(task,input,{signal:controller.signal,onProgress:event=>{
    if(disposed||id!==generation||!s.pending)return;
    s.phase=copy(event);s.elapsedMs=event.elapsedMs??s.elapsedMs;if(event.intent)s.pendingIntent=copy(event.intent);emit();
   }});
   if(disposed||id!==generation)return null;
   if(!Array.isArray(result.intent?.people)||!Array.isArray(result.selection)||!['needs_confirmation','clarify','no_match'].includes(result.status))throw new GenerativeError('invalid_response','回覆缺少可核對的雙人安排。');
   if(result.intent.people.length!==s.input.people.length||result.intent.people.some(p=>!s.input.people.some(x=>p.id===x.id)))throw new GenerativeError('invalid_response','回覆中的參與者不一致。');
   s.input=nextInput;s.acceptedInput=copy(nextInput);s.result=copy(result);s.resultFresh=true;if(result.selection.length)s.lastOptions=copy(result);
   s.pending=false;s.pendingIntent=null;s.phase=null;s.error=null;s.revision.text='';s.elapsedMs=Date.now()-s.startedAt;controller=null;emit();return copy(result);
  }catch(error){
   if(disposed||id!==generation)return null;
   s.pending=false;s.pendingIntent=null;s.phase=null;controller=null;s.error=error.code==='cancelled'?null:{code:error.code??'unknown',message:error.message};s.notice=error.code==='cancelled'?'已取消。':'';emit();return null;
  }
 }
 function select(index){const state=getState();if(!state.canSelect)return null;const choice=s.result.selection[index];return choice?copy({selection:choice,plan:choice.plan,input:s.input,intent:s.result.intent,result:s.result}):null;}
 function dispose(){stop();disposed=true;}
 return {getState,setInput,setRevision,cancel,restore,run,select,dispose};
}

// Only called after an explicit click. Merge into the current input, never replace a friend.
export function appendOwnInterests(input,interests){
 if(!Array.isArray(interests)||interests.some(x=>typeof x!=='string'))throw new GenerativeError('interests_invalid','目前無法讀取興趣，請再試一次。');
 const terms=[...new Set(interests.map(x=>x.trim()).filter(Boolean))];
 if(!terms.length)return {input:copy(input),changed:false,message:'目前沒有可帶入的興趣。'};
 const next=copy(input),person=next.people[0],extra='我喜歡'+terms.join('、')+'。';
 if(person.text.includes(extra))return {input:next,changed:false,message:'已包含你的興趣。'};
 const combined=person.text.trim()?person.text+'\n'+extra:extra;
 if(combined.length>1200)return {input:next,changed:false,message:'內容已達上限，請先整理想法。'};
 person.text=combined;return {input:next,changed:true,message:'已帶入你的興趣。'};
}
