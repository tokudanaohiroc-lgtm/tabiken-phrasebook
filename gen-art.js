// Tabiken Café Counter Service — full art regen (locked flat-illustration style)
var fs = require('fs'), path = require('path');
fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(function (l) {
  var p = l.split('='); var k = p[0]; var v = p.slice(1).join('=');
  if (k && v) process.env[k.trim()] = v.trim();
});

// 画風を強制ロック（フォトリアル/写真/3D禁止・フラット2Dベクター・限定平面色）
var STYLE = [
  'IMPORTANT: Flat 2D vector illustration ONLY. Absolutely NOT photorealistic, NOT 3D, NOT a photograph,',
  'no realistic skin texture, no realistic lighting. Clean bold simple shapes, flat color fills, minimal soft shading,',
  'limited natural muted color palette. Consistent modern editorial flat-illustration style, uniform across the whole series.',
  'Subtle Australian brunch-cafe vibe (timber counter, leafy plants, bright airy, soft daylight) with NO landmarks',
  '(no Opera House, no koala, no kangaroo, no flags).'
].join(' ');

// キャラの容姿を完全固定（毎回同一記述）
var C = {
  akari: 'Akari is a Japanese woman in her late 20s: warm light-medium skin tone, round friendly face, shoulder-length straight black hair in a low ponytail, wearing a denim-blue apron over a plain white t-shirt.',
  cooper: 'Cooper is an Australian man in his late 20s: relaxed surfer look, sun-kissed skin, short messy light-brown hair, casual t-shirt.',
  yuna: 'Yuna is a Korean woman in her late 20s: light skin, neat shoulder-length dark hair, stylish casual, wearing the same denim-blue cafe apron (she is a barista coworker).',
  lucas: 'Lucas is a Brazilian man in his late 20s: warm tan skin, short dark curly hair, friendly, casual clothes.',
  chloe: 'Chloe is an Australian woman around 30: light skin, light-brown hair in a loose bun, approachable cafe manager, smart-casual.',
  kenta: 'Kenta is a Japanese man around 30: neat short black hair, light skin, confident, smart-casual.'
};
var KEEP = ' Keep every character\'s face, hairstyle, skin tone and outfit EXACTLY consistent with this description.';

var SCENE = function (desc) { return 'Flat editorial vector illustration. ' + desc + KEEP + '\n\n' + STYLE; };
var AVA = function (sheet) { return 'Flat editorial vector illustration, square headshot avatar (head and shoulders), plain soft single-color background. ' + sheet + KEEP + '\n\n' + STYLE; };

var ITEMS = [
  // Cover
  { id: 'cover', dir: 'assets/cta', size: '1536x1024', prompt: SCENE(C.akari + ' Wide inviting hero scene: Akari stands behind a bright brunch-style cafe counter (timber counter, espresso machine, pastries under glass, chalkboard menu, leafy plants, big windows), welcoming. A couple of customers chat at the counter. Airy and friendly.') },
  // 10 category scenes (new structure)
  { id: 'scene-greeting', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' ' + C.cooper + ' Scene: Akari at the till warmly greeting Cooper (a regular) across the counter; card reader and a coffee cup on the counter.') },
  { id: 'scene-drinks', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari taking a drink order, gesturing to a chalkboard coffee menu (flat white, latte, long black, sizes); cups and a milk jug on the timber counter.') },
  { id: 'scene-food', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari behind the counter presenting a slice of cake and a sandwich on plates, asking the customer a question; a glass pastry case nearby.') },
  { id: 'scene-allergies', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari carefully checking an allergy with a customer, pointing to a small allergen/dietary note; a reusable stainless-steel straw visible in a cup on the counter.') },
  { id: 'scene-addons', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari warmly suggesting an add-on, gesturing toward a display of muffins and banana bread under a glass case on the counter.') },
  { id: 'scene-payment', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari at the till handling payment, gesturing to a card reader / EFTPOS terminal on the timber counter while a customer taps a phone to pay.') },
  { id: 'scene-payment-trouble', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' Scene: Akari calmly helping at the till when a card payment did not go through; she gestures reassuringly toward the card reader, customer holding two cards.') },
  { id: 'scene-smalltalk', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' ' + C.cooper + ' Scene: Akari sharing a friendly chat and a laugh with Cooper over the counter while making a coffee; easygoing, warm.') },
  { id: 'scene-resume', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' ' + C.lucas + ' Scene: Lucas handing a paper resume across the cafe counter to Akari, who receives it kindly; hopeful, friendly mood.') },
  { id: 'scene-coworkers', dir: 'assets/illustrations', size: '1536x1024', prompt: SCENE(C.akari + ' ' + C.yuna + ' Scene: Akari and Yuna (barista coworker) working together behind the counter during a busy rush, calling out to each other; teamwork.') },
  // CTA counselor (ILLUSTRATION, replaces the photo-like one)
  { id: 'consult', dir: 'assets/cta', size: '1536x1024', prompt: SCENE('A friendly Japanese study-abroad counselor in their late 20s (fresh, approachable, neat smart-casual, NOT flashy) on an online video call, smiling and talking warmly with an open-hand gesture, simply advising. NO books, notebooks, pens or papers. Clean bright simple background. Centered chest-up.') },
  // Avatars
  { id: 'akari', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.akari + ' Friendly bright expression.') },
  { id: 'cooper', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.cooper) },
  { id: 'yuna', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.yuna) },
  { id: 'lucas', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.lucas) },
  { id: 'chloe', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.chloe) },
  { id: 'kenta', dir: 'assets/avatars', size: '1024x1024', prompt: AVA(C.kenta) }
];

function gen(item) {
  var outPath = path.join(__dirname, item.dir, item.id + '.png');
  if (fs.existsSync(outPath)) { console.log('skip ' + item.id); return Promise.resolve(); }
  function attempt(n) {
    return fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-2', prompt: item.prompt, n: 1, size: item.size, output_format: 'png' })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (data.error) throw new Error(data.error.message);
      fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, 'base64'));
      console.log('OK ' + item.id);
    }).catch(function (e) {
      if (n < 2) { console.log('retry ' + item.id); return attempt(n + 1); }
      console.log('FAIL ' + item.id + ': ' + e.message);
    });
  }
  return attempt(1);
}

(async function () {
  for (var i = 0; i < ITEMS.length; i++) { process.stdout.write('[' + (i + 1) + '/' + ITEMS.length + '] '); await gen(ITEMS[i]); }
  console.log('DONE all art');
})();
