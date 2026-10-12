// These are retrieval scope definitions, not generated answers or recommendation scores.
export const RECOMMEND_DOMAINS=[
 {id:'photography',supported:true,tags:['攝影'],text:'拍照攝影，尋找建築線條、牆面、空間和不同角度，探索城市中的視覺細節。'},
 {id:'photography_general',supported:true,tags:['攝影'],text:'找值得拍照的地方，不限主題，有意思的建築、牆面或城市角落都可以。'},
 {id:'heritage',supported:true,tags:['地方故事','老屋'],text:'認識城市文化與地方歷史，參觀老房子、歷史建築和文創園區。'},
 {id:'literature',supported:true,tags:['文學'],text:'閱讀文學作品，了解臺灣文學與作家的故事，參觀文學館。'},
 {id:'art',supported:true,tags:['看展','藝術'],text:'參觀美術館與藝術展覽，在室內欣賞藝術與建築。'},
 {id:'shared_meal',supported:true,tags:['合菜'],text:'和朋友一起點一桌台菜合菜，一起用餐、聊天和認識同好。'},
 {id:'repairs',supported:false,text:'維修保養交通工具、汽車引擎、家電、相機和電腦，修理損壞設備。'},
 {id:'medical',supported:false,text:'尋找醫院診所、牙科或藥局，診斷治療疾病、牙痛或急診。'},
 {id:'finance',supported:false,text:'找銀行辦理貸款、存款、匯款、保險、投資和金融服務。'},
 {id:'sports',supported:false,text:'運動場館或戶外運動，籃球、游泳、滑雪、潛水、衝浪、卡丁車、登山及露營。'},
 {id:'food_business',supported:false,text:'找餐廳、咖啡廳、甜點店、蛋糕、早午餐、商店，查菜單或訂位。'},
 {id:'accommodation',supported:false,text:'旅館民宿飯店住宿、客房預訂與住宿設施。'},
 {id:'nature',supported:false,text:'到公園、山林、農場或海邊，看花草、昆蟲和動物，野餐、烤肉、觀星或接觸大自然。'},
 {id:'workshop',supported:false,text:'親手製作陶器、木工、飾品或其他手工作品，報名工藝課程。'},
 {id:'retail',supported:false,text:'購買相機鏡頭、電腦、生活用品或其他商品，尋找販售商品的商店。'},
 {id:'personal_assistance',supported:false,text:'尋找個人物品、遺失鑰匙、辦理私人事情、工作求職、解決生活問題。'},
];
export const GUIDE_DOMAINS=[
 {id:'observation',supported:true,text:'如何觀察建築、牆面、立體線條、柱頭、窗框和屋頂的細節，換角度比較。'},
 {id:'photography',supported:true,text:'在哪裡拍攝、怎麼拍照、如何選角度和構圖，觀察前景與建築的比例。'},
 {id:'history',supported:true,text:'這個園區以前是什麼用途，地方前身與創作來源的故事。'},
 {id:'live',supported:false,text:'目前或未來現場排隊時間、遊客人數、人潮、停車空位、天氣和即時營業狀態。'},
 {id:'policy',supported:false,text:'是否允許寵物、飲食、攝影或輪椅，入場規定、優惠資格與服務設施。'},
 {id:'specific_fact',supported:false,text:'建築成本、施工價格、材料規格、建造年份、建築師姓名、設計師生日或詳細傳記。'},
 {id:'practical',supported:false,text:'門票多少錢、營業開館時間、交通路線、停車位置和預約訂位。'},
 {id:'unrelated',supported:false,text:'修理電腦、汽車、家電，治療疾病，銀行金融和私人事務。'},
];
// Explicit feature requests must be backed by catalog tags. Semantic proximity cannot satisfy them.
export const REQUESTED_FEATURES=[
 {re:/滑雪|滑水|水上摩托|潛水|浮潛|衝浪|卡丁車|賽車|賽道|籃球|羽球|網球|攀岩|健身|游泳池|露營/,tag:'未收錄運動設施'},
 {re:/住宿|旅館|民宿|飯店房間|客房/,tag:'住宿'},
 {re:/咖啡廳|咖啡店|蛋糕|甜點|早午餐/,tag:'餐飲店家'},
 {re:/維修|修理|保養廠|無法開機|故障|修車/,tag:'維修服務'},
 {re:/診所|醫院|牙醫|牙科|急診|治療|藥局/,tag:'醫療服務'},
 {re:/貸款|匯款|保險|投資|銀行|外幣/,tag:'金融服務'},
 {re:/花草|蝴蝶|賞花|賞鳥|小動物|農場|星空|螢火蟲|沙灘|海邊|野餐|烤肉/,tag:'自然體驗'},
 {re:/停車|寵物|帶狗|帶貓|無障礙|充電樁/,tag:'設施與入場規定'},
 {re:/親手|做陶|手作課|木工課/,tag:'手作課程'},
 {re:/現場表演|舞台表演|演唱會|音樂會|劇場演出/,tag:'表演活動'},
 {re:/購買|販售|專賣店/,tag:'商品販售'},
];
export const UNSUPPORTED_GUIDE_FIELDS=[
 {id:'live',re:/排隊|候位|人潮|人數|人多|空位|剩.{0,4}車位|天氣|下雨|氣溫|等多久|現在.{0,6}開|今日.{0,6}開/},
 {id:'policy',re:/帶狗|帶貓|寵物|輪椅|無障礙|規定|能否.{0,4}入場|可不可以.{0,4}入場/},
 {id:'specific_fact',re:/多少錢.{0,5}(興建|建造)|造價|成本|生日|幾月幾|哪一年|建於|幾年建|材料|建築師|設計師|誰|幾公尺|多高|多長|面積/},
 {id:'practical',re:/門票|票價|入場費|開館時間|營業時間|幾點.{0,4}(開|關)|車位|公車|火車|訂位|預約/},
];
