import {getPlace} from '../data/catalog.mjs';
import {searchPlaces,ok,fail} from './rules.mjs';

// These are explicit selections or text, never inferred from saved places or play.
export const MAX_PREFERENCE_TERMS=10;
export function parsePreferenceTerms(selected=[],text='') {
 if(!Array.isArray(selected)||selected.some(x=>typeof x!=='string')||typeof text!=='string')return fail('preferences_invalid','請選擇或輸入想做的事。',{field:'other'});
 const terms=[...new Set([...selected,...text.split(/[、，,；;\n]+/)].map(x=>x.trim()).filter(Boolean))];
 if(terms.length>MAX_PREFERENCE_TERMS)return fail('preferences_too_many','每個地點最多記下 10 項想做的事。',{field:'other'});
 if(terms.some(x=>x.length>40))return fail('preferences_too_long','每項最多 40 個字，請用頓號分開。',{field:'other'});
 return ok(terms);
}
export function isConfirmedPreference(value) {
 return Boolean(value&&value.version===1&&value.confirmedBy==='me'&&Number.isFinite(Date.parse(value.confirmedAt))&&Number.isInteger(value.revision)&&value.revision>0&&Array.isArray(value.terms)&&value.terms.length<=MAX_PREFERENCE_TERMS&&value.terms.every(x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=40)&&new Set(value.terms).size===value.terms.length);
}
export function getConfirmedPlaceTerms(collection) {
 return isConfirmedPreference(collection?.confirmedPreferences)?[...collection.confirmedPreferences.terms]:[];
}
export const SETTINGS_CONSENTS=['useCollections','invitationNotifications','nearbyNotifications','publicInterests','publicArea'];
// Bind settings submissions to the values actually shown, even after the store refreshed.
export function profileSettingsSnapshot(profile) {
 return JSON.stringify([profile.displayName,profile.interests,profile.interestsConfirmation??null,SETTINGS_CONSENTS.map(k=>profile.consents[k])]);
}
export function getConfirmedProfileInterests(profile) {
 const c=profile?.interestsConfirmation,terms=profile?.interests;
 return c?.version===1&&c.confirmedBy==='me'&&Number.isFinite(Date.parse(c.confirmedAt))&&Number.isInteger(c.revision)&&c.revision>0&&Array.isArray(terms)&&terms.length<=20&&terms.every(x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=40)&&new Set(terms).size===terms.length&&JSON.stringify(c.terms)===JSON.stringify(terms)?[...terms]:[];
}
export function getExplorationPreferences(state) {
 if(state?.activeProfileId!=='me')return {interests:[],collectionTerms:[],sources:[]};
 const profile=getConfirmedProfileInterests(state.profile);
 const sources=state.profile?.consents?.useCollections===true?(state.collections||[]).filter(c=>getPlace(c.placeId)&&!getPlace(c.placeId).testData).flatMap(c=>{
  const terms=getConfirmedPlaceTerms(c);return terms.length?[{placeId:c.placeId,terms}]:[];
 }):[];
 const collectionTerms=[...new Set(sources.flatMap(x=>x.terms))];
 return {interests:[...new Set([...profile,...collectionTerms])],collectionTerms,sources};
}
const aliases={'拍照':'攝影','拍照片':'攝影','逛展':'看展','展覽':'看展','地方的故事':'地方故事'};
const canonical=x=>aliases[x]||x;
const matches=(place,terms)=>[...new Set(terms.map(canonical))].filter(t=>place.tags.includes(t));
export function rankExplorationPlaces(state,{query='',filter='',candidatePlaceIds=null}={}) {
 const preferences=getExplorationPreferences(state);
 // Keep this request's hard conditions and relevance ahead of remembered interests.
 // An AI response supplies candidates only; turning consent off reranks the same candidates.
 const candidates=searchPlaces({city:state.profile.city,query,mustInclude:filter?[filter]:[]}).places.filter(p=>!p.testData);
 const order=candidatePlaceIds===null?null:new Map(candidatePlaceIds.map((id,index)=>[id,index]));
 return candidates.filter(p=>!order||order.has(p.id)).map((p,index)=>({...p,
  preferenceMatches:matches(p,preferences.interests),confirmedMatches:matches(p,preferences.collectionTerms),
  preferenceOrder:order?order.get(p.id):index
 })).sort((a,b)=>b.score-a.score||b.preferenceMatches.length-a.preferenceMatches.length||a.preferenceOrder-b.preferenceOrder);
}
