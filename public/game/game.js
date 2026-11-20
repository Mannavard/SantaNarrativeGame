/* The game: a self-contained script. app.ts starts it once the markup from app.html is on the page. */
(()=>{
'use strict';

/* =====================================================================
   CONFIG — everything you are likely to edit lives here
   ===================================================================== */
// Things standing in front of the falling snow (logical 1536x1024 frame): the snow is not drawn over them.
const OCC={
  books:{poly:[[110,652],[120,632],[165,622],[300,624],[306,650]]},
  globe:{circle:[626,664,78]},
  clockBtn:{poly:[[1200,640],[1206,628],[1296,626],[1304,640],[1300,664],[1204,664]]},
};
// The same for the PORTRAIT frame (phones), see CONFIG.portrait.
const OCCP={
  globeA:{circle:[400,1352,78]},          // the snow globe on stage 4
  globeB:{circle:[397,1357,74]},          // ... and on stage 5 (it sits slightly differently in that picture)
};
const CONFIG={
  // When each stop opens (local time of the visitor). Stops stay open once they have opened.
  stops:['2026-11-23T10:00','2026-11-28T10:00','2026-12-03T10:00','2026-12-08T10:00','2026-12-13T10:00'],
  santaAt:'2026-12-18T10:00',          // the Secret Santa exchange (the finale opens)
  quietSeconds:30,                     // length of the "quiet moment"
  feedbackUrl:'',                      // optional: a link shown under the keepsake card ("tell the author what you thought"). Empty = hidden.
  // Background music: put the file at public/audio/music.mp3. It starts on the first tap of the start screen
  // (browsers only allow sound after a tap), fades in over fadeIn seconds, loops. No file = no music, no button.
  music:{src:'audio/music.mp3',volume:.35,fadeIn:6},
  allowDebug:true,                     // SET TO false BEFORE PUBLISHING: turns off ?debug, ?now, ?fast, ?reset and the debug panel

  // Stage pictures. Add stage4/5/(6 = finale) here when they are ready (see tools/normalize.py).
  // Coordinates are in the 1536x1024 frame of the normalised image:
  //   clock = area of the clock screen that gets covered by live digits  [x0,y0,x1,y1]
  //   lamp  = centre of the lantern's light (used for the glow and for lighting the snow)
  //   cup   = centre of the mug's rim, where the faint steam starts
  // A stop without its own picture shows the last available one.
  stages:[
    // p = the same stage in the portrait frame (phones): its own picture, lamp, mug, clear glass and occluders. Anything not listed is inherited.
    {src:'img/stage1.webp',p:{src:'img/stage1-portrait.webp',lamp:[719,771],cup:[315,1352],glass:[145,112,800,1272],occ:[]},cup:[415,668],clock:[1148,690,1380,752],lamp:[1188,258],tilt:2.3,occ:[OCC.books,OCC.clockBtn]},
    {src:'img/stage2.webp',p:{src:'img/stage2-portrait.webp',lamp:[721,783],cup:[315,1357],glass:[145,118,800,1272],occ:[]},cup:[415,668],clock:[1148,690,1380,752],lamp:[1188,258],tilt:2.3,occ:[OCC.books,OCC.clockBtn]},
    {src:'img/stage3.webp',p:{src:'img/stage3-portrait.webp',lamp:[712,802],cup:[243,1366],glass:[100,245,795,1300],occ:[]},cup:[410,663],clock:[1144,680,1378,742],lamp:[1190,248],tilt:.4,occ:[OCC.books,OCC.clockBtn]},
    {src:'img/stage4.webp',p:{src:'img/stage4-portrait.webp',lamp:[714,723],cup:[220,1360],glass:[115,112,785,1302],occ:[OCCP.globeA]},cup:[410,663],clock:[1144,680,1378,742],lamp:[1186,252],tilt:1.2,occ:[OCC.books,OCC.globe,OCC.clockBtn]},
    // Stage 5+ are warm-toned, so they carry a colour theme for the live layers:
    //   screen = colour of the clock screen, digit/unlit = lit and unlit segments, glow = lamp glow, tint = snow colour multiplier
    {src:'img/stage5.webp',p:{src:'img/stage5-portrait.webp',lamp:[710,790],cup:[225,1364],glass:[100,215,792,1298],occ:[OCCP.globeB]},cup:[408,663],clock:[1144,680,1378,742],lamp:[1186,252],tilt:1.25,occ:[OCC.books,OCC.globe,OCC.clockBtn],screen:'#16100f',digit:'#e4c288',unlit:'#2b1e16',glow:[255,190,100],tint:[1,.92,.78]},
  ],
  // The gift (box + lid cut by tools/prep_gift.py, heart by tools/make_heart.py - swap img/heart.png for the real reveal).
  // Everything is in the 1536x1024 frame / as fractions of the box:  x,y = centre of the box's base on the sill, w = box width;
  // lidFit = where the closed lid sits on the box;  rim = the opening (left corner, front corner, right corner): the heart is hidden below that "V".
  gift:{body:'img/gift-body.png',lid:'img/gift-lid.png',heart:'img/heart.png',
        x:914,y:796,w:150,
        lidFit:{w:1.06,left:-.03,top:-.55},
        rim:[[.03,.27],[.86,.285],[.98,.13]],
        heartW:.5,heartTop:.2},
  // Progress bar (cut from your sheet by tools/slice_sheet.py):  [cap] frame - ornament - frame - ... - frame [cap]
  // The page greys the art with a filter: locked = the "?" frame in B/W, then the stop's picture appears in B/W,
  // then the filter is removed when that stop arrives (and the next frame opens in B/W).
  stepper:{locked:'img/ui/locked.png',
           frames:[1,2,3,4,5].map(i=>`img/ui/step${i}.png`),
           lines:{left:'img/ui/line-left.png',mid:['img/ui/line-mid1.png','img/ui/line-mid2.png','img/ui/line-mid3.png'],right:'img/ui/line-right.png'},
           unit:256,          // height of a frame in the image files (px): the ornaments are sized relative to it
           lineY:.12,         // where the ornaments sit vertically: 0 = centre of the frames, positive = lower
           colorLines:true,   // the ornaments light up with the frames (false = they stay B/W)
           pixelated:false},  // false for smooth art, true to keep hard pixel edges when scaled
  glass:[250,56,1318,644],             // the clear part of the window, where the live snow falls
  // PHONES (portrait screens). Its own frame and pictures (tools/normalize_portrait.py aligns them by the clock), everything in that frame's pixels.
  //   glass = the snow field (the union of every stage's `p.glass`; a stage's own `p.glass` hides the snow outside its window)
  //   clock/tilt = the clock screen, identical in all five pictures;  gift = where the box stands (x,y,w as in CONFIG.gift)
  //   fitY = the lowest thing that must stay visible above the dialogue (the bottom of the clock);  dialogMax = room kept for the dialogue, px at most
  portrait:{w:941,h:1672,glass:[100,112,800,1302],clock:[626,1368,838,1440],tilt:0,
            gift:{x:545,y:1438,w:110},fitY:1450,dialogMax:225},
};


/* ---- helpers / debug flags ----
   ?fast            speed up waits (testing)        ?now=2026-12-03T12:00   pretend it is that moment
   ?reset           forget saved progress          */
const QS=new URLSearchParams(CONFIG.allowDebug?location.search:'');
let FAST=QS.has('fast');
let NOW_OFFSET=QS.get('now')?new Date(QS.get('now')).getTime()-Date.now():0;
const nowMs=()=>Date.now()+NOW_OFFSET;
const sleep=ms=>new Promise(r=>setTimeout(r,FAST?ms/8:ms));
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ROM=['I','II','III','IV','V'];
const stopMs=CONFIG.stops.map(s=>new Date(s).getTime()),santaMs=new Date(CONFIG.santaAt).getTime();
const unlockedCount=()=>stopMs.filter(t=>t<=nowMs()).length;
const fmtDate=d=>(d.toLocaleDateString(LOC[LANG],{month:'short',day:'numeric'})+' · '+d.toLocaleTimeString(LOC[LANG],{hour:'2-digit',minute:'2-digit',hour12:false})).replace(/ /g,'\u00A0');

/* =====================================================================
   LANGUAGES (en / ru / ro): every line the player sees lives here
   ===================================================================== */
const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);
const secRu=n=>{const a=n%10,b=n%100;return b>=11&&b<=14?'секунд':a===1?'секунду':a>=2&&a<=4?'секунды':'секунд'};
const secRo=n=>n>=20||n===0?'de secunde':n===1?'secundă':'secunde';
const LOC={en:'en-US',ru:'ru-RU',ro:'ro-RO'};
const TX={
en:{
 title:'The Journey',
 gateA:'find a quiet corner<br>and take your time',gateB:'[ TAP TO BEGIN ]',
 santa:'SANTA',
 themes:['Now','Warmth','Memory','Loved ones','Giving'],
 questions:[
  'When did I last lose track of time? What was I doing?',
  'What is one small thing that reliably makes my day better?',
  'If I could hang one thing of mine on this tree, what would it be, and why that one?',
  'Who would I want here right now? What would I thank them for?',
  'What could I give someone this week that would make them smile? Time counts. A word counts.',
 ],
 roadNotBegun:"THE ROAD HASN'T BEGUN",firstNear:'THE FIRST MOMENT IS NEAR',allDone:'ALL FIVE MOMENTS DONE',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'NOW',cSanta:'UNTIL SANTA',cUntil:th=>`UNTIL ${th.toUpperCase()}`,cQuiet:'QUIET MOMENT',
 unitsDHM:'DAYS · HRS · MIN',unitsHMS:'HRS · MIN · SEC',
 clockTip:'Tap to switch: now · until the next moment · until Santa',
 muteTip:'Music on / off',
 intro:[
  ['Evening. The snow has been falling for so long that the world outside has gone quiet.'],
  ['One lamp is lit in the park. On the windowsill, a clock is ticking. It is the only thing in here that never stops.'],
  ['This page opened from a link.\nCuriosity is a good sign.'],
  ['Hello.','???'],
  ["I'm your Secret Santa. For now, just a voice in the dark.",'???'],
  ["I have a gift for you. It doesn't come in a box.",'SANTA'],
  ["You'll have to build it yourself. From five small moments, one at each stop.",'SANTA'],
  ["It's not a race. More like a walk in the snow.",'SANTA'],
  ['Will you walk with me?','SANTA'],
 ],
 yes:"Yes, let's go",no:"No, I'm too busy",
 changed:'Something has changed since you left.',
 arrive:[
  'Every park starts out empty. So does every December.',
  'Someone has been here. There is a tree now, small and quiet.',
  'The tree is glowing. There is a snow globe on the sill, and warm lights along the glass.',
  'There are people around the tree now. Dancing in the snow, hand in hand. You are not alone out there.',
  'There is a box on the windowsill. It is not for you yet.',
 ],
 ask:q=>`Ask yourself: ${lc(q)}`,
 quietLine:n=>`Nobody is listening. Take a quiet moment with it: ${n} seconds, just you and the clock.`,
 beginQuiet:'Begin the quiet moment',thatMoment:'That moment was yours.',
 after:[
  'Until the next stop, notice one moment you would want back.',
  'Do it on purpose, once. Not as a break from life. As life.',
  'Look at your own shelf this week. Some of it is a story.',
  'Do not keep it in your head. Tell them. This game can wait.',
 ],
 afterLast:d=>`That was the last question. See you on ${d}.`,
 remindQ:(l,d)=>`Want a reminder for ${l}? It opens ${d}.`,
 calGoogle:'Google Calendar',calIcs:'Download .ics (Apple / Outlook)',calNo:'No, thanks',
 calTitle:l=>`The Journey: ${l} opens`,calDetails:'Come back to the window. A new stop is waiting.',
 lastSurprise:'the last surprise',
 waitFirst:(l,d)=>`The first moment, ${l}, opens ${d}. Until then: the window, the snow, the clock.`,
 waitNext:(l,d)=>`Nothing has changed yet. ${l} opens ${d}.`,
 waitFinale:d=>`All five stops are done. The box on the windowsill opens on ${d}.`,
 remindBtn:'↻ REMIND ME TO COME BACK',
 finDay:'It is the day.',finBox:'The box on the windowsill has been waiting for you.',finOpen:'Go on. Open it.',finNoBox:' (Imagine a box here.)',
 tapBox:'TAP THE BOX',
 finInside:n=>`Inside there is nothing you can hold. Only a heart, and five questions, and the ${n} seconds you gave each of them.`,
 finReal:'And somewhere nearby, a real box is waiting with your name on it.',
 finThesis:'Time is the one thing nobody can wrap.\nA gift is just a reason to spend it on someone.',
 finTake:'Take this with you. Ask the questions again, sometime.',merry:'Merry everything.',
 cardTitle:'YOUR DECEMBER',cardSub:'FIVE QUESTIONS WORTH ASKING AGAIN',cardFrom:d=>`FROM YOUR SECRET SANTA · ${d.toUpperCase()}`,
 cardSave:'SAVE THE CARD',cardClose:'CLOSE',cardAgain:'↻ OPEN THE CARD AGAIN',cardFeedback:'TELL THE AUTHOR WHAT YOU THOUGHT >',
 endTitle:'THE END?',retry:'↻ CHANGE YOUR MIND',
 dec1:['I see. It happens.','Deadlines, calls, tickets… all very important.',"But adventure doesn't knock twice.\nYou missed yours.","And that's how life goes — in a rush, between tasks, past the most interesting things. Tra-la-la.","You'll still get a gift. But it will be just a gift.",'The lamp flickers. Once. Twice.','And goes out.'],
 dec2:['As you wish. The road will wait.','The lamp flickers… and goes out.'],
 dec3:['Looks like this is just a game to you.','Fine. I will wait aside while you play.'],
 backLamp:'The lamp shudders… and lights up again.',back1:'I knew you would come back.',back2:'Stubborn. But fine.',backQ:'So? Shall we go?',
 acc1:'Great. I was hoping you would say yes.',acc1b:'Now it is for real.',
 acc:['The rules are simple. Five stops. One question at each.','There is nothing to type. Nobody is listening, nobody is keeping score. That is the point.',"The questions are for you. Ask them quietly. Answer them honestly. Or don't — it's your road.","Between stops we'll need time, about five days each. A gift doesn't like to be rushed."],
 accLights:'Above the window, five small lights come on. That is your path.',
},
ru:{
 title:'Путешествие',
 gateA:'найди тихий уголок<br>и не торопись',gateB:'[ НАЖМИ, ЧТОБЫ НАЧАТЬ ]',
 santa:'САНТА',
 themes:['Сейчас','Тепло','Память','Близкие','Дарить'],
 questions:[
  'Когда в последний раз время пролетело незаметно? Что тогда занимало меня?',
  'Какая одна маленькая вещь стабильно делает мой день лучше?',
  'Если бы на эту ёлку можно было повесить одну мою вещь — что бы это было и почему именно она?',
  'Кого мне хотелось бы увидеть здесь прямо сейчас? За что я хочу их поблагодарить?',
  'Что можно подарить кому-то на этой неделе, чтобы человек улыбнулся? Время тоже считается. Слово — тоже.',
 ],
 roadNotBegun:'ДОРОГА ЕЩЁ НЕ НАЧАЛАСЬ',firstNear:'ПЕРВЫЙ МОМЕНТ БЛИЗКО',allDone:'ВСЕ ПЯТЬ МОМЕНТОВ ПРОЙДЕНЫ',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'СЕЙЧАС',cSanta:'ДО САНТЫ',cUntil:th=>`ДО: ${th.toUpperCase()}`,cQuiet:'ТИХИЙ МОМЕНТ',
 unitsDHM:'ДНИ · ЧАС · МИН',unitsHMS:'ЧАС · МИН · СЕК',
 clockTip:'Нажми, чтобы переключить: сейчас · до следующего момента · до Санты',
 muteTip:'Музыка: вкл / выкл',
 intro:[
  ['Вечер. Снег идёт так давно, что мир за окном затих.'],
  ['В парке горит один фонарь. На подоконнике тикают часы — единственное, что здесь никогда не останавливается.'],
  ['Эта страница открылась по ссылке.\nЛюбопытство — хороший знак.'],
  ['Привет.','???'],
  ['Я — твой Тайный Санта. Пока что просто голос в темноте.','???'],
  ['У меня для тебя подарок. Но он не лежит в коробке.','SANTA'],
  ['Собрать его придётся самому — из пяти маленьких моментов, по одному на каждой остановке.','SANTA'],
  ['Это не гонка. Скорее прогулка по снегу.','SANTA'],
  ['Пойдёшь со мной?','SANTA'],
 ],
 yes:'Да, пойдём',no:'Нет, мне некогда',
 changed:'Пока тебя не было, кое-что изменилось.',
 arrive:[
  'Каждый парк сначала пуст. Как и каждый декабрь.',
  'Здесь кто-то побывал. Теперь тут стоит ёлочка — маленькая и тихая.',
  'Ёлка светится. На подоконнике появился снежный шар, а вдоль стекла — тёплые огоньки.',
  'Вокруг ёлки теперь люди. Они танцуют в снегу, взявшись за руки. Одиночества здесь больше нет.',
  'На подоконнике стоит коробка. Пока что она не для тебя.',
 ],
 ask:q=>`Спроси себя: ${lc(q)}`,
 quietLine:n=>`Никто не слушает. Побудь с этим в тишине: ${n} ${secRu(n)}, только ты и часы.`,
 beginQuiet:'Начать тихий момент',thatMoment:'Этот момент был твоим.',
 after:[
  'До следующей остановки заметь один момент, который захотелось бы вернуть.',
  'Сделай это нарочно, один раз. Не как передышку от жизни, а как жизнь.',
  'Загляни на свою полку на этой неделе. Часть вещей на ней — это истории.',
  'Не держи это в голове. Скажи им. Игра подождёт.',
 ],
 afterLast:d=>`Это был последний вопрос. До встречи ${d}.`,
 remindQ:(l,d)=>`Напомнить про ${l}? Откроется ${d}.`,
 calGoogle:'Google Календарь',calIcs:'Скачать .ics (Apple / Outlook)',calNo:'Нет, спасибо',
 calTitle:l=>`Путешествие: откроется ${l}`,calDetails:'Вернись к окну. Тебя ждёт новая остановка.',
 lastSurprise:'последний сюрприз',
 waitFirst:(l,d)=>`Первый момент — ${l} — откроется ${d}. А пока: окно, снег, часы.`,
 waitNext:(l,d)=>`Пока ничего не изменилось. ${l} откроется ${d}.`,
 waitFinale:d=>`Все пять остановок пройдены. Коробка на подоконнике откроется ${d}.`,
 remindBtn:'↻ НАПОМНИТЬ ВЕРНУТЬСЯ',
 finDay:'Этот день настал.',finBox:'Коробка на подоконнике ждёт тебя.',finOpen:'Давай. Открой её.',finNoBox:' (Представь здесь коробку.)',
 tapBox:'НАЖМИ НА КОРОБКУ',
 finInside:n=>`Внутри нет ничего, что можно удержать в руках. Только сердце, пять вопросов и ${n} ${secRu(n)}, которые достались каждому из них.`,
 finReal:'А где-то рядом ждёт настоящая коробка с твоим именем.',
 finThesis:'Время — единственное, что нельзя упаковать.\nПодарок — просто повод потратить его на кого-то.',
 finTake:'Возьми это с собой. Когда-нибудь задай эти вопросы снова.',merry:'Счастливых праздников.',
 cardTitle:'ТВОЙ ДЕКАБРЬ',cardSub:'ПЯТЬ ВОПРОСОВ, КОТОРЫЕ СТОИТ ЗАДАТЬ СНОВА',cardFrom:d=>`ОТ ТВОЕГО ТАЙНОГО САНТЫ · ${d.toUpperCase()}`,
 cardSave:'СОХРАНИТЬ КАРТОЧКУ',cardClose:'ЗАКРЫТЬ',cardAgain:'↻ ОТКРЫТЬ КАРТОЧКУ СНОВА',cardFeedback:'НАПИСАТЬ АВТОРУ, ЧТО ДУМАЕШЬ >',
 endTitle:'КОНЕЦ?',retry:'↻ ПЕРЕДУМАТЬ',
 dec1:['Понятно. Бывает.','Дедлайны, созвоны, тикеты… всё очень важно.','Но приключение не стучится дважды.\nСвоё — упущено.','Так и жизнь проходит — в спешке, между задачами, мимо самого интересного. Тра-ля-ля.','Подарок ты всё равно получишь. Но это будет просто подарок.','Фонарь мигает. Раз. Другой.','И гаснет.'],
 dec2:['Как скажешь. Дорога подождёт.','Фонарь мигает… и гаснет.'],
 dec3:['Похоже, для тебя это просто игра.','Хорошо. Я подожду в стороне, пока ты наиграешься.'],
 backLamp:'Фонарь вздрагивает… и загорается снова.',back1:'Я знал, что ты вернёшься.',back2:'Упрямство. Ну ладно.',backQ:'Ну что? Идём?',
 acc1:'Отлично. Я надеялся, что ты согласишься.',acc1b:'Вот теперь — по-настоящему.',
 acc:['Правила простые. Пять остановок. На каждой — один вопрос.','Печатать ничего не нужно. Никто не слушает и никто не ведёт счёт. В этом смысл.','Вопросы — для тебя. Задавай их тихо. Отвечай честно. А можешь и не отвечать — это твоя дорога.','Между остановками нужно время — дней по пять. Подарок не любит спешки.'],
 accLights:'Над окном загораются пять маленьких огоньков. Это твой путь.',
},
ro:{
 title:'Călătoria',
 gateA:'găsește un colț liniștit<br>și nu te grăbi',gateB:'[ APASĂ PENTRU A ÎNCEPE ]',
 santa:'MOȘ CRĂCIUN',
 themes:['Acum','Căldură','Amintiri','Cei dragi','Dăruire'],
 questions:[
  'Când mi-am pierdut ultima dată noțiunea timpului? Ce făceam atunci?',
  'Care este un lucru mic care îmi face, de fiecare dată, ziua mai bună?',
  'Dacă aș putea atârna în acest brad un singur lucru de-al meu, care ar fi și de ce tocmai acela?',
  'Pe cine mi-aș dori aici chiar acum? Pentru ce i-aș mulțumi?',
  'Ce aș putea dărui cuiva săptămâna aceasta ca să zâmbească? Timpul contează. Un cuvânt contează.',
 ],
 roadNotBegun:'DRUMUL NU A ÎNCEPUT ÎNCĂ',firstNear:'PRIMA CLIPĂ E APROAPE',allDone:'TOATE CELE CINCI CLIPE',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'ACUM',cSanta:'PÂNĂ LA MOȘ',cUntil:th=>`PÂNĂ LA ${th.toUpperCase()}`,cQuiet:'CLIPĂ DE LINIȘTE',
 unitsDHM:'ZILE · ORE · MIN',unitsHMS:'ORE · MIN · SEC',
 clockTip:'Apasă pentru a comuta: acum · până la următoarea clipă · până la Moș',
 muteTip:'Muzică: pornită / oprită',
 intro:[
  ['Seară. Ninge de atâta vreme, încât lumea de afară a amuțit.'],
  ['În parc arde un singur felinar. Pe pervaz, un ceas ticăie. E singurul lucru de aici care nu se oprește niciodată.'],
  ['Pagina s-a deschis dintr-un link.\nCuriozitatea e un semn bun.'],
  ['Salut.','???'],
  ['Sunt Moșul tău Secret. Deocamdată, doar o voce în întuneric.','???'],
  ['Am un cadou pentru tine. Dar nu e într-o cutie.','SANTA'],
  ['Va trebui să-l construiești chiar tu. Din cinci clipe mici, câte una la fiecare oprire.','SANTA'],
  ['Nu e o cursă. E mai degrabă o plimbare prin zăpadă.','SANTA'],
  ['Vii cu mine?','SANTA'],
 ],
 yes:'Da, hai',no:'Nu, n-am timp',
 changed:'Ceva s-a schimbat de când ai plecat.',
 arrive:[
  'Fiecare parc începe gol. La fel ca fiecare decembrie.',
  'Cineva a fost aici. Acum e un brad, mic și liniștit.',
  'Bradul strălucește. Pe pervaz e un glob cu zăpadă, iar de-a lungul geamului sunt luminițe calde.',
  'Acum sunt oameni în jurul bradului. Dansează în zăpadă, mână în mână. Singurătatea a rămas în urmă.',
  'Pe pervaz e o cutie. Deocamdată nu e pentru tine.',
 ],
 ask:q=>`Întreabă-te: ${lc(q)}`,
 quietLine:n=>`Nimeni nu ascultă. Rămâi cu asta într-o clipă de liniște: ${n} ${secRo(n)}, doar tu și ceasul.`,
 beginQuiet:'Începe clipa de liniște',thatMoment:'Clipa aceea a fost a ta.',
 after:[
  'Până la următoarea oprire, observă o clipă pe care ți-ai dori s-o primești înapoi.',
  'Fă-o intenționat, o singură dată. Nu ca pe o pauză de la viață, ci ca pe viață.',
  'Uită-te săptămâna asta la raftul tău. Unele lucruri de acolo sunt povești.',
  'Nu o ține doar în minte. Spune-le. Jocul poate aștepta.',
 ],
 afterLast:d=>`Aceasta a fost ultima întrebare. Ne vedem pe ${d}.`,
 remindQ:(l,d)=>`Vrei un memento pentru ${l}? Se deschide ${d}.`,
 calGoogle:'Google Calendar',calIcs:'Descarcă .ics (Apple / Outlook)',calNo:'Nu, mulțumesc',
 calTitle:l=>`Călătoria: se deschide ${l}`,calDetails:'Întoarce-te la fereastră. Te așteaptă o nouă oprire.',
 lastSurprise:'ultima surpriză',
 waitFirst:(l,d)=>`Prima clipă, ${l}, se deschide ${d}. Până atunci: fereastra, zăpada, ceasul.`,
 waitNext:(l,d)=>`Încă nimic nu s-a schimbat. ${l} se deschide ${d}.`,
 waitFinale:d=>`Toate cele cinci opriri sunt parcurse. Cutia de pe pervaz se deschide ${d}.`,
 remindBtn:'↻ AMINTEȘTE-MI SĂ MĂ ÎNTORC',
 finDay:'Ziua a venit.',finBox:'Cutia de pe pervaz te așteaptă.',finOpen:'Hai. Deschide-o.',finNoBox:' (Imaginează-ți aici o cutie.)',
 tapBox:'APASĂ PE CUTIE',
 finInside:n=>`Înăuntru nu e nimic ce poți ține în mână. Doar o inimă, cinci întrebări și cele ${n} ${secRo(n)} pe care le-ai dat fiecăreia.`,
 finReal:'Iar undeva aproape te așteaptă o cutie adevărată, cu numele tău pe ea.',
 finThesis:'Timpul e singurul lucru pe care nu-l poate împacheta nimeni.\nUn cadou e doar un motiv de a-l petrece cu cineva.',
 finTake:'Ia asta cu tine. Pune din nou aceste întrebări, cândva.',merry:'Sărbători fericite.',
 cardTitle:'DECEMBRIE AL TĂU',cardSub:'CINCI ÎNTREBĂRI CARE MERITĂ PUSE DIN NOU',cardFrom:d=>`DE LA MOȘUL TĂU SECRET · ${d.toUpperCase()}`,
 cardSave:'SALVEAZĂ FELICITAREA',cardClose:'ÎNCHIDE',cardAgain:'↻ DESCHIDE FELICITAREA DIN NOU',cardFeedback:'SPUNE-I AUTORULUI CE GÂNDEȘTI >',
 endTitle:'SFÂRȘIT?',retry:'↻ M-AM RĂZGÂNDIT',
 dec1:['Înțeleg. Se întâmplă.','Deadline-uri, apeluri, tichete… toate foarte importante.','Dar aventura nu bate de două ori la ușă.\nPe a ta ai pierdut-o.','Așa trece viața — în grabă, între sarcini, pe lângă cele mai interesante lucruri. Tra-la-la.','Cadoul tot îl vei primi. Dar va fi doar un cadou.','Felinarul pâlpâie. O dată. A doua oară.','Și se stinge.'],
 dec2:['Cum vrei. Drumul va aștepta.','Felinarul pâlpâie… și se stinge.'],
 dec3:['Se pare că, pentru tine, e doar un joc.','Bine. Aștept deoparte cât timp te joci.'],
 backLamp:'Felinarul tresare… și se aprinde din nou.',back1:'Știam că te vei întoarce.',back2:'Încăpățânare. Dar fie.',backQ:'Deci? Mergem?',
 acc1:'Grozav. Speram să spui da.',acc1b:'Acum e pe bune.',
 acc:['Regulile sunt simple. Cinci opriri. La fiecare, o întrebare.','Nu trebuie să scrii nimic. Nimeni nu ascultă, nimeni nu ține scorul. Asta e ideea.','Întrebările sunt pentru tine. Pune-le în liniște. Răspunde sincer. Sau nu — e drumul tău.','Între opriri avem nevoie de timp, cam cinci zile fiecare. Unui cadou nu-i place graba.'],
 accLights:'Deasupra ferestrei se aprind cinci luminițe. Acesta e drumul tău.',
},
};
let LANG='en',langKnown=false;
{ // language: ?lang=xx wins, then the saved choice; otherwise the picker is shown on the first screen
  let sv=null;try{sv=localStorage.getItem('journey-lang')}catch(e){}
  const pick=[new URLSearchParams(location.search).get('lang'),sv].find(v=>v&&TX[v]);if(pick){LANG=pick;langKnown=true}
}
const T=k=>TX[LANG][k]!==undefined?TX[LANG][k]:TX.en[k];          // a string, an array or a template function: callers use T('key')(args) for functions
let THEMES=TX[LANG].themes,QUESTIONS=TX[LANG].questions;

/* ---- saved progress ---- */
const KEY='secret-santa-journey-v1';
let state={accepted:false,done:0};
try{if(QS.has('reset'))localStorage.removeItem(KEY);const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.done==='number')state=s}catch(e){}
state.entered=Math.max(state.entered||0,state.done||0);   // highest stop whose arrival has been shown
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}};

/* =====================================================================
   ARTWORK
   ===================================================================== */
let PORT=false,LW=1536,LH=1024,orientChanged=false;          // logical frame of the stage pictures: 1536x1024 on wide screens, CONFIG.portrait on phones
/* the stage as it is meant for the current orientation (portrait overrides are merged over the base entry) */
const stageMeta=i=>{const m=CONFIG.stages[i];if(!m||!PORT)return m;const P=CONFIG.portrait;return {...m,clock:P.clock,tilt:P.tilt,...m.p}};
const artEl=$('#art'),imgsEl=$('#imgs'),imgA=$('#imgA'),dis=$('#dis'),fx=$('#fx'),fctx=fx.getContext('2d'),clk=$('#clk'),cctx=clk.getContext('2d');
let box={s:1,left:0,top:0,w:LW,h:LH,P:2},glass={x:0,y:0,w:1,h:1},flakes=[];
let stageIdx=0,meta=stageMeta(0);
let t=0,lampPower=0,lampTarget=0,lampRate=14,flick=1,dip=0,lastBright=-1,dpr=1;
const imgCache={};
const loadImg=src=>imgCache[src]||(imgCache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('missing '+src));i.src=src}));
const stageFor=n=>Math.min(Math.max(n,0),CONFIG.stages.length-1);      // 0 = start (no tree), 1..5 = stop, 6 = finale -> picture index (the last one is reused)

function layout(){
  const vw=innerWidth,vh=innerHeight,portrait=vh>vw*1.1,topInset=Math.ceil($('#stepper').getBoundingClientRect().bottom)+10;
  if(portrait!==PORT){PORT=portrait;LW=PORT?CONFIG.portrait.w:1536;LH=PORT?CONFIG.portrait.h:1024;orientChanged=true}
  dpr=Math.min(2,window.devicePixelRatio||1);
  let s,left,top;
  if(PORT){const pf=CONFIG.portrait,room=clamp(vh*.27,150,pf.dialogMax);     // phones: the whole window, from under the stepper to just above the dialogue
    s=Math.max(.05,Math.min(vw/LW,(vh-topInset-16-room)/pf.fitY));left=(vw-LW*s)/2;top=topInset}
  else{s=Math.max(.05,Math.min(vw/LW,(vh-topInset)/LH));left=(vw-LW*s)/2;top=topInset}      // never <=0 (a hidden or zero-height window)
  box={s,left,top,w:LW*s,h:LH*s,P:Math.max(2,Math.round(3*s))};
  imgsEl.style.left=left+'px';imgsEl.style.top=top+'px';imgsEl.style.width=box.w+'px';imgsEl.style.height=box.h+'px';
  fx.style.left=left+'px';fx.style.top=top+'px';fx.style.width=box.w+'px';fx.style.height=box.h+'px';
  fx.width=Math.ceil(box.w/box.P);fx.height=Math.ceil(box.h/box.P);
  const g=PORT?CONFIG.portrait.glass:CONFIG.glass,k=s/box.P;glass={x:g[0]*k,y:g[1]*k,w:(g[2]-g[0])*k,h:(g[3]-g[1])*k};
  flakes=[];const n=Math.round(glass.w*glass.h/105);
  for(let i=0;i<n;i++)flakes.push({x:Math.random()*glass.w,y:Math.random()*glass.h,z:Math.random(),ph:Math.random()*6.28,vx:0,vy:0});
  placeClock();placeGift();
  if(orientChanged){orientChanged=false;showStage(stageIdx,true)}     // the phone was turned: switch to the other set of pictures
}
function placeClock(){
  const c=meta.clock,s=box.s,x=box.left+c[0]*s,y=box.top+c[1]*s,w=(c[2]-c[0])*s,h=(c[3]-c[1])*s;
  clk.style.left=x+'px';clk.style.top=y+'px';clk.style.width=w+'px';clk.style.height=h+'px';
  clk.width=Math.round(w*dpr);clk.height=Math.round(h*dpr);clk.dataset.w=w;clk.dataset.h=h;clkKey='';
  clk.style.transform=`rotate(${meta.tilt||0}deg)`;buildOcc();
  GR=makeGR(meta.tint||[1,1,1.02]);
  const ui=$('#clockUI'),pad=14*s;
  ui.style.left=x-pad+'px';ui.style.top=y-pad-22*s+'px';ui.style.width=w+2*pad+'px';ui.style.height=h+2*pad+22*s+'px';
}

/* ---- mask: foreground objects (globe, books, clock buttons) that the snow must not be drawn over ---- */
let occMask=null;
function buildOcc(){
  const fw=fx.width,fh=fx.height,k=box.s/box.P,cv=document.createElement('canvas');cv.width=fw;cv.height=fh;
  const g=cv.getContext('2d');g.fillStyle=g.strokeStyle='#000';g.lineWidth=Math.max(2,6*k);g.lineJoin='round';     // the stroke also covers the outline of each object
  for(const sh of meta.occ||[]){
    g.beginPath();
    if(sh.circle){const [x,y,r]=sh.circle;g.arc(x*k,y*k,r*k,0,6.283)}
    else sh.poly.forEach(([x,y],i)=>i?g.lineTo(x*k,y*k):g.moveTo(x*k,y*k));
    g.closePath();g.fill();g.stroke();
  }
  const d=g.getImageData(0,0,fw,fh).data;occMask=new Uint8Array(fw*fh);for(let i=0;i<occMask.length;i++)occMask[i]=d[i*4+3]>24?1:0;
}

/* ---- the gift on the windowsill: box + lid + a heart that rises out of it ---- */
const giftEl=$('#gift'),giftBody=$('#giftBody'),giftLid=$('#giftLid'),heartWrap=$('#heartWrap'),heartEl=$('#heart'),giftSh=$('#giftSh'),giftHint=$('#giftHint'),flashEl=$('#flash');
let giftOn=false,giftOpened=false,giftClickRes=null;const particles=[];
const giftReady=CONFIG.gift?Promise.all([CONFIG.gift.body,CONFIG.gift.lid,CONFIG.gift.heart].map(loadImg)).then(()=>{
  giftBody.src=CONFIG.gift.body;giftLid.src=CONFIG.gift.lid;heartEl.src=CONFIG.gift.heart;return giftBody.decode().catch(()=>{}).then(()=>true)}).catch(()=>false):Promise.resolve(false);
giftBody.onload=()=>placeGift();
function placeGift(){
  const g=CONFIG.gift&&(PORT?{...CONFIG.gift,...CONFIG.portrait.gift}:CONFIG.gift);if(!g)return;const s=box.s,w=g.w*s,h=giftBody.naturalWidth?w*giftBody.naturalHeight/giftBody.naturalWidth:w*.8;
  const left=box.left+g.x*s-w/2,top=box.top+g.y*s-h;
  Object.assign(giftEl.style,{width:w+'px',height:h+'px',left:left+'px',top:top+'px'});
  const lf=g.lidFit;Object.assign(giftLid.style,{width:lf.w*100+'%',left:lf.left*100+'%',top:lf.top*100+'%'});
  Object.assign(heartEl.style,{width:g.heartW*100+'%',left:(1-g.heartW)/2*100+'%',top:g.heartTop*100+'%'});
  const r=g.rim,p=q=>`${q[0]*100}% ${q[1]*100}%`;
  heartWrap.style.clipPath=`polygon(-80% -600%,180% -600%,180% ${r[2][1]*100}%,${p(r[2])},${p(r[1])},${p(r[0])},-80% ${r[0][1]*100}%)`;
  Object.assign(giftSh.style,{width:w*1.15+'px',height:w*.2+'px',left:left-w*.075+'px',top:box.top+g.y*s-w*.1+'px'});
  Object.assign(giftHint.style,{left:left+w/2+'px',top:top-h*.3-24+'px'});
}
async function showGift(animate,opened=false){
  if(giftOn||!(await giftReady))return;giftOn=true;placeGift();
  giftEl.className='show';giftSh.className='show';void giftEl.offsetWidth;
  if(opened){giftEl.classList.add('opened');giftOpened=true;return}
  if(animate){giftEl.classList.add('drop');setTimeout(()=>{giftEl.classList.remove('drop');giftEl.classList.add('idle')},1000*(FAST?.3:1))}
  else giftEl.classList.add('idle');
}
function onGiftActivate(){
  if(!giftOn||giftOpened)return;
  if(giftClickRes){const r=giftClickRes;giftClickRes=null;giftEl.classList.remove('ready');giftHint.classList.remove('show');r()}
  else{giftEl.classList.add('nudge');setTimeout(()=>giftEl.classList.remove('nudge'),480)}     // "not yet"
}
giftEl.addEventListener('click',e=>{e.stopPropagation();onGiftActivate()});
giftEl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onGiftActivate()}});
function waitForGiftClick(){
  if(!giftOn)return Promise.resolve();                       // no sprites -> do not get stuck
  giftEl.classList.add('ready');giftHint.classList.add('show');
  if(DBG.auto)setTimeout(onGiftActivate,1100);
  return new Promise(res=>{giftClickRes=res});
}
function heartCenter(){const r=heartEl.getBoundingClientRect();return{x:(r.left+r.width/2-box.left)/box.P,y:(r.top+r.height/2-box.top)/box.P}}
function burst(n=46){const c=heartCenter();for(let i=0;i<n;i++){const a=Math.random()*6.283,sp=8+Math.random()*28;
  particles.push({x:c.x,y:c.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-6,life:.9+Math.random()*.9,max:1.6,g:190+Math.random()*60|0,big:Math.random()<.3})}}
async function openGiftBox(){
  if(!giftOn||giftOpened)return;
  giftEl.classList.remove('idle','drop','ready');void giftEl.offsetWidth;giftEl.classList.add('open');
  await sleep(1900);flashEl.style.opacity=.3;burst();setTimeout(()=>flashEl.style.opacity=0,350);   // the heart is nearly up
  await sleep(700);giftOpened=true;
  giftEl.classList.remove('open');giftEl.classList.add('opened');
  await sleep(500);
}

/* ---- stage transitions: ordered-dither dissolve between two pictures ---- */
const BAY8=(()=>{let m=[[0,2],[3,1]];for(let k=0;k<2;k++){const n=m.length,nm=Array.from({length:n*2},()=>Array(n*2));
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=m[y][x]*4;nm[y][x]=v;nm[y][x+n]=v+2;nm[y+n][x]=v+3;nm[y+n][x+n]=v+1}m=nm}return m.flat().map(v=>(v+.5)/64)})();
async function showStage(idx,instant=false){
  const m=stageMeta(idx);if(!m)return;
  const im=await loadImg(m.src).catch(()=>null);if(!im)return;
  if(instant||!imgA.getAttribute('src')){imgA.src=m.src;await imgA.decode().catch(()=>{});stageIdx=idx;meta=m;placeClock();return}
  if(idx===stageIdx)return;
  const g=dis.getContext('2d'),B=Math.max(6,Math.round(box.w/110));
  dis.width=Math.round(box.w);dis.height=Math.round(box.h);dis.style.display='block';
  const cols=Math.ceil(dis.width/B),rows=Math.ceil(dis.height/B),order=[];
  for(let by=0;by<rows;by++)for(let bx=0;bx<cols;bx++)order.push([bx,by,BAY8[(by&7)*8+(bx&7)]+Math.random()*.03]);
  order.sort((a,b)=>a[2]-b[2]);
  const kx=im.naturalWidth/dis.width,ky=im.naturalHeight/dis.height,dur=FAST?300:2400,t0=performance.now();let drawn=0;
  await new Promise(res=>{(function step(){
    const p=Math.min(1,(performance.now()-t0)/dur),target=Math.floor(p*order.length);
    for(;drawn<target;drawn++){const [bx,by]=order[drawn];g.drawImage(im,bx*B*kx,by*B*ky,B*kx,B*ky,bx*B,by*B,B,B)}
    p<1?requestAnimationFrame(step):res()})()});
  imgA.src=m.src;await imgA.decode().catch(()=>{});dis.style.display='none';
  stageIdx=idx;meta=m;placeClock();
}

/* ---- live clock: 7-segment digits drawn on the clock screen of the picture, with a title and a mode switch ---- */
const SEG={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
let curMode=0,clockForced=false,clockAuto=true,clockPausedUntil=0,lastSwitch=0,clkKey='',quietLeft=0,quietRes=null;
let clockHover=false,clockClicked=false,flashUntil=0,lastModeSeen=-1;
const nextLockedIdx=()=>unlockedCount();
function modes(){const m=[0];if(state.accepted&&nextLockedIdx()<5)m.push(1);m.push(2);return m}
function nextMode(){const m=modes(),i=m.indexOf(curMode);curMode=m[(i+1)%m.length];lastSwitch=t}
function clockState(){
  let a,b,c,name,units='';
  if(curMode===3){a=0;b=0;c=Math.ceil(quietLeft);name=T('cQuiet');units=T('unitsHMS')}
  else if(curMode===0){const d=new Date(nowMs());a=d.getHours();b=d.getMinutes();c=d.getSeconds();name=T('cNow');units=T('unitsHMS')}
  else{
    const idx=nextLockedIdx(),target=curMode===1?stopMs[idx]:santaMs;
    let rem=target-nowMs();if(!(rem>0))rem=0;
    if(rem>=864e5){a=Math.min(99,Math.floor(rem/864e5));b=Math.floor(rem%864e5/36e5);c=Math.floor(rem%36e5/6e4);units=T('unitsDHM')}
    else{a=Math.floor(rem/36e5);b=Math.floor(rem%36e5/6e4);c=Math.floor(rem%6e4/1e3);units=T('unitsHMS')}
    name=curMode===1?T('cUntil')(THEMES[idx]):T('cSanta');
  }
  return{digits:[a,b,c].map(n=>String(n).padStart(2,'0')).join(''),name,units};
}
const uiFont=px=>LANG==='ro'?`${Math.round(px*1.35)}px "Pixelify Sans","Press Start 2P",monospace`:`${px}px "Press Start 2P",monospace`;
const hexA=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`};
function drawClock(){
  if(!clockForced&&clockAuto&&t-lastSwitch>9&&Date.now()>clockPausedUntil)nextMode();
  if(clockForced)curMode=3;else if(!modes().includes(curMode))curMode=0;
  if(curMode!==lastModeSeen){lastModeSeen=curMode;flashUntil=t+1.7}                     // every mode change shows its title for a moment
  const st=clockState(),w=+clk.dataset.w,h=+clk.dataset.h;if(!w)return;
  const ms=modes(),led=ms.indexOf(curMode),big=h>=30,flash=!big&&t<flashUntil;
  const colon=curMode!==0||Math.floor(t)%2===0,hint=!clockClicked&&!clockForced&&(t%5)<1.5?Math.floor(t*6)%ms.length:-1;
  const key=[st.digits,colon,led,ms.length,curMode,clockHover,hint,flash,st.name,st.units,flash?1:0,meta.digit].join('|');
  if(key===clkKey)return;clkKey=key;
  const c=cctx,lit=meta.digit||'#e6e6e6',pad=Math.max(2,Math.round(h*.07));
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=meta.screen||'#0b0b0b';c.fillRect(0,0,w,h);c.textBaseline='alphabetic';
  const fitFont=(txt,maxW,sizes)=>{for(const f of sizes){c.font=uiFont(f);if(c.measureText(txt).width<=maxW)return f}return sizes[sizes.length-1]};
  // --- mode switch (top right): one segment per mode, the active one lit; brighter on hover, a travelling wave as a hint
  const n=ms.length,sw=clamp(Math.round(h*.24),6,12),sh=clamp(Math.round(h*.12),3,5),gap=2,swW=n*sw+(n-1)*gap,sx=w-pad-swW-1,sy=pad+1;
  if(!clockForced&&!flash){
    for(let k=0;k<n;k++){
      const on=k===led||k===hint,x=sx+k*(sw+gap);
      c.shadowColor=hexA(lit,.45);c.shadowBlur=on?sh*1.2:0;
      c.fillStyle=on?lit:hexA(lit,clockHover?.38:.2);c.fillRect(x,sy,sw,sh);
      c.shadowBlur=0;c.strokeStyle=hexA(lit,clockHover?.95:.55);c.lineWidth=1;c.strokeRect(x-.5,sy-.5,sw+1,sh+1);
    }
  }
  // --- title: on the screen itself (small screens flash it over the digits for a moment)
  const titleRoom=w-2*pad-(clockForced?0:swW)-6;
  let top=pad;
  if(flash){
    const f=fitFont(st.name,w-2*pad,[8,7,6,5]);c.font=uiFont(f);c.fillStyle=lit;c.textAlign='center';
    const two=st.units&&h>=24&&c.measureText(st.units).width<=w-2*pad;
    c.fillText(st.name,w/2,Math.round(h/2+(two?-f*.2:f*.4)));
    if(two){const f2=fitFont(st.units,w-2*pad,[6,5]);c.font=uiFont(f2);c.fillStyle=hexA(lit,.7);c.fillText(st.units,w/2,Math.round(h/2+f*1.0+2))}
    return;
  }
  if(big){
    const f=fitFont(st.name,titleRoom,[8,7,6,5]);c.font=uiFont(f);c.textAlign='left';c.fillStyle=hexA(lit,.82);
    c.fillText(st.name,pad+2,pad+f);top=pad+8+Math.max(3,Math.round(h*.06));        // the same top for every title, so the digits never move or change size
  }
  // --- digits (soft glow, faint ghost segments)
  if(!big)top=pad+sh+3;                                                                  // small screen: switch strip above the digits (space kept even when hidden)
  const unitsRoom=big&&h>=48,unitsH=unitsRoom?8:0,availH=h-top-pad-unitsH,u=Math.max(1,Math.floor(Math.min((w-2*pad)*.96/43,availH/9)*2)/2);
  const x0=Math.round((w-43*u)/2),y0=Math.round(top+(availH-9*u)/2);
  const ghost=hexA(lit,.07),R=(x,y,ww,hh,on)=>{c.fillStyle=on?lit:ghost;c.fillRect(x0+x*u,y0+y*u,ww*u,hh*u)};
  c.shadowColor=hexA(lit,.32);c.shadowBlur=u*.5;
  const pos=[0,6,16,22,32,38];
  for(let k=0;k<6;k++){const g=SEG[+st.digits[k]],x=pos[k],on=q=>g.includes(q);
    R(x+1,0,3,1,on('a'));R(x,1,1,3,on('f'));R(x+4,1,1,3,on('b'));R(x+1,4,3,1,on('g'));R(x,5,1,3,on('e'));R(x+4,5,1,3,on('c'));R(x+1,8,3,1,on('d'));}
  for(const cx of [13,29])for(const dy of [2,6])R(cx,dy,1,1,colon);
  c.shadowBlur=0;
  if(unitsRoom){const f=fitFont(st.units,w-2*pad,[6,5]);c.font=uiFont(f);c.textAlign='center';c.fillStyle=hexA(lit,.55);c.fillText(st.units,w/2,Math.round(h-pad-1))}
}
/* ---- the mouse as a body moving through the air ----------------------------------------------------
   The cursor is a small round body. As it moves, the air has to get out of its way and fill the space behind it:
   - flow around it (potential flow around a moving cylinder): snow ahead is pushed forward, snow at the sides is
     dragged back, and snow behind is sucked in after the cursor;
   - the faster it goes, the more it sheds swirls into the wake (alternately on the left and right, like a vortex
     street); each swirl spins the snow around it and fades out in about a second.
   Slow movement = barely a ripple; a stopped cursor = still air. The path is integrated in small steps, so a fast
   sweep cannot jump over the snowflakes. */
const BODY_R=36;
const PART_FULL=450;                                      // cursor speed (logical px/s) at which the gentle parting reaches full strength; slower than that it fades out quadratically (a crawl barely stirs the snow)
const WAKE_FROM=260,WAKE_FULL=950;                        // cursor speed (logical px/s) below which the air has time to refill behind it (only parting), and above which the wake is fully developed
const sstep=(a,b,x)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u)};                                          // radius of the cursor "body", logical px of the picture
const wind={x:0,y:0,px:0,py:0,sp:0,t:0,on:false,side:1,acc:0};   // x,y = cursor now, px,py = where it was at the last frame, sp = smoothed speed (fx px/s)
const vort=[];                                            // wake swirls: {x,y,g (circulation, sign = spin),rc (core radius),age}
let steam=[],steamAcc=0;
addEventListener('pointermove',e=>{
  const x=(e.clientX-box.left)/box.P-glass.x,y=(e.clientY-box.top)/box.P-glass.y,now=performance.now();
  if(!wind.on){wind.px=x;wind.py=y;wind.sp=0}                  // (re)entering: no jump from the old place
  else{const d=Math.hypot(x-wind.x,y-wind.y),dt=Math.max(.004,(now-wind.t)/1000);wind.sp=wind.sp*.5+Math.min(1500,d/dt)*.5}
  wind.x=x;wind.y=y;wind.t=now;wind.on=true;
},{passive:true});
const windOff=()=>{wind.on=false;wind.sp=0};
document.addEventListener('mouseleave',windOff);addEventListener('blur',windOff);
function stirSnow(dt,k){
  const a=BODY_R*k,a2=a*a,reach=a*4.6,reach2=reach*reach;
  wind.sp*=Math.exp(-dt*7);                                // no events = the cursor has stopped
  const wake=sstep(WAKE_FROM,WAKE_FULL,wind.sp/k);          // 0 = slow: the snow is only gently parted; 1 = fast: low pressure behind the cursor, flow around it, shed swirls
  const part=clamp(wind.sp/k/PART_FULL,0,1)**2;
  if(wind.on){
    const mx=wind.x-wind.px,my=wind.y-wind.py,dist=Math.hypot(mx,my);
    if(dist>.02){
      const n=clamp(Math.ceil(dist/(a*.45)),1,40),sx=mx/n,sy=my/n,ux=mx/dist,uy=my/dist;
      const gain=2,L=a*1.2,sm=dist/n;                              // L = path length between two shed swirls
      for(let s=1;s<=n;s++){
        const cx=wind.px+sx*s,cy=wind.py+sy*s;
        for(const f of flakes){
          let dx=f.x-cx,dy=f.y-cy,r2=dx*dx+dy*dy;if(r2>reach2)continue;
          let r=Math.sqrt(r2);
          if(r<a){if(r<.01){dx=a;dy=0}else{dx*=a/r;dy*=a/r}r=a;r2=a2}   // inside the body: treated as on its surface
          const dd=sx*dx+sy*dy,q=a2/r2,fall=1-clamp((r-a*2.2)/(reach-a*2.2),0,1)**2,mm=gain*q*fall*(1.15-.35*f.z),m=mm/r2;
          // fast: flow around a moving cylinder, u = a²/r² (2 (U·r̂) r̂ - U), U = the step: ahead pushed on, sides dragged back, behind sucked in
          // slow: the air refills behind in time, so the flakes are only pushed out of the way (radially), in proportion to the step
          const pk=(1-wake)*part*.8*mm*sm/r;
          f.x+=wake*m*(2*dd*dx-sx*r2)+pk*dx;f.y+=wake*m*(2*dd*dy-sy*r2)+pk*dy;
        }
        wind.acc+=dist/n;
        if(wind.acc>=L){wind.acc-=L;wind.side=-wind.side;
          const G=wind.side*Math.min(wind.sp,520)*a*5*wake;
          if(Math.abs(G)>a*14)vort.push({x:cx-ux*a*.9-uy*wind.side*a*.85,y:cy-uy*a*.9+ux*wind.side*a*.85,g:G,rc:a*.9,age:0});
          if(vort.length>48)vort.shift()}
      }
    }
    wind.px=wind.x;wind.py=wind.y;
  }
  for(let i=vort.length-1;i>=0;i--){const v=vort[i];v.age+=dt;v.g*=Math.exp(-dt/1);if(v.age>2.4||Math.abs(v.g)<a*6){vort.splice(i,1)}}
  if(vort.length){
    for(const f of flakes){
      let vx=0,vy=0;
      for(const v of vort){
        const rc=v.rc*(1+v.age*.9),dx=f.x-v.x,dy=f.y-v.y,r2=dx*dx+dy*dy;if(r2>rc*rc*25)continue;
        const kk=v.g*(1-Math.exp(-r2/(rc*rc)))/(6.283*Math.max(r2,.5));
        vx-=dy*kk;vy+=dx*kk}
      const vs=Math.hypot(vx,vy),cap=260*k/.3;if(vs>cap){vx*=cap/vs;vy*=cap/vs}      // a very fast flick must not throw the snow across the window
      f.x+=vx*dt*(1.15-.35*f.z);f.y+=vy*dt*(1.15-.35*f.z);
    }
  }
}
const clockBtnEl=$('#clockBtn');
clockBtnEl.addEventListener('click',e=>{e.stopPropagation();if(clockForced)return;clockClicked=true;nextMode();clockPausedUntil=Date.now()+25000});
clockBtnEl.addEventListener('pointerenter',()=>{clockHover=true});clockBtnEl.addEventListener('pointerleave',()=>{clockHover=false});

/* ---- per-frame: lamp glow, falling snow (clipped to the glass), clock ---- */
const makeGR=t=>[6,14,24,38,58,88,130,190,250].map(g=>`rgb(${Math.round(g*t[0])},${Math.round(g*t[1])},${Math.min(255,Math.round(g*t[2]))})`);
let GR=makeGR([1,1,1.02]);
function frame(ts){
  requestAnimationFrame(frame);                          // first, so one bad frame can never stop the loop
  const dt=Math.min(.05,(ts-(frame.last||ts))/1000);frame.last=ts;t+=dt;
  lampPower+=(lampTarget-lampPower)*Math.min(1,dt*lampRate);
  dip*=Math.pow(.02,dt);if(Math.random()<dt*.3)dip=.12+Math.random()*.2;
  flick=(1+.03*Math.sin(t*9)+.02*Math.sin(t*21))*(1-(lampPower>.5?dip:0));
  const b=.1+.9*clamp(lampPower,0,1);if(Math.abs(b-lastBright)>.015){lastBright=b;imgsEl.style.filter=`brightness(${b.toFixed(3)})`}
  if(quietLeft>0){
    quietLeft-=FAST?dt*8:dt;
    if(quietLeft<=0){quietLeft=0;if(quietRes){const r=quietRes;quietRes=null;r()}}
  }
  // overlay canvas
  const P=box.P,k=box.s/P,c=fctx;c.clearRect(0,0,fx.width,fx.height);
  const lx=meta.lamp[0]*k,ly=meta.lamp[1]*k,LR=120*k;
  const lp=clamp(lampPower,0,1)*flick;
  if(lp>.02){c.globalCompositeOperation='lighter';const gr=c.createRadialGradient(lx,ly,0,lx,ly,LR);
    const gc=(meta.glow||[255,255,255]).join(',');gr.addColorStop(0,`rgba(${gc},${(.22*lp).toFixed(3)})`);gr.addColorStop(1,`rgba(${gc},0)`);c.fillStyle=gr;c.fillRect(lx-LR,ly-LR,LR*2,LR*2);c.globalCompositeOperation='source-over'}
  const sway=Math.sin(t*.35)*6,gx=glass.x,gy=glass.y,gw=glass.w,gh=glass.h;
  stirSnow(dt,k);
  const sg=meta.glass?meta.glass.map(v=>v*k):null;
  for(const f of flakes){
    f.y+=(10+f.z*22)*dt*(box.s>.5?1:.8);f.x+=(Math.sin(t*.9+f.ph)*(3+f.z*5)+sway*(.4+f.z))*dt;
    if(f.y>=gh){f.y=-2;f.x=Math.random()*gw}
    if(f.x<0)f.x+=gw;else if(f.x>=gw)f.x-=gw;
    if(f.y<0)continue;
    const x=Math.floor(gx+f.x),y=Math.floor(gy+f.y);
    if(sg&&(x<sg[0]||x>=sg[2]||y<sg[1]||y>=sg[3]))continue;                // outside this stage's own window
    if(occMask&&occMask[y*fx.width+x])continue;
    const dx=x-lx,dy=y-ly,L=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/(LR*1.3))*clamp(lampPower,0,1);
    let i=f.z<.4?4:f.z<.75?5:6;i=Math.min(8,i+Math.round(L*3));
    c.fillStyle=GR[i];c.fillRect(x,y,1,1);
    if(f.z>.9&&Math.sin(t*2.4+f.ph)>-.4){c.fillStyle=GR[i-1];c.fillRect(x-1,y,1,1);c.fillRect(x+1,y,1,1);c.fillRect(x,y-1,1,1);c.fillRect(x,y+1,1,1)}
    else if(f.z>.78){c.fillStyle=GR[i-1];c.fillRect(x+1,y,1,1)}
  }
  // a faint wisp of steam over the mug: small, slow, barely there
  if(meta.cup){
    steamAcc+=dt*4.5;while(steamAcc>=1){steamAcc--;steam.push({x:meta.cup[0]+(Math.random()-.5)*30,y:meta.cup[1],age:0,life:4.5+Math.random()*2.5,vy:9+Math.random()*6,ph:Math.random()*6.28,w:2+Math.random()*2})}
    const sl=clamp(lampPower,0,1),sc=meta.steam||'232,230,226';
    for(let i=steam.length-1;i>=0;i--){const p=steam[i];p.age+=dt;if(p.age>=p.life){steam.splice(i,1);continue}
      const u=p.age/p.life,a=.13*Math.sin(Math.PI*u)*Math.sin(Math.PI*u)*sl;
      const sx=Math.round((p.x+Math.sin(p.age*1.1+p.ph)*(p.w+p.age*2.2))*k),sy=Math.round((p.y-p.age*p.vy)*k);
      c.fillStyle=`rgba(${sc},${(a*.55).toFixed(3)})`;c.fillRect(sx-1,sy-1,3,3);
      c.fillStyle=`rgba(${sc},${a.toFixed(3)})`;c.fillRect(sx,sy,2,2)}
  }
  if(giftOpened&&Math.random()<dt*9){const c=heartCenter();particles.push({x:c.x+(Math.random()-.5)*14,y:c.y+(Math.random()-.5)*10,vx:(Math.random()-.5)*4,vy:-3-Math.random()*5,life:.8,max:.8,g:200+Math.random()*50|0,big:false})}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=5*dt;c.fillStyle=`rgba(255,${p.g},120,${Math.min(1,p.life/p.max*1.6).toFixed(2)})`;
    const z=p.big?2:1;c.fillRect(Math.round(p.x),Math.round(p.y),z,z);if(p.big){c.fillRect(Math.round(p.x)-1,Math.round(p.y),1,1);c.fillRect(Math.round(p.x)+2,Math.round(p.y),1,1)}}
  drawClock();
}

const setLamp=v=>{lampPower=lampTarget=v};
async function lampOnSeq(){
  lampRate=14;
  for(const [v,ms] of [[1,120],[0,180],[.8,70],[0,260],[1,100],[.25,110],[1,0]]){setLamp(v);await sleep(ms)}
  setLamp(1);
}
async function lampDyingSeq(){
  lampRate=14;
  for(const [v,ms] of [[.4,120],[1,150],[.2,200],[.8,110],[.1,300]]){setLamp(v);await sleep(ms)}
  lampRate=3;lampTarget=.25;
}
function lampOut(){lampRate=1.4;lampTarget=0}
async function stageFlicker(){for(const v of [.55,1,.7,1]){setLamp(v);await sleep(90)}}

/* =====================================================================
   DIALOGUE
   ===================================================================== */
const dialog=$('#dialog'),tagEl=$('#tag'),textEl=$('#text'),nextEl=$('#next'),choicesEl=$('#choices'),srEl=$('#sr');
const DBG={auto:QS.has('auto')};
let typing=false,skipTyping=false,advanceRes=null,lineDoneAt=0;
function onAdvance(){
  if(typing){skipTyping=true;return}
  if(advanceRes&&performance.now()-lineDoneAt>150){const r=advanceRes;advanceRes=null;r()}
}
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,#gift'))return;onAdvance()});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&document.activeElement.tagName!=='BUTTON'){e.preventDefault();onAdvance()}
});
const pauseFor=c=>c==='.'||c==='!'||c==='?'?320:c===','||c===':'||c===';'?150:c==='…'?420:c==='\n'?260:0;
async function typeLine(text,voice){
  typing=true;skipTyping=false;
  const shown=document.createElement('span'),rest=document.createElement('span');rest.className='rest';
  textEl.replaceChildren(shown,rest);
  for(let i=0;i<=text.length;i++){
    shown.textContent=text.slice(0,i);rest.textContent=text.slice(i);
    if(skipTyping||DBG.auto){shown.textContent=text;rest.textContent='';break}
    const c=text[i-1];
    await sleep(28+pauseFor(c));
  }
  typing=false;lineDoneAt=performance.now();
}
const L=(t,who,act)=>({t,who,act});
async function say(lines,{hold=false}={}){
  dialog.classList.add('on');
  for(let n=0;n<lines.length;n++){
    const l=lines[n];
    if(l.who){tagEl.textContent=l.who==='SANTA'?T('santa'):l.who;tagEl.classList.add('on')}else tagEl.classList.remove('on');
    textEl.className=l.who?'voice':'narr';
    nextEl.style.opacity=0;srEl.textContent=l.t;
    if(l.act)l.act();
    await typeLine(l.t,!!l.who);
    if(hold&&n===lines.length-1)return;
    nextEl.style.opacity=1;
    if(DBG.auto)await sleep(650);else await new Promise(r=>{advanceRes=r});
    nextEl.style.opacity=0;
  }
}
function choose(opts,autoIdx=0){
  return new Promise(res=>{
    choicesEl.replaceChildren();
    const btns=opts.map((o,i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=o;
      b.addEventListener('click',()=>done(i));
      b.addEventListener('pointerenter',()=>{b.focus({preventScroll:true});});
      choicesEl.appendChild(b);return b;
    });
    choicesEl.classList.add('on');dialog.classList.add('choosing');
    if(DBG.auto)sleep(800).then(()=>btns[Math.min(autoIdx,btns.length-1)].click());   // debug: say yes, skip reminders
    const onKey=e=>{
      const k=e.key;
      if(k==='ArrowDown'||k==='ArrowUp'||k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();const dir=(k==='ArrowDown'||k==='ArrowRight')?1:-1;
        const cur=btns.indexOf(document.activeElement);const n=cur<0?0:(cur+dir+btns.length)%btns.length;btns[n].focus();}
      else if(/^[1-9]$/.test(k)&&btns[+k-1])done(+k-1);
    };
    function done(i){document.removeEventListener('keydown',onKey);dialog.classList.remove('choosing');choicesEl.classList.remove('on');choicesEl.replaceChildren();res(i)}
    document.addEventListener('keydown',onKey);
  });
}

/* =====================================================================
   STEPPER
   ===================================================================== */
const stepsEl=$('#steps'),stepLbl=$('#steplbl'),STEP=CONFIG.stepper,stepNodes=[],linkNodes=[],pxc=STEP.pixelated?' pixelated':'';
const mkLink=(src)=>{const el=document.createElement('img');el.className='link'+pxc;el.alt='';el.setAttribute('aria-hidden','true');el.src=src;stepsEl.appendChild(el);linkNodes.push({el,on:false})};
mkLink(STEP.lines.left);
for(let i=0;i<5;i++){
  const li=document.createElement('li');li.className='step locked';
  const im=document.createElement('img');im.className='frame'+pxc;im.alt='';im.src=STEP.locked;
  const cap=document.createElement('span');cap.className='cap';cap.textContent='???';
  li.append(im,cap);stepsEl.appendChild(li);stepNodes.push({li,im,cap,mode:'locked'});
  if(i<4)mkLink(STEP.lines.mid[i%STEP.lines.mid.length]);
}
mkLink(STEP.lines.right);
// frame i (1-based): after "yes" the first one opens (B/W picture); a stop that has arrived is coloured and the next one opens in B/W
function stepMode(i){return !state.accepted?'locked':i<=state.entered?'colored':i===state.entered+1?'revealed':'locked'}
function renderStepper(animate=false){
  stepNodes.forEach((n,k)=>{
    const m=stepMode(k+1);if(m===n.mode)return;
    n.li.className='step '+m;n.im.src=m==='locked'?STEP.locked:STEP.frames[k];n.cap.textContent=m==='locked'?'???':THEMES[k].toUpperCase();
    if(animate){const c=m==='colored'?'bloom':'pop';n.li.classList.add(c);setTimeout(()=>n.li.classList.remove(c),2000)}
    n.mode=m;
  });
  const e=state.entered,acc=state.accepted;
  linkNodes.forEach((l,j)=>{                              // left cap: the road has begun | ornament j: its stop arrived | right cap: all arrived
    const on=STEP.colorLines&&(j===0?acc:j===5?e>=5:e>=j+1);if(on===l.on)return;l.on=on;
    l.el.classList.toggle('colored',on);if(on&&animate){l.el.classList.add('bloom');setTimeout(()=>l.el.classList.remove('bloom'),2000)}
  });
  const wide=matchMedia('(min-width:700px)').matches;      // wide screens show the themes under the frames; phones get one line
  stepLbl.textContent=!acc?T('roadNotBegun'):e===0?T('firstNear'):wide?'':state.done>=5?T('allDone'):T('stepCount')(THEMES[e-1],e);
}
// sizes are relative to the frame height (unit); the whole row is scaled to fit the screen width
let stepR=0;
function fitStepper(){if(stepR)$('#stepper').style.setProperty('--fs',clamp((innerWidth-28)/stepR,22,60)+'px')}
async function setupStepper(){
  const imgs=[...stepNodes.map(n=>n.im),...linkNodes.map(n=>n.el)];
  await Promise.all([...imgs.map(im=>im.decode().catch(()=>{})),...STEP.frames.map(f=>loadImg(f).catch(()=>{}))]);
  stepR=0;
  for(const im of imgs){
    const hr=(im.naturalHeight||STEP.unit)/STEP.unit;im.style.height=`calc(var(--fs) * ${hr})`;stepR+=(im.naturalWidth||STEP.unit)/STEP.unit;
    if(im.classList.contains('link'))im.style.marginTop=`calc(var(--fs) * ${.5+STEP.lineY-hr/2})`;
  }
  fitStepper();layout();
}
renderStepper();setupStepper();

/* =====================================================================
   REMINDERS (calendar links, no server needed)
   ===================================================================== */
const pad2=n=>String(n).padStart(2,'0');
const icsDate=d=>`${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
function calendar(date,title,details){
  const end=new Date(date.getTime()+30*60000),url=location.href.split(/[?#]/)[0];
  const google=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${icsDate(date)}/${icsDate(end)}&details=${encodeURIComponent(details+'\n'+url)}`;
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//journey//EN','BEGIN:VEVENT',`UID:${icsDate(date)}-${Math.random().toString(36).slice(2)}@journey`,
    `DTSTAMP:${icsDate(new Date())}`,`DTSTART:${icsDate(date)}`,`DTEND:${icsDate(end)}`,`SUMMARY:${title}`,`DESCRIPTION:${details} ${url}`,
    'BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY',`DESCRIPTION:${title}`,'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  return{google,ics};
}
function download(name,type,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const quote=x=>({en:`“${x}”`,ru:`«${x}»`,ro:`„${x}”`})[LANG];
async function askRemind(date,label){
  const cal=calendar(date,T('calTitle')(label),T('calDetails'));
  await say([L(T('remindQ')(label,fmtDate(date)),'SANTA')],{hold:true});
  const c=await choose([T('calGoogle'),T('calIcs'),T('calNo')],2);
  if(c===0){window.open(cal.google,'_blank','noopener')}
  else if(c===1){download('journey-reminder.ics','text/calendar',cal.ics)}
  dialog.classList.remove('on');
}
const remindBtn=$('#remind');let remindTarget=null;
remindBtn.addEventListener('click',async e=>{e.stopPropagation();if(!remindTarget||dialog.classList.contains('on'))return;remindBtn.classList.remove('on');await askRemind(remindTarget.date,remindTarget.label);remindBtn.classList.add('on')});

/* =====================================================================
   STORY
   ===================================================================== */
const santaDay=()=>new Date(santaMs).toLocaleDateString(LOC[LANG],{month:'long',day:'numeric'});
const INTRO=()=>T('intro').map(([t,w])=>L(t,w));

async function runStop(n){
  await showStage(stageFor(n));
  stageFlicker();
  if(state.entered<n){state.entered=n;save();renderStepper(true)}
  if(n>=5)showGift(true);
  const arrive=n===1?[L(T('arrive')[0],'SANTA')]:[L(T('changed')),L(T('arrive')[n-1],'SANTA')];
  await say([...arrive,L(T('ask')(QUESTIONS[n-1]),'SANTA'),L(T('quietLine')(CONFIG.quietSeconds),'SANTA')],{hold:true});
  await choose([T('beginQuiet')]);
  await quietMoment();
  await say([L(T('thatMoment'),'SANTA'),L(n<5?T('after')[n-1]:T('afterLast')(santaDay()),'SANTA')]);
  state.done=n;save();renderStepper(true);
  dialog.classList.remove('on');
  if(n<5)await askRemind(new Date(stopMs[n]),quote(THEMES[n]));
  else if(nowMs()<santaMs)await askRemind(new Date(santaMs),T('lastSurprise'));
}
function quietMoment(){
  dialog.classList.remove('on');
  clockForced=true;curMode=3;quietLeft=CONFIG.quietSeconds;
  return new Promise(res=>{quietRes=res}).then(()=>{clockForced=false;curMode=0;lastSwitch=t});
}

let offeredFirst=false;
async function waitForStop(n){
  const date=new Date(stopMs[n-1]),label=quote(THEMES[n-1]);
  remindTarget={date,label};
  if(state.done===0&&n===1){
    await say([L(T('waitFirst')(label,fmtDate(date)),'SANTA')]);
    if(!offeredFirst){offeredFirst=true;await askRemind(date,label)}
  }else await say([L(T('waitNext')(label,fmtDate(date)),'SANTA')]);
  dialog.classList.remove('on');
  remindBtn.classList.add('on');curMode=1;lastSwitch=t;
  await new Promise(res=>{const iv=setInterval(()=>{if(unlockedCount()>=n){clearInterval(iv);res()}else if(DBG.auto)dbgJump()},FAST?300:1200)});
  remindBtn.classList.remove('on');
}
async function waitForFinale(){
  const date=new Date(santaMs);remindTarget={date,label:T('lastSurprise')};
  await say([L(T('waitFinale')(fmtDate(date)),'SANTA')]);
  dialog.classList.remove('on');remindBtn.classList.add('on');curMode=2;lastSwitch=t;
  await new Promise(res=>{const iv=setInterval(()=>{if(nowMs()>=santaMs){clearInterval(iv);res()}else if(DBG.auto)dbgJump()},FAST?300:1200)});
  remindBtn.classList.remove('on');
}

async function finale(){
  await showStage(stageFor(6));
  stageFlicker();await showGift(false);
  await say([L(T('finDay')),L(T('finBox'),'SANTA'),L(T('finOpen')+(giftOn?'':T('finNoBox')),'SANTA')],{hold:true});
  await waitForGiftClick();
  dialog.classList.remove('on');
  await openGiftBox();
  await say([L(T('finInside')(CONFIG.quietSeconds),'SANTA'),L(T('finReal'),'SANTA'),L(T('finThesis'),'SANTA'),L(T('finTake'),'SANTA')]);
  dialog.classList.remove('on');
  state.finale=true;save();
  await showCard();
}

/* ---- the keepsake card ---- */
async function drawCard(){
  const cv=$('#cardCv'),c=cv.getContext('2d'),W=cv.width,H=cv.height;
  try{await Promise.all([document.fonts.load('28px "Press Start 2P"'),document.fonts.load('30px "Pixelify Sans"')])}catch(e){}
  c.fillStyle='#050505';c.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){const g=90+Math.floor(Math.random()*150);c.fillStyle=`rgb(${g},${g},${g})`;const s=Math.random()<.2?4:2;c.fillRect(Math.floor(Math.random()*W/2)*2,Math.floor(Math.random()*H/2)*2,s,s)}
  const frame=(o,col)=>{c.fillStyle=col;c.fillRect(o,o,W-2*o,6);c.fillRect(o,H-o-6,W-2*o,6);c.fillRect(o,o,6,H-2*o);c.fillRect(W-o-6,o,6,H-2*o)};
  c.fillStyle='#050505';c.fillRect(34,34,W-68,H-68);frame(30,'#ececec');frame(48,'#5a5a5a');
  const title=T('cardTitle'),sub=T('cardSub');
  c.textAlign='center';c.fillStyle='#ececec';c.font=uiFont(title.length>14?30:34);c.fillText(title,W/2,150);
  c.fillStyle='#8c8c8c';c.font=uiFont(sub.length>34?11:14);c.fillText(sub,W/2,196);
  c.textAlign='left';let y=300;
  const qf=LANG==='ru'?{f:'17px "Press Start 2P",monospace',lh:34}:{f:'30px "Pixelify Sans","Press Start 2P",monospace',lh:38};
  const wrap=(txt,maxW)=>{const words=txt.split(' ');let line='',lines=[];for(const w of words){const test=line?line+' '+w:w;if(c.measureText(test).width>maxW&&line){lines.push(line);line=w}else line=test}lines.push(line);return lines};
  QUESTIONS.forEach((q,i)=>{
    c.fillStyle='#e0c88a';c.font=uiFont(20);c.fillText(`${ROM[i]} · ${THEMES[i].toUpperCase()}`,110,y);
    c.fillStyle='#d6d6d6';c.font=qf.f;
    const lines=wrap(q,W-220);lines.forEach((ln,k)=>c.fillText(ln,110,y+46+k*qf.lh));
    y+=46+Math.max(1,lines.length)*qf.lh+40;
    c.fillStyle='#5a5a5a';c.fillRect(110,y-34,W-220,4);
  });
  c.textAlign='center';c.fillStyle='#8c8c8c';c.font=uiFont(13);c.fillText(T('cardFrom')(santaDay()),W/2,H-110);
}
async function showCard(){
  await drawCard();
  const card=$('#card');card.classList.add('on');
  await new Promise(res=>{
    $('#cardSave').onclick=()=>{$('#cardCv').toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='your-december.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)})};
    $('#cardClose').onclick=()=>{card.classList.remove('on');res()};
    if(DBG.auto)setTimeout(()=>$('#cardClose').click(),3500);
  });
  curMode=2;remindBtn.classList.remove('on');
  if(!cardSeen){cardSeen=true;await say([L(T('merry'),'SANTA')]);dialog.classList.remove('on')}
  offerCardAgain();
}
let cardSeen=false,remindIsCard=false;
function offerCardAgain(){
  remindTarget=null;remindIsCard=true;remindBtn.textContent=T('cardAgain');remindBtn.classList.add('on');
  remindBtn.onclick=async e=>{e.stopPropagation();remindBtn.classList.remove('on');await showCard()};
}

/* ---- decline / accept branches ---- */
let declines=0;
const endEl=$('#end'),retry=$('#retry');
async function decline(){
  // 1st: the long ending; 2nd: short and dry; 3rd: "just a game to you" and the lamp goes out in the dark; 4th and on: no words at all
  if(declines>=4){lampDyingSeq().then(lampOut);dialog.classList.remove('on');await sleep(FAST?500:2800);return}
  const a=T(declines===1?'dec1':declines===2?'dec2':'dec3');
  if(declines===1)await say([...a.slice(0,5).map(t=>L(t,'SANTA')),L(a[5],undefined,lampDyingSeq),L(a[6],undefined,lampOut)]);
  else if(declines===2)await say([L(a[0],'SANTA'),L(a[1],undefined,()=>{lampDyingSeq().then(lampOut)})]);
  else await say([L(a[0],'SANTA'),L(a[1],'SANTA',()=>{lampDyingSeq().then(lampOut)})]);
  dialog.classList.remove('on');
}
function endCard(){
  return new Promise(res=>{
    endEl.classList.add('on');
    setTimeout(()=>retry.classList.add('on'),FAST?900:7000);
    retry.onclick=()=>{retry.classList.remove('on');endEl.classList.remove('on');res()};
  });
}
async function accept(){
  await say([L(declines?T('acc1b'):T('acc1'),'SANTA'),...T('acc').map(t=>L(t,'SANTA')),
    L(T('accLights'),undefined,()=>{state.accepted=true;save();renderStepper(true)})]);
  dialog.classList.remove('on');
}

async function intro(){
  await say(INTRO(),{hold:true});
  for(;;){
    const c=await choose([T('yes'),T('no')]);
    if(c===0){await accept();return}
    declines++;
    await decline();
    await endCard();
    await say(declines>=3?[L(T('backLamp'),undefined,()=>lampOnSeq()),L(T('backQ'),'SANTA')]
                         :[L(T('backLamp'),undefined,()=>lampOnSeq()),L(declines>1?T('back2'):T('back1'),'SANTA'),L(T('backQ'),'SANTA')],{hold:true});
  }
}

async function route(){
  for(;;){
    if(state.done<5){
      const n=state.done+1;
      if(unlockedCount()>=n)await runStop(n);else await waitForStop(n);
    }else{
      if(nowMs()>=santaMs){if(state.finale){cardSeen=true;offerCardAgain()}else await finale();return}
      await waitForFinale();
    }
  }
}

/* =====================================================================
   DEBUG PANEL  (open index.html?debug  or  debug.html)
   ===================================================================== */
const setNow=ms=>{NOW_OFFSET=ms-Date.now()};
function dbgJump(){                                    // move the pretend clock to the next date that unlocks something
  if(!state.accepted)return;const u=unlockedCount();
  if(u<5)setNow(stopMs[u]+60000);else if(nowMs()<santaMs)setNow(santaMs+60000);
}
if(QS.has('debug')){
  const st=document.createElement('style');
  st.textContent=`#dbg{position:fixed;left:8px;bottom:8px;z-index:40;font-family:var(--px);font-size:8px;color:#ddd;max-width:calc(100vw - 16px)}
  #dbg .box{display:none;background:rgba(0,0,0,.95);padding:10px;box-shadow:0 0 0 2px #777;margin-bottom:6px;width:340px;max-width:100%}
  #dbg.open .box{display:block}
  #dbg button{font:inherit;color:#ddd;background:#222;border:0;padding:6px 7px;margin:2px;cursor:pointer;box-shadow:0 0 0 1px #666}
  #dbg button:hover{background:#ddd;color:#000}
  #dbg h4{font-size:8px;color:#888;margin:9px 0 3px;font-weight:400}
  #dbg label{display:inline-block;margin:5px 10px 0 0;cursor:pointer}
  #dbg .ro{color:#ffd166;line-height:1.7}#dbg .tip{color:#777;line-height:1.7;margin-top:8px}`;
  document.head.appendChild(st);
  const root=document.createElement('div');root.id='dbg';
  const box=document.createElement('div');box.className='box';
  const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
  const ro=mk('div','ro');box.appendChild(ro);
  const btn=(label,fn)=>{const b=mk('button',null,label);b.type='button';b.onclick=fn;return b};
  const go=(stateObj,ms)=>{                             // set the saved progress + the pretend time, then reload
    try{if(stateObj)localStorage.setItem(KEY,JSON.stringify(stateObj));else localStorage.removeItem(KEY)}catch(e){}
    const p=new URLSearchParams();p.set('debug','');if(FAST)p.set('fast','');if(DBG.auto)p.set('auto','');
    if(ms!=null){const d=new Date(ms);p.set('now',`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`)}
    location.search='?'+p.toString().replace(/=(?=&|$)/g,'');
  };
  box.appendChild(mk('h4',null,'JUMP TO (reloads)'));
  box.appendChild(btn('START',()=>go(null,stopMs[0]-3*864e5)));
  THEMES.forEach((th,i)=>box.appendChild(btn(`${ROM[i]} ${th.toUpperCase()}`,()=>go({accepted:true,done:i,entered:i},stopMs[i]+36e5))));
  box.appendChild(btn('FINALE',()=>go({accepted:true,done:5,entered:5},santaMs+36e5)));
  box.appendChild(btn('AFTER',()=>go({accepted:true,done:5,entered:5,finale:true},santaMs+864e5)));
  box.appendChild(mk('h4',null,'WHILE PLAYING'));
  box.appendChild(btn('NEXT DATE ⏭',dbgJump));
  box.appendChild(btn('SKIP QUIET MOMENT',()=>{if(quietLeft>0)quietLeft=.001}));
  const cb=(label,get,set)=>{const l=mk('label',null,`<input type="checkbox"> ${label}`);const i=l.firstChild;i.checked=get();i.onchange=()=>set(i.checked);return l};
  box.appendChild(mk('div'));
  box.appendChild(cb('FAST',()=>FAST,v=>{FAST=v}));
  box.appendChild(cb('AUTO-PLAY (clicks through everything)',()=>DBG.auto,v=>{DBG.auto=v;if(v&&advanceRes)onAdvance()}));
  box.appendChild(mk('div','tip','Click anywhere to skip a line. AUTO-PLAY says "yes", skips reminders, jumps to the next date by itself, opens the gift and the card.'));
  root.appendChild(box);
  const tg=btn('DEBUG ▾ (D)',()=>root.classList.toggle('open'));root.appendChild(tg);document.body.appendChild(root);
  addEventListener('keydown',e=>{if((e.key==='d'||e.key==='D')&&!e.ctrlKey&&!e.metaKey&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName))root.classList.toggle('open')});
  setInterval(()=>{const d=new Date(nowMs());ro.innerHTML=`TIME ${d.toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}<br>entered ${state.entered} · done ${state.done}${state.finale?' · finale seen':''}`},400);
}

/* =====================================================================
   START
   ===================================================================== */
const gate=$('#gate'),beginView=$('#beginView');let started=false;
function applyStatic(){
  document.title=T('title');document.documentElement.lang=LANG;
  $('#gateA').innerHTML=T('gateA');$('#gateB').textContent=T('gateB');
  $('#endH').textContent=T('endTitle');retry.textContent=T('retry');
  $('#cardSave').textContent=T('cardSave');$('#cardClose').textContent=T('cardClose');
  const fb=$('#cardFeedback');fb.textContent=T('cardFeedback');fb.hidden=!CONFIG.feedbackUrl;if(CONFIG.feedbackUrl)fb.href=CONFIG.feedbackUrl;
  remindBtn.textContent=remindIsCard?T('cardAgain'):T('remindBtn');
  giftHint.textContent=T('tapBox');clockBtnEl.title=clockBtnEl.ariaLabel=T('clockTip');
  muteBtn.title=muteBtn.ariaLabel=T('muteTip');
}
function setLang(l,persist=true){
  if(!TX[l])l='en';LANG=l;THEMES=TX[l].themes;QUESTIONS=TX[l].questions;
  if(persist){try{localStorage.setItem('journey-lang',l)}catch(e){}}
  applyStatic();stepNodes.forEach(n=>{n.mode=''});renderStepper();clkKey='';
}
gate.querySelectorAll('.langs button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setLang(b.dataset.l);gate.classList.remove('pick')}));
/* ---- background music: starts on the first tap (autoplay rules), fades in, loops; the button switches it on/off ---- */
const muteBtn=$('#mute');
const MUS=(()=>{
  const cfg=CONFIG.music;if(!cfg)return null;
  let el=null,ctx=null,gain=null,wanted=true,ready=false,missing=false;
  try{wanted=localStorage.getItem('journey-music')!=='off'}catch(e){}
  const fade=(to,sec)=>{
    if(gain){const n=ctx.currentTime;gain.gain.cancelScheduledValues(n);gain.gain.setValueAtTime(gain.gain.value,n);gain.gain.linearRampToValueAtTime(to,n+Math.max(.05,sec))}
    else if(el)el.volume=to;}                                  // no Web Audio: no smooth fade, just the level
  const paint=()=>{muteBtn.classList.toggle('off',!wanted);muteBtn.setAttribute('aria-pressed',String(wanted))};
  const play=()=>{
    if(!el||missing)return;
    if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});
    el.play().then(()=>{ready=true;fade(cfg.volume,cfg.fadeIn)}).catch(()=>{       // blocked: try again on the next tap
      const again=()=>{removeEventListener('pointerdown',again,true);removeEventListener('keydown',again,true);if(wanted)play()};
      addEventListener('pointerdown',again,true);addEventListener('keydown',again,true)});
  };
  return {
    init(){                                                    // call from inside a tap / key press
      if(el||!cfg.src)return;
      el=new Audio(cfg.src);el.loop=true;el.preload='auto';
      el.addEventListener('error',()=>{missing=true;muteBtn.classList.remove('has')});
      el.addEventListener('canplay',()=>{if(!missing)muteBtn.classList.add('has')},{once:true});
      const AC=window.AudioContext||window.webkitAudioContext;
      if(AC){try{ctx=new AC();gain=ctx.createGain();gain.gain.value=0;ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination)}catch(e){ctx=gain=null}}
      if(!gain)el.volume=0;
      paint();
      if(wanted)play();
    },
    toggle(){
      if(!el||missing)return;
      wanted=!wanted;try{localStorage.setItem('journey-music',wanted?'on':'off')}catch(e){}
      paint();
      if(wanted)play();else{fade(0,.8);setTimeout(()=>{if(!wanted&&el)el.pause()},900)}
    },
    hidden(h){                                                 // pause while the tab is in the background
      if(!el||!ready||!wanted)return;
      if(h){el.pause();if(ctx)ctx.suspend().catch(()=>{})}else play();
    },
  };
})();
muteBtn.addEventListener('click',e=>{e.stopPropagation();MUS&&MUS.toggle()});
document.addEventListener('visibilitychange',()=>{MUS&&MUS.hidden(document.hidden)});

async function start(){
  if(started)return;started=true;
  MUS&&MUS.init();                                            // inside the tap, before any await
  gate.classList.add('hide');
  // show the picture matching the saved progress (the bare park for a first visit); the next stop's change is dissolved in by runStop
  await showStage(stageFor(state.accepted?state.entered:0),true);
  if(state.accepted&&state.finale)showGift(false,true);else if(state.accepted&&state.done>=5)showGift(false);
  await sleep(900);
  artEl.classList.add('on');
  await sleep(3000);
  await lampOnSeq();
  await sleep(800);
  renderStepper();
  $('#stepper').classList.add('on');$('#clockUI').classList.add('on');muteBtn.classList.add('on');
  await sleep(1000);
  if(!state.accepted)await intro();
  await route();
}
beginView.addEventListener('click',start);
beginView.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();start()}});
setLang(LANG,false);
if(!langKnown)gate.classList.add('pick');
if(QS.has('debug')){gate.classList.remove('pick');setTimeout(start,50)}

layout();
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{fitStepper();renderStepper();layout()},150)});
// warm the cache so the first dissolve is instant
CONFIG.stages.forEach((_,i)=>loadImg(stageMeta(i).src).catch(()=>{}));
requestAnimationFrame(frame);
})();
