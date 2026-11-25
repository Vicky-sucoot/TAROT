/* 月下占卜：牌陣定義與規則式解讀引擎（完全離線） */
(function (root) {
  'use strict';
  var T = root.TAROT;

  var SPREADS = {
    guide: {
      id: 'guide',
      name: '三張牌指引',
      positions: ['現況', '阻礙', '建議'],
      options: [
        { id: 'love', label: '感情' },
        { id: 'work', label: '工作' },
        { id: 'money', label: '財運' },
        { id: 'general', label: '綜合' }
      ]
    },
    relation: {
      id: 'relation',
      name: '感情關係牌陣',
      positions: ['我的感受與期待', '目前的互動模式', '下一步建議'],
      options: [
        { id: 'ambig', label: '曖昧中' },
        { id: 'dating', label: '交往中' },
        { id: 'after', label: '分開後' },
        { id: 'none', label: '略過' }
      ]
    },
    choice: {
      id: 'choice',
      name: '二選一牌陣',
      positions: ['選項 A 的發展', '選項 B 的發展', '我真正在意的事'],
      options: [
        { id: 'love', label: '感情' },
        { id: 'work', label: '工作' },
        { id: 'money', label: '財運' },
        { id: 'general', label: '綜合' }
      ]
    },
    flow: {
      id: 'flow',
      name: '時間之流牌陣',
      positions: ['過去的影響', '現在的狀態', '未來的走向', '需要留意', '行動建議'],
      options: [
        { id: 'love', label: '感情' },
        { id: 'work', label: '工作' },
        { id: 'money', label: '財運' },
        { id: 'general', label: '綜合' }
      ]
    }
  };
  var ORDER = ['guide', 'relation', 'choice', 'flow'];
  var NUM = { 3: '三', 5: '五' };

  var CATEGORIES = [
    { id: 'all', label: '全部' },
    { id: 'love', label: '感情' },
    { id: 'work', label: '工作' },
    { id: 'money', label: '財運' },
    { id: 'general', label: '綜合' }
  ];

  var TOPIC_LABEL = { love: '感情', work: '工作', money: '財運', general: '綜合' };
  var CONTEXT_LABEL = { ambig: '曖昧中', dating: '交往中', after: '分開後', none: '' };

  // 小步驟：STEPS[視角][花色] = [正位, 逆位]
  var STEPS = {
    love: {
      major: ['寫下這段感情中你最在意的一件事，想想它反映了你重視的哪個價值。', '先暫停揣測對方，回到自己：我此刻真正需要的是什麼？'],
      wands: ['主動提出一個具體的小邀約，例如一起吃頓飯或散步，觀察對方的回應。', '在衝動傳訊息前先等十分鐘，確認自己是想溝通，還是想要對方立刻回應。'],
      cups: ['用「我覺得……」開頭，說出一個真實的感受，而不是評論對方。', '先替自己的情緒命名並寫下來，等心情平穩後再決定要不要說。'],
      swords: ['把想說的話整理成三句以內，挑一個雙方都不趕時間的時候說。', '留意自己是否在腦中反覆演練最壞的劇情，把擔心和實際發生的事分開寫下。'],
      pentacles: ['從可以持續的小事表達心意，例如固定的關心，或一起完成一件日常小事。', '看看這段關係裡時間與心力的分配，是否有一方長期付出較多。']
    },
    work: {
      major: ['把這個階段最重要的一個目標寫下來，排出本週能推進的一步。', '列出目前最消耗你的工作事項，想想哪一項可以調整或請求支援。'],
      wands: ['挑一件拖延已久的任務，今天先花二十五分鐘開始做。', '同時進行的事太多時，先暫停其中一項，讓力氣集中。'],
      cups: ['和一位合作夥伴聊聊彼此的感受與想法，好的關係會讓合作更順。', '留意情緒是否影響工作判斷，給自己一段不處理訊息的休息時間。'],
      swords: ['把卡住的問題寫成一句話，帶著兩個可能的解法去和相關的人討論。', '重要訊息先查證再轉述，回覆前多讀一次，避免誤會擴大。'],
      pentacles: ['盤點手上的技能與資源，挑一項本月可以精進的能力。', '找出工作流程中最常出錯的環節，先修好一個小地方。']
    },
    money: {
      major: ['寫下近三個月最重要的一個財務目標，並設定每月做得到的金額。', '暫緩重大的財務決定，先把收入、固定支出與存款列成一張清單。'],
      wands: ['若想投入新計畫，先設定自己承受得起的上限金額，再開始行動。', '留意衝動購物或追高的念頭，想買的東西先放進清單，隔三天再決定。'],
      cups: ['想想哪些花費真正讓你開心，把預算留給它們，減少可有可無的支出。', '留意情緒性消費，心情低落時先別打開購物網站或下單。'],
      swords: ['把支出分類，找出一個可以立刻取消的訂閱或固定開銷。', '面對看不懂的投資或借貸條件時，先查證、多問，不急著答應。'],
      pentacles: ['建立固定的儲蓄或緊急預備金習慣，金額小也沒關係，重點是持續。', '看看是否把太多資源放在同一個地方，想想分散風險的方式。']
    },
    general: {
      major: ['寫下這張牌讓你想到的一件人生大事，問問自己準備好面對了嗎。', '給自己一天的緩衝，不急著決定，先觀察內心的變化。'],
      wands: ['選一件讓你有熱情的小事，今天就做一點點。', '檢查自己的體力與時間，先休息，再出發。'],
      cups: ['主動聯絡一位讓你感到溫暖的人，分享近況。', '找一段安靜的時間寫下最近的情緒，不評判，只是看見。'],
      swords: ['把腦中纏繞的念頭寫成清單，標出可以行動的與只能放下的部分。', '減少睡前滑手機的時間，讓思緒有機會安靜下來。'],
      pentacles: ['整理生活中的一個小角落，例如書桌、行事曆或帳戶，讓秩序帶來安心。', '照顧身體的基本需要：睡眠、飲食與活動，先從其中一項開始。']
    },
    ambig: {
      major: ['觀察對方在言語之外的行動，例如是否記得你說過的事、是否主動延續話題。', '先問自己：我期待這段關係走向哪裡？把答案寫下來，再對照對方的步調。'],
      wands: ['提出一個輕鬆、具體的約定，看看對方是否願意一起安排時間。', '如果總是你在主動，試著放慢一次，觀察對方是否也會靠近。'],
      cups: ['在自然的時刻分享一點真實感受，觀察對方是否以同樣的真誠回應。', '分辨自己是喜歡對方，還是喜歡被在意的感覺，誠實回答就好。'],
      swords: ['用輕鬆的方式確認彼此的期待，例如問：「你平常喜歡怎樣的相處節奏？」', '別把一次已讀不回當成全部的答案，記下實際的互動，而不是腦中的劇情。'],
      pentacles: ['看看彼此是否願意為對方挪出固定時間，穩定的出現比熱烈的話更能說明心意。', '留意自己是否花太多時間等待，把一部分生活重心留給自己。']
    },
    dating: {
      major: ['和對方聊一次「我們想要怎樣的關係」，各自說出一個最在意的價值。', '回想最近一次爭執，找出你們反覆出現的相處模式，而不只是那件事本身。'],
      wands: ['安排一次新鮮的共同體驗，讓兩人的熱情有新的出口。', '爭執時先約定一個暫停的暗號，等情緒降溫再談。'],
      cups: ['用「我需要……」說出一個具體需求，也邀請對方說出自己的需要。', '如果覺得委屈，先說出感受，再一起討論怎麼調整，而不是翻舊帳。'],
      swords: ['挑一個平靜的時間，用「我觀察到、我感覺、我希望」三句話溝通。', '留意對話中是否有指責或冷處理，試著把「你總是」換成「我希望」。'],
      pentacles: ['一起討論生活中的實際分工，例如時間、金錢或家務安排。', '如果關係只剩例行公事，留一段不談瑣事、只陪伴彼此的時間。']
    },
    after: {
      major: ['寫一封不寄出的信，把想說的話都寫下，最後寫一句給未來自己的話。', '允許自己還沒放下，不必逼自己立刻釋懷，先照顧好今天的作息。'],
      wands: ['把重新燃起的熱情放在自己身上，例如一個想學的技能或想去的地方。', '想聯絡對方之前，先問自己：這則訊息是為了溝通，還是為了確認對方還在不在？'],
      cups: ['找一位信任的朋友聊聊，讓情緒有地方流動。', '如果容易反覆看舊照片或對話紀錄，先把它們收到不常打開的地方。'],
      swords: ['寫下這段關係教會你的三件事，以及下次想守住的一條界線。', '減少查看對方動態的次數，必要時暫時隱藏或靜音。'],
      pentacles: ['整理生活的實際面向，例如作息、居住空間或財務，讓生活重新站穩。', '若還有共同物品或金錢往來，先列出清單，用平和的方式一次處理清楚。']
    },
    none: {
      major: ['寫下你在這段關係中最真實的一個期待，看看它是否曾被說出口。', '暫時把注意力從對方身上收回，問問自己現在最需要的是什麼。'],
      wands: ['主動表達一次心意或邀約，觀察對方的實際回應。', '在情緒最高點時先不做決定，給自己一晚的時間。'],
      cups: ['用「我覺得」說出一個感受，讓對方有機會理解你。', '分清楚哪些是自己的情緒、哪些是對方的責任，不需要全部扛起。'],
      swords: ['把想溝通的內容寫成重點，選一個雙方都平靜的時間談。', '留意自己是否過度解讀訊息，記錄實際發生的事，而不是猜測。'],
      pentacles: ['觀察彼此是否願意在時間與行動上穩定投入。', '看看你在這段關係中的付出，是否讓自己感到長期消耗。']
    }
  };

  var LENS_LABEL = {
    love: '感情上可以試試', work: '工作上可以試試', money: '財務上可以試試', general: '生活中可以試試',
    ambig: '曖昧中的你可以試試', dating: '交往中的你們可以試試', after: '分開後的你可以試試', none: '在這段關係裡可以試試'
  };

  var FOCUS = {
    love: '感情主題聚焦在你自己的感受、可以觀察到的互動，以及你能做的溝通選擇。',
    work: '工作主題聚焦在你的節奏、合作方式與下一步的具體行動。',
    money: '財運主題聚焦在消費習慣、風險意識與資源分配，而不是預測輸贏。',
    general: '綜合主題聚焦在你目前生活的整體狀態，以及可以著手的下一步。',
    ambig: '曖昧階段的重點，是觀察實際的互動、釐清自己的期待，並確認彼此的步調是否相近。',
    dating: '交往中的重點，是看見彼此的相處模式、說出自己的需求，並找到雙方都舒服的溝通方式。',
    after: '分開之後的重點，是好好整理自己的情緒、建立需要的界線，並思考屬於自己的下一步。',
    none: '這個牌陣聚焦在你自己的感受、你們之間可觀察的互動，以及你可以做的溝通選擇。'
  };

  var QUESTIONS = {
    love: ['想到「{k}」時，我在這段感情裡最想調整的一個小地方是什麼？', '如果先不管對方會怎麼想，我對「{k1}」真正的感受是什麼？', '這週我能透過哪一次具體的對話或行動，讓對方更了解我？'],
    work: ['關於「{k}」，我這週可以在工作上做出的一個具體改變是什麼？', '如果「{k1}」就是我目前的處境，我最需要誰的協助？', '完成哪一件工作，會讓我對自己更有信心？'],
    money: ['想到「{k}」，我最近哪一筆花費最值得重新檢視？', '如果要為未來的自己存下一筆錢，我願意先從哪一項支出開始調整？', '面對錢的時候，我的感受是安心、焦慮還是想逃避？這和「{k1}」有什麼關聯？'],
    general: ['「{k}」讓我想到生活中的哪一個時刻？我可以為它做些什麼？', '如果把「{k1}」當成一面鏡子，我在其中看見了怎樣的自己？', '今天我可以完成哪一件很小、但會讓自己更靠近答案的事？'],
    ambig: ['從實際互動來看，對方的步調和我期待的相近嗎？「{k}」給了我什麼提醒？', '我希望這段曖昧走向哪裡？為了確認它，我願意說出哪一句話？', '想到「{k1}」，我是在享受相處的過程，還是在等待一個答案？'],
    dating: ['關於「{k}」，我有沒有一個需求還沒好好說出口？', '我們最常卡住的是哪一種對話？下次我可以換成什麼說法？', '在「{k1}」之中，我希望對方怎麼理解我？我又能怎麼理解對方？'],
    after: ['「{k}」提醒我，下一步要先照顧自己的哪一個部分？', '我想為自己建立哪一條界線，讓心慢慢安定下來？', '離開這段關係後，我最想重新找回的是自己的哪一面？'],
    none: ['關於「{k}」，我想讓對方知道的一件事是什麼？我打算怎麼說？', '從可以觀察到的互動來看，這段關係讓我感到安心，還是消耗？', '如果「{k1}」就是我心裡的感受，我願意為它做出哪一個溝通選擇？']
  };

  var CHOICE_Q = [
    '如果完全不考慮別人的期待，我會選哪一個？「{k}」在提醒我什麼？',
    '兩個選項裡，哪一個更貼近「{k}」？我願意為它承擔什麼？',
    '一年後回頭看，我希望自己是因為什麼理由做出這個選擇？'
  ];

  var PUBLIC_UP = [
    '讓「{k}」成為下一步的方向，答案就在你心裡。',
    '帶著「{k}」前行，月光會照亮你的路。',
    '今夜的指引是「{k}」，慢慢來，你會聽見自己的答案。'
  ];
  var PUBLIC_RV = [
    '先溫柔地留意「{k}」，再找回屬於自己的節奏。',
    '今夜的提醒：看見「{k}」，停一停，答案會更清楚。',
    '看見「{k}」，就是改變的開始；給自己一點時間。'
  ];

  var SUIT_NOTE = {
    wands: '多張權杖出現，這件事和行動與熱情很有關，重點在於「去做」，同時留意別燒得太快。',
    cups: '多張聖杯出現，情緒與關係是這次的核心，先好好理解自己的感受。',
    swords: '多張寶劍出現，想法與溝通是關鍵，釐清思緒、把話說清楚會帶來轉機。',
    pentacles: '多張錢幣出現，實際的資源、時間與身體狀態值得優先照顧，穩紮穩打最重要。'
  };

  function fill(t, map) {
    return t.replace(/\{(\w+)\}/g, function (_, k) { return map[k] != null ? map[k] : ''; });
  }
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function face(card, rev) { return rev ? card.rv : card.up; }

  function lensOf(spreadId, option) {
    if (spreadId === 'relation') return option || 'none';
    return option || 'general';
  }

  // 這次解讀對應的專屬牌義主題（感情／工作／財運），綜合主題則不加
  function topicOf(spreadId, option) {
    if (spreadId === 'relation') return 'love';
    return option === 'love' || option === 'work' || option === 'money' ? option : null;
  }
  var TOPIC_PREFIX = { love: '放在感情上：', work: '放在工作上：', money: '放在財運上：' };

  function categoryOf(spreadId, option) {
    return spreadId === 'relation' ? 'love' : (option || 'general');
  }

  function cardIntro(spreadId, idx, card, rev) {
    var f = face(card, rev);
    var kw = f.k.join('、');
    var label = '「' + card.name + '」' + (rev ? '逆位' : '正位');
    var lead = ({
      guide: ['這張牌描述你目前的狀態。', '這是目前可能卡住你的部分。', '這是你可以嘗試的方向。'],
      relation: ['這張牌反映你心裡的感受與期待。', '這是你們之間目前可以觀察到的互動模式。', '這是你下一步可以考慮的方向。'],
      choice: ['這張牌描述選擇 A 之後可能的發展。', '這張牌描述選擇 B 之後可能的發展。', '這張牌反映你在這個選擇裡真正在意的事。'],
      flow: ['這張牌是過去留下的影響。', '這張牌描述你現在的狀態。', '這張牌是照目前方向走下去，未來可能的走向。', '這是需要特別留意的地方。', '這是你可以採取的行動。']
    })[spreadId][idx];
    return lead + label + '的關鍵詞是：' + kw + '。';
  }

  function adviceIndex(spreadId) { return spreadId === 'flow' ? 4 : spreadId === 'choice' ? -1 : 2; }
  function keyIndex(spreadId) { return spreadId === 'flow' ? 4 : 2; }

  function nuance(spreadId, idx, card, rev) {
    var k = face(card, rev).k[0];
    if (idx === 1 && !rev && spreadId === 'guide') {
      return '雖然是正位，但放在「阻礙」的位置，也可能代表「' + k + '」用得太多，或成了你沒注意到的盲點。';
    }
    if (idx === 1 && spreadId === 'relation') {
      return rev
        ? '這個互動模式中，「' + k + '」可能正在影響你們，試著觀察它在什麼情況下出現。'
        : '「' + k + '」是你們互動中已經存在的力量，可以留意它如何被雙方感受到。';
    }
    if (spreadId === 'flow' && idx === 3 && !rev) {
      return '雖然是正位，放在「需要留意」的位置，也提醒你別讓「' + k + '」走得太過頭。';
    }
    if (spreadId === 'choice' && idx < 2) {
      return rev
        ? '逆位代表這條路上可能有「' + k + '」的課題，不一定是壞選項，而是要先想好怎麼面對。'
        : '正位代表這條路上「' + k + '」的能量比較順，但仍要對照你真正在意的事。';
    }
    if (idx === adviceIndex(spreadId) && rev) {
      return '逆位出現在建議的位置，提醒你先留意「' + k + '」，從調整它開始，而不是急著往前衝。';
    }
    if (card.suit === 'major') {
      return '這是一張大阿爾克那，代表這個位置牽涉到比較深層、值得花時間思考的課題。';
    }
    if (card.rank >= 11) {
      return '這是一張宮廷牌，可以看作某種態度或角色——也許是你自己，也許是你身邊的人。';
    }
    return '';
  }

  /**
   * 產生解讀
   * @param {{spread:string, option:string, cards:Array<{id:string, rev:boolean}>}} input
   */
  function interpret(input) {
    var spread = SPREADS[input.spread];
    var lens = lensOf(input.spread, input.option);
    var cards = input.cards.map(function (c) { return { card: T.BY_ID[c.id], rev: !!c.rev }; });
    var ks = cards.map(function (x) { return face(x.card, x.rev).k[0]; });

    // ── 整體摘要 ──
    var summary = [];
    var n = cards.length;
    if (input.spread === 'guide') {
      summary.push('現況呈現「' + ks[0] + '」，阻礙落在「' + ks[1] + '」，' +
        (cards[2].rev ? '而建議牌提醒你先留意「' + ks[2] + '」，從調整它開始。' : '而「' + ks[2] + '」是你可以著手的方向。'));
    } else if (input.spread === 'relation') {
      summary.push('你心裡的感受與期待和「' + ks[0] + '」有關；目前的互動呈現「' + ks[1] + '」；' +
        (cards[2].rev ? '下一步可以先留意「' + ks[2] + '」，再決定怎麼回應。' : '下一步可以朝「' + ks[2] + '」嘗試。'));
    } else if (input.spread === 'choice') {
      summary.push('選項 A 呈現「' + ks[0] + '」，選項 B 呈現「' + ks[1] + '」，而你真正在意的是「' + ks[2] + '」。');
      var ra = cards[0].rev, rb = cards[1].rev;
      summary.push(ra === rb
        ? (ra ? '兩個選項都是逆位，兩條路各有要面對的課題，也許先別急著選，或想想有沒有第三種可能。' : '兩個選項都是正位，兩條路都走得通，關鍵在於哪一條更貼近你在意的事。')
        : '就目前的能量來看，選項 ' + (ra ? 'B' : 'A') + ' 走起來比較順，選項 ' + (ra ? 'A' : 'B') + ' 則需要先處理一些課題。');
      summary.push('牌不替你做決定，它幫你看清每條路的樣子，最後仍由你選擇。');
    } else {
      summary.push('從過去的「' + ks[0] + '」，走到現在的「' + ks[1] + '」，未來可能朝向「' + ks[2] + '」。需要留意「' + ks[3] + '」，' +
        (cards[4].rev ? '行動上先調整「' + ks[4] + '」。' : '行動上可以朝「' + ks[4] + '」前進。'));
    }

    var all = NUM[n] ? NUM[n] + '張' : '全部';
    var majors = cards.filter(function (x) { return x.card.suit === 'major'; });
    if (majors.length === 0) {
      summary.push(all + '都是小阿爾克那，事情多半落在日常可以調整的範圍，小小的改變就能帶來不同。');
    } else if (majors.length === 1) {
      summary.push('「' + majors[0].card.name + '」是這次唯一的大阿爾克那，它所在的位置是值得你特別花心思的關鍵。');
    } else {
      summary.push('出現了 ' + majors.length + ' 張大阿爾克那，這件事可能牽涉到較深的人生課題，不急著一次解決，給自己一些時間。');
    }

    var revCount = cards.filter(function (x) { return x.rev; }).length;
    if (n === 3) {
      summary.push([
        '三張都是正位，能量流動得比較順，適合把想法化為行動。',
        '有一張逆位，提醒你在某個環節放慢腳步、回頭檢查。',
        '有兩張逆位，目前可能有些卡住或內耗，先照顧好自己，再處理外在的事。',
        '三張都是逆位，這段時間比較適合沉澱與向內整理，而不是硬推進度。'
      ][revCount]);
    } else if (revCount === 0) {
      summary.push(all + '都是正位，能量流動得比較順，適合把想法化為行動。');
    } else if (revCount === n) {
      summary.push(all + '都是逆位，這段時間比較適合沉澱與向內整理，而不是硬推進度。');
    } else if (revCount * 2 < n) {
      summary.push('有 ' + revCount + ' 張逆位，整體還算順，但在逆位出現的環節要放慢腳步、回頭檢查。');
    } else {
      summary.push('有 ' + revCount + ' 張逆位，目前可能有些卡住或內耗，先照顧好自己，再處理外在的事。');
    }

    var suitCount = {};
    cards.forEach(function (x) { if (x.card.suit !== 'major') suitCount[x.card.suit] = (suitCount[x.card.suit] || 0) + 1; });
    var dom = Object.keys(suitCount).filter(function (s) { return suitCount[s] >= (n > 3 ? 3 : 2); })[0];
    if (dom) summary.push(SUIT_NOTE[dom]);
    var courts = cards.filter(function (x) { return x.card.suit !== 'major' && x.card.rank >= 11; }).length;
    if (courts >= 2) summary.push('出現多張宮廷牌，人的態度與角色是這次的關鍵，也可能代表你內在不同的面向。');

    // ── 逐張解讀 ──
    var used = {};
    var details = cards.map(function (x, i) {
      var f = face(x.card, x.rev);
      var suit = x.card.suit;
      var step = STEPS[lens][suit][x.rev ? 1 : 0];
      var label = LENS_LABEL[lens];
      if (used[step]) {
        step = STEPS.general[suit][x.rev ? 1 : 0];
        label = LENS_LABEL.general;
        if (used[step]) step = '';
      }
      if (step) used[step] = true;
      var body = [cardIntro(input.spread, i, x.card, x.rev), f.m];
      var topic = topicOf(input.spread, input.option);
      var tm = topic && root.TOPIC_MEANINGS && root.TOPIC_MEANINGS[x.card.id];
      if (tm) body.push(TOPIC_PREFIX[topic] + tm[topic][x.rev ? 1 : 0]);
      var n = nuance(input.spread, i, x.card, x.rev);
      if (n) body.push(n);
      return {
        position: spread.positions[i],
        id: x.card.id,
        rev: x.rev,
        name: x.card.name,
        orientation: x.rev ? '逆位' : '正位',
        keywords: f.k.slice(),
        body: body,
        step: step ? label + '：' + step : ''
      };
    });

    var seed = hash(cards.map(function (x) { return x.card.id + (x.rev ? 'r' : 'u'); }).join(''));
    var ki = keyIndex(input.spread);
    var qset = input.spread === 'choice' ? CHOICE_Q : QUESTIONS[lens];
    var question = fill(qset[seed % 3], { k: ks[ki], k1: ks[0] });
    // 結果卡指引：優先使用每張牌專屬的公開指引句，沒有時才用套句
    var pl = root.PUBLIC_LINES && root.PUBLIC_LINES[cards[ki].card.id];
    var publicLine = pl ? pl[cards[ki].rev ? 1 : 0] : fill((cards[ki].rev ? PUBLIC_RV : PUBLIC_UP)[seed % 3], { k: ks[ki] });

    return {
      summary: summary.join(''),
      focus: FOCUS[lens],
      cards: details,
      combos: root.COMBOS ? root.COMBOS.find(input.cards) : [],
      question: question,
      publicLine: publicLine
    };
  }

  root.READING = {
    SPREADS: SPREADS,
    ORDER: ORDER,
    NUM: NUM,
    CATEGORIES: CATEGORIES,
    TOPIC_LABEL: TOPIC_LABEL,
    CONTEXT_LABEL: CONTEXT_LABEL,
    STEPS: STEPS,
    interpret: interpret,
    topicOf: topicOf,
    categoryOf: categoryOf
  };
})(typeof self !== 'undefined' ? self : this);
