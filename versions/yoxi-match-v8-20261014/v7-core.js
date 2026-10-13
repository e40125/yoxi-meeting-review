'use strict';
(() => {
 const courses={
  dadaocheng:{id:'dadaocheng',name:'大稻埕河岸',district:'datong',place:'大稻埕',subtitle:'沿著河邊，<br>跑一趟。'},
  yuanshan:{id:'yuanshan',name:'圓山公園',district:'zhongshan',place:'圓山',subtitle:'這次，<br>跑進圓山。'}
 };
 const defaults=()=>({period:'oct',outfit:'bag',arrived:false,unlocked:['scarf','bag','badge'],scores:{},runs:[],savedPlace:false,board:'friends',boardMetric:'run',runOrigin:'run',course:'dadaocheng'});
 function data(){if(!state.v7||typeof state.v7!=='object')state.v7=defaults();if(!courses[state.v7.course])state.v7.course='dadaocheng';return state.v7;}
 function setCourse(id){if(courses[id]){data().course=id;const u=new URL(location.href);u.searchParams.set('course',id);history.replaceState(null,'',u);save();}return course();}
 function course(){return courses[data().course];}
 function owned(id=course().id){return id==='dadaocheng'||(id==='yuanshan'&&data().arrived);}
 window.YoxiV7={data,save:()=>save(),courses,course,setCourse,owned,goRun:(id)=>{if(id)setCourse(id);go('run');},get route(){return course().id;},reset:()=>{state.v7=defaults();save();}};
 document.querySelector('#reset').addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.delete('course');history.replaceState(null,'',u);});
 const sharedCourse=new URLSearchParams(location.search).get('course');
 if(courses[sharedCourse])setCourse(sharedCourse);
 Object.assign(paths,{trophy:'M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v5m-5 3h10m-8-3h6',mountain:'M2 20 9 7l4 7 3-5 6 11H2ZM6 13l3 2 3-2',flag:'M5 22V3m0 1c5-5 9 5 14 0v10c-5 5-9-5-14 0',chart:'M4 3v18h18M8 16v-5m5 5V7m5 9V4'});
})();
