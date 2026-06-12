var fs = require('fs');
var path = require('path');

var logoWhiteB64 = fs.readFileSync(path.join(__dirname, 'assets', 'tabiken-logo-white.png')).toString('base64');
var LOGO_WHITE = 'data:image/png;base64,' + logoWhiteB64;

var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'content', '01_cafe-cashier.json'), 'utf8'));

// ── Theme colors (meta-driven) ────────────────────────────────────────────────
// テーマ色は content JSON の meta.cover_color / meta.accent_color から駆動する。
// ベース色（下記）を生成後に meta 色へ一括置換するため、色を変えたいときは
// JSON の cover_color / accent_color を1つ書き換えるだけで全ページに反映される。
var BASE_COVER = '#1B2A5E';
var BASE_ACCENT = '#D4A843';
var COVER = (data.meta && data.meta.cover_color) || BASE_COVER;
var ACCENT = (data.meta && data.meta.accent_color) || BASE_ACCENT;
function themed(html) {
  return html.split(BASE_COVER).join(COVER).split(BASE_ACCENT).join(ACCENT);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function applyEmphasis(text, emphasisList) {
  var result = esc(text);
  for (var i = 0; i < emphasisList.length; i++) {
    var em = esc(emphasisList[i]);
    result = result.split(em).join('<span class="em">' + em + '</span>');
  }
  return result;
}

function pad(n) { return n < 10 ? '0' + n : String(n); }

function renderPhraseCell(p) {
  var badge = p.type === 'idiom'
    ? '<span class="type-badge" style="background:#C0392B;">イディオム</span>'
    : '<span class="type-badge" style="background:#1A3B6B;">フレーズ</span>';
  var noteHtml = p.street_note
    ? '\n      <div class="street-note">' + esc(p.street_note) + '</div>'
    : '';
  return '    <div class="phrase-cell">\n' +
    '      <div class="phrase-top"><span class="phrase-num">' + pad(p.num) + '</span><span class="phrase-en">' + applyEmphasis(p.phrase_en, p.emphasis) + '</span></div>\n' +
    '      <div class="phrase-ja">' + esc(p.phrase_ja) + '</div>\n' +
    '      <div class="phrase-katakana">' + esc(p.katakana) + '</div>\n' +
    '      <div class="phrase-meta">' + badge + '<span class="phrase-scene">' + esc(p.scene) + '</span></div>' + noteHtml + '\n' +
    '    </div>\n';
}

function renderBubble(speaker, textHtml, refs) {
  var isRight = speaker !== 'akari';
  var name = speaker.charAt(0).toUpperCase() + speaker.slice(1);
  var avatarHtml = '<div class="avatar-wrap"><img class="avatar" src="../assets/avatars/' + speaker + '.png" alt="' + name + '" onerror="this.parentNode.outerHTML=\'<div class=&quot;avatar-circle&quot; style=&quot;background:#1B2A5E;&quot;>' + name.charAt(0) + '</div>\'"></div>';
  var refsHtml = '';
  if (refs && refs.length) {
    for (var r = 0; r < refs.length; r++) {
      refsHtml += ' <span class="phrase-ref">' + pad(refs[r]) + '</span>';
    }
  }
  var bubbleClass = speaker === 'akari' ? 'bubble kenta' : 'bubble other';
  var rowClass = isRight ? 'bubble-row right' : 'bubble-row';
  return '        <div class="' + rowClass + '">\n' +
    '          ' + avatarHtml + '\n' +
    '          <div class="bubble-wrap"><div class="bubble-name">' + name + '</div>\n' +
    '          <div class="' + bubbleClass + '">' + textHtml + refsHtml + '</div></div>\n' +
    '        </div>\n';
}

// ── Category definitions ──────────────────────────────────────────────────────

// カテゴリ定義は content JSON から自動生成（10カテゴリ × 各10フレーズ）
var catDefs = data.categories.map(function (c, i) {
  return { idx: i + 1, id: c.id, ja: c.ja, en: c.en, color: c.color, from: i * 10 + 1, to: i * 10 + 10 };
});

// ── Roleplay definitions ──────────────────────────────────────────────────────

// ── Roleplay definitions (Cafe Counter Service) ──────────
var rpDefs = {
  'greeting': {
    sceneTitle: '開店直後のカウンター',
    sceneTitleEn: 'Morning at the Counter',
    sceneDesc: 'ワーホリで来たばかりのAkariがカウンター担当。<br>常連のCooperが朝の一杯を買いに来る。<br>明るい第一声で一日が始まる。',
    imageFile: 'scene-greeting.png',
    cultureText: 'オーストラリアのカフェはコーヒー文化が濃く、朝の常連との一言が店の雰囲気を作る。‘G’day’ の一言が、機械的な接客と「また来たい店」を分ける。',
    bubbles: [
      { speaker: 'akari',  text: '<strong>G’day!</strong> <strong>What can I get for you</strong>?', refs: [1] },
      { speaker: 'cooper', text: 'Morning! Just a large flat white, thanks.', refs: [] },
      { speaker: 'akari',  text: '<strong>Morning! How’s it going</strong>?', refs: [2] },
      { speaker: 'cooper', text: 'Yeah, good — still waking up!', refs: [] },
      { speaker: 'akari',  text: '<strong>No worries.</strong> To have here or takeaway?', refs: [4, 19] },
      { speaker: 'cooper', text: 'Takeaway, cheers.', refs: [] },
      { speaker: 'akari',  text: '<strong>Good to see you again</strong>! Won’t be a sec.', refs: [6] }
    ],
    keyPoints: [
      { phrase: '"G’day!"', desc: '豪の超定番あいさつ。これだけで一気に現地っぽくなる。' },
      { phrase: '"How’s it going?"', desc: 'あいさつの一部。返事は ‘Good, thanks. You?’ でOK。' }
    ]
  },
  'drinks': {
    sceneTitle: 'コーヒーの注文を取る',
    sceneTitleEn: 'Taking a Coffee Order',
    sceneDesc: 'Yunaが注文。サイズ・ミルク・ショット数を、<br>Akariが手際よく確認していく。<br>豪らしいミルクの選択肢がポイント。',
    imageFile: 'scene-drinks.png',
    cultureText: '豪ではミルクの選択肢（full cream / skim / oat / soy）が当たり前で、オーツミルクの人気も高い。聞き漏らすと作り直しにつながるので、復唱して確定する習慣がミスを防ぐ。',
    bubbles: [
      { speaker: 'akari', text: 'Hi! <strong>What size — small, regular, or large</strong>?', refs: [11] },
      { speaker: 'yuna',  text: 'Large latte, please.', refs: [] },
      { speaker: 'akari', text: '<strong>What kind of milk</strong> — full cream, oat, or soy?', refs: [13] },
      { speaker: 'yuna',  text: 'Oat milk, thanks. Make it strong?', refs: [] },
      { speaker: 'akari', text: 'Sure — <strong>one shot or two</strong>?', refs: [14] },
      { speaker: 'yuna',  text: 'Two, please.', refs: [] },
      { speaker: 'akari', text: '<strong>Just to confirm — a large latte, oat milk</strong>, double shot?', refs: [18] }
    ],
    keyPoints: [
      { phrase: '"What kind of milk?"', desc: 'oat / soy / full cream / skim。豪では必ず聞かれる。' },
      { phrase: '"Just to confirm"', desc: '復唱して注文を確定。作り直しを防ぐ。' }
    ]
  },
  'food': {
    sceneTitle: 'フードの注文',
    sceneTitleEn: 'Taking a Food Order',
    sceneDesc: 'ケーキとサンドを注文したYunaに、<br>温めるか・ホイップを付けるかなどを<br>Akariが確認していく。',
    imageFile: 'scene-food.png',
    cultureText: 'バナナブレッドは名前に反してケーキに近く、トーストより「バターを添える」のが定番。ホイップを別添えにするか聞かれることも多い。待ち時間は先に伝えるとクレームを防げる。',
    bubbles: [
      { speaker: 'akari', text: 'One banana bread — <strong>did you want butter with that</strong>?', refs: [24] },
      { speaker: 'yuna',  text: 'Yes please.', refs: [] },
      { speaker: 'akari', text: 'And a slice of carrot cake — <strong>whipped cream on the side</strong>?', refs: [23] },
      { speaker: 'yuna',  text: 'Ooh, go on then!', refs: [] },
      { speaker: 'akari', text: 'Lovely. <strong>It’ll be about ten minutes for the hot food — that okay</strong>?', refs: [29] },
      { speaker: 'yuna',  text: 'That’s fine.', refs: [] },
      { speaker: 'akari', text: '<strong>Grab a seat and I’ll bring it over.</strong>', refs: [30] }
    ],
    keyPoints: [
      { phrase: '"butter with that?"', desc: 'バナナブレッドは温めるより、バターを添えるのが定番。' },
      { phrase: '"whipped cream on the side?"', desc: 'ケーキ類でよく聞く。‘on the side’＝別添え。' }
    ]
  },
  'requests': {
    sceneTitle: 'アレルギーとこだわり',
    sceneTitleEn: 'Allergies & Requests',
    sceneDesc: 'Lucasがアイスドリンクを注文。<br>ナッツアレルギーの確認に加え、<br>「紙以外のストローは？」のやり取りも。',
    imageFile: 'scene-requests.png',
    cultureText: 'アレルギー対応は安全に直結。曖昧にせず確認し、厨房に共有する。オーストラリアは使い捨てプラ禁止で紙ストローが基本になったが、「ふやけて苦手」という声も多く、店によってはステンレスなど再利用できるストローを用意していることも。「紙以外ある？」と聞かれる場面は実際によくある。',
    bubbles: [
      { speaker: 'akari', text: '<strong>Do you have any allergies I should know about</strong>?', refs: [31] },
      { speaker: 'lucas', text: 'Yeah, I’m allergic to nuts.', refs: [] },
      { speaker: 'akari', text: 'Thanks for letting me know. <strong>I’ll flag the allergy with the kitchen.</strong>', refs: [40] },
      { speaker: 'lucas', text: 'Cheers. Oh — do you have a straw that isn’t paper? They go a bit soggy.', refs: [] },
      { speaker: 'akari', text: '<strong>We’ve only got paper straws now</strong> since the plastic ban — but <strong>I can grab you a reusable metal one if you’d prefer</strong>.', refs: [36, 37] },
      { speaker: 'lucas', text: 'Oh, perfect — thanks so much!', refs: [] }
    ],
    keyPoints: [
      { phrase: '"I’ll flag the allergy with the kitchen."', desc: '確認だけで終わらせず、厨房に共有するところまでが対応。' },
      { phrase: '"I can grab you a reusable metal one"', desc: '紙ストローが苦手な人に、ステンレス等の代替を提案できると親切。' }
    ]
  },
  'addons': {
    sceneTitle: 'もう一品すすめる',
    sceneTitleEn: 'Suggesting an Add-on',
    sceneDesc: 'コーヒーだけのCooperに、<br>Akariが焼きたてのフードを<br>さりげなくおすすめする。',
    imageFile: 'scene-addons.png',
    cultureText: 'アップセルは「押し売り」ではなく「気の利いた提案」。staff favourite（スタッフのお気に入り）や焼きたてなど、自分の言葉で一言添えると自然に伝わる。',
    bubbles: [
      { speaker: 'akari',  text: '<strong>Would you like anything sweet with that</strong>?', refs: [41] },
      { speaker: 'cooper', text: 'Hmm, what’s good?', refs: [] },
      { speaker: 'akari',  text: '<strong>Fresh batch of cookies just came out — keen</strong>?', refs: [50] },
      { speaker: 'cooper', text: 'Go on then, one of those.', refs: [] },
      { speaker: 'akari',  text: 'Nice. <strong>The carrot cake’s a staff favourite</strong> too, <strong>if you fancy something sweet</strong> next time.', refs: [45] },
      { speaker: 'cooper', text: 'Ha, noted! <strong>That’s everything.</strong>', refs: [49] }
    ],
    keyPoints: [
      { phrase: '"Fresh batch... keen?"', desc: '焼きたてのタイミングを逃さず勧める。‘keen’ は「乗り気」「興味がある」の意味。' },
      { phrase: '"staff favourite"', desc: '自分の推しを添えると、ただの売り込みより自然に伝わる。' }
    ]
  },
  'payment': {
    sceneTitle: 'お会計',
    sceneTitleEn: 'Taking Payment',
    sceneDesc: 'Cooperのお会計。<br>金額を伝え、支払い方法・暗証番号・<br>口座選択・レシートまで案内する。',
    imageFile: 'scene-payment.png',
    cultureText: '豪のEFTPOS端末はタッチ決済が主流。一定額以上はPIN入力、デビットは口座種別（SAVINGS/CHEQUE）を選ぶことがある。チップ文化は薄いが、もらったら素直に感謝を。',
    bubbles: [
      { speaker: 'akari',  text: '<strong>That’s twelve fifty altogether.</strong> <strong>How would you like to pay — card or cash</strong>?', refs: [51, 52] },
      { speaker: 'cooper', text: 'Card, thanks. Can I tap?', refs: [] },
      { speaker: 'akari',  text: 'Of course. <strong>Whenever you’re ready, go ahead and enter your PIN.</strong>', refs: [55] },
      { speaker: 'cooper', text: 'Done. Oh, keep the change.', refs: [] },
      { speaker: 'akari',  text: '<strong>Oh, thank you so much — that’s really kind!</strong> <strong>Would you like a receipt</strong>?', refs: [59, 58] },
      { speaker: 'cooper', text: 'No, I’m right, thanks!', refs: [] }
    ],
    keyPoints: [
      { phrase: '"enter your PIN"', desc: '一定額以上はタッチでも暗証番号を求められる。' },
      { phrase: '"Would you like a receipt?"', desc: 'レシートの要否は最後に一言。' }
    ]
  },
  'payment-trouble': {
    sceneTitle: '決済が通らない・割り勘',
    sceneTitleEn: 'A Card Decline & a Split',
    sceneDesc: 'Lucasの決済が一度通らず、<br>Akariが落ち着いて対応。<br>さらに友達との割り勘にも応じる。',
    imageFile: 'scene-payment-trouble.png',
    cultureText: '決済トラブルは慌てず、別の方法を提案するのがコツ。グループ来店では「一緒か別か」「割り勘か」を先に聞くと会計がスムーズ。‘go through’（通る）はやわらかい言い方。',
    bubbles: [
      { speaker: 'akari', text: 'Hmm, <strong>it’s not going through — do you want to try again</strong>?', refs: [61] },
      { speaker: 'lucas', text: 'Weird. Let me try tapping my phone.', refs: [] },
      { speaker: 'akari', text: '<strong>Sometimes Apple Pay needs a second — give it another tap?</strong>', refs: [63] },
      { speaker: 'lucas', text: 'There we go!', refs: [] },
      { speaker: 'akari', text: '<strong>All good — it went through that time!</strong> Oh, <strong>are these together or separate</strong>?', refs: [70, 67] },
      { speaker: 'lucas', text: 'Separate, please — just mine.', refs: [] }
    ],
    keyPoints: [
      { phrase: '"it’s not going through"', desc: '‘declined’ より角が立たない言い方。' },
      { phrase: '"together or separate?"', desc: 'グループ会計の超定番。最初に聞くとスムーズ。' }
    ]
  },
  'smalltalk': {
    sceneTitle: 'カウンター越しの会話',
    sceneTitleEn: 'Small Talk at the Counter',
    sceneDesc: 'ドリンクを作りながら、<br>AkariがCooperと軽い世間話。<br>さりげない褒め言葉が常連を作る。',
    imageFile: 'scene-smalltalk.png',
    cultureText: '英語圏では見た目や持ち物を褒めるのは自然なスモールトーク。天気ネタも鉄板。文末の ‘hey?’ は同意を求める豪らしい相づち。',
    bubbles: [
      { speaker: 'akari',  text: '<strong>Love your outfit today, by the way!</strong>', refs: [71] },
      { speaker: 'cooper', text: 'Oh, cheers! Op-shop find, actually.', refs: [] },
      { speaker: 'akari',  text: 'No way, it’s great. <strong>Gorgeous day out there, hey</strong>?', refs: [75] },
      { speaker: 'cooper', text: 'Perfect beach weather!', refs: [] },
      { speaker: 'akari',  text: '<strong>Any plans for the weekend</strong>?', refs: [74] },
      { speaker: 'cooper', text: 'Just surfing. <strong>You always brighten up my morning</strong>, by the way!', refs: [78] },
      { speaker: 'akari',  text: 'Aw! <strong>Hope the rest of your day’s a good one!</strong>', refs: [80] }
    ],
    keyPoints: [
      { phrase: '"Love your outfit!"', desc: '見た目を褒めるのは自然なスモールトーク。一気に距離が縮まる。' },
      { phrase: '"..., hey?"', desc: '文末の ‘hey?’ は同意を誘う豪らしい相づち。' }
    ]
  },
  'resume': {
    sceneTitle: 'レジュメを持ってきた人',
    sceneTitleEn: 'A Walk-in Resume',
    sceneDesc: '仕事を探すLucasが、<br>カウンターに直接レジュメを持参。<br>店長不在の中、Akariが感じよく預かる。',
    imageFile: 'scene-resume.png',
    cultureText: '豪・加ではカフェやお店に直接レジュメを持ち込む就活が一般的。店員が最初の窓口になることも多い。たとえ募集がなくても感じよく対応し、名前を書いて紛失を防ぎ、返事の目安まで伝える。',
    bubbles: [
      { speaker: 'lucas', text: 'Hi, um… is the manager around?', refs: [] },
      { speaker: 'akari', text: '<strong>Are you handing in a resume</strong>?', refs: [81] },
      { speaker: 'lucas', text: 'Yeah, I’m looking for work.', refs: [] },
      { speaker: 'akari', text: 'No worries! <strong>The manager’s not in right now, but I’ll pass this on.</strong> <strong>Let me put your name on it so it doesn’t get lost.</strong>', refs: [83, 85] },
      { speaker: 'lucas', text: 'Thanks so much. When might I hear back?', refs: [] },
      { speaker: 'akari', text: '<strong>She usually gets back to people within a week or so.</strong> <strong>Thanks for dropping in — good luck!</strong>', refs: [87, 90] }
    ],
    keyPoints: [
      { phrase: '"I’ll pass this on."', desc: '店長不在時の定番。確実に取り次ぐ姿勢を見せる。' },
      { phrase: '"gets back to people within a week"', desc: '返事の目安を伝えると応募者が安心する。' }
    ]
  },
  'coworkers': {
    sceneTitle: 'ピーク時の連携',
    sceneTitleEn: 'Teamwork in the Rush',
    sceneDesc: '急に混み出したカフェ。<br>Akari・バリスタのYuna・店長Chloeが<br>声を掛け合って乗り切る。',
    imageFile: 'scene-coworkers.png',
    cultureText: '忙しい現場では短い声かけがすべて。‘Heads up’（共有ね）、‘when you get a sec’（手が空いたら）、‘Thanks heaps’（超ありがとう）など、軽くて速い豪口語がチームを回す。',
    bubbles: [
      { speaker: 'akari', text: 'Yuna, <strong>can you make a large oat latte when you get a sec</strong>?', refs: [91] },
      { speaker: 'yuna',  text: 'On it!', refs: [] },
      { speaker: 'akari', text: '<strong>Heads up — order eighty-two’s a nut allergy.</strong>', refs: [92] },
      { speaker: 'chloe', text: 'We’re <strong>getting slammed</strong> — Akari, <strong>can you cover the till for a minute</strong>?', refs: [93, 94] },
      { speaker: 'akari', text: 'Yep! Oh — <strong>we’re running low on oat milk.</strong>', refs: [95] },
      { speaker: 'chloe', text: 'I’ll grab some. <strong>Thanks heaps for today, team!</strong>', refs: [100] }
    ],
    keyPoints: [
      { phrase: '"Heads up — ..."', desc: 'アレルギー等の重要共有の前置き。チーム連携で必須。' },
      { phrase: '"Thanks heaps"', desc: '‘Thanks heaps’ は豪口語で「本当にありがとう」に近い表現。仲間への感謝が伝わる。' }
    ]
  }
};

// ── CSS strings ────────────────────────────────────────────────────────────────

var PHRASE_CSS = '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif; background: #b8b8b8; padding: 30px; }\n' +
'.page { width: 1123px; height: 794px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 6px 32px rgba(0,0,0,0.28); overflow: hidden; }\n' +
'.header { background: #1B2A5E; flex-shrink: 0; height: 128px; border-top: 5px solid #D4A843; position: relative; overflow: hidden; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }\n' +
'.header::before { content: "ONLINE MEETINGS"; position: absolute; right: -10px; bottom: -18px; font-size: 88px; font-weight: 900; letter-spacing: -0.02em; color: rgba(255,255,255,0.04); white-space: nowrap; pointer-events: none; line-height: 1; }\n' +
'.header-left { display: flex; flex-direction: column; gap: 4px; }\n' +
'.header-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }\n' +
'.header-logo { height: 20px; width: auto; }\n' +
'.header-series { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: rgba(255,255,255,0.35); }\n' +
'.header-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.01em; line-height: 1.2; white-space: nowrap; }\n' +
'.header-title2 { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); letter-spacing: 0.01em; }\n' +
'.header-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; z-index: 1; }\n' +
'.header-category { color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 2px; white-space: nowrap; }\n' +
'.header-range { font-size: 38px; font-weight: 900; color: rgba(255,255,255,0.35); letter-spacing: 0.02em; line-height: 1; }\n' +
'.phrase-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(5, 1fr); min-height: 0; }\n' +
'.phrase-cell { padding: 7px 18px 5px 14px; border-right: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; display: flex; flex-direction: column; gap: 2px; overflow: hidden; position: relative; }\n' +
'.phrase-cell:nth-child(even) { border-right: none; }\n' +
'.phrase-cell:nth-child(9), .phrase-cell:nth-child(10) { border-bottom: none; }\n' +
'.phrase-cell::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 2px 2px 0; }\n' +
'.phrase-top { display: flex; align-items: baseline; gap: 8px; }\n' +
'.phrase-num { font-size: 11px; font-weight: 900; flex-shrink: 0; min-width: 22px; line-height: 1; }\n' +
'.phrase-en { font-size: 16px; font-weight: 700; color: #0d0d0d; line-height: 1.25; }\n' +
'.em { color: #C0392B; font-weight: 800; }\n' +
'.phrase-ja { font-size: 11px; color: #444; line-height: 1.3; padding-left: 30px; }\n' +
'.phrase-katakana { font-size: 10px; color: #888; letter-spacing: 0.06em; padding-left: 30px; }\n' +
'.phrase-meta { display: flex; align-items: flex-start; gap: 5px; padding-left: 30px; flex-wrap: wrap; margin-top: 1px; }\n' +
'.type-badge { font-size: 9px; font-weight: 700; color: #fff; padding: 1px 6px; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }\n' +
'.phrase-scene { font-size: 10px; color: #666; line-height: 1.5; }\n' +
'.street-note { font-size: 9.5px; color: #7a3a0a; background: #FFF8F0; border-left: 2px solid #D4A843; padding: 2px 7px; border-radius: 0 2px 2px 0; line-height: 1.4; margin-left: 30px; }\n' +
'.footer { height: 24px; flex-shrink: 0; border-top: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 9px; color: #c0c0c0; }\n';

var ROLEPLAY_CSS = '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
'body { font-family: "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif; background: #b8b8b8; padding: 30px; }\n' +
'.page { width: 1123px; height: 794px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 6px 32px rgba(0,0,0,0.28); overflow: hidden; }\n' +
'.header { background: #1B2A5E; flex-shrink: 0; height: 118px; border-top: 5px solid #D4A843; position: relative; overflow: hidden; padding: 16px 28px 14px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }\n' +
'.header::before { content: "ROLE PLAY"; position: absolute; right: -10px; bottom: -18px; font-size: 88px; font-weight: 900; letter-spacing: -0.02em; color: rgba(255,255,255,0.04); white-space: nowrap; pointer-events: none; line-height: 1; }\n' +
'.header-left { flex: 1; display: flex; flex-direction: column; gap: 4px; }\n' +
'.header-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }\n' +
'.header-logo { height: 18px; width: auto; }\n' +
'.header-series { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 0.14em; }\n' +
'.header-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.01em; line-height: 1.2; white-space: nowrap; }\n' +
'.header-title2 { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 0.02em; line-height: 1.2; }\n' +
'.header-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; z-index: 1; }\n' +
'.header-badge { background: #D4A843; color: #1B2A5E; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 2px; white-space: nowrap; }\n' +
'.header-type { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 0.06em; }\n' +
'.body { flex: 1; display: flex; gap: 0; overflow: hidden; min-height: 0; }\n' +
'.left-col { width: 288px; flex-shrink: 0; display: flex; flex-direction: column; border-right: 1px solid #e8e8e8; overflow: hidden; }\n' +
'.scene-illus { height: 210px; overflow: hidden; position: relative; flex-shrink: 0; background: linear-gradient(150deg, #1a2750 0%, #253980 100%); }\n' +
'.scene-illus img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; position: absolute; inset: 0; }\n' +
'.scene-illus-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 40%, rgba(27,42,94,0.75)); }\n' +
'.scene-illus-text { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 14px 10px; z-index: 2; }\n' +
'.scene-illus-cat { font-size: 9px; font-weight: 800; letter-spacing: 0.18em; color: #D4A843; text-transform: uppercase; margin-bottom: 3px; }\n' +
'.scene-illus-title { font-size: 13px; font-weight: 800; color: #fff; line-height: 1.3; }\n' +
'.scene-box { flex: 1; background: #F4F6FB; padding: 10px 13px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }\n' +
'.scene-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em; color: #D4A843; text-transform: uppercase; }\n' +
'.scene-title { font-size: 12px; font-weight: 800; color: #1B2A5E; line-height: 1.3; }\n' +
'.scene-desc { font-size: 10.5px; color: #555; line-height: 1.6; }\n' +
'.characters { display: flex; flex-direction: column; gap: 5px; }\n' +
'.char-row { display: flex; align-items: center; gap: 8px; }\n' +
'.char-photo-wrap { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; clip-path: circle(50% at center); flex-shrink: 0; }\n' +
'.char-photo { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }\n' +
'.char-avatar-circle { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0; }\n' +
'.char-name { font-size: 10px; font-weight: 700; color: #222; }\n' +
'.char-role { font-size: 9px; color: #888; }\n' +
'.culture-note { margin-top: 2px; background: #fff; border: 1px solid #e8e8e8; border-radius: 4px; padding: 7px 10px; flex: 1; overflow: hidden; }\n' +
'.culture-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.12em; color: #2E5896; text-transform: uppercase; margin-bottom: 3px; }\n' +
'.culture-text { font-size: 9.5px; color: #444; line-height: 1.5; }\n' +
'.right-col { flex: 1; display: flex; flex-direction: column; overflow: hidden; }\n' +
'.convo-area { flex: 1; padding: 6px 14px 4px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }\n' +
'.convo-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em; color: #999; text-transform: uppercase; margin-bottom: 2px; }\n' +
'.bubble-row { display: flex; gap: 8px; align-items: flex-start; }\n' +
'.bubble-row.right { flex-direction: row-reverse; }\n' +
'.avatar-wrap { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; clip-path: circle(50% at center); flex-shrink: 0; margin-top: 2px; }\n' +
'.avatar { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }\n' +
'.avatar-circle { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0; margin-top: 2px; }\n' +
'.bubble-wrap { display: flex; flex-direction: column; gap: 1px; max-width: 68%; }\n' +
'.bubble-row.right .bubble-wrap { align-items: flex-end; }\n' +
'.bubble-name { font-size: 9px; font-weight: 700; color: #888; padding: 0 4px; }\n' +
'.bubble { padding: 5px 10px; border-radius: 12px; font-size: 13px; font-weight: 500; line-height: 1.45; color: #111; }\n' +
'.bubble.kenta { background: #EEF2FB; border-radius: 4px 12px 12px 12px; }\n' +
'.bubble.other { background: #F5F5F5; border-radius: 12px 4px 12px 12px; }\n' +
'.bubble strong { color: #C0392B; font-weight: 800; }\n' +
'.phrase-ref { display: inline-flex; align-items: center; background: #D4A843; color: #fff; font-size: 8.5px; font-weight: 800; padding: 1px 5px; border-radius: 10px; margin-left: 4px; vertical-align: middle; white-space: nowrap; }\n' +
'.key-points { flex-shrink: 0; border-top: 1px solid #e8e8e8; padding: 6px 16px; background: #FAFBFD; }\n' +
'.key-points-label { font-size: 8.5px; font-weight: 800; letter-spacing: 0.12em; color: #2E5896; text-transform: uppercase; margin-bottom: 4px; }\n' +
'.key-points-grid { display: flex; flex-direction: column; gap: 4px; }\n' +
'.key-point-item { display: flex; flex-direction: row; align-items: baseline; gap: 12px; background: #EEF2FB; border-left: 3px solid #2E5896; border-radius: 0 4px 4px 0; padding: 4px 10px; }\n' +
'.kp-phrase { font-size: 12px; font-weight: 800; color: #1B2A5E; flex-shrink: 0; min-width: 160px; }\n' +
'.kp-desc { font-size: 11px; color: #444; line-height: 1.45; }\n' +
'.footer { height: 22px; flex-shrink: 0; border-top: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; font-size: 9px; color: #c0c0c0; }\n';

// ── Page generators ────────────────────────────────────────────────────────────

function renderPhrasePage(cat, phrases) {
  var cells = phrases.map(renderPhraseCell).join('');
  var catColorStyle = 'background:' + cat.color + ';';
  var accentStyle = 'color:' + cat.color + ';';
  var borderStyle = 'border-color:' + cat.color + ';';
  // inject per-category color via inline override
  var cellColorOverride = '<style>.phrase-cell::before { background: ' + cat.color + '; } .phrase-num { color: ' + cat.color + '; }</style>\n';
  return '<!DOCTYPE html>\n' +
    '<html lang="ja">\n<head>\n<meta charset="UTF-8">\n' +
    '<title>Phrase Page ' + pad(cat.idx) + '</title>\n' +
    '<style>\n' + PHRASE_CSS + '</style>\n' +
    cellColorOverride +
    '</head>\n<body>\n' +
    '<div class="page">\n' +
    '  <div class="header">\n' +
    '    <div class="header-left">\n' +
    '      <div class="header-logo-row">\n' +
    '        <img class="header-logo" src="' + LOGO_WHITE + '" alt="ENGLEAD">\n' +
    '        <span class="header-series">Phrasebook No.001 &nbsp;Cafe Counter Service</span>\n' +
    '      </div>\n' +
    '      <div class="header-title">カフェのカウンター接客｜' + cat.ja + '</div>\n' +
    '      <div class="header-title2">' + esc(data.meta.subtitle) + '</div>\n' +
    '    </div>\n' +
    '    <div class="header-right">\n' +
    '      <span class="header-category" style="' + catColorStyle + '">' + cat.ja + ' &nbsp;/&nbsp; ' + cat.en + '</span>\n' +
    '      <span class="header-range">' + pad(cat.from) + '&#8211;' + pad(cat.to) + '</span>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="phrase-grid">\n' + cells + '  </div>\n' +
    '  <div class="footer">\n' +
    '    <span>タビケン留学 Phrasebook No.001: Cafe Counter Service</span>\n' +
    '    <span style="color:#1B2A5E;font-weight:700;">' + cat.ja + ' / ' + cat.en + '</span>\n' +
    '  </div>\n' +
    '</div>\n</body>\n</html>';
}

function renderRoleplayPage(cat, rp) {
  var bubblesHtml = '';
  for (var b = 0; b < rp.bubbles.length; b++) {
    var bubble = rp.bubbles[b];
    bubblesHtml += renderBubble(bubble.speaker, bubble.text, bubble.refs);
  }
  var kpHtml = '';
  for (var k = 0; k < rp.keyPoints.length; k++) {
    var kp = rp.keyPoints[k];
    kpHtml += '          <div class="key-point-item">\n' +
      '            <div class="kp-phrase">' + esc(kp.phrase) + '</div>\n' +
      '            <div class="kp-desc">' + kp.desc + '</div>\n' +
      '          </div>\n';
  }
  return '<!DOCTYPE html>\n' +
    '<html lang="ja">\n<head>\n<meta charset="UTF-8">\n' +
    '<title>Role Play ' + pad(cat.idx) + '</title>\n' +
    '<style>\n' + ROLEPLAY_CSS + '</style>\n' +
    '</head>\n<body>\n' +
    '<div class="page">\n' +
    '  <div class="header">\n' +
    '    <div class="header-left">\n' +
    '      <div class="header-logo-row">\n' +
    '        <img class="header-logo" src="' + LOGO_WHITE + '" alt="ENGLEAD">\n' +
    '        <span class="header-series">Phrasebook No.001 &nbsp;Cafe Counter Service</span>\n' +
    '      </div>\n' +
    '      <div class="header-title">カフェのカウンター接客｜' + cat.ja + '</div>\n' +
    '      <div class="header-title2">ロールプレイをしてみよう</div>\n' +
    '    </div>\n' +
    '    <div class="header-right">\n' +
    '      <span class="header-badge">ROLE PLAY</span>\n' +
    '      <span class="header-type">' + cat.ja + '</span>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="body">\n' +
    '    <div class="left-col">\n' +
    '      <div class="scene-illus">\n' +
    '        <img src="../assets/illustrations/' + rp.imageFile + '" alt="" onerror="this.style.display=\'none\'">\n' +
    '        <div class="scene-illus-overlay"></div>\n' +
    '        <div class="scene-illus-text">\n' +
    '          <div class="scene-illus-cat">Scene &mdash; ' + cat.en + '</div>\n' +
    '          <div class="scene-illus-title">' + rp.sceneTitle + '</div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="scene-box">\n' +
    '        <div class="scene-label">Scene</div>\n' +
    '        <div class="scene-title">' + rp.sceneTitle + '<br>' + rp.sceneTitleEn + '</div>\n' +
    '        <div class="scene-desc">' + rp.sceneDesc + '</div>\n' +
    '        <div class="characters">\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/akari.png" alt="Akari" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#1398BF;&quot;>A</div>\'"></div>\n' +
    '            <div><div class="char-name">Akari</div><div class="char-role">ワーホリ中・カフェのレジ担当</div></div>\n' +
    '          </div>\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/cooper.png" alt="Cooper" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#FFA500;&quot;>C</div>\'"></div>\n' +
    '            <div><div class="char-name">Cooper</div><div class="char-role">常連客・地元のサーファー</div></div>\n' +
    '          </div>\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/yuna.png" alt="Yuna" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#1DAE9D;&quot;>Y</div>\'"></div>\n' +
    '            <div><div class="char-name">Yuna</div><div class="char-role">同僚バリスタ・韓国人WH</div></div>\n' +
    '          </div>\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/lucas.png" alt="Lucas" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#8154DA;&quot;>L</div>\'"></div>\n' +
    '            <div><div class="char-name">Lucas</div><div class="char-role">友達・求職中の留学生</div></div>\n' +
    '          </div>\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/chloe.png" alt="Chloe" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#2E6B96;&quot;>C</div>\'"></div>\n' +
    '            <div><div class="char-name">Chloe</div><div class="char-role">カフェの店長</div></div>\n' +
    '          </div>\n' +
    '          <div class="char-row">\n' +
    '            <div class="char-photo-wrap"><img class="char-photo" src="../assets/avatars/kenta.png" alt="Kenta" onerror="this.parentNode.outerHTML=\'<div class=&quot;char-avatar-circle&quot; style=&quot;background:#1B2A5E;&quot;>K</div>\'"></div>\n' +
    '            <div><div class="char-name">Kenta</div><div class="char-role">英語上級者・ときどき来店</div></div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="culture-note">\n' +
    '          <div class="culture-label">Note</div>\n' +
    '          <div class="culture-text">' + rp.cultureText + '</div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="right-col">\n' +
    '      <div class="convo-area">\n' +
    '        <div class="convo-label">Conversation</div>\n' +
    bubblesHtml +
    '      </div>\n' +
    '      <div class="key-points">\n' +
    '        <div class="key-points-label">使い方のポイント</div>\n' +
    '        <div class="key-points-grid">\n' + kpHtml +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="footer">\n' +
    '    <span>タビケン留学 Phrasebook No.001: Cafe Counter Service</span>\n' +
    '    <span style="color:#1B2A5E;font-weight:700;">' + cat.ja + ' / Role Play</span>\n' +
    '  </div>\n' +
    '</div>\n</body>\n</html>';
}

function renderCoverPage() {
  return '<!DOCTYPE html>\n' +
    '<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<title>Cover</title>\n' +
    '<style>\n' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif; background: #b8b8b8; padding: 30px; }\n' +
    '.page { width: 1123px; height: 794px; background: #1B2A5E; display: flex; flex-direction: column; position: relative; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.28); border-top: 5px solid #D4A843; }\n' +
    '.cover-body { flex: 1; display: flex; flex-direction: row; align-items: center; padding: 48px 64px 48px 72px; gap: 52px; z-index: 1; }\n' +
    '.cover-left { flex: 1; display: flex; flex-direction: column; }\n' +
    '.cover-top { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }\n' +
    '.cover-logo { height: 22px; width: auto; }\n' +
    '.cover-series { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; color: #D4A843; }\n' +
    '.cover-en-title { font-size: 56px; font-weight: 900; color: #fff; letter-spacing: -0.02em; line-height: 1.0; margin-bottom: 8px; }\n' +
    '.cover-ja-title { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.75); margin-bottom: 20px; }\n' +
    '.cover-tagline { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 0.06em; margin-bottom: 36px; }\n' +
    '.cover-desc { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.85; border-left: 3px solid rgba(212,168,67,0.4); padding-left: 18px; }\n' +
    '.cover-right { flex-shrink: 0; width: 400px; height: 420px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; }\n' +
    '.illus-tile { position: relative; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.06); border: 1px solid rgba(212,168,67,0.2); }\n' +
    '.illus-tile img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; display: block; }\n' +
    '.illus-tile-label { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.6)); padding: 14px 10px 7px; font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.04em; }\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="page">\n' +
    '  <div class="cover-body">\n' +
    '    <div class="cover-left">\n' +
    '      <div class="cover-top">\n' +
    '        <img class="cover-logo" src="' + LOGO_WHITE + '" alt="ENGLEAD">\n' +
    '        <span class="cover-series">Phrasebook No.001 &nbsp;Cafe Counter Service</span>\n' +
    '      </div>\n' +
    '      <div class="cover-en-title">Cafe Counter Service</div>\n' +
    '      <div class="cover-ja-title">カフェのカウンター接客で使える英語</div>\n' +
    '      <div class="cover-tagline">' + esc(data.meta.subtitle_ja) + '</div>\n' +
    '      <div class="cover-desc">' + esc(data.meta.description_ja) + '</div>\n' +
    '    </div>\n' +
    '    <div class="cover-right">\n' +
    catDefs.slice(0, 4).map(function (c) {
      return '      <div class="illus-tile"><img src="../assets/illustrations/scene-' + c.id + '.png" alt="' + esc(c.ja) + '"><div class="illus-tile-label">' + esc(c.ja) + '</div></div>\n';
    }).join('') +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n</body>\n</html>';
}

function renderHowtoPage() {
  var catRows = '';
  for (var ci = 0; ci < catDefs.length; ci++) {
    catRows += '        <div class="cat-item" style="border-left:3px solid ' + catDefs[ci].color + ';">' + esc(catDefs[ci].ja) + '<span class="cat-count">10フレーズ</span></div>\n';
  }
  return '<!DOCTYPE html>\n' +
    '<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<title>How To Use</title>\n' +
    '<style>\n' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif; background: #b8b8b8; padding: 30px; }\n' +
    '.page { width: 1123px; height: 794px; background: #fff; display: flex; flex-direction: column; box-shadow: 0 6px 32px rgba(0,0,0,0.28); overflow: hidden; }\n' +
    '.header { background: #1B2A5E; flex-shrink: 0; height: 118px; border-top: 5px solid #D4A843; position: relative; overflow: hidden; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }\n' +
    '.header::before { content: "HOW TO USE"; position: absolute; right: -10px; bottom: -18px; font-size: 88px; font-weight: 900; letter-spacing: -0.02em; color: rgba(255,255,255,0.04); white-space: nowrap; pointer-events: none; line-height: 1; }\n' +
    '.header-left { flex: 1; display: flex; flex-direction: column; gap: 4px; }\n' +
    '.header-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }\n' +
    '.header-logo { height: 18px; width: auto; }\n' +
    '.header-series { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 0.14em; }\n' +
    '.header-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.01em; line-height: 1.2; white-space: nowrap; }\n' +
    '.header-title2 { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.6); }\n' +
    '.header-right { flex-shrink: 0; z-index: 1; }\n' +
    '.header-badge { background: #D4A843; color: #1B2A5E; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 2px; }\n' +
    '.content { flex: 1; padding: 18px 40px 14px; overflow: hidden; }\n' +
    '.page-title { font-size: 20px; font-weight: 800; color: #1B2A5E; padding-bottom: 10px; border-bottom: 2px solid #1B2A5E; margin-bottom: 14px; }\n' +
    '.section { margin-bottom: 16px; }\n' +
    '.section-label { display: inline-block; background: #1B2A5E; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 2px; margin-bottom: 7px; }\n' +
    '.section-text { font-size: 13px; line-height: 1.75; color: #444; }\n' +
    '.legend { display: flex; flex-direction: column; }\n' +
    '.legend-row { display: flex; align-items: baseline; gap: 20px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }\n' +
    '.legend-row:last-child { border-bottom: none; }\n' +
    '.legend-key { min-width: 150px; font-size: 12px; font-weight: 700; color: #222; flex-shrink: 0; }\n' +
    '.legend-val { font-size: 12px; color: #555; line-height: 1.5; }\n' +
    '.em { color: #C0392B; font-weight: 800; }\n' +
    '.categories { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }\n' +
    '.cat-item { padding: 7px 12px; font-size: 12px; font-weight: 600; color: #333; background: #f8f8f8; }\n' +
    '.cat-count { font-size: 10px; font-weight: 400; color: #999; margin-left: 5px; }\n' +
    '.footer { height: 24px; flex-shrink: 0; border-top: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 9px; color: #c0c0c0; }\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="page">\n' +
    '  <div class="header">\n' +
    '    <div class="header-left">\n' +
    '      <div class="header-logo-row">\n' +
    '        <img class="header-logo" src="' + LOGO_WHITE + '" alt="ENGLEAD">\n' +
    '        <span class="header-series">Phrasebook No.001 &nbsp;Cafe Counter Service</span>\n' +
    '      </div>\n' +
    '      <div class="header-title">フレーズブックの使い方</div>\n' +
    '      <div class="header-title2">How to Use This Phrasebook</div>\n' +
    '    </div>\n' +
    '    <div class="header-right"><span class="header-badge">使い方ガイド</span></div>\n' +
    '  </div>\n' +
    '  <div class="content">\n' +
    '    <div class="page-title">このフレーズブックの使い方</div>\n' +
    '    <div class="section">\n' +
    '      <div class="section-label">ターゲット</div>\n' +
    '      <p class="section-text">ワーホリで現地のカフェのカウンターに立つ人向けに設計しています。ウェイターでもバリスタでもなく「カウンター接客」というポジションに絞り、現場で本当に使う表現だけを掲載。カフェの本場であるオーストラリアやカナダらしい言い回しも取り入れています。</p>\n' +
    '    </div>\n' +
    '    <div class="section">\n' +
    '      <div class="section-label">各フレーズの見方</div>\n' +
    '      <div class="legend">\n' +
    '        <div class="legend-row"><span class="legend-key">英文フレーズ</span><span class="legend-val">そのまま使えるフレーズ本体。<span class="em">赤文字</span>が特に重要なポイント。</span></div>\n' +
    '        <div class="legend-row"><span class="legend-key">カタカナ読み</span><span class="legend-val">発音の目安。実際の音声とあわせて確認してください。</span></div>\n' +
    '        <div class="legend-row"><span class="legend-key"><span style="background:#1A3B6B;color:#fff;padding:1px 6px;border-radius:2px;font-size:10px;">フレーズ</span></span><span class="legend-val">汎用的な定型表現</span></div>\n' +
    '        <div class="legend-row"><span class="legend-key"><span style="background:#C0392B;color:#fff;padding:1px 6px;border-radius:2px;font-size:10px;">イディオム</span></span><span class="legend-val">慣用的な表現。直訳すると意味が通じないもの。</span></div>\n' +
    '        <div class="legend-row"><span class="legend-key">💡 Native Note</span><span class="legend-val">ネイティブの現場感覚・使い方のコツ。</span></div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="section">\n' +
    '      <div class="section-label">収録カテゴリ</div>\n' +
    '      <div class="categories">\n' +
    catRows +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="footer">\n' +
    '    <span>タビケン留学 Phrasebook No.001: Cafe Counter Service</span>\n' +
    '    <span style="color:#1B2A5E;font-weight:700;">使い方ガイド</span>\n' +
    '  </div>\n' +
    '</div>\n</body>\n</html>';
}

function renderCtaPage() {
  var illustSrc = '../assets/cta/cover.png';
  var cardIllus = function(n) {
    return '../assets/cta/card-0' + n + '.png';
  };
  return '<!DOCTYPE html>\n' +
    '<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<title>無料留学カウンセリング</title>\n' +
    '<style>\n' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: "Helvetica Neue", "Hiragino Sans", "Yu Gothic", sans-serif; background: #b8b8b8; padding: 30px; }\n' +
    '.page { width: 1123px; height: 794px; background: #fff; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 6px 32px rgba(0,0,0,0.22); border-top: 5px solid #D4A843; }\n' +
    '.hdr { background: #1B2A5E; flex-shrink: 0; height: 40px; display: flex; align-items: center; padding: 0 28px; gap: 10px; }\n' +
    '.hdr-logo { height: 15px; width: auto; }\n' +
    '.hdr-sep { width: 1px; height: 11px; background: rgba(255,255,255,0.2); }\n' +
    '.hdr-series { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; color: rgba(255,255,255,0.35); }\n' +
    '.hdr-badge { margin-left: auto; background: #D4A843; color: #1B2A5E; font-size: 8.5px; font-weight: 800; letter-spacing: 0.1em; padding: 3px 10px; border-radius: 2px; }\n' +
    '.hl { flex-shrink: 0; padding: 11px 0 10px; text-align: center; border-bottom: 1px solid #eee; }\n' +
    '.hl-eyebrow { font-size: 8.5px; font-weight: 800; letter-spacing: 0.22em; color: #D4A843; text-transform: uppercase; margin-bottom: 3px; }\n' +
    '.hl-title { font-size: 18px; font-weight: 900; color: #1B2A5E; line-height: 1.35; }\n' +
    '.img-sec { flex-shrink: 0; padding: 9px 24px 7px; }\n' +
    '.img-inner { position: relative; border-radius: 10px; overflow: hidden; height: 200px; }\n' +
    '.img-inner img { width: 100%; height: 100%; object-fit: cover; object-position: center 28%; display: block; }\n' +
    '.stats-bar { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(27,42,94,0.9); display: flex; }\n' +
    '.stat { flex: 1; padding: 7px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid rgba(255,255,255,0.12); gap: 1px; }\n' +
    '.stat:last-child { border-right: none; }\n' +
    '.stat-n { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; letter-spacing: -0.02em; }\n' +
    '.stat-n .u { font-size: 11px; font-weight: 700; }\n' +
    '.stat-l { font-size: 8px; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 0.04em; }\n' +
    '.cards-sec { flex: 1; display: flex; flex-direction: column; padding: 10px 20px 0; min-height: 0; }\n' +
    '.cards-lbl { font-size: 13px; font-weight: 800; color: #1B2A5E; border-left: 3px solid #D4A843; padding-left: 9px; margin-bottom: 8px; flex-shrink: 0; }\n' +
    '.cards-row { display: flex; gap: 12px; flex: 1; min-height: 0; padding-bottom: 8px; }\n' +
    '.card { flex: 1; border: 1px solid #e0e6f0; border-radius: 8px; background: #fff; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 2px 8px rgba(27,42,94,0.06); }\n' +
    '.card-il { width: 100%; flex: 1 1 auto; min-height: 0; overflow: hidden; background: #F2F5F9; padding: 3px; border-bottom: 1px solid #e0e6f0; }\n' +
    '.card-il-report { background: #fff; }\n' +
    '.card-il-report img { object-position: center; }\n' +
    '.card-il img { width: 100%; height: 100%; object-fit: contain; display: block; }\n' +
    '.card-body { padding: 9px 13px 10px; display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; overflow: hidden; }\n' +
    '.card-head { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }\n' +
    '.card-num { width: 20px; height: 20px; border-radius: 50%; background: #1B2A5E; color: #fff; font-size: 8.5px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }\n' +
    '.card-title { font-size: 12px; font-weight: 800; color: #1B2A5E; line-height: 1.3; }\n' +
    '.card-desc { font-size: 11px; color: #555; line-height: 1.65; overflow: hidden; }\n' +
    '.bottom { flex-shrink: 0; height: 66px; border-top: 1px solid #e0e0e0; display: flex; }\n' +
    '.promo { flex: none; width: 50%; min-width: 0; background: #FFF8E8; border-right: 1px solid #F0D880; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 0 18px; }\n' +
    '.promo-main { display: flex; align-items: center; gap: 8px; }\n' +
    '.promo-tag { background: #C0392B; color: #fff; font-size: 8px; font-weight: 800; padding: 3px 8px; border-radius: 2px; letter-spacing: 0.06em; flex-shrink: 0; }\n' +
    '.promo-price { display: flex; align-items: baseline; gap: 3px; }\n' +
    '.promo-label { font-size: 12px; font-weight: 700; color: #C0392B; line-height: 1; }\n' +
    '.promo-amount { font-size: 23px; font-weight: 900; color: #C0392B; line-height: 1; font-family: "Helvetica Neue", Arial, sans-serif; letter-spacing: -0.02em; }\n' +
    '.promo-off { font-size: 14px; font-weight: 900; color: #C0392B; line-height: 1; font-family: "Helvetica Neue", Arial, sans-serif; }\n' +
    '.promo-sub { font-size: 8.5px; color: #888; margin-top: 3px; }\n' +
    '.cta { flex: none; width: 50%; min-width: 0; background: #06C755; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 0 32px; }\n' +
    '.cta-row { display: flex; align-items: center; gap: 10px; }\n' +
    '.cta-badge { background: #fff; border-radius: 4px; padding: 2px 9px; font-size: 10px; font-weight: 900; color: #06C755; flex-shrink: 0; }\n' +
    '.cta-main { font-size: 15px; font-weight: 900; color: #fff; }\n' +
    '.cta-sub { font-size: 10.5px; color: rgba(255,255,255,0.88); }\n' +
    '.footer { flex-shrink: 0; height: 22px; border-top: 1px solid #eee; background: #fafafa; display: flex; align-items: center; justify-content: center; gap: 8px; }\n' +
    '.fi { font-size: 8.5px; color: #bbb; }\n' +
    '.fd { width: 2px; height: 2px; border-radius: 50%; background: #ddd; }\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="page">\n' +
    '  <div class="hdr">\n' +
    '    <img class="hdr-logo" src="' + LOGO_WHITE + '" alt="ENGLEAD">\n' +
    '    <div class="hdr-sep"></div>\n' +
    '    <span class="hdr-series">Phrasebook No.001 &nbsp;Cafe Counter Service</span>\n' +
    '    <span class="hdr-badge">FREE COUNSELING</span>\n' +
    '  </div>\n' +
    '  <div class="hl">\n' +
    '    <div class="hl-eyebrow">Next Step</div>\n' +
    '    <div class="hl-title">タビケンプライムの無料留学カウンセリングで、英語力診断と留学相談を受けてみませんか？</div>\n' +
    '  </div>\n' +
    '  <div class="img-sec">\n' +
    '    <div class="img-inner">\n' +
    '      <img src="' + illustSrc + '" alt="">\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="cards-sec">\n' +
    '    <div class="cards-lbl">無料留学カウンセリングでできること</div>\n' +
    '    <div class="cards-row">\n' +
    '      <div class="card">\n' +
    '        <div class="card-il card-il-report"><img src="../assets/cta/diagnosis.png" alt="タビケンプライム 英語力診断テスト結果の例"></div>\n' +
    '        <div class="card-body">\n' +
    '          <div class="card-head"><div class="card-num">01</div><div class="card-title">英語力診断テスト</div></div>\n' +
    '          <div class="card-desc">タビケンプライムの英語力診断テストで、単語・スピーキング・ワーホリ対応力などをスコア化し、CEFR（国際基準）で総合レベルを判定。さらに、いまの英語力で「現地でチャレンジできる職種」まで分かる診断結果をその場でお渡しします。</div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="card">\n' +
    '        <div class="card-il"><img src="../assets/cta/consult.png" alt=""></div>\n' +
    '        <div class="card-body">\n' +
    '          <div class="card-head"><div class="card-num">02</div><div class="card-title">留学相談</div></div>\n' +
    '          <div class="card-desc">診断結果とヒアリングをもとに、あなたに合った留学・ワーホリのプランを担当コンサルタントがご提案します。国選び・費用・準備・現地での過ごし方まで、「何から始めればいい？」の疑問もその場で解消できます。</div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="bottom">\n' +
    '    <div class="promo">\n' +
    '      <div class="promo-main">\n' +
    '        <div class="promo-tag">まずはここから</div>\n' +
    '        <div class="promo-price">\n' +
    '          <span class="promo-label">いまの英語力に合った留学・ワーホリプランが分かる</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="promo-sub">タビケンプライムの無料留学カウンセリング</div>\n' +
    '    </div>\n' +
    '    <div class="cta">\n' +
    '      <div class="cta-row">\n' +
    '        <div class="cta-badge">LINE</div>\n' +
    '        <div class="cta-main">このままトーク画面からご相談いただけます</div>\n' +
    '      </div>\n' +
    '      <div class="cta-sub">このLINEで「留学相談したい」とメッセージを送ってください。担当者がご案内します。</div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="footer">\n' +
    '    <span class="fi">完全無料</span><span class="fd"></span>\n' +
    '    <span class="fi">完全オンライン（Zoom）</span><span class="fd"></span>\n' +
    '    <span class="fi">国内・海外どこからでも参加可能</span><span class="fd"></span>\n' +
    '    <span class="fi">tabiken-ryugaku.co.jp</span>\n' +
    '  </div>\n' +
    '</div>\n</body>\n</html>';
}

// ── Generate all pages ────────────────────────────────────────────────────────

var outDir = path.join(__dirname, 'output') + '/';

fs.writeFileSync(outDir + 'cover.html', themed(renderCoverPage()));
console.log('cover.html');

fs.writeFileSync(outDir + 'howto.html', themed(renderHowtoPage()));
console.log('howto.html');

for (var ci = 0; ci < catDefs.length; ci++) {
  var cat = catDefs[ci];
  var phrases = data.phrases.filter(function(p) { return p.category === cat.id; });
  var numStr = pad(cat.idx);

  var phraseHtml = themed(renderPhrasePage(cat, phrases));
  fs.writeFileSync(outDir + 'phrase-' + numStr + '.html', phraseHtml);
  console.log('phrase-' + numStr + '.html');

  var rp = rpDefs[cat.id];
  var roleplayHtml = themed(renderRoleplayPage(cat, rp));
  fs.writeFileSync(outDir + 'roleplay-' + numStr + '.html', roleplayHtml);
  console.log('roleplay-' + numStr + '.html');
}

fs.writeFileSync(outDir + 'cta.html', themed(renderCtaPage()));
console.log('cta.html');

// ── viewer.html（catDefsからスライド一覧を自動生成）────────────────────────────
var slideLines = "  { file: 'cover.html', label: '表紙' },\n  { file: 'howto.html', label: '使い方ガイド' },\n";
catDefs.forEach(function (c) {
  var n = pad(c.idx);
  slideLines += "  { file: 'phrase-" + n + ".html', label: '" + n + " " + c.ja + " — フレーズ' },\n";
  slideLines += "  { file: 'roleplay-" + n + ".html', label: '" + n + " " + c.ja + " — ロールプレイ' },\n";
});
slideLines += "  { file: 'cta.html', label: '無料留学カウンセリングのご案内' }\n";
var viewerHtml = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="UTF-8">\n<title>タビケン留学 Phrasebook Viewer</title>\n<style>\n' +
  '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
  'body { background: #111; font-family: "Helvetica Neue", sans-serif; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }\n' +
  '#toolbar { background: #1a1a1a; border-bottom: 1px solid #333; padding: 8px 20px; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }\n' +
  '#counter { color: #fff; font-size: 13px; font-weight: 700; min-width: 80px; }\n' +
  '#title { color: #aaa; font-size: 12px; flex: 1; }\n' +
  '.btn { background: #333; color: #fff; border: none; padding: 6px 18px; border-radius: 4px; font-size: 13px; cursor: pointer; font-weight: 600; }\n' +
  '.btn:hover { background: ' + ACCENT + '; color: #111; }\n' +
  '.btn:disabled { opacity: 0.3; cursor: default; }\n' +
  '#hint { color: #555; font-size: 11px; }\n' +
  '#frame-wrap { flex: 1; display: flex; align-items: center; justify-content: center; background: #222; overflow: hidden; padding: 12px; }\n' +
  'iframe { width: 1123px; height: 794px; border: none; transform-origin: top left; display: block; flex-shrink: 0; }\n' +
  '</style>\n</head>\n<body>\n' +
  '<div id="toolbar">\n  <button class="btn" id="btn-prev">&#8592; Prev</button>\n  <button class="btn" id="btn-next">Next &#8594;</button>\n  <span id="counter"></span>\n  <span id="title"></span>\n  <span id="hint">← → キーでも操作できます</span>\n</div>\n' +
  '<div id="frame-wrap"><iframe id="slide" src=""></iframe></div>\n' +
  '<script>\nvar slides = [\n' + slideLines + '];\n' +
  'var current = 0;\nvar iframe = document.getElementById("slide");\nvar counter = document.getElementById("counter");\nvar title = document.getElementById("title");\nvar btnPrev = document.getElementById("btn-prev");\nvar btnNext = document.getElementById("btn-next");\n' +
  'function scale() { var wrap = document.getElementById("frame-wrap"); var availW = wrap.clientWidth - 24; var availH = wrap.clientHeight - 24; var s = Math.min(availW / 1123, availH / 794); iframe.style.transform = "scale(" + s + ")"; iframe.style.marginLeft = ((availW - 1123 * s) / 2) + "px"; iframe.style.marginTop = ((availH - 794 * s) / 2) + "px"; }\n' +
  'function goTo(n) { current = n; iframe.src = slides[current].file; counter.textContent = (current + 1) + " / " + slides.length; title.textContent = slides[current].label; btnPrev.disabled = current === 0; btnNext.disabled = current === slides.length - 1; }\n' +
  'btnPrev.addEventListener("click", function() { if (current > 0) goTo(current - 1); });\nbtnNext.addEventListener("click", function() { if (current < slides.length - 1) goTo(current + 1); });\n' +
  'document.addEventListener("keydown", function(e) { if (e.key === "ArrowRight" || e.key === "ArrowDown") { if (current < slides.length - 1) goTo(current + 1); } if (e.key === "ArrowLeft" || e.key === "ArrowUp") { if (current > 0) goTo(current - 1); } });\n' +
  'window.addEventListener("resize", scale);\ngoTo(0);\nsetTimeout(scale, 100);\niframe.addEventListener("load", scale);\n</script>\n</body>\n</html>';
fs.writeFileSync(outDir + 'viewer.html', viewerHtml);
console.log('viewer.html');

console.log('Done. 24 files generated (23 pages + viewer).');
