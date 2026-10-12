import {describeJointBenefit,describeJointFit} from './core/joint-benefit-display.mjs';
import {esc as e} from './city-ui.mjs';

export function renderJointBenefit(benefit,person){
 const b=describeJointBenefit(benefit,person);
 const title=b.type==='supported'?'對應想法':b.type==='partial'?'原本想法與活動資料':'活動資料';
 return `${b.type!=='supported'?`<p class="jp-benefit-status">${e(b.label)}</p>`:''}<p class="jp-benefit-reason">${e(b.reason)}</p>${b.note?`<p class="jp-benefit-note">${e(b.note)}</p>`:''}${b.evidence||b.type==='supported'||b.type==='partial'?`<details class="jp-benefit-detail"><summary>${title}</summary>${b.desire&&b.type!=='alternative'?`<p>「${e(b.desire)}」</p>`:''}${b.evidence?`<p>${e(b.evidence)}</p>`:''}</details>`:''}`;
}

export function renderJointFit(selection,intent,names={}, {adjust=false}={}){
 const fit=describeJointFit(selection,intent);if(!fit.title)return '';
 return `<section class="jp-fit-summary" data-fit="${fit.type}" aria-label="這個安排與原本想法的差別"><p class="jp-fit-title">${e(fit.title)}</p>${fit.entries.map(row=>`<p><strong>${e(names[row.personId]??row.personId)}</strong>${e(row.text)}</p>`).join('')}${adjust?'<button type="button" class="jp-text-button" data-jp="adjust-fit">調整時間或想法</button>':''}</section>`;
}
