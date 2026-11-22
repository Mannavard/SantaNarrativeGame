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
  // Stop I opens right after the player says "yes" (so its date is in the past on purpose); the others open on their dates.
  stops:['2000-01-01T00:00','2026-12-15T10:00','2026-12-16T10:00','2026-12-17T10:00','2026-12-18T10:00'],     // Mon (stop I: right after "yes") .. Fri
  santaAt:'2026-12-18T16:00',          // the Secret Santa exchange (the finale opens) - PLACEHOLDER time, set the real one
  quietSeconds:45,                     // length of the "quiet moment" (the pause for thinking)
  quietReadyAfter:20,                  // after this many seconds an "I am ready" button appears
  quietExtra:30,                       // the "thirty more seconds" button adds this much (shown in the last 10 s)
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
    // star = the tree's star (masked until clicked), globe = the snow globe's glass [centre x, y, radius, the snow at its bottom (y)]
    {src:'img/stage4.webp',p:{src:'img/stage4-portrait.webp',lamp:[714,723],cup:[220,1360],glass:[115,112,785,1302],occ:[OCCP.globeA],star:[327,877],globe:[398,1350,76,1398]},cup:[410,663],clock:[1144,680,1378,742],lamp:[1186,252],tilt:1.2,occ:[OCC.books,OCC.globe,OCC.clockBtn],star:[695,362],globe:[628,663,77,702]},
    // Stage 5+ are warm-toned, so they carry a colour theme for the live layers:
    //   screen = colour of the clock screen, digit/unlit = lit and unlit segments, glow = lamp glow, tint = snow colour multiplier
    {src:'img/stage5.webp',p:{src:'img/stage5-portrait.webp',lamp:[710,790],cup:[225,1364],glass:[100,215,792,1298],occ:[OCCP.globeB],star:[327,947],globe:[401,1364,75,1399]},globe:[628,663,77,702],cup:[408,663],clock:[1144,680,1378,742],lamp:[1186,252],tilt:1.25,occ:[OCC.books,OCC.globe,OCC.clockBtn],screen:'#16100f',digit:'#e4c288',unlit:'#2b1e16',glow:[255,190,100],tint:[1,.92,.78],star:[662,380]},
  ],
  // The gift (box + lid cut by tools/prep_gift.py, heart by tools/make_heart.py - swap img/heart.png for the real reveal).
  // Everything is in the 1536x1024 frame / as fractions of the box:  x,y = centre of the box's base on the sill, w = box width;
  // lidFit = where the closed lid sits on the box;  rim = the opening (left corner, front corner, right corner): the heart is hidden below that "V".
  gift:{body:'img/gift-body.png',lid:'img/gift-lid.png',heart:'img/heart.png',
        x:914,y:796,w:150,
        lidFit:{w:1.06,left:-.03,top:-.55},
        rim:[[.03,.27],[.86,.285],[.98,.13]],
        heartW:.5,heartTop:.2,
        riseSeconds:4},                     // after a reload with the box already opened: how long the heart takes to float out (tune to the music's tempo)
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
  // Findings: one card per secret, in this order (the names are TX.findings). Card art is 2:3, e.g. 400x600; `back` is shared.
  // A file that does not exist yet is drawn as a placeholder, so just drop the pictures into public/img/findings/.
  findings:{back:'img/findings/back.png',list:[
    {key:'wind',  img:'img/findings/wind.png'},      // swipe the cursor back and forth over the snow (from the start)
    {key:'branch',img:'img/findings/branch.png'},    // shake the snow off a branch of the big tree (from stop II: there is no snow on day one)
    {key:'globe', img:'img/findings/globe.png'},     // shake the snow globe (from stop IV)
    {key:'star',  img:'img/findings/star.png'},      // light the star on the little tree (from stop IV)
    {key:'f5',    img:'img/findings/f5.png'},        // not designed yet: nothing unlocks it
    {key:'f6',    img:'img/findings/f6.png'},        // not designed yet: nothing unlocks it
  ]},
  clockGrow:[0,4,0,5],                 // landscape: the dark screen in the pictures is a bit taller than each stage's `clock` rect; the live clock may use this much more [left, up, right, down] (logical px)
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
const ROM=['I','II','III','IV','V','VI'];
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
 themes:["Time", "Light", "Memory", "Gratitude", "Generosity"],
 questions:["When did I last lose track of time doing something I love?", "What lights up my life when everything around me is dark?", "Which memory is my most precious Christmas ornament?", "What good thing in my life have I stopped noticing?", "Whom did I once make so happy that I still remember it?"],
 roadNotBegun:"THE ROAD HASN'T BEGUN",firstNear:'THE FIRST MOMENT IS NEAR',allDone:'ALL FIVE MOMENTS DONE',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'NOW',cSanta:'UNTIL SECRET SANTA',cUntil:th=>`UNTIL ${th.toUpperCase()}`,cQuiet:'QUIET MOMENT',
 unitsDHM:'DAYS · HRS · MIN',unitsHMS:'HRS · MIN · SEC',
 clockTip:'Tap to switch: now · until the next moment · until Secret Santa',
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
  'Someone has been here. There is a tree now, small and quiet.',
  'The tree is glowing now. Warm little lights run along the windowsill.',
  'The tree is dressed up. And on the sill there is a snow globe, a tiny winter of its own.',
  'There are people around the tree now. Dancing in the snow, hand in hand. You are not alone out there.',
  'There is a box on the windowsill. It is not for you yet.',
 ],
 starters:[["It was when…"], ["I feel lighter when…"], ["I remember how…"], ["Next to me there is…", "Thank you for…"], ["I remember how I made… happy"]],howTo:"Nobody is listening. There is no right answer: the first thought is the true one.",
 cues:["What came first?", "And what is behind that?"],qReady:"I am ready",qMore:"Thirty more seconds",
 reflect:[["You lose track of time exactly when you are truly here.", "Clocks count minutes, but they do not know which of them were yours.", "Today, notice one minute you would want to live again."], ["Everyone has a lantern of their own: a person, a song, a habit. You do not notice it until it gets dark.", "Light does not have to be big. Sometimes it is one window in a stranger's house, or one sentence.", "Do one thing today that lights you up. On purpose."], ["Every ornament on a tree is somebody's story.", "Memory is not an archive. It is what we chose to keep. Choosing a memory, you choose what you are made of.", "Tell that story to someone. A story that is told lives longer."], ["A lot of the good in life does not catch the eye. It is simply there: a warm room, someone's patience, a morning without pain. Habit makes it invisible.", "Gratitude brings it back into view. Not because anyone owes you, but because without it you would be someone else.", "Say \"thank you\" out loud today: to a person, to the world outside the window, or to yourself."], ["There is a quiet joy in making someone feel good. Remember hiding a present and waiting for it to be found? The giver's joy is often quieter, but it lasts longer.", "Giving is one of the few ways to feel needed and strong at once.", "If you feel like it, repeat that feeling today: one small joy for someone, no strings attached. And then the box on the sill, as promised."]],
 beginQuiet:'Begin the quiet moment',
 afterLast:d=>`That was the last question. See you on ${d}.`,
 remindQ:(l,d)=>`Want a reminder for ${l}? It opens ${d}.`,
 calGoogle:'Google Calendar',calIcs:'Download .ics (Apple / Outlook)',calNo:'No, thanks',
 calTitle:l=>`The Journey: ${l} opens`,calDetails:'Come back to the window. A new stop is waiting.',
 lastSurprise:'the last surprise',
 waitFirst:(l,d)=>`The first moment, ${l}, opens ${d}. Until then: the window, the snow, the clock.`,
 waitNext:(l,d)=>`Nothing has changed yet. ${l} opens ${d}.`,
 waitFinale:d=>`All five stops are done. The box on the windowsill opens on ${d}.`,
 remindBtn:'REMIND ME TO COME BACK',
 finDay:'It is the day.',finBox:'The box on the windowsill has been waiting for you.',finOpen:'Go on. Open it.',finNoBox:' (Imagine a box here.)',
 tapBox:'TAP THE BOX',
 finInside:()=>`Inside there is nothing you can hold. Only a heart, and five questions, and the time you gave to each of them.`,
 finReal:'And somewhere nearby, a real box is waiting with your name on it.',
 finThesis:'Time is the one thing nobody can wrap.\nA gift is just a reason to spend it on someone.',
 finTake:'Take this with you. Ask the questions again, sometime.',merry:'Merry everything.',
 cardTitle:'YOUR DECEMBER',cardSub:'FIVE QUESTIONS WORTH ASKING AGAIN',cardFrom:d=>`FROM YOUR SECRET SANTA · ${d.toUpperCase()}`,
 cardSave:'SAVE THE CARD',cardClose:'CLOSE',cardAgain:'OPEN THE CARD AGAIN',cardFeedback:'TELL THE AUTHOR WHAT YOU THOUGHT >',
 endTitle:'THE END?',retry:'CHANGE YOUR MIND',
 dec1:['I see. It happens.','Deadlines, calls, tickets… all very important.',"But adventure doesn't knock twice.\nYou missed yours.","And that's how life goes — in a rush, between tasks, past the most interesting things. Tra-la-la.","You'll still get a gift. But it will be just a gift.",'The lamp flickers. Once. Twice.','And goes out.'],
 dec2:['As you wish. The road will wait.','The lamp flickers… and goes out.'],
 dec3:['Looks like this is just a game to you.','Fine. I will wait aside while you play.'],
 backLamp:'The lamp shudders… and lights up again.',back1:'I knew you would come back.',back2:'Stubborn. But fine.',backQ:'So? Shall we go?',
 acc1:'Great. I was hoping you would say yes.',acc1b:'Now it is for real.',
 acc:['The rules are simple. Five stops. One question at each.','There is nothing to type. Nobody is listening, nobody is keeping score. That is the point.',"The questions are for you. Ask them quietly. Answer them honestly. Or don't — it's your road.","One stop a day, five in all. A gift doesn't like to be rushed."],
 accLights:'Above the window, five small lights come on. That is your path.',
 findsTitle:'FINDINGS',findsBtn:'Findings',found:'A FINDING',findLocked:'???',findsClose:'CLOSE',
 findings:{wind:'The Blizzard Painter',branch:'Shake Off Winter',globe:'A Tiny Winter',star:'Starlight',f5:'',f6:''},
},
ru:{
 title:'Путешествие',
 gateA:'найди тихий уголок<br>и не торопись',gateB:'[ НАЖМИ, ЧТОБЫ НАЧАТЬ ]',
 santa:'САНТА',
 themes:["Время", "Свет", "Память", "Благодарность", "Щедрость"],
 questions:["Когда я в последний раз терял счёт времени, занимаясь тем, что люблю?", "Что в моей жизни зажигает свет, когда вокруг темно?", "Какое воспоминание — моя самая дорогая ёлочная игрушка?", "Что хорошее в моей жизни я давно перестал замечать?", "Кого я когда-то порадовал так, что помню это до сих пор?"],
 roadNotBegun:'ДОРОГА ЕЩЁ НЕ НАЧАЛАСЬ',firstNear:'ПЕРВЫЙ МОМЕНТ БЛИЗКО',allDone:'ВСЕ ПЯТЬ МОМЕНТОВ ПРОЙДЕНЫ',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'СЕЙЧАС',cSanta:'ДО ТАЙНОГО САНТЫ',cUntil:th=>`ДО: ${th.toUpperCase()}`,cQuiet:'ТИХИЙ МОМЕНТ',
 unitsDHM:'ДНИ · ЧАС · МИН',unitsHMS:'ЧАС · МИН · СЕК',
 clockTip:'Нажми, чтобы переключить: сейчас · до следующего момента · до Тайного Санты',
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
  'Здесь кто-то побывал. Теперь тут стоит ёлочка — маленькая и тихая.',
  'Ёлка засветилась. Вдоль подоконника тянутся тёплые огоньки.',
  'Ёлка нарядная. А на подоконнике появился снежный шар — маленькая зима внутри.',
  'Вокруг ёлки теперь люди. Они танцуют в снегу, взявшись за руки. Одиночества здесь больше нет.',
  'На подоконнике стоит коробка. Пока что она не для тебя.',
 ],
 starters:[["Это было, когда…"], ["Мне светлее, когда…"], ["Я помню, как…"], ["Рядом со мной есть…", "Спасибо за…"], ["Я помню, как порадовал…"]],howTo:"Никто не слушает. Правильного ответа нет: первая мысль и есть настоящая.",
 cues:["Что пришло первым?", "А что стоит за этим?"],qReady:"Я готов",qMore:"Ещё полминуты",
 reflect:[["Счёт времени теряешь именно тогда, когда по-настоящему здесь.", "Часы считают минуты, но не знают, какие из них были твоими.", "Заметь сегодня одну минуту, которую захотелось бы повторить."], ["У каждого есть свой фонарь: человек, песня, привычка. Его не замечаешь, пока не стемнеет.", "Свет не обязан быть большим. Иногда это одно окно в чужом доме или одна фраза.", "Сделай сегодня один раз то, что тебя зажигает. Нарочно."], ["На ёлке каждая игрушка — чья-то история.", "Память — не архив, а то, что мы выбрали беречь. Выбирая воспоминание, выбираешь, из чего ты состоишь.", "Расскажи эту историю кому-нибудь. Рассказанное живёт дольше."], ["Многое хорошее не бросается в глаза, оно просто есть: тёплая комната, чьё-то терпение, утро без боли. Привычка делает его невидимым.", "Благодарность возвращает это в поле зрения. Не потому, что кто-то обязан, а потому, что без этого ты был бы другим.", "Скажи «спасибо» вслух сегодня: человеку, миру за окном или себе."], ["Есть тихая радость — сделать кому-то хорошо. Помнишь, как прячешь подарок и ждёшь, когда его найдут? У того, кто дарит, радость часто тише, но длится дольше.", "Отдавать — один из немногих способов почувствовать себя нужным и сильным одновременно.", "Если захочется, повтори это чувство сегодня: одна маленькая радость для кого-то, без расчёта. А потом — коробка на подоконнике, как обещано."]],
 beginQuiet:'Начать тихий момент',
 afterLast:d=>`Это был последний вопрос. До встречи ${d}.`,
 remindQ:(l,d)=>`Напомнить про ${l}? Откроется ${d}.`,
 calGoogle:'Google Календарь',calIcs:'Скачать .ics (Apple / Outlook)',calNo:'Нет, спасибо',
 calTitle:l=>`Путешествие: откроется ${l}`,calDetails:'Вернись к окну. Тебя ждёт новая остановка.',
 lastSurprise:'последний сюрприз',
 waitFirst:(l,d)=>`Первый момент — ${l} — откроется ${d}. А пока: окно, снег, часы.`,
 waitNext:(l,d)=>`Пока ничего не изменилось. ${l} откроется ${d}.`,
 waitFinale:d=>`Все пять остановок пройдены. Коробка на подоконнике откроется ${d}.`,
 remindBtn:'НАПОМНИТЬ ВЕРНУТЬСЯ',
 finDay:'Этот день настал.',finBox:'Коробка на подоконнике ждёт тебя.',finOpen:'Давай. Открой её.',finNoBox:' (Представь здесь коробку.)',
 tapBox:'НАЖМИ НА КОРОБКУ',
 finInside:()=>`Внутри нет ничего, что можно удержать в руках. Только сердце, пять вопросов и время, которое досталось каждому из них.`,
 finReal:'А где-то рядом ждёт настоящая коробка с твоим именем.',
 finThesis:'Время — единственное, что нельзя упаковать.\nПодарок — просто повод потратить его на кого-то.',
 finTake:'Возьми это с собой. Когда-нибудь задай эти вопросы снова.',merry:'Счастливых праздников.',
 cardTitle:'ТВОЙ ДЕКАБРЬ',cardSub:'ПЯТЬ ВОПРОСОВ, КОТОРЫЕ СТОИТ ЗАДАТЬ СНОВА',cardFrom:d=>`ОТ ТВОЕГО ТАЙНОГО САНТЫ · ${d.toUpperCase()}`,
 cardSave:'СОХРАНИТЬ КАРТОЧКУ',cardClose:'ЗАКРЫТЬ',cardAgain:'ОТКРЫТЬ КАРТОЧКУ СНОВА',cardFeedback:'НАПИСАТЬ АВТОРУ, ЧТО ДУМАЕШЬ >',
 endTitle:'КОНЕЦ?',retry:'ПЕРЕДУМАТЬ',
 dec1:['Понятно. Бывает.','Дедлайны, созвоны, тикеты… всё очень важно.','Но приключение не стучится дважды.\nСвоё — упущено.','Так и жизнь проходит — в спешке, между задачами, мимо самого интересного. Тра-ля-ля.','Подарок ты всё равно получишь. Но это будет просто подарок.','Фонарь мигает. Раз. Другой.','И гаснет.'],
 dec2:['Как скажешь. Дорога подождёт.','Фонарь мигает… и гаснет.'],
 dec3:['Похоже, для тебя это просто игра.','Хорошо. Я подожду в стороне, пока ты наиграешься.'],
 backLamp:'Фонарь вздрагивает… и загорается снова.',back1:'Я знал, что ты вернёшься.',back2:'Упрямство. Ну ладно.',backQ:'Ну что? Идём?',
 acc1:'Отлично. Я надеялся, что ты согласишься.',acc1b:'Вот теперь — по-настоящему.',
 acc:['Правила простые. Пять остановок. На каждой — один вопрос.','Печатать ничего не нужно. Никто не слушает и никто не ведёт счёт. В этом смысл.','Вопросы — для тебя. Задавай их тихо. Отвечай честно. А можешь и не отвечать — это твоя дорога.','Одна остановка в день, всего пять. Подарок не любит спешки.'],
 accLights:'Над окном загораются пять маленьких огоньков. Это твой путь.',
 findsTitle:'НАХОДКИ',findsBtn:'Находки',found:'НАХОДКА',findLocked:'???',findsClose:'ЗАКРЫТЬ',
 findings:{wind:'Художник Метели',branch:'Стряхнуть Зиму',globe:'Маленькая Зима',star:'Звёздный Свет',f5:'',f6:''},
},
ro:{
 title:'Călătoria',
 gateA:'găsește un colț liniștit<br>și nu te grăbi',gateB:'[ APASĂ PENTRU A ÎNCEPE ]',
 santa:'MOȘ CRĂCIUN',
 themes:["Timp", "Lumină", "Amintire", "Recunoștință", "Generozitate"],
 questions:["Când mi-am pierdut ultima dată noțiunea timpului făcând ceva ce iubesc?", "Ce îmi aprinde lumina în viață atunci când în jur e întuneric?", "Care amintire e cea mai prețioasă podoabă din bradul meu?", "Ce lucru bun din viața mea am încetat de mult să observ?", "Pe cine am bucurat cândva atât de mult încât țin minte și acum?"],
 roadNotBegun:'DRUMUL NU A ÎNCEPUT ÎNCĂ',firstNear:'PRIMA CLIPĂ E APROAPE',allDone:'TOATE CELE CINCI CLIPE',
 stepCount:(th,e)=>`${th.toUpperCase()} · ${e} / 5`,
 cNow:'ACUM',cSanta:'PÂNĂ LA MOȘUL SECRET',cUntil:th=>`PÂNĂ LA ${th.toUpperCase()}`,cQuiet:'CLIPĂ DE LINIȘTE',
 unitsDHM:'ZILE · ORE · MIN',unitsHMS:'ORE · MIN · SEC',
 clockTip:'Apasă pentru a comuta: acum · până la următoarea clipă · până la Moșul Secret',
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
  'Cineva a fost aici. Acum e un brad, mic și liniștit.',
  'Bradul s-a luminat. De-a lungul pervazului sunt luminițe calde.',
  'Bradul e împodobit. Iar pe pervaz e un glob cu zăpadă, o mică iarnă de sine stătătoare.',
  'Acum sunt oameni în jurul bradului. Dansează în zăpadă, mână în mână. Singurătatea a rămas în urmă.',
  'Pe pervaz e o cutie. Deocamdată nu e pentru tine.',
 ],
 starters:[["A fost atunci când…"], ["Mi-e mai luminos când…"], ["Îmi amintesc cum…"], ["Lângă mine este…", "Mulțumesc pentru…"], ["Îmi amintesc cum am bucurat…"]],howTo:"Nimeni nu ascultă. Nu există un răspuns corect: primul gând e cel adevărat.",
 cues:["Ce a venit primul?", "Și ce se află în spatele lui?"],qReady:"Sunt gata",qMore:"Încă treizeci de secunde",
 reflect:[["Pierzi noțiunea timpului exact atunci când ești cu adevărat aici.", "Ceasurile numără minutele, dar nu știu care dintre ele au fost ale tale.", "Observă azi un minut pe care ai vrea să-l trăiești din nou."], ["Fiecare are felinarul lui: un om, o melodie, un obicei. Nu-l observi până nu se întunecă.", "Lumina nu trebuie să fie mare. Uneori e o fereastră într-o casă străină sau o singură frază.", "Fă azi, o dată, ceea ce te aprinde. Intenționat."], ["Fiecare podoabă din brad e povestea cuiva.", "Memoria nu e o arhivă, ci ceea ce am ales să păstrăm. Alegând o amintire, alegi din ce ești făcut.", "Povestește-o cuiva. Ce se povestește trăiește mai mult."], ["Multe lucruri bune nu se văd, pur și simplu sunt acolo: o cameră caldă, răbdarea cuiva, o dimineață fără durere. Obișnuința le face invizibile.", "Recunoștința le aduce înapoi în vedere. Nu pentru că ți le datorează cineva, ci pentru că fără ele ai fi altul.", "Spune azi „mulțumesc” cu voce tare: unui om, lumii de dincolo de fereastră sau ție."], ["Există o bucurie liniștită în a face pe cineva să se simtă bine. Îți amintești cum ascundeai un cadou și așteptai să fie găsit? Bucuria celui care dăruiește e adesea mai tăcută, dar durează mai mult.", "A da e unul dintre puținele moduri de a te simți deopotrivă necesar și puternic.", "Dacă ai chef, repetă azi sentimentul: o mică bucurie pentru cineva, fără calcul. Iar apoi, cutia de pe pervaz, ca promis."]],
 beginQuiet:'Începe clipa de liniște',
 afterLast:d=>`Aceasta a fost ultima întrebare. Ne vedem pe ${d}.`,
 remindQ:(l,d)=>`Vrei un memento pentru ${l}? Se deschide ${d}.`,
 calGoogle:'Google Calendar',calIcs:'Descarcă .ics (Apple / Outlook)',calNo:'Nu, mulțumesc',
 calTitle:l=>`Călătoria: se deschide ${l}`,calDetails:'Întoarce-te la fereastră. Te așteaptă o nouă oprire.',
 lastSurprise:'ultima surpriză',
 waitFirst:(l,d)=>`Prima clipă, ${l}, se deschide ${d}. Până atunci: fereastra, zăpada, ceasul.`,
 waitNext:(l,d)=>`Încă nimic nu s-a schimbat. ${l} se deschide ${d}.`,
 waitFinale:d=>`Toate cele cinci opriri sunt parcurse. Cutia de pe pervaz se deschide ${d}.`,
 remindBtn:'AMINTEȘTE-MI SĂ MĂ ÎNTORC',
 finDay:'Ziua a venit.',finBox:'Cutia de pe pervaz te așteaptă.',finOpen:'Hai. Deschide-o.',finNoBox:' (Imaginează-ți aici o cutie.)',
 tapBox:'APASĂ PE CUTIE',
 finInside:()=>`Înăuntru nu e nimic ce poți ține în mână. Doar o inimă, cinci întrebări și timpul pe care i l-ai dat fiecăreia.`,
 finReal:'Iar undeva aproape te așteaptă o cutie adevărată, cu numele tău pe ea.',
 finThesis:'Timpul e singurul lucru pe care nu-l poate împacheta nimeni.\nUn cadou e doar un motiv de a-l petrece cu cineva.',
 finTake:'Ia asta cu tine. Pune din nou aceste întrebări, cândva.',merry:'Sărbători fericite.',
 cardTitle:'DECEMBRIE AL TĂU',cardSub:'CINCI ÎNTREBĂRI CARE MERITĂ PUSE DIN NOU',cardFrom:d=>`DE LA MOȘUL TĂU SECRET · ${d.toUpperCase()}`,
 cardSave:'SALVEAZĂ FELICITAREA',cardClose:'ÎNCHIDE',cardAgain:'DESCHIDE FELICITAREA DIN NOU',cardFeedback:'SPUNE-I AUTORULUI CE GÂNDEȘTI >',
 endTitle:'SFÂRȘIT?',retry:'M-AM RĂZGÂNDIT',
 dec1:['Înțeleg. Se întâmplă.','Deadline-uri, apeluri, tichete… toate foarte importante.','Dar aventura nu bate de două ori la ușă.\nPe a ta ai pierdut-o.','Așa trece viața — în grabă, între sarcini, pe lângă cele mai interesante lucruri. Tra-la-la.','Cadoul tot îl vei primi. Dar va fi doar un cadou.','Felinarul pâlpâie. O dată. A doua oară.','Și se stinge.'],
 dec2:['Cum vrei. Drumul va aștepta.','Felinarul pâlpâie… și se stinge.'],
 dec3:['Se pare că, pentru tine, e doar un joc.','Bine. Aștept deoparte cât timp te joci.'],
 backLamp:'Felinarul tresare… și se aprinde din nou.',back1:'Știam că te vei întoarce.',back2:'Încăpățânare. Dar fie.',backQ:'Deci? Mergem?',
 acc1:'Grozav. Speram să spui da.',acc1b:'Acum e pe bune.',
 acc:['Regulile sunt simple. Cinci opriri. La fiecare, o întrebare.','Nu trebuie să scrii nimic. Nimeni nu ascultă, nimeni nu ține scorul. Asta e ideea.','Întrebările sunt pentru tine. Pune-le în liniște. Răspunde sincer. Sau nu — e drumul tău.','O oprire pe zi, cinci în total. Unui cadou nu-i place graba.'],
 accLights:'Deasupra ferestrei se aprind cinci luminițe. Acesta e drumul tău.',
 findsTitle:'DESCOPERIRI',findsBtn:'Descoperiri',found:'O DESCOPERIRE',findLocked:'???',findsClose:'ÎNCHIDE',
 findings:{wind:'Pictorul Viscolului',branch:'Scutură Iarna',globe:'O Iarnă Mică',star:'Lumină de Stea',f5:'',f6:''},
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
state.secrets=state.secrets||{};state.findSeen=state.findSeen||[];   // findings: the secrets found ({key:true}) and those the collection has already shown
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}};

/* =====================================================================
   ARTWORK
   ===================================================================== */
let PORT=false,LW=1536,LH=1024,orientChanged=false;          // logical frame of the stage pictures: 1536x1024 on wide screens, CONFIG.portrait on phones
/* the stage as it is meant for the current orientation (portrait overrides are merged over the base entry) */
const stageMeta=i=>{const m=CONFIG.stages[i];if(!m||!PORT)return m;const P=CONFIG.portrait;return {...m,clock:P.clock,tilt:P.tilt,...m.p}};
const artEl=$('#art'),imgsEl=$('#imgs'),imgA=$('#imgA'),fx=$('#fx'),fctx=fx.getContext('2d'),clk=$('#clk'),cctx=clk.getContext('2d');
let box={s:1,left:0,top:0,w:LW,h:LH,P:2},glass={x:0,y:0,w:1,h:1},flakes=[];
let stageIdx=0,meta=stageMeta(0);
let breathA=0,t=0,lampPower=0,lampTarget=0,lampRate=14,flick=1,dip=0,lastBright=-1,dpr=1;
const imgCache={};
const loadImg=src=>imgCache[src]||(imgCache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('missing '+src));i.src=src}));
const stageFor=n=>Math.min(Math.max(n,0),CONFIG.stages.length-1);      // 0 = start (no tree), 1..5 = stop, 6 = finale -> picture index (the last one is reused)

function layout(){
  const vw=innerWidth,vh=innerHeight,portrait=vh>vw*1.1,topInset=Math.ceil($('#stepper').getBoundingClientRect().bottom)+10;
  document.documentElement.style.setProperty('--below-stepper',topInset+'px');      // the corner buttons sit there (styles.css #corner)
  if(portrait!==PORT){PORT=portrait;LW=PORT?CONFIG.portrait.w:1536;LH=PORT?CONFIG.portrait.h:1024;orientChanged=true}
  dpr=Math.min(2,window.devicePixelRatio||1);
  let s,left,top;
  if(PORT){const pf=CONFIG.portrait,room=clamp(vh*.27,150,pf.dialogMax);     // phones: the whole window, from under the stepper to just above the dialogue
    s=Math.max(.05,Math.min(vw/LW,(vh-topInset-16-room)/pf.fitY));left=(vw-LW*s)/2;top=topInset}
  else{const room=clamp(vh*.3,150,240);      // the dialogue and the quiet moment get the bottom of the screen: the picture ends above them, only its dark bottom 15% may run under the text
    s=Math.max(.05,Math.min(vw/LW,(vh-topInset)/LH,(vh-topInset-room)/(LH*.85)));left=(vw-LW*s)/2;top=topInset}      // never <=0 (a hidden or zero-height window)
  box={s,left,top,w:LW*s,h:LH*s,P:Math.max(2,Math.round(3*s))};
  imgsEl.style.left=left+'px';imgsEl.style.top=top+'px';imgsEl.style.width=box.w+'px';imgsEl.style.height=box.h+'px';
  fx.style.left=left+'px';fx.style.top=top+'px';fx.style.width=box.w+'px';fx.style.height=box.h+'px';
  fx.width=Math.ceil(box.w/box.P);fx.height=Math.ceil(box.h/box.P);
  const hi=$('#fxHi');Object.assign(hi.style,{left:left+'px',top:top+'px',width:box.w+'px',height:box.h+'px'});hi.width=Math.round(box.w*dpr);hi.height=Math.round(box.h*dpr);
  const g=PORT?CONFIG.portrait.glass:CONFIG.glass,k=s/box.P;glass={x:g[0]*k,y:g[1]*k,w:(g[2]-g[0])*k,h:(g[3]-g[1])*k};
  flakes=[];const n=Math.round(glass.w*glass.h/105);
  for(let i=0;i<n;i++)flakes.push({x:Math.random()*glass.w,y:Math.random()*glass.h,z:Math.random(),ph:Math.random()*6.28,vx:0,vy:0});
  placeClock();placeGift();
  if(orientChanged){orientChanged=false;showStage(stageIdx)}     // the phone was turned: switch to the other set of pictures
}
function placeClock(){
  const c0=meta.clock,G=PORT?[0,0,0,0]:CONFIG.clockGrow,c=[c0[0]-G[0],c0[1]-G[1],c0[2]+G[2],c0[3]+G[3]],s=box.s,x=box.left+c[0]*s,y=box.top+c[1]*s,w=(c[2]-c[0])*s,h=(c[3]-c[1])*s;
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
const giftEl=$('#gift'),giftBody=$('#giftBody'),giftLid=$('#giftLid'),heartWrap=$('#heartWrap'),heartEl=$('#heart'),giftSh=$('#giftSh'),giftHint=$('#giftHint'),giftLayer=$('#giftLayer'),flashEl=$('#flash');
let giftOn=false,giftOpened=false,giftClickRes=null;const particles=[];
const giftReady=CONFIG.gift?Promise.all([CONFIG.gift.body,CONFIG.gift.lid,CONFIG.gift.heart].map(loadImg)).then(()=>{
  giftBody.src=CONFIG.gift.body;giftLid.src=CONFIG.gift.lid;heartEl.src=CONFIG.gift.heart;return giftBody.decode().catch(()=>{}).then(()=>true)}).catch(()=>false):Promise.resolve(false);
giftBody.onload=()=>placeGift();
function placeGift(){
  const g=CONFIG.gift&&(PORT?{...CONFIG.gift,...CONFIG.portrait.gift}:CONFIG.gift);if(!g)return;const s=box.s,w=g.w*s,h=giftBody.naturalWidth?w*giftBody.naturalHeight/giftBody.naturalWidth:w*.8;
  const left=box.left+g.x*s-w/2,top=box.top+g.y*s-h;
  Object.assign(giftEl.style,{width:w+'px',height:h+'px',left:left+'px',top:top+'px'});
  giftEl.style.setProperty('--rise',(g.riseSeconds||4)+'s');
  giftEl.style.setProperty('--hy',PORT?'-250%':'-215%');                       // how high the heart floats above the box (a little lower on wide screens)
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
  if(opened==='rise'){giftEl.classList.add('wait');return}                    // page reload after the gift was opened: the heart rises when the light comes on (riseHeart)
  if(opened){giftEl.classList.add('opened');giftOpened=true;return}
  if(animate){giftEl.classList.add('drop');setTimeout(()=>{giftEl.classList.remove('drop');giftEl.classList.add('idle')},1000*(FAST?.3:1))}
  else giftEl.classList.add('idle');
}
async function riseHeart(){
  if(!giftEl.classList.contains('wait'))return;
  giftEl.classList.remove('wait');void giftEl.offsetWidth;giftEl.classList.add('rise');
  await sleep((CONFIG.gift.riseSeconds||4)*1000);giftOpened=true;giftEl.classList.remove('rise');giftEl.classList.add('opened');
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

/* ---- stage pictures: swapped at once; between stages always in the dark (darkSwap) ---- */
async function showStage(idx){
  const m=stageMeta(idx);if(!m)return;
  const im=await loadImg(m.src).catch(()=>null);if(!im)return;
  imgA.src=m.src;await imgA.decode().catch(()=>{});stageIdx=idx;meta=m;placeClock();
}

/* ---- live clock: 7-segment digits drawn on the clock screen of the picture, with a title and a mode switch ---- */
const SEG={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
let curMode=0,clockForced=false,clockAuto=true,clockPausedUntil=0,lastSwitch=0,clkKey='',quietLeft=0,quietRes=null;
let clockHover=false,clockClicked=false;
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
const uiFont=px=>`600 ${Math.round(px*2)}px "Handjet",monospace`;      // one font for every language (Handjet has Latin, Romanian and Cyrillic); sizes are given in the old 8px-grid units
const hexA=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`};
function drawClock(){
  if(!clockForced&&clockAuto&&t-lastSwitch>9&&Date.now()>clockPausedUntil)nextMode();
  if(clockForced)curMode=3;else if(!modes().includes(curMode))curMode=0;
  const st=clockState(),w=+clk.dataset.w,h=+clk.dataset.h;if(!w)return;
  const ms=modes(),led=ms.indexOf(curMode),big=h>=30;
  const colon=curMode!==0||Math.floor(t)%2===0,hint=!clockClicked&&!clockForced&&(t%5)<1.5?Math.floor(t*6)%ms.length:-1;
  const key=[st.digits,colon,led,ms.length,curMode,clockHover,hint,st.name,st.units,meta.digit].join('|');
  if(key===clkKey)return;clkKey=key;
  const c=cctx,lit=meta.digit||'#e6e6e6',pad=Math.max(2,Math.round(h*.07));
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=meta.screen||'#0b0b0b';c.fillRect(0,0,w,h);c.textBaseline='alphabetic';
  const fitFont=(txt,maxW,sizes)=>{for(const f of sizes){c.font=uiFont(f);if(c.measureText(txt).width<=maxW)return f}return sizes[sizes.length-1]};
  // --- mode switch (top right): one segment per mode, the active one lit; brighter on hover, a travelling wave as a hint
  const sq=clamp(Math.round(h*.1),4,7),n=ms.length,sw=big?sq:clamp(Math.round(h*.24),6,12),sh=big?sq:clamp(Math.round(h*.12),3,5),gap=2,swW=n*sw+(n-1)*gap,sx=w-pad-swW-1;
  let sy=pad+1;
  // --- title on the screen itself. A small (phone) clock gets a smaller font so that the title and the time are always there together
  let top=pad,showSw=!clockForced;
  if(big){
    const f=fitFont(st.name,w-2*pad-(clockForced?0:swW)-6,[8,7,6,5]);c.font=uiFont(f);c.textAlign='left';c.fillStyle=hexA(lit,.82);
    const base=pad+f;c.fillText(st.name,pad+2,base);top=pad+9+Math.max(3,Math.round(h*.06));      // the same top for every title, so the digits never move or change size. The title stays where it is: higher, the circumflexes of Â Ă would be cut by the screen's edge
    sy=Math.round(base-f*2*.6+.5);                                                   // the switch lines up with the top of the title's capitals
  }else{
    const f=fitFont(st.name,w-2*pad-1,[5,4,3.5]),capH=Math.round(f*2*.6);c.font=uiFont(f);c.textAlign='left';c.fillStyle=hexA(lit,.85);
    showSw=showSw&&c.measureText(st.name).width+swW+6<=w-2*pad;                       // the switch only if there is room for it
    c.fillText(st.name,pad+1,pad+capH);top=pad+capH+2;
  }
  if(showSw){
    for(let k=0;k<n;k++){
      const on=k===led||k===hint,x=sx+k*(sw+gap);
      c.shadowColor=hexA(lit,.45);c.shadowBlur=on?sh*1.2:0;
      c.fillStyle=on?lit:hexA(lit,clockHover?.28:.1);c.fillRect(x,sy,sw,sh);
      c.shadowBlur=0;c.strokeStyle=hexA(lit,clockHover?.6:.2);c.lineWidth=1;c.strokeRect(x-.5,sy-.5,sw+1,sh+1);
    }
  }
  // --- digits (soft glow, faint ghost segments)
  const unitsRoom=big&&h>=48,wMax=(w-2*pad)*.96/43;
  let u,y0,unitsBase=0;
  if(unitsRoom){                                   // title / digits / units with equal gaps: the gap under the title is repeated between the digits and the units
    const tb=pad+8,cap=7,bm=2,avail=h-tb-cap-bm;
    u=Math.max(1,Math.floor(Math.min(wMax,(avail-6)/9)*2)/2);
    const gp=Math.min(7,(avail-9*u)/2);y0=Math.round(tb+gp);unitsBase=Math.round(y0+9*u+gp+cap);
  }else{
    const availH=h-top-pad;u=Math.max(1,Math.floor(Math.min(wMax,availH/9)*2)/2);y0=Math.round(top+(availH-9*u)/2);
  }
  const x0=Math.round((w-43*u)/2);
  const ghost=hexA(lit,.07),R=(x,y,ww,hh,on)=>{c.fillStyle=on?lit:ghost;c.fillRect(x0+x*u,y0+y*u,ww*u,hh*u)};
  c.shadowColor=hexA(lit,.32);c.shadowBlur=u*.5;
  const pos=[0,6,16,22,32,38];
  for(let k=0;k<6;k++){const g=SEG[+st.digits[k]],x=pos[k],on=q=>g.includes(q);
    R(x+1,0,3,1,on('a'));R(x,1,1,3,on('f'));R(x+4,1,1,3,on('b'));R(x+1,4,3,1,on('g'));R(x,5,1,3,on('e'));R(x+4,5,1,3,on('c'));R(x+1,8,3,1,on('d'));}
  for(const cx of [13,29])for(const dy of [2,6])R(cx,dy,1,1,colon);
  c.shadowBlur=0;
  if(unitsRoom){const f=fitFont(st.units,w-2*pad,[6,5]);c.font=uiFont(f);c.textAlign='center';c.fillStyle=hexA(lit,.55);c.fillText(st.units,w/2,unitsBase)}
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
// steam over the mug: thin pixel strands that wave like a ribbon; the wave and the gaps near the top travel upward
const STEAM=[{dx:-11,h:150,wl:70,amp:1,ph:0},{dx:12,h:125,wl:60,amp:.85,ph:2.6}];    // offsets, heights and wavelengths in logical px of the picture
const STEAM_RISE=22;                                                              // how fast the wave climbs, logical px/s
const hash1=n=>{n=Math.sin(n*12.9898)*43758.5453;return n-Math.floor(n)};
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
  breathA+=((quietActive?1:0)-breathA)*Math.min(1,dt*1.2);
  const bm=1-.16*breathA*(.5-.5*Math.cos(t*Math.PI/4));                  // the lamp breathes during the pause for thinking: 8 s, dims by up to 16%
  const b=.1+.9*clamp(lampPower,0,1)*bm;if(Math.abs(b-lastBright)>.006){lastBright=b;const f=`brightness(${b.toFixed(3)})`;imgsEl.style.filter=hiEl.style.filter=f;giftLayer.style.filter=b>.995?'none':f}
  if(quietLeft>0){
    quietLeft-=FAST?dt*8:dt;
    if(quietLeft<=0){quietLeft=0;if(quietRes){const r=quietRes;quietRes=null;r()}}
  }
  // overlay canvas
  const P=box.P,k=box.s/P,c=fctx;c.clearRect(0,0,fx.width,fx.height);
  const lx=meta.lamp[0]*k,ly=meta.lamp[1]*k,LR=120*k;
  const lp=clamp(lampPower,0,1)*flick*bm;
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
  // steam over the mug: two wavy strands, 2 px wide at the rim, 1 px higher up, breaking into dots at the top
  if(meta.cup&&lampPower>.02){
    const sl=clamp(lampPower,0,1),sc=meta.steam||'232,230,226',TAU=Math.PI*2;
    STEAM.forEach((st,si)=>{
      const bx=(meta.cup[0]+st.dx)*k,by=Math.round(meta.cup[1]*k)-1,H=Math.max(6,Math.round(st.h*k));
      const life=.65+.35*Math.sin(t*.33+st.ph*1.7),lean=Math.sin(t*.21+st.ph)*8*k;   // each strand breathes and leans slowly
      let px=null;
      for(let j=0;j<H;j++){
        const h=j/H,hl=j/k;
        if(h>.45&&hash1(si*977+Math.floor(j-t*STEAM_RISE*k))<(h-.45)*1.5){px=null;continue}   // gaps that rise with the wave
        const amp=(2+h*11)*st.amp*k;
        const x=Math.round(bx+amp*Math.sin((hl-t*STEAM_RISE)*TAU/st.wl+st.ph)+lean*h*h);
        const a=.4*sl*life*Math.min(1,h/.12+.15)*(1-h)**.7;
        let x0=x,x1=x;if(px!==null){if(x>px)x0=px+1;else if(x<px)x1=px-1}         // join to the row below without doubling pixels
        c.fillStyle=`rgba(${sc},${a.toFixed(3)})`;c.fillRect(x0,by-j,x1-x0+1,1);
        if(h<.4){c.fillStyle=`rgba(${sc},${(a*.55).toFixed(3)})`;c.fillRect(x1+1,by-j,1,1)}   // a softer second column near the rim
        px=x;
      }
    });
  }
  if(giftOpened&&Math.random()<dt*9){const c=heartCenter();particles.push({x:c.x+(Math.random()-.5)*14,y:c.y+(Math.random()-.5)*10,vx:(Math.random()-.5)*4,vy:-3-Math.random()*5,life:.8,max:.8,g:200+Math.random()*50|0,big:false})}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=5*dt;c.fillStyle=`rgba(255,${p.g},120,${Math.min(1,p.life/p.max*1.6).toFixed(2)})`;
    const z=p.big?2:1;c.fillRect(Math.round(p.x),Math.round(p.y),z,z);if(p.big){c.fillRect(Math.round(p.x)-1,Math.round(p.y),1,1);c.fillRect(Math.round(p.x)+2,Math.round(p.y),1,1)}}
  stepRoom(dt);
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
/* between stages: the light goes out, the picture is swapped in the dark (the new things appear with the light, and the
   slightly different framing of the pictures never shows), then the lamp comes back on */
async function darkSwap(idx){
  lampOut();await sleep(2600);
  await showStage(idx);await sleep(900);
  await lampOnSeq();await sleep(500);
}

/* =====================================================================
   DIALOGUE
   ===================================================================== */
const dialog=$('#dialog'),tagEl=$('#tag'),textEl=$('#text'),nextEl=$('#next'),choicesEl=$('#choices'),srEl=$('#sr');
const DBG={auto:QS.has('auto')};
let typing=false,skipTyping=false,advanceRes=null,lineDoneAt=0;
function onAdvance(){
  if(findsOpen)return;
  if(typing){skipTyping=true;return}
  if(advanceRes&&performance.now()-lineDoneAt>150){const r=advanceRes;advanceRes=null;r()}
}
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,#gift,#finds'))return;if(sceneClick(e))return;onAdvance()});
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
const L=(t,who,act,cls)=>({t,who,act,cls});
async function say(lines,{hold=false}={}){
  dialog.classList.add('on');
  for(let n=0;n<lines.length;n++){
    const l=lines[n];
    if(l.who){tagEl.textContent=l.who==='SANTA'?T('santa'):l.who;tagEl.classList.add('on')}else tagEl.classList.remove('on');
    textEl.className=l.who?'voice':'narr';dialog.classList.toggle('q',!!l.cls);
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
   FINDINGS — the collection of secrets. When one is found, its card flies in, turns over and flies
   into the corner button; the button opens all six (face down, the found ones turn over one by one).
   ===================================================================== */
const FIND=CONFIG.findings.list,findsBtn=$('#findsBtn'),findsEl=$('#finds'),findsGrid=$('#findsGrid'),findFly=$('#findFly'),flyWrap=findFly.querySelector('.fwrap');
const isFound=f=>!!state.secrets[f.key];
const findName=f=>T('findings')[f.key]||T('findLocked');
const isFresh=f=>isFound(f)&&!state.findSeen.includes(f.key);
function setArt(img,src){loadImg(src).then(()=>{img.src=src;img.classList.add('ok')}).catch(()=>{})}   // a missing file keeps the placeholder
function makeCard(i){
  const card=document.createElement('div');card.className='fcard';
  card.innerHTML=`<div class="fc-in"><div class="fc-side fc-back"><img alt=""><span class="ph">?</span></div><div class="fc-side fc-face"><img alt=""><span class="ph">${ROM[i]}</span></div></div>`;
  const [back,face]=card.querySelectorAll('img');setArt(back,CONFIG.findings.back);setArt(face,FIND[i].img);
  return card;
}
function updateFindsBtn(){
  const n=FIND.filter(isFound).length;
  findsBtn.classList.toggle('has',n>0);findsBtn.classList.toggle('new',FIND.some(isFresh));
  $('#findsN').textContent=`${n}/${FIND.length}`;$('#findsCount').textContent=`${n} / ${FIND.length}`;
}
let flyQueue=Promise.resolve();
function unlockSecret(key){
  const i=FIND.findIndex(f=>f.key===key);
  if(i<0||state.secrets[key])return;state.secrets[key]=true;save();
  flyQueue=flyQueue.then(()=>flyIn(i)).catch(()=>{findFly.className=''});     // several at once: one after another
}
async function flyIn(i){
  const card=makeCard(i);flyWrap.append(card);
  $('#flyK').textContent=T('found');$('#flyV').textContent=findName(FIND[i]);$('#srFind').textContent=`${T('found')}: ${findName(FIND[i])}`;
  findFly.className='on dim';
  await card.animate([{transform:'translateY(65vh) rotate(-12deg) scale(.45)',opacity:0},{opacity:1,offset:.5},{transform:'none',opacity:1}],
    {duration:FAST?200:750,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'}).finished;
  await sleep(250);
  findFly.classList.add('burst');card.classList.add('flip');
  await sleep(500);findFly.classList.add('cap');
  await sleep(2400);
  findFly.classList.remove('cap','dim');
  updateFindsBtn();await sleep(350);                     // the first finding: the button appears before the card flies into it
  const a=card.getBoundingClientRect(),b=findsBtn.getBoundingClientRect();
  const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
  await card.animate([{transform:'none',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(${b.height/a.height}) rotate(8deg)`,opacity:.3}],
    {duration:FAST?150:650,easing:'cubic-bezier(.6,0,.8,.4)',fill:'forwards'}).finished;
  card.remove();findFly.className='';
  findsBtn.classList.remove('got');void findsBtn.offsetWidth;findsBtn.classList.add('got');
  if(findsOpen){revealSlot(i,0,true);state.findSeen.push(FIND[i].key);save();updateFindsBtn()}   // the collection is open behind it: turn that card over there (once)
}

let findsOpen=false,findsTimers=[];
const later=(fn,ms)=>findsTimers.push(setTimeout(fn,ms));
function revealSlot(i,delay,fresh){
  const fig=findsGrid.children[i];if(!fig)return;
  later(()=>{fig.classList.add('got');fig.querySelector('figcaption').textContent=findName(FIND[i]);fig.querySelector('.fcard').classList.add('flip');if(fresh)fig.classList.add('fresh')},delay);
  later(()=>fig.classList.add('show'),delay+450);
}
function openFinds(){
  if(findsOpen)return;findsOpen=true;
  findsGrid.replaceChildren(...FIND.map((f,i)=>{
    const fig=document.createElement('figure'),cap=document.createElement('figcaption'),card=makeCard(i),seen=isFound(f)&&!isFresh(f);
    fig.className='fslot'+(seen?' got':'');fig.style.setProperty('--i',i);cap.textContent=seen?findName(f):T('findLocked');
    if(seen)card.classList.add('flip');                      // already shown once: dealt face up, no turning over again
    fig.append(card,cap);return fig;
  }));
  findsEl.classList.add('on');requestAnimationFrame(()=>findsEl.classList.add('dealt'));
  const dealt=FIND.length*70+650;let k=0;                  // after the deal, the new findings turn over one by one
  FIND.forEach((f,i)=>{if(isFresh(f))revealSlot(i,dealt+220*k++,true);else later(()=>findsGrid.children[i].classList.add('show'),dealt)});
  state.findSeen=FIND.filter(isFound).map(f=>f.key);save();updateFindsBtn();
  $('#findsClose').focus({preventScroll:true});
}
function closeFinds(){
  if(!findsOpen)return;findsOpen=false;findsTimers.forEach(clearTimeout);findsTimers=[];
  findsEl.classList.remove('on');setTimeout(()=>{if(!findsOpen){findsEl.classList.remove('dealt');findsGrid.replaceChildren()}},500);
  findsBtn.focus({preventScroll:true});
}
findsBtn.addEventListener('click',e=>{e.stopPropagation();openFinds()});
$('#findsClose').addEventListener('click',e=>{e.stopPropagation();closeFinds()});
findsEl.addEventListener('click',e=>{if(e.target===findsEl)closeFinds()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&findsOpen){e.preventDefault();closeFinds()}});
updateFindsBtn();

/* =====================================================================
   SECRETS — things in the room that answer a click.
   They are drawn on their own full-resolution canvas (#fxHi, dimmed with the picture), in logical-frame px.
   A prop is {click(x,y), draw(c,dt)}: click returns true if the click was its (it then does its thing and unlocks its
   finding), draw paints it every frame. Earlier in PROPS wins.
   ===================================================================== */
const near=(x,y,[px,py],r)=>Math.hypot(x-px,y-py)<=r;
const hiEl=$('#fxHi'),hctx=hiEl.getContext('2d');
const css=px=>px/box.s;                                    // a size in screen px, in logical px
const lumAt=(d,i)=>.299*d[i]+.587*d[i+1]+.114*d[i+2];
function pixelsOf(img,x,y,w,h){                            // a region of a stage picture (its natural size is the logical frame)
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(img,-x,-y);return{cv,g,img:g.getImageData(0,0,w,h)};
}
const pictureReady=()=>imgA.complete&&imgA.naturalWidth&&imgA.getAttribute('src')===meta.src;

/* chunks and powder falling off a shaken branch. g = gravity, fade = seconds of fading out at the end of life, size in screen px */
let bits=[];
const addBit=o=>bits.push({vx:0,vy:0,g:0,life:0,max:1,fade:.6,size:2,col:'#fff',...o});
function stepBits(dt,c){
  for(const p of bits){p.life+=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
  bits=bits.filter(p=>p.life<=p.max);if(bits.length>400)bits.splice(0,bits.length-400);
  for(const p of bits){c.globalAlpha=Math.min(1,(p.max-p.life)/p.fade);c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y,css(p.size)/2,0,6.283);c.fill()}
  c.globalAlpha=1;
}

/* the star on top of the little tree (stages whose picture has one, CONFIG.stages[].star). Unlit until clicked: whatever is
   brighter than the sky around it is pulled down towards the sky, so the star stays as a dull grey shape without its glow. */
let starLitAt=-99;
const unlitStar={key:'',cv:null,R:0};
function makeUnlitStar(){
  const [cx,cy]=meta.star,R=36,S=Math.round(R*1.7),{cv,g,img}=pixelsOf(imgA,Math.round(cx-S),Math.round(cy-S),S*2,S*2),d=img.data,W=S*2;
  const ring=[];for(let a=0;a<16;a++){const an=Math.PI*(1.15+a*.7/15),x=Math.round(S+R*1.6*Math.cos(an)),y=Math.round(S+R*1.6*Math.sin(an));ring.push((y*W+x)*4)}   // the upper half: sky, not the tree
  ring.sort((a,b)=>lumAt(d,a)-lumAt(d,b));const si=ring[ring.length>>1],sky=[d[si],d[si+1],d[si+2]],skyL=lumAt(d,si);
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){
    const r=Math.hypot(x-S,y-S)/R;if(r>=1){d[(y*W+x)*4+3]=0;continue}
    const i=(y*W+x)*4,gl=lumAt(d,i)-skyL,u=clamp((1-r)/.65,0,1),w=u*u*(3-2*u);          // full inside 35% of R, then a smooth edge
    if(gl>0)for(let j=0;j<3;j++)d[i+j]+=(sky[j]+gl*.22-d[i+j])*w;
    d[i+3]=255*Math.min(1,w*3);
  }
  g.putImageData(img,0,0);unlitStar.cv=cv;unlitStar.R=S;
}
const starProp={
  click(x,y){if(!meta.star||state.secrets.star||!near(x,y,meta.star,30))return false;starLitAt=t;unlockSecret('star');return true},
  draw(c){
    if(!meta.star||!pictureReady())return;const [x,y]=meta.star;
    if(!state.secrets.star){
      const key=meta.src;if(unlitStar.key!==key){makeUnlitStar();unlitStar.key=key}
      const S=unlitStar.R;c.drawImage(unlitStar.cv,x-S,y-S,S*2,S*2);return;
    }
    const age=t-starLitAt;if(age>3)return;                                           // catching light: a few flickers, then the picture's own glow
    const fl=Math.max(0,1-age/3)*(.55+.45*Math.sin(age*24));
    const g=c.createRadialGradient(x,y,0,x,y,40);g.addColorStop(0,`rgba(255,232,170,${(.5*fl).toFixed(3)})`);g.addColorStop(1,'rgba(255,232,170,0)');
    c.globalCompositeOperation='lighter';c.fillStyle=g;c.fillRect(x-40,y-40,80,80);c.globalCompositeOperation='source-over';
  },
};

/* the snow globe (stages that have it, CONFIG.stages[].globe = [x,y,radius,the snow at its bottom]): a shake throws fine snow
   off the bottom, the water keeps turning for a while, then the flakes sink slowly and settle back into the painted snow */
const GLOBE_PER_SHAKE=99,GLOBE_MAX=600;                  // flakes thrown up by one shake; the most in the water at once (about six shakes in a row still add snow)
const GLOBE_REST_FADE=1.5,GLOBE_LIFE=18,GLOBE_AGE_FADE=3; // seconds: the last of the fade once settled; the longest life, and the fade before it
const GLOBE_SNOW_BAND=12;                                 // logical px above the painted snow over which a flake melts into it (and comes out of it on a shake)
const globeSnow={flakes:[],swirl:0,dir:1};
const globeProp={
  click(x,y){
    const G=meta.globe;if(!G||!near(x,y,G,G[2]+16))return false;
    const [gx,,r,ground]=G,S=globeSnow;
    S.swirl=Math.min(2.2,S.swirl+1);S.dir=Math.random()<.5?-1:1;
    for(const f of S.flakes){f.rest=0;f.vy-=40+Math.random()*60;f.vx+=(Math.random()-.5)*50}       // the ones still in the water go up again
    for(let i=Math.min(GLOBE_PER_SHAKE,GLOBE_MAX-S.flakes.length);i>0;i--)
      S.flakes.push({x:gx+(Math.random()*2-1)*r*.75,y:ground-1-Math.random()*10,vx:(Math.random()-.5)*140,vy:-30-Math.random()*150,z:Math.random(),age:0,rest:0});
    unlockSecret('globe');return true;
  },
  draw(c,dt){
    const G=meta.globe,S=globeSnow;if(!G){S.flakes.length=0;return}
    const [gx,gy,r,ground]=G,R=r-6,drag=Math.exp(-dt*1.8);
    S.swirl*=Math.exp(-dt*.9);
    for(const f of S.flakes){
      f.age+=dt;if(f.rest){f.rest+=dt;continue}
      const dx=f.x-gx,dy=f.y-gy,d=Math.hypot(dx,dy)||1,a=S.swirl*S.dir*130*d/r;
      f.vx+=(-dy/d*a+(Math.random()-.5)*30)*dt;f.vy+=(dx/d*a+22-S.swirl*28)*dt;      // the turning water, a little jitter, slow sinking (lifted while it turns)
      f.vx*=drag;f.vy*=drag;f.x+=f.vx*dt;f.y+=f.vy*dt;
      const ex=f.x-gx,ey=f.y-gy,e=Math.hypot(ex,ey);
      if(e>R){const nx=ex/e,ny=ey/e,vn=f.vx*nx+f.vy*ny;f.x=gx+nx*R;f.y=gy+ny*R;if(vn>0){f.vx-=1.3*vn*nx;f.vy-=1.3*vn*ny}}
      if(f.y>=ground-1){f.y=ground-1;if(f.vy>0&&S.swirl<.25)f.rest=.001;else if(f.vy>0)f.vy*=-.3}
    }
    S.flakes=S.flakes.filter(f=>f.rest<GLOBE_REST_FADE&&f.age<GLOBE_LIFE);
    c.fillStyle='#fff';
    for(const f of S.flakes){
      const s=css(.9+f.z*.9),u=clamp(Math.min((ground-f.y)/GLOBE_SNOW_BAND,f.rest?1-f.rest/GLOBE_REST_FADE:1,(GLOBE_LIFE-f.age)/GLOBE_AGE_FADE),0,1);   // sinking into the painted snow, settled, or simply old: a smooth fade
      c.globalAlpha=u*u*(3-2*u)*(.7+.3*f.z);c.fillRect(f.x-s/2,f.y-s/2,s,s);   // fine points, 1-2 screen px
    }
    c.globalAlpha=1;
  },
};

/* new snow on the branches. Where it can lie is read from the picture: the top edge of the snow already on the branches
   (light, not too coloured, clearly darker just above), in the upper half of the window, chained into near-horizontal runs
   (snow does not stay on steep twigs). From stop II each run gets a cushion of snow, thicker each day, in the picture's own
   snow colour, rounded at the ends. A click on a cushion shakes it off until the next day; the finding comes when all of them are off. */
const DRIFT_DEPTH=[0,0,4,7,10,13];                         // logical px of new snow by state.entered (none on the first day)
const drifts={};                                          // per picture: {runs:[[x,y],...][], col:[r,g,b]}
const driftDepth=()=>DRIFT_DEPTH[clamp(state.entered,0,5)];
function shakenHere(){                                     // today's shaken cushions of the current picture
  if(state.branchShakenDay!==state.entered){state.branchShakenDay=state.entered;state.branchShaken=[]}
  return state.branchShaken.filter(s=>s.src===meta.src).map(s=>s.i);
}
function findDrifts(){
  const D=.5,gl=meta.glass||CONFIG.glass,away=[[meta.lamp,100],[meta.star,40]].filter(a=>a[0]);
  const X0=gl[0]+40,Y0=gl[1]+30,X1=gl[2]-40,Y1=gl[1]+(gl[3]-gl[1])*.52;
  const w=Math.round((X1-X0)*D),h=Math.round((Y1-Y0)*D),cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(imgA,X0,Y0,X1-X0,Y1-Y0,0,0,w,h);
  const d=g.getImageData(0,0,w,h).data,L=(x,y)=>lumAt(d,(y*w+x)*4),colsByX=[],snow=[];
  for(let x=0;x<w;x++){const ys=[];colsByX.push(ys);
    for(let y=2;y<h-2;y++){
      const i=(y*w+x)*4,l=L(x,y),mx=Math.max(d[i],d[i+1],d[i+2]);
      if(l<95||(mx-Math.min(d[i],d[i+1],d[i+2]))/(mx+1)>.55)continue;
      if(l-L(x,y-1)<30&&l-L(x,y-2)<45)continue;                                     // a top edge: clearly darker just above
      if(L(x,y+2)<l*.55)continue;                                                   // with snow under it, not a one-pixel star
      const lx=X0+x/D,ly=Y0+y/D;if(away.some(([p,r])=>near(lx,ly,p,r)))continue;
      ys.push(y);snow.push([d[i],d[i+1],d[i+2],l]);
    }}
  let runs=[],active=[];                                   // chain the edges left to right, one pixel up or down per column at most
  for(let x=0;x<w;x++){
    const next=[],used=new Set();
    for(const run of active){
      const [lx,ly]=run[run.length-1];let best=null;
      for(const y of colsByX[x])if(!used.has(y)&&Math.abs(y-ly)<=1&&(best===null||Math.abs(y-ly)<Math.abs(best-ly)))best=y;
      if(best!==null){run.push([x,best]);used.add(best);next.push(run)}else if(x-lx<=2)next.push(run);else runs.push(run);
    }
    for(const y of colsByX[x])if(!used.has(y))next.push([[x,y]]);
    active=next;
  }
  runs=runs.concat(active).filter(r=>r[r.length-1][0]-r[0][0]>=10).map(r=>{   // fill the gaps, smooth, to logical px
    const at={};for(const [x,y] of r)at[x]=y;const ys=[];let last=r[0][1];
    for(let x=r[0][0];x<=r[r.length-1][0];x++){last=at[x]??last;ys.push(last)}
    return ys.map((_,i)=>{const s=ys.slice(Math.max(0,i-3),i+4);return[X0+(r[0][0]+i)/D,Y0+s.reduce((a,b)=>a+b,0)/s.length/D]});
  });
  const top=snow.sort((a,b)=>b[3]-a[3]).slice(0,Math.max(1,snow.length>>2));        // the snow's colour: its brightest quarter, a bit closer to white (the lamp tints it)
  return{runs,col:[0,1,2].map(j=>(top.length?top.reduce((s,c)=>s+c[j],0)/top.length:235)*.7+[238,240,244][j]*.3)};
}
function cushionTop(run,depth,seed){
  const n=run.length,h0=Math.min(depth,(run[n-1][0]-run[0][0])*.22);
  return run.map(([x,y],i)=>{const taper=Math.pow(Math.sin(Math.PI*i/(n-1)),.55),wob=.86+.12*Math.sin(x*.09+seed)+.06*Math.sin(x*.23+seed*2)+.04*Math.sin(x*.71+seed*3);
    return[x,y-h0*taper*wob+.5]});
}
const rgb=(c,m,a,al=1)=>`rgba(${Math.min(255,c[0]*m+a)|0},${Math.min(255,c[1]*m+a)|0},${Math.min(255,c[2]*m+a)|0},${al})`;
const branchProp={
  click(x,y){
    const depth=driftDepth(),dr=drifts[meta.src];if(!depth||!dr)return false;
    const shaken=shakenHere(),dist=run=>Math.min(...run.map(([px,py])=>Math.hypot(px-x,py-depth/2-y)));
    const hits=dr.runs.map((run,i)=>[i,dist(run)]).filter(([i,e])=>!shaken.includes(i)&&e<60);     // the part of the branch around the click
    if(!hits.some(([,e])=>e<22+depth/2))return false;                                                // ... but only if the click was on snow
    const col=rgb(dr.col,1,6);
    for(const [i] of hits){
      state.branchShaken.push({src:meta.src,i});
      cushionTop(dr.runs[i],depth,i*1.7).forEach(([px,py],j)=>{if(j%3)return;const by=dr.runs[i][j][1];
        addBit({x:px,y:py+(by-py)*Math.random(),vx:(Math.random()-.5)*30,vy:Math.random()*25,g:420,max:.7+Math.random()*.5,fade:.25,size:2+Math.random()*2.5,col});   // chunks
        addBit({x:px,y:py,vx:(Math.random()-.5)*40,vy:-5+Math.random()*15,g:35,max:1.2+Math.random(),fade:1,size:1+Math.random(),col:'#fff'});                   // powder
      });
    }
    save();if(dr.runs.every((_,i)=>shakenHere().includes(i)))unlockSecret('branch');return true;   // the finding: only once the whole tree is clear
  },
  draw(c){
    const depth=driftDepth();if(!depth||!pictureReady())return;
    const dr=drifts[meta.src]||(drifts[meta.src]=findDrifts()),shaken=shakenHere();
    const body=rgb(dr.col,.98,4),hi=rgb(dr.col,1.08,24),shade=rgb(dr.col,.55,0,.55);
    dr.runs.forEach((run,i)=>{
      if(shaken.includes(i))return;const top=cushionTop(run,depth,i*1.7);
      c.beginPath();top.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));for(let j=run.length-1;j>=0;j--)c.lineTo(run[j][0],run[j][1]+1.5);c.closePath();
      c.fillStyle=body;c.fill();
      c.lineWidth=css(1.2);c.strokeStyle=shade;c.beginPath();run.forEach(([x,y],j)=>j?c.lineTo(x,y+1.2):c.moveTo(x,y+1.2));c.stroke();   // a soft underside
      c.strokeStyle=hi;c.beginPath();top.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.stroke();                                 // the lit top
    });
  },
};

/* the lamp: blinks once (a toy, no finding) */
let blinking=false;
const lampProp={
  click(x,y){
    if(!near(x,y,meta.lamp,46))return false;
    if(!blinking){blinking=true;const was=lampTarget;
      (async()=>{for(const v of [.3,1,.15,1]){setLamp(v);await sleep(70)}setLamp(was);blinking=false})()}
    return true;
  },
};

const PROPS=[starProp,globeProp,branchProp,lampProp];

/* the wind: on purpose only — quick strokes back and forth across the window, five sharp turns within 2.5 s
   (an ordinary move of the mouse, or reaching for a button, never does it). Only once the journey has begun. */
const swipe={x:0,t:0,dir:0,run:0,turns:[]};
addEventListener('pointermove',e=>{
  if(state.secrets.wind||!state.accepted||!box.s)return;
  const x=(e.clientX-box.left)/box.s,y=(e.clientY-box.top)/box.s,g=meta.glass||CONFIG.glass,now=performance.now();
  if(x<g[0]||x>g[2]||y<g[1]||y>g[3]){Object.assign(swipe,{x,t:now,dir:0,run:0});return}
  const dx=x-swipe.x,ms=Math.max(1,now-swipe.t);swipe.x=x;swipe.t=now;
  if(Math.abs(dx)<1)return;
  const dir=Math.sign(dx);
  if(dir===swipe.dir){if(Math.abs(dx)/ms>.5)swipe.run+=Math.abs(dx);return}       // the stroke grows while it is quick (> 500 logical px/s)
  if(swipe.run>160)swipe.turns.push(now);                                          // a turn counts after a quick stroke of 160+ px
  swipe.dir=dir;swipe.run=0;swipe.turns=swipe.turns.filter(t=>now-t<2500);
  if(swipe.turns.length>=5)unlockSecret('wind');
},{passive:true});

/* called once per frame from frame() */
function stepRoom(dt){
  const c=hctx,S=box.s*dpr;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,hiEl.width,hiEl.height);c.setTransform(S,0,0,S,0,0);
  for(const p of PROPS)if(p.draw)p.draw(c,dt);
  stepBits(dt,c);
}
/* a click in the scene: true if a prop took it (then it does not also advance the dialogue) */
function sceneClick(e){
  if(!box.s)return false;
  const x=(e.clientX-box.left)/box.s,y=(e.clientY-box.top)/box.s;
  return x>=0&&y>=0&&x<=LW&&y<=LH&&PROPS.some(p=>p.click(x,y));
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
  if(stageIdx!==stageFor(n))await darkSwap(stageFor(n));  // stop I: already swapped in the dark by accept()
  if(state.entered<n){state.entered=n;save();renderStepper(true)}
  if(n>=5)showGift(true);
  const arrive=n===1?[L(T('arrive')[0],'SANTA')]:[L(T('changed')),L(T('arrive')[n-1],'SANTA')];     // stop I appears before the player's eyes, so no "something has changed"

  await say([...arrive,L(T('howTo'),'SANTA')]);
  await say([L(QUESTIONS[n-1],`${ROM[n-1]} · ${THEMES[n-1].toUpperCase()}`,undefined,'q')],{hold:true});      // the question gets a screen of its own
  await choose([T('beginQuiet')]);
  await quietMoment(n);
  await say([...T('reflect')[n-1].map(t=>L(t,'SANTA')),...(n===5?[L(T('afterLast')(santaDay()),'SANTA')]:[])]);
  state.done=n;save();renderStepper(true);
  dialog.classList.remove('on');
  if(n<5)await askRemind(new Date(stopMs[n]),quote(THEMES[n]));
  else if(nowMs()<santaMs)await askRemind(new Date(santaMs),T('lastSurprise'));
}
/* The pause for thinking: the dialogue goes away, the question stays as a quiet caption, a sentence starter fades in (stop IV has two:
   first noticing, then thanking), two soft cues come at 40% and 70%, the lamp breathes (8 s), "I am ready" appears after quietReadyAfter
   seconds and "thirty more seconds" in the last 10. The clock counts down (quietLeft is in game seconds, so FAST works too). */
const quietEl=$('#quiet'),qQ=$('#qQ'),qS=$('#qS'),qCue=$('#qCue'),qReady=$('#qReady'),qMore=$('#qMore'),qBtns=$('.qbtns');
let quietTotal=0,quietActive=false,qMoreWant=false,qMoreTimer=0;
const Q_RESIZE_MS=600,Q_FADE_MS=800;                              // match the width and opacity transitions in styles.css
function qMeasure(){                                             // natural widths of both buttons -> --rw and --grow (no animation)
  qBtns.classList.add('nt');qReady.style.width='auto';
  const rW=qReady.getBoundingClientRect().width,mW=qMore.getBoundingClientRect().width,gap=parseFloat(getComputedStyle(qBtns).columnGap)||0;
  qBtns.style.setProperty('--rw',rW+'px');qBtns.style.setProperty('--grow',(gap+mW)+'px');
  qReady.style.width='';void qBtns.offsetWidth;qBtns.classList.remove('nt');
}
function qShowMore(want){                                        // narrow "ready" then fade "more" in; fade "more" out then widen "ready"
  if(want===qMoreWant)return;qMoreWant=want;clearTimeout(qMoreTimer);
  if(want){qBtns.classList.remove('solo');qMoreTimer=setTimeout(()=>qMore.classList.add('on'),qReady.classList.contains('on')?Q_RESIZE_MS:0)}
  else{qMore.classList.remove('on');qMoreTimer=setTimeout(()=>qBtns.classList.add('solo'),Q_FADE_MS)}
}
addEventListener('resize',()=>{if(quietActive)qMeasure()});
function setFade(el,s){                                          // change a caption with a fade out / fade in
  if(el.dataset.s===s)return;el.dataset.s=s;
  const swap=()=>{if(el.dataset.s!==s)return;el.textContent=s;if(s)el.classList.add('on')};
  if(el.classList.contains('on')){el.classList.remove('on');setTimeout(swap,650)}else swap();
}
function quietMoment(n){
  dialog.classList.remove('on');
  const base=CONFIG.quietSeconds,starters=T('starters')[n-1],cues=T('cues');
  clockForced=true;curMode=3;quietLeft=DBG.auto?Math.min(base,3):base;quietTotal=quietLeft;quietActive=true;
  qQ.textContent=QUESTIONS[n-1];[qS,qCue].forEach(el=>{el.textContent='';el.dataset.s='';el.classList.remove('on')});
  qReady.textContent=T('qReady');qMore.textContent=T('qMore');qReady.classList.remove('on');qMore.classList.remove('on');
  clearTimeout(qMoreTimer);qMoreWant=false;qMeasure();qBtns.classList.add('nt','solo');void qBtns.offsetWidth;qBtns.classList.remove('nt');
  quietEl.classList.add('on');
  qReady.onclick=()=>{if(quietLeft>0)quietLeft=.001};
  qMore.onclick=()=>{if(quietLeft>0){quietLeft+=CONFIG.quietExtra;quietTotal+=CONFIG.quietExtra;qShowMore(false)}};
  const iv=setInterval(()=>{
    const e=quietTotal-quietLeft,live=quietLeft>0;
    setFade(qS,e<2?'':starters.length>1&&e>=base*.5?starters[1]:starters[0]);
    setFade(qCue,e>=base*.4&&e<base*.4+7?cues[0]:e>=base*.7&&e<base*.7+7?cues[1]:'');
    qReady.classList.toggle('on',live&&e>=CONFIG.quietReadyAfter);
    qShowMore(live&&quietLeft<10);
  },200);
  return new Promise(res=>{quietRes=res}).then(()=>{
    clearInterval(iv);clearTimeout(qMoreTimer);quietActive=false;quietEl.classList.remove('on');
    clockForced=false;curMode=0;lastSwitch=t;
    return sleep(900);
  });
}

async function waitForStop(n){
  const date=new Date(stopMs[n-1]),label=quote(THEMES[n-1]);
  remindTarget={date,label};
  await say([L(T('waitNext')(label,fmtDate(date)),'SANTA')]);
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
  if(stageIdx!==stageFor(6))await darkSwap(stageFor(6));else stageFlicker();     // the finale uses stop V's picture unless it has its own
  await showGift(false);
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
  try{await Promise.all([document.fonts.load('600 28px "Handjet"'),document.fonts.load('500 28px "Handjet"')])}catch(e){}
  c.fillStyle='#050505';c.fillRect(0,0,W,H);
  for(let i=0;i<260;i++){const g=90+Math.floor(Math.random()*150);c.fillStyle=`rgb(${g},${g},${g})`;const s=Math.random()<.2?4:2;c.fillRect(Math.floor(Math.random()*W/2)*2,Math.floor(Math.random()*H/2)*2,s,s)}
  const frame=(o,col)=>{c.fillStyle=col;c.fillRect(o,o,W-2*o,6);c.fillRect(o,H-o-6,W-2*o,6);c.fillRect(o,o,6,H-2*o);c.fillRect(W-o-6,o,6,H-2*o)};
  c.fillStyle='#050505';c.fillRect(34,34,W-68,H-68);frame(30,'#ececec');frame(48,'#5a5a5a');
  const title=T('cardTitle'),sub=T('cardSub');
  c.textAlign='center';c.fillStyle='#ececec';c.font=uiFont(title.length>14?30:34);c.fillText(title,W/2,150);
  c.fillStyle='#8c8c8c';c.font=uiFont(sub.length>34?11:14);c.fillText(sub,W/2,196);
  c.textAlign='left';let y=300;
  const qf={f:'500 42px "Handjet",monospace',lh:46};
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
  await sleep(1200);await darkSwap(stageFor(1));await sleep(200);        // the questions start at once
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
   DEBUG PANEL  (a DEBUG button on every screen while CONFIG.allowDebug is true; ?debug or debug.html also skip the start screen)
   ===================================================================== */
const setNow=ms=>{NOW_OFFSET=ms-Date.now()};
function dbgJump(){                                    // move the pretend clock to the next date that unlocks something
  if(!state.accepted)return;const u=unlockedCount();
  if(u<5)setNow(stopMs[u]+60000);else if(nowMs()<santaMs)setNow(santaMs+60000);
}
if(CONFIG.allowDebug){
  const st=document.createElement('style');
  st.textContent=`#dbg{position:fixed;left:8px;bottom:8px;z-index:40;font-family:var(--px);font-size:13px;color:#ddd;max-width:calc(100vw - 16px);display:flex;flex-direction:column}
  #dbg .box{display:none;background:rgba(0,0,0,.95);padding:10px;box-shadow:0 0 0 2px #777;margin-bottom:6px;width:340px;max-width:100%}
  #dbg.open .box{display:block}
  #dbg button{font:inherit;color:#ddd;background:#222;border:0;padding:6px 7px;margin:2px;cursor:pointer;box-shadow:0 0 0 1px #666}
  #dbg button:hover{background:#ddd;color:#000}
  #dbg h4{font-size:13px;color:#888;margin:9px 0 3px;font-weight:400}
  #dbg label{display:inline-block;margin:5px 10px 0 0;cursor:pointer}
  #dbg .ro{color:#ffd166;line-height:1.7}#dbg .tip{color:#777;line-height:1.7;margin-top:8px}
  #dbg button{touch-action:manipulation}
  @media (max-width:699px){            /* phones: under the progress bar on the left (the sound button is on the right), panel opens downward, big touch targets */
    #dbg{bottom:auto;top:calc(max(14px,env(safe-area-inset-top)) + 62px);left:max(10px,env(safe-area-inset-left));flex-direction:column-reverse;align-items:flex-start}
    #dbg .box{margin:6px 0 0;width:min(340px,calc(100vw - 20px));max-height:calc(100dvh - 150px);overflow-y:auto;font-size:14px}
    #dbg button{font-size:14px;padding:10px 11px;margin:3px}
    #dbg h4,#dbg .ro,#dbg .tip{font-size:13px}
    #dbg label{font-size:14px;margin:8px 12px 0 0}
  }`;
  document.head.appendChild(st);
  const root=document.createElement('div');root.id='dbg';
  const box=document.createElement('div');box.className='box';
  const mk=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
  const ro=mk('div','ro');box.appendChild(ro);
  const btn=(label,fn)=>{const b=mk('button',null,label);b.type='button';b.onclick=fn;return b};
  const go=(stateObj,ms)=>{                             // set the saved progress + the pretend time, then reload (findings are kept)
    if(stateObj)stateObj={...stateObj,secrets:state.secrets,findSeen:state.findSeen};
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
  box.appendChild(mk('h4',null,'LANGUAGE'));
  ['en','ru','ro'].forEach(l=>box.appendChild(btn(l.toUpperCase(),()=>setLang(l))));
  box.appendChild(mk('h4',null,'FINDINGS'));
  FIND.forEach(f=>box.appendChild(btn(f.key.toUpperCase(),()=>unlockSecret(f.key))));
  box.appendChild(btn('OPEN',openFinds));
  box.appendChild(btn('RESET',()=>{state.secrets={};state.findSeen=[];save();updateFindsBtn()}));
  box.appendChild(mk('h4',null,'WHILE PLAYING'));
  box.appendChild(btn('NEXT DATE ⏭',dbgJump));
  box.appendChild(btn('SKIP QUIET MOMENT',()=>{if(quietLeft>0)quietLeft=.001}));
  const cb=(label,get,set)=>{const l=mk('label',null,`<input type="checkbox"> ${label}`);const i=l.firstChild;i.checked=get();i.onchange=()=>set(i.checked);return l};
  box.appendChild(mk('div'));
  box.appendChild(cb('FAST',()=>FAST,v=>{FAST=v}));
  box.appendChild(cb('AUTO-PLAY (clicks through everything)',()=>DBG.auto,v=>{DBG.auto=v;if(v&&advanceRes)onAdvance()}));
  box.appendChild(mk('div','tip','Key D opens this panel. Click anywhere to skip a line. AUTO-PLAY says "yes", skips reminders, jumps to the next date by itself, opens the gift and the card.'));
  root.appendChild(box);
  const tg=btn('DEBUG ▾',()=>root.classList.toggle('open'));root.appendChild(tg);document.body.appendChild(root);
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
  findsBtn.title=findsBtn.ariaLabel=T('findsBtn');$('#findsH').textContent=T('findsTitle');$('#findsClose').textContent=T('findsClose');
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
  await showStage(stageFor(state.accepted?state.entered:0));
  if(state.accepted&&state.finale)showGift(false,'rise');else if(state.accepted&&state.done>=5)showGift(false);
  await sleep(900);
  artEl.classList.add('on');
  await sleep(3000);
  await lampOnSeq();
  if(state.accepted&&state.finale)riseHeart();                  // reload after the gift was opened: the heart floats up out of the box as the light comes back
  await sleep(800);
  renderStepper();
  $('#stepper').classList.add('on');$('#clockUI').classList.add('on');muteBtn.classList.add('on');findsBtn.classList.add('on');
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
