// Display only the correspondence explicitly established by the current contract.
// Legacy records stay readable without upgrading their old reasons to verified matches.
export function describeJointBenefit(benefit,person){
 const reason=typeof benefit?.reason==='string'?benefit.reason:'';
 const index=benefit?.desireIndex;
 const indexed=Number.isInteger(index)&&index>=0?person?.desires?.[index]:null;
 const exact=typeof indexed==='string'&&indexed.trim()&&benefit?.desireText===indexed;
 const matched=['supported','partial','alternative'].includes(benefit?.matchType)&&exact;
 const type=matched?benefit.matchType:'general';
 const desire=matched?indexed:null;
 return {
  type,reason,desire,
  label:({supported:'對應想法',partial:'部分符合',alternative:'替代安排',general:'可做的事'})[type],
  note:type==='alternative'?`「${desire}」尚無資料確認。`:'',
  evidence:typeof benefit?.evidence?.text==='string'?benefit.evidence.text:'',
 };
}

export function visibleJointChanges(changes=[]){
 return changes.filter(change=>JSON.stringify(change.before)!==JSON.stringify(change.after));
}

// Overall suitability is supplied by the planner, not inferred from one benefit.
export function describeJointFit(selection,intent){
 const type=['supported','partial','alternative'].includes(selection?.fitStatus)?selection.fitStatus:'unknown';
 const entries=type==='unknown'?[]:(Array.isArray(selection.desireCoverage)?selection.desireCoverage:[]).filter(item=>{
  if(!item)return false;
  const person=intent?.people?.find(p=>p.id===item.personId);
  return ['partial','alternative','not_in_plan'].includes(item.status)&&Number.isInteger(item.desireIndex)&&person?.desires?.[item.desireIndex]===item.desireText;
 }).map(item=>{
  const details=[...new Set((Array.isArray(item.unverifiedDetails)?item.unverifiedDetails:[]).filter(x=>typeof x==='string'))];
  const outcome=item.status==='not_in_plan'?'這次未安排':item.status==='alternative'?'尚無符合的活動資料':'只符合一部分';
  const detailText=details.length?`；${details.join('、')}尚未確認`:'';
  return {personId:item.personId,desireIndex:item.desireIndex,desire:item.desireText,details,text:`「${item.desireText}」${outcome}${detailText}。`};
 });
 return {type,title:({alternative:'其他可考慮的安排',partial:'只符合部分想法'})[type]??'',entries};
}
export function jointResultsTitle(selections=[]){
 const types=selections.map(s=>s.fitStatus);
 if(types.length&&types.every(t=>t==='supported'))return types.length===1?'可以一起去這裡':'這幾處都能一起安排';
 if(types.length&&types.every(t=>t==='alternative'))return '可考慮的其他安排';
 if(types.length&&types.every(t=>t==='partial'))return '有部分符合的安排';
 return '找到的共同去處';
}
export function remainingJointUnknowns(selection,intent){
 const covered=new Set(describeJointFit(selection,intent).entries.flatMap(row=>row.details.map(detail=>JSON.stringify([row.personId,detail]))));
 return (selection.unverifiedPreferences??[]).filter(u=>!covered.has(JSON.stringify([u.personId,u.detail])));
}
