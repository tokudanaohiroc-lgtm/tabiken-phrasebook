const fs = require('fs');
const path = require('path');

require('fs').readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const OUT_DIR = './assets/illustrations';
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE = `
Style: clean flat vector illustration with bold outlines and solid color fills. Color palette is natural and soft — not overly saturated. The character has light, natural East Asian skin tone (fair, not orange). Overall palette is balanced: muted navy, soft gray, natural wood tones, gentle ambient light. Premium business book illustration quality. Mature and confident tone — absolutely no cute or cartoonish elements. Wide landscape composition, subject positioned in the upper-center to upper-left area of the frame.
`.trim();

const SCENES = [
  {
    id: 'home-office-start',
    desc: 'A Japanese man in his mid-30s in smart business casual sits at a tidy home office desk, just opened his laptop to begin a morning video call. Coffee cup and notepad nearby. Expression is alert and composed.'
  },
  {
    id: 'conference-room',
    desc: 'A Japanese man in his mid-30s in smart business casual sits at a desk with his laptop open showing a presentation slide, in facilitation mode, one hand gesturing toward the screen. Expression is confident and engaged.'
  },
  {
    id: 'whiteboard-discussion',
    desc: 'A Japanese man in his mid-30s in smart business casual leans slightly forward at his desk, speaking expressively with a subtle hand gesture, sharing his screen which shows a document or chart. Expression is thoughtful and direct.'
  },
  {
    id: 'one-on-one',
    desc: 'A Japanese man in his mid-30s in smart business casual sits in focused attention during a one-on-one video call, leaning slightly toward the screen, listening carefully. Expression is attentive and calm.'
  },
  {
    id: 'negotiation',
    desc: 'A Japanese man in his mid-30s in smart business casual sits upright at his desk during a video call negotiation, reviewing printed notes beside his laptop. Expression is measured, focused, and composed.'
  },
  {
    id: 'time-pressure',
    desc: 'A Japanese man in his mid-30s in smart business casual glances at his wristwatch while on a video call, a clock visible on the wall behind him. Expression is slightly tense but in control.'
  },
  {
    id: 'tech-trouble',
    desc: 'A Japanese man in his mid-30s in smart business casual adjusts his headset and looks at a frozen or glitchy video call screen with a puzzled, slightly frustrated expression. One hand raised near the microphone.'
  },
  {
    id: 'wrap-up',
    desc: 'A Japanese man in his mid-30s in smart business casual writes in a notebook beside his laptop, pen in hand, organizing notes at the close of a video meeting. Expression is focused and organized.'
  },
  {
    id: 'goodbye',
    desc: 'A Japanese man in his mid-30s in smart business casual sits relaxed with a brief professional smile, beginning to close his laptop as a video meeting ends. Expression is calm and satisfied.'
  },
  {
    id: 'presentation',
    desc: 'A Japanese man in his mid-30s in smart business casual sits beside a laptop showing a data chart on the screen, one hand pointing confidently at the display as if walking an audience through slides. Expression is clear, composed, and professional.'
  }
];

async function generateImage(scene) {
  const outPath = path.join(OUT_DIR, `${scene.id}.png`);

  if (fs.existsSync(outPath)) {
    console.log(`  skip (already exists): ${scene.id}.png`);
    return;
  }

  const prompt = `Flat vector illustration in a modern editorial style. ${scene.desc}\n\n${STYLE}`;

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1536x1024',
      output_format: 'png'
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  fs.writeFileSync(outPath, Buffer.from(data.data[0].b64_json, 'base64'));
  console.log(`  OK: ${scene.id}.png`);
}

(async () => {
  console.log(`Generating ${SCENES.length} illustrations...\n`);
  for (const scene of SCENES) {
    process.stdout.write(`[${SCENES.indexOf(scene) + 1}/${SCENES.length}] ${scene.id} ... `);
    try {
      await generateImage(scene);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }
  console.log('\nDone. Run `node build.js` to generate the HTML.');
})();
