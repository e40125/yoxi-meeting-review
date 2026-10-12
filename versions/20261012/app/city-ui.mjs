export const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
arrow:'M19 12H5m6-6-6 6 6 6',chevron:'m9 5 7 7-7 7',close:'m6 6 12 12M6 18 18 6',plus:'M12 5v14M5 12h14',check:'m5 12 4 4L19 6',
search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
compass:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Zm-6-4-3 5-5 3 3-5 5-3Z',
people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
star:'m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-5 7-1L12 2Z',
book:'M12 5v16M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Z',
car:'m5 6-2 7v6h3v-3h12v3h3v-6l-2-7H5ZM3 12h18M7 6V4h10v2M6 13v1m12-1v1',
clock:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2',
camera:'M8 5 10 2h4l2 3h5v16H3V5h5Zm8 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
chat:'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L2 21l1.8-6a10 10 0 0 1-.8-4 9 9 0 0 1 18 0Z',
settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2',
share:'M12 16V2m-4 4 4-4 4 4M5 9H3v13h18V9h-2',
image:'M3 3h18v18H3V3Zm0 12 5-5 6 7 3-3 4 5M15 7h.01',
bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
menu:'M4 6h16M4 12h16M4 18h16',
send:'m22 2-7 20-4-9L2 9l20-7Zm0 0L11 13',
info:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 11v6m0-10v.01',
wallet:'M21 8V4H3v16h18V8ZM16 8h6v8h-6V8Z',
calendar:'M4 5h16v17H4V5ZM4 10h16M8 2v6m8-6v6',
map:'m3 4 6-2 6 2 6-2v18l-6 2-6-2-6 2V4Zm6-2v18m6-16v18',
play:'m8 4 13 8-13 8V4',refresh:'M20 8a8 8 0 1 0 1 8M20 3v5h-5',download:'M12 2v14m-5-5 5 5 5-5M3 16v6h18v-6',external:'M14 3h7v7m-1-6L10 14M10 3H3v18h18v-7'};
export const icon=(name,size=22)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;
export const button=(label,action,kind='primary',attrs='')=>`<button class="btn ${kind}" data-action="${action}" ${attrs}>${label}</button>`;
export const money=v=>Number.isFinite(v)?`NT$${Math.round(v).toLocaleString('en-US')}`:'待確認';
export function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');document.querySelector('#live-status').textContent=msg;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove('show'),3500)}
export function modal(title,html){const d=document.querySelector('#modal');d.innerHTML=`<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="關閉">${icon('close')}</button></div><div class="modal-body">${html}</div>`;if(!d.open){d.showModal();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.animate([{opacity:0,transform:'translateY(10px) scale(.99)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)'});}d.onclick=ev=>{if(ev.target!==d)return;const r=d.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)d.close();};}
export const dateText=v=>new Date(v).toLocaleString('zh-TW',{month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
