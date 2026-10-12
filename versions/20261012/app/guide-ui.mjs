import {createGuideSession} from './core/generative-guide-session.mjs';
import {esc as e,icon as i} from './city-ui.mjs';
import {SOURCES} from './data/catalog.mjs';
export function renderGuideAnswer(state){
 const result=state.result;if(!result)return '';
 const refs=[...new Set(result.sourceIds??[])].map(id=>SOURCES.find(s=>s.id===id)).filter(Boolean);
 return `<div class="jp-guide-answer${state.previous?' jp-guide-previous':''}">${state.previous?`<p class="jp-guide-previous-label">上次的回答 · ${e(state.answeredQuestion)}</p>`:''}${result.segments.some(s=>s.answerOrigin==='verified_observation_text'||s.answerRole==='observation')?'<p class="jp-guide-previous-label">可以先這樣觀察；原因尚未確認。</p>':''}${result.segments.map(s=>`<p>${e(s.explanation)}</p>`).join('')}${result.unknown.trim()?`<div class="jp-guide-unknown"><strong>尚無資料確認</strong><p>${e(result.unknown)}</p></div>`:''}${refs.length?`<details class="jp-sources"><summary>回答依據 ${i('plus',15)}</summary>${refs.map(s=>`<p><a href="${e(s.url)}" target="_blank" rel="noreferrer">${e(s.title)}</a><span>${e(s.publisher)}</span></p>`).join('')}</details>`:''}</div>`;
}
export function mountGuide(container,{placeId,sessionState,capabilities,client,onStateChange=()=>{}}={}){
 let disposed=false,cap=capabilities??{status:'loading'},timer;
 container.classList.add('joint-planner','jp-guide');
 container.innerHTML=`<h2>想多知道一點</h2><form class="jp-guide-form"><label class="sr-only" for="jp-guide-question">想問這個地方什麼</label><textarea id="jp-guide-question" name="question" maxlength="1200" rows="2" required placeholder="例如：看這棟建築時，可以注意什麼？"></textarea><div class="jp-guide-actions"><button type="submit" class="jp-button jp-primary">問問 AI ${i('chevron',17)}</button><button type="button" class="jp-text-button" data-guide-cancel hidden>取消</button><span class="jp-guide-elapsed"></span></div></form><div class="jp-guide-status" role="status"></div><div class="jp-guide-response" aria-live="polite"></div>`;
 const form=container.querySelector('form'),input=container.querySelector('textarea'),submit=form.querySelector('[type=submit]'),cancel=form.querySelector('[data-guide-cancel]'),status=container.querySelector('.jp-guide-status'),response=container.querySelector('.jp-guide-response'),elapsed=container.querySelector('.jp-guide-elapsed');
 const session=createGuideSession({placeId,client,sessionState,onChange:update});
 function update(s){if(disposed)return;onStateChange(s);submit.disabled=s.pending||cap.status!=='ready';cancel.hidden=!s.pending;if(input.value!==s.question)input.value=s.question;
  status.innerHTML=s.error?`<p class="jp-error" role="alert">${e(s.error.message)}</p>`:s.pending?`<span class="jp-pulse" aria-hidden="true"></span> ${s.phase==='connecting'?'正在連線…':'正在整理可回答的內容…'}`:s.notice?e(s.notice):cap.preview?'網頁預覽未連接 AI，完整操作請看 Demo 影片。':cap.status==='unavailable'?'AI 暫時無法使用。':'';
  response.innerHTML=renderGuideAnswer(s);tick();
 }
 function tick(){const s=session.getState();elapsed.textContent=s.pending?`已等候 ${Math.floor((Date.now()-s.startedAt)/1000)} 秒`:'';}
 function onInput(){session.setQuestion(input.value);}function onSubmit(ev){ev.preventDefault();ev.stopPropagation();session.setQuestion(input.value);session.run();}function onCancel(){session.cancel();input.focus();}
 input.value=session.getState().question;form.addEventListener('submit',onSubmit);input.addEventListener('input',onInput);cancel.addEventListener('click',onCancel);timer=setInterval(tick,1000);update(session.getState());
 return {getState:session.getState,setCapabilities(value){cap=value;update(session.getState());},dispose(){if(disposed)return;disposed=true;clearInterval(timer);session.dispose();form.removeEventListener('submit',onSubmit);input.removeEventListener('input',onInput);cancel.removeEventListener('click',onCancel);}};
}
