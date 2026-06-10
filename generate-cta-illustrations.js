var fs = require('fs');
var path = require('path');

fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(function(l) {
  var parts = l.split('=');
  var k = parts[0];
  var v = parts.slice(1).join('=');
  if (k && v) process.env[k.trim()] = v.trim();
});

var OUT_DIR = path.join(__dirname, 'assets/cta');
fs.mkdirSync(OUT_DIR, { recursive: true });

var STYLE = [
  'Style: clean flat vector illustration, bold outlines, solid color fills.',
  'Color palette: white or very light background, muted navy (#1B2A5E) accents, soft warm tones.',
  'Not overly saturated. No gradients. Premium business coaching quality.',
  'Mature and confident — no cute or cartoonish elements.',
  'Japanese adult characters with natural East Asian skin tone (fair, not orange).',
  'Wide landscape composition. Subject positioned center to upper-center.'
].join(' ');

var IMAGES = [
  {
    id: 'banner',
    size: '1536x1024',
    desc: [
      'Wide landscape scene: a Japanese man in his mid-30s in business casual sits at a clean home office desk,',
      'looking attentively at his laptop during a Zoom video call.',
      'On the laptop screen is a Japanese female English coach in her late 20s to early 30s,',
      'wearing smart office casual attire (blouse or jacket), smiling warmly and speaking.',
      'She appears professional, refined, and approachable.',
      'The man has a notepad and pen nearby. Bright clean home office background.',
      'Composition is wide and cinematic, showing both the man and the coach on the laptop screen clearly.'
    ].join(' ')
  },
  {
    id: 'card-01',
    size: '1536x1024',
    desc: [
      'A Zoom video call thumbnail: a Japanese female English coach in her late 20s to early 30s,',
      'office casual (blouse/light jacket), holds an open phrasebook or study guide',
      'and points to a specific phrase with a pen, smiling and explaining.',
      'Clean simple background behind her. Expression is warm and helpful.',
      'Composition centers on the coach and the open book she is pointing to.'
    ].join(' ')
  },
  {
    id: 'card-02',
    size: '1536x1024',
    desc: [
      'A clean digital assessment dashboard screen showing an English skill radar chart.',
      'Axes labeled: Speaking, Listening, Grammar, Vocabulary, Reading.',
      'Some axes are filled further than others, revealing a personal skill profile.',
      'A small star or checkmark near a highlighted score.',
      'Overall feel: data-driven, clear, encouraging. No people — just the clean chart UI.',
      'Light background, navy and gold (#D4A843) accent colors on the chart.'
    ].join(' ')
  },
  {
    id: 'card-03',
    size: '1536x1024',
    desc: [
      'A Japanese female English coach in her late 20s to early 30s, office casual,',
      'smiling warmly during a Zoom video call, leaning slightly forward in a supportive listening posture.',
      'Around her float illustrated speech bubbles: some with question marks, some with checkmarks,',
      'suggesting a Q&A or problem-solving conversation.',
      'Clean bright atmosphere. Speech bubbles are light and conversational, not cluttered.',
      'Composition: coach is center-left, bubbles on the right side.'
    ].join(' ')
  }
];

async function generateImage(img) {
  var outPath = path.join(OUT_DIR, img.id + '.png');
  if (fs.existsSync(outPath)) {
    console.log('skip (already exists)');
    return;
  }
  var prompt = 'Flat vector illustration in a modern editorial style. ' + img.desc + '\n\n' + STYLE;
  var res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: prompt,
      n: 1,
      size: img.size,
      output_format: 'png'
    })
  });
  var data = await res.json();
  if (data.error) throw new Error(data.error.message);
  fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, 'base64'));
  console.log('OK');
}

(async function() {
  console.log('Generating ' + IMAGES.length + ' CTA illustrations...\n');
  for (var i = 0; i < IMAGES.length; i++) {
    var img = IMAGES[i];
    process.stdout.write('[' + (i + 1) + '/' + IMAGES.length + '] ' + img.id + ' ... ');
    try {
      await generateImage(img);
    } catch (e) {
      console.log('ERROR: ' + e.message);
    }
  }
  console.log('\nDone.');
})();
