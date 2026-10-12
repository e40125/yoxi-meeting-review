export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'yoxi.city-collection.v1';
export const SCENES = Object.freeze([
  Object.freeze({ id: 'blue', title: '藍色街角', location: '以台南藍晒圖為靈感', description: '轉個角度，看看框架、樹影和旅伴。', state: 'available', contentStatus: 'original-art-prototype', visitClaim: false }),
  Object.freeze({ id: 'bookshop', title: '雨後書店', location: '原創城市場景', description: '推開木窗，陪旅伴讀一會書。', state: 'available', contentStatus: 'original-art-prototype', visitClaim: false }),
  Object.freeze({ id: 'gather', title: '燈下小聚', location: '原創城市場景', description: '', state: 'planned', contentStatus: 'not-built', visitClaim: false }),
]);
export const LIGHTING = Object.freeze([{id:'day',title:'白天'},{id:'sunset',title:'夕陽'},{id:'night',title:'夜晚'}].map(Object.freeze));
export const POSES = Object.freeze([{id:'wave',title:'揮手'},{id:'sit',title:'坐下'},{id:'walk',title:'散步'},{id:'show-bag',title:'展示旅行包'}].map(Object.freeze));
export const PROPS = Object.freeze([{id:'scarf',title:'圍巾'},{id:'camera',title:'相機'},{id:'umbrella',title:'雨傘'}].map(Object.freeze));
export const EQUIPMENT_IDS = Object.freeze({bag:'canvas-travel',badge:'blue-house',bookmark:'leaf'});
export const createEmptyEquipment = () => ({bag:null,badge:null,bookmark:null});
export const CAPTION_MAX_LENGTH = 280;
export function createDefaultDraft(sceneId = 'blue') {
  return { sceneId, view: { yaw: 16.55 }, lightingId: 'day', poseId: 'wave', propId: 'scarf', equipment:createEmptyEquipment(), windowOpen:false, raining:true, caption: '', editingCardId: null };
}
