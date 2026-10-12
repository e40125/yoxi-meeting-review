import {createGenerativeClient,GenerativeError} from './generative-client.mjs';
const copy=value=>structuredClone(value);
export function createGuideSession({placeId,client=createGenerativeClient(),sessionState,onChange=()=>{}}={}){
 let state={question:'',answeredQuestion:'',result:null,resultFresh:true,pending:false,startedAt:null,elapsedMs:0,phase:null,error:null,notice:''};
 if(sessionState)for(const key of ['question','answeredQuestion','result','resultFresh'])if(sessionState[key]!==undefined)state[key]=copy(sessionState[key]);
 let controller=null,generation=0,disposed=false;
 const getState=()=>copy({...state,previous:!!state.result&&(!state.resultFresh||state.question!==state.answeredQuestion||state.pending||!!state.error||!!state.notice)});
 const emit=()=>{if(!disposed)onChange(getState());};
 function stop(){generation++;controller?.abort();controller=null;state.pending=false;state.phase=null;}
 function setQuestion(question){if(question===state.question)return;const wasPending=state.pending;stop();state.question=question;state.error=null;state.notice=wasPending?'問題已修改。':'';emit();}
 function cancel(){if(!state.pending)return;stop();state.notice='已取消。';state.error=null;emit();}
 async function run(){
  if(disposed||state.pending)return null;
  if(!state.question.trim()||state.question.length>1200){state.error={code:'invalid_question',message:'請寫下問題，最多 1200 字。'};emit();return null;}
  stop();const id=generation,question=state.question;controller=new AbortController();state.pending=true;state.resultFresh=false;state.startedAt=Date.now();state.elapsedMs=0;state.phase='connecting';state.error=null;state.notice='';emit();
  try{
   const previous=state.result?{question:state.answeredQuestion,segments:state.result.segments,unknown:state.result.unknown}:null;
   const result=await client.request('guide',{placeId,question,previous},{signal:controller.signal,onProgress:event=>{if(disposed||id!==generation)return;state.phase=event.phase;state.elapsedMs=event.elapsedMs??state.elapsedMs;emit();}});
   if(disposed||id!==generation)return null;
   if(!['answered','partial','unknown'].includes(result.status)||!Array.isArray(result.segments)||result.segments.some(s=>typeof s?.explanation!=='string'||typeof s?.factId!=='string')||typeof result.unknown!=='string'||!Array.isArray(result.sourceIds))throw new GenerativeError('invalid_response','回覆內容不完整，請再試一次。');
   state.result=copy(result);state.resultFresh=true;state.answeredQuestion=question;state.pending=false;state.phase=null;state.elapsedMs=Date.now()-state.startedAt;controller=null;emit();return copy(result);
  }catch(error){if(disposed||id!==generation)return null;state.pending=false;state.phase=null;controller=null;state.error=error.code==='cancelled'?null:{code:error.code??'unknown',message:error.message};state.notice=error.code==='cancelled'?'已取消。':'';emit();return null;}
 }
 function dispose(){stop();disposed=true;}
 return {getState,setQuestion,cancel,run,dispose};
}
