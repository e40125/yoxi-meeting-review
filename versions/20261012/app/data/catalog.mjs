export const SOURCES=[
  {
    "id": "museum-architecture",
    "title": "美術館建築介紹",
    "publisher": "台南旅遊網",
    "url": "https://www.twtainan.net/zh-tw/attractions/detail/5533/",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "literature-visit",
    "title": "參觀資訊",
    "publisher": "國立臺灣文學館",
    "url": "https://www.nmtl.gov.tw/cp.aspx?n=3801",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "literature-history",
    "title": "館舍歷史",
    "publisher": "國立臺灣文學館",
    "url": "https://www.nmtl.gov.tw/cp.aspx?n=3894",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "photo-literature",
    "title": "國立臺灣文學館，2025年照片",
    "publisher": "Adece033090 · CC BY 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:20250719%E5%9C%8B%E7%AB%8B%E8%87%BA%E7%81%A3%E6%96%87%E5%AD%B8%E9%A4%A8.jpg",
    "status": "verified"
  },
  {
    "id": "tainan-blueprint",
    "title": "藍晒圖文創園區",
    "publisher": "臺南市政府觀光旅遊局",
    "url": "https://www.twtainan.net/zh-tw/attractions/detail/740/",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "tainan-blueprint-history",
    "title": "藍晒圖公共藝術",
    "publisher": "臺南市政府",
    "url": "https://info.tainan.gov.tw/News_Content.aspx?n=25742&s=8539664",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "museum-official",
    "title": "臺南國家美術館籌備處",
    "publisher": "臺南國家美術館",
    "url": "https://www.momatainan.gov.tw/",
    "checkedAt": "2026-10-11",
    "status": "needs_refresh"
  },
  {
    "id": "museum-fees",
    "title": "票價資訊",
    "publisher": "臺南國家美術館",
    "url": "https://www.momatainan.gov.tw/cp.aspx?n=9522",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "museum-hours",
    "title": "開館時間",
    "publisher": "臺南國家美術館",
    "url": "https://www.momatainan.gov.tw/cp.aspx?n=9523",
    "checkedAt": "2026-10-11",
    "status": "verified"
  },
  {
    "id": "photo-blueprint-day",
    "title": "藍晒圖，2016年照片",
    "publisher": "Sinchen Lin · CC BY 2.0",
    "url": "https://commons.wikimedia.org/wiki/File:18-%E5%8F%B0%E5%8D%97%E8%97%8D%E6%99%92%E5%9C%96%E6%96%87%E5%89%B5%E5%9C%92%E5%8D%80_(29484625966).jpg",
    "status": "verified"
  },
  {
    "id": "photo-blueprint-night",
    "title": "藍晒圖，2024年照片",
    "publisher": "阿道 · CC BY-SA 4.0",
    "url": "https://commons.wikimedia.org/wiki/File:Blueprint_Culture_and_Creative_Park_at_night_01._20241217.jpg",
    "status": "verified"
  },
  {
    "id": "photo-museum",
    "title": "美術館建築，2025年照片",
    "publisher": "Lchung9779 · CC0",
    "url": "https://commons.wikimedia.org/wiki/File:Tainan_Art_Museum_Building_2_(%E5%8F%B0%E5%8D%97%E5%B8%82%E7%BE%8E%E8%A1%93%E9%A4%A82%E9%A4%A8).jpg",
    "status": "verified"
  },
  {
    "id": "demo-data",
    "title": "產品展示情境",
    "publisher": "yoxi 城市夥伴提案",
    "url": null,
    "status": "example"
  }
];

export const PLACES=[
  {
    "id": "literature",
    "name": "國立臺灣文學館",
    "city": "台南",
    "area": "中西區",
    "address": "臺南市中西區中正路（湯德章大道）1號",
    "coordinates": null,
    "tags": [
      "攝影",
      "建築",
      "老屋",
      "地方故事",
      "文學",
      "看展",
      "室內"
    ],
    "image": "assets/literature-20250719.jpg",
    "eyebrow": "在老州廳，找一個被忽略的細節",
    "description": "沿著窗框與柱頭的線條看老建築，再到館內看看文學與生活的故事。",
    "fees": [
      {
        "label": "入場",
        "amount": 0,
        "status": "verified",
        "sourceId": "literature-visit",
        "required": true
      }
    ],
    "hours": {
      "label": "週二至週日09:00–18:00；週一原則休館，例外依公告",
      "sourceId": "literature-visit"
    },
    "sourceIds": [
      "literature-visit",
      "literature-history",
      "photo-literature"
    ],
    "testData": false,
    "experiences": [
      {
        "id": "detail",
        "title": "找出柱頭與窗框的差別",
        "minutes": 10,
        "priority": 1,
        "tags": [
          "攝影",
          "建築",
          "老屋"
        ],
        "detail": "從開放的人行空間看二樓拱窗，找找成對柱子上端的捲紋。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "photo",
        "title": "留下喜歡的一個細節",
        "minutes": 15,
        "priority": 1,
        "tags": [
          "攝影"
        ],
        "detail": "比較入口與二樓的裝飾，拍下你覺得最有意思的地方。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "reading",
        "title": "到館內看看文學展覽",
        "minutes": 25,
        "priority": 2,
        "tags": [
          "看展",
          "文學"
        ],
        "detail": "當期展覽與開放空間依館方公告；攝影限制依現場規定。",
        "requiresConfirmation": true,
        "settings": [
          "indoor"
        ]
      }
    ]
  },
  {
    "id": "blueprint",
    "name": "藍晒圖文創園區",
    "city": "台南",
    "area": "南區",
    "address": "臺南市南區西門路一段689巷",
    "coordinates": {
      "lat": 22.987238,
      "lng": 120.197491
    },
    "tags": [
      "攝影",
      "線條",
      "空間",
      "戶外",
      "文創",
      "地方故事"
    ],
    "image": "assets/blueprint-day.jpg",
    "secondaryImage": "assets/blueprint-night.jpg",
    "eyebrow": "白線、藍牆與立體空間",
    "description": "在白色線條與藍色牆面之間，找一個自己的拍攝角度。",
    "fees": [
      {
        "label": "園區入場",
        "amount": 0,
        "status": "verified",
        "sourceId": "tainan-blueprint",
        "note": "台南旅遊網記載免門票；頁面更新2024-01-09，店家消費另計",
        "required": true
      }
    ],
    "hours": {
      "label": "10:00–21:00，週二休息；各店另依公告",
      "sourceId": "tainan-blueprint",
      "note": "官方頁最後更新2024-01-09，非即時營業狀態"
    },
    "sourceIds": [
      "tainan-blueprint",
      "tainan-blueprint-history"
    ],
    "testData": false,
    "experiences": [
      {
        "id": "observe",
        "title": "找出牆上的線與立體框架",
        "minutes": 10,
        "priority": 1,
        "tags": [
          "攝影",
          "線條"
        ],
        "detail": "先看正面，再向側邊移動，觀察哪些白線留在牆上、哪些伸向空中。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "photo",
        "title": "拍下兩個不同角度",
        "minutes": 15,
        "priority": 1,
        "tags": [
          "攝影"
        ],
        "detail": "保留同一個主體，試著讓平面的線條與立體框架在照片裡接在一起。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "story",
        "title": "看看這個街角的故事",
        "minutes": 10,
        "priority": 2,
        "tags": [
          "地方故事"
        ],
        "detail": "園區前身是舊司法宿舍；3D藍晒圖延續了海安路藍晒圖的創作。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "studios",
        "title": "看看有開放的文創小店",
        "minutes": 20,
        "priority": 3,
        "tags": [
          "文創"
        ],
        "detail": "各店營業時間不同，到場再確認開放情況。",
        "settings": []
      }
    ]
  },
  {
    "id": "museum",
    "name": "臺南國家美術館",
    "aliases": [
      "臺南市美術館2館",
      "台南市美術館二館",
      "南美館"
    ],
    "city": "台南",
    "area": "中西區",
    "address": "臺南市中西區忠義路二段1號",
    "coordinates": {
      "lat": 22.9891,
      "lng": 120.2024
    },
    "tags": [
      "攝影",
      "建築",
      "空間",
      "看展",
      "藝術",
      "室內"
    ],
    "image": "assets/museum.jpg",
    "eyebrow": "建築觀察，也能安排看展",
    "description": "觀察建築的幾何線條與空間層次，再安排時間看展。",
    "fees": [
      {
        "label": "一般門票",
        "amount": 160,
        "status": "verified",
        "sourceId": "museum-fees",
        "note": "優惠資格請依館方規定確認",
        "required": true
      }
    ],
    "hours": {
      "label": "週二至週日10:00–18:00；週六至21:00；週一原則休館",
      "sourceId": "museum-hours"
    },
    "sourceIds": [
      "museum-official",
      "museum-fees",
      "museum-hours",
      "photo-museum"
    ],
    "testData": false,
    "experiences": [
      {
        "id": "architecture",
        "title": "觀察建築的層次與線條",
        "minutes": 15,
        "priority": 1,
        "tags": [
          "攝影",
          "建築",
          "空間"
        ],
        "detail": "先從外觀找出不同方向的水平線、立柱與屋頂。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "photo",
        "title": "選一個角度拍建築",
        "minutes": 10,
        "priority": 1,
        "tags": [
          "攝影"
        ],
        "detail": "換一個站位，觀察前景與建築之間的比例。",
        "settings": [
          "outdoor"
        ]
      },
      {
        "id": "exhibition",
        "title": "安排一段看展時間",
        "minutes": 30,
        "priority": 2,
        "tags": [
          "看展",
          "藝術"
        ],
        "detail": "展覽內容、開放區域與票價需由官方最新資訊確認。",
        "requiresConfirmation": true,
        "settings": [
          "indoor"
        ]
      }
    ]
  },
  {
    "id": "table-demo",
    "name": "台菜合菜體驗",
    "city": "台南",
    "area": "中西區",
    "address": null,
    "coordinates": null,
    "tags": [
      "美食",
      "合菜",
      "聊天",
      "認識同好",
      "多人活動"
    ],
    "image": "assets/banquet-reference.jpg",
    "eyebrow": "測試活動",
    "description": "四個人一起點一桌菜，試試一個人不方便點的份量。",
    "fees": [
      {
        "label": "一桌餐費",
        "amount": 2400,
        "status": "example",
        "sourceId": "demo-data",
        "required": true
      }
    ],
    "hours": null,
    "sourceIds": [
      "demo-data"
    ],
    "testData": true,
    "experiences": [
      {
        "id": "meal",
        "title": "一起吃合菜",
        "minutes": 90,
        "priority": 1,
        "tags": [
          "美食",
          "合菜"
        ],
        "detail": "展示用活動，餐廳、菜色與價格均未訂定。",
        "settings": []
      }
    ]
  }
];

export const THEMES=[];

export const ACCESSORIES=[];

export const CHALLENGES=[];

export const TEST_PROFILES=[
  {
    "id": "me",
    "name": "我",
    "interests": [
      "攝影",
      "空間"
    ],
    "area": "手動選擇",
    "testData": true
  },
  {
    "id": "mika",
    "name": "小米",
    "interests": [
      "美食",
      "地方故事"
    ],
    "area": "中西區",
    "testData": true
  },
  {
    "id": "hao",
    "name": "阿浩",
    "interests": [
      "合菜",
      "攝影"
    ],
    "area": "南區",
    "testData": true
  },
  {
    "id": "lin",
    "name": "小林",
    "interests": [
      "美食",
      "看展"
    ],
    "area": "中西區",
    "testData": true
  }
];
export const getPlace=id=>PLACES.find(p=>p.id===id);
export const getChallenge=id=>CHALLENGES.find(p=>p.id===id);
export function makeSeedInvitations(now=new Date()) {
 const start=new Date(now);start.setDate(start.getDate()+((6-start.getDay()+7)%7||7));start.setHours(18,0,0,0);
 const end=new Date(start.getTime()+90*60_000),deadline=new Date(start.getTime()-24*3600_000);
 return [{id:'party-table-01',placeId:'table-demo',title:'週末一起吃台菜',activity:'四個人，分享一桌合菜',startAt:start.toISOString(),endAt:end.toISOString(),deadlineAt:deadline.toISOString(),minPeople:4,maxPeople:4,hostId:'mika',revision:1,status:'open',testData:true,costItems:[{id:'food',label:'一桌餐費',amount:2400,basis:'shared',status:'example'}],transportCostKnown:false,description:'示範如何找伴、分攤費用與確認變動。尚未向餐廳訂位。',membership:['mika','hao','lin'].map(userId=>({userId,status:'confirmed',acceptedRevision:1})),history:[]}];
}
