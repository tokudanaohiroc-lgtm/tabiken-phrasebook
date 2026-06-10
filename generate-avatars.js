const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const API_KEY = process.env.OPENAI_API_KEY;

const STYLE = `flat vector illustration, bold clean outlines, solid color fills, natural mature professional look, no gradients, no textures, no shadows, no cute or cartoonish elements, editorial style, calm confident expression`;

const avatars = [
  {
    name: 'kenta',
    prompt: `Portrait of a professional Japanese man in his mid-30s, smart business casual attire, calm confident expression, neat short black hair, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  },
  {
    name: 'akari',
    prompt: `Portrait of a professional Japanese woman in her early 30s, smart business casual attire, composed and friendly expression, shoulder-length black hair, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  },
  {
    name: 'sarah',
    prompt: `Portrait of a professional American woman in her early 30s, business casual attire, warm smile, short to medium length hair, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  },
  {
    name: 'marcus',
    prompt: `Portrait of a professional Black American man in his late 20s, smart casual tech attire, confident relaxed expression, short hair, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  },
  {
    name: 'tom',
    prompt: `Portrait of a professional European man in his early 30s, business casual attire, friendly expression, slight stubble, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  },
  {
    name: 'mei',
    prompt: `Portrait of a professional Chinese-Singaporean woman in her early 30s, business casual attire, sharp composed expression, medium-length dark hair, on a plain light gray background. ${STYLE}. Bust-up portrait, centered, square crop. Character for a business English learning material.`
  }
];

async function generateAvatar(avatar) {
  const outPath = path.join(__dirname, 'assets/avatars', `${avatar.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`[skip] ${avatar.name} already exists`);
    return;
  }

  console.log(`[gen] Generating ${avatar.name}...`);

  const body = JSON.stringify({
    model: 'gpt-image-2',
    prompt: avatar.prompt,
    size: '1024x1024',
    quality: 'medium',
    n: 1
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          console.error(`[error] ${parsed.error.message}`);
          reject(new Error(parsed.error.message));
          return;
        }
        const b64 = parsed.data[0].b64_json;
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
        console.log(`[done] Saved ${outPath}`);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const avatar of avatars) {
    await generateAvatar(avatar);
  }
  console.log('All avatars done.');
})();
