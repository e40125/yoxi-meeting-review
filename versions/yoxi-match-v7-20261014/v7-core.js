'use strict';
(() => {
 const defaults=()=>({period:'oct',outfit:'bag',arrived:false,unlocked:['scarf','bag','badge'],scores:{},runs:[],savedPlace:false,board:'friends',boardMetric:'run',runOrigin:'run'});
 function data(){if(!state.v7||typeof state.v7!=='object')state.v7=defaults();return state.v7;}
 window.YoxiV7={data,save:()=>save(),goRun:()=>go('run'),route:'dadaocheng',reset:()=>{state.v7=defaults();save();}};
 Object.assign(paths,{trophy:'M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-5 3h10m-8-3h6',mountain:'M2 20 9 7l4 7 3-5 6 11H2ZM6 13l3 2 3-2',flag:'M5 22V3m0 1c5-5 9 5 14 0v10c-5 5-9-5-14 0',chart:'M4 3v18h18M8 16v-5m5 5V7m5 9V4'});
})();
