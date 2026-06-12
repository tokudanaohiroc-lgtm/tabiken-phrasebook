#!/usr/bin/env node
/*
 * codex-review.js  ─ 解説文の「AI感」チェック工程（2段目ゲート / 意味レベル）
 *
 * 役割分担:
 *   check-japanese.js … 機械ゲート。中国語簡体字・常用外漢字の「化け」を確実に弾く（必須・自動）。
 *   codex-review.js   … 意味ゲート。機械では拾えない『不自然な日本語・文のブチ切れ・論理飛躍・
 *                       正しい漢字を使った誤字(例 話題→話顔)』を OpenAI Codex(GPT-5系) に検出させる。
 *
 *   ※ check-japanese は文字単位、codex-review は文章単位。両方通って初めて配布可。
 *
 * 使い方:
 *   node codex-review.js            … 解説を全抽出 → Codexがレビュー → 修正案(diff)を表示
 *                                     （.codex-review/fixes.jsonl に保存。自動適用はしない）
 *   node codex-review.js --apply    … 人が fixes.jsonl を吟味・取捨選択した後、これで適用
 *
 * 前提: `codex` CLI が PATH にあること（codex exec --skip-git-repo-check を使用）。
 * 注意: Codexの指摘は鵜呑みにせず、必ず人が「妥当/部分妥当/不同意」を判断してから適用する。
 */

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var DIR = path.join(__dirname, '.codex-review');
var REVIEW = path.join(DIR, 'review.txt');
var MAP = path.join(DIR, 'map.json');
var FIXES = path.join(DIR, 'fixes.jsonl');

function ls(d) { var p = path.join(__dirname, d); return fs.existsSync(p) ? fs.readdirSync(p) : []; }

// ── 解説テキストを全抽出（content/*.json と update-pages*.js）─────────────
function extract() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
  var review = [], map = {};

  ls('content').filter(function (f) { return f.endsWith('.json') && f !== 'series.json'; }).forEach(function (fn) {
    var rel = 'content/' + fn;
    var d = JSON.parse(fs.readFileSync(path.join(__dirname, rel), 'utf8'));
    (d.phrases || []).forEach(function (p) {
      var en = p.phrase_en || '', ja = p.phrase_ja || '';
      [['S', 'scene'], ['N', 'street_note']].forEach(function (kv) {
        if (p[kv[1]]) {
          var id = fn.split('.')[0] + '-' + kv[0] + p.num;
          map[id] = { file: rel, raw: p[kv[1]], kind: 'json' };
          review.push(id + '\t(EN: ' + en + ' / JA: ' + ja + ')\t解説原文: ' + p[kv[1]]);
        }
      });
    });
  });

  var strpat = "'((?:[^'\\\\]|\\\\.)*)'";
  ls('.').filter(function (f) { return /^update-pages.*\.js$/.test(f); }).forEach(function (fn) {
    var js = fs.readFileSync(path.join(__dirname, fn), 'utf8');
    [['SD', 'sceneDesc'], ['DS', 'desc'], ['CT', 'cultureText']].forEach(function (kv) {
      var re = new RegExp(kv[1] + ':\\s*' + strpat, 'g'), m, i = 0;
      while ((m = re.exec(js))) {
        i++;
        var id = fn.replace(/\.js$/, '') + '-' + kv[0] + i;
        map[id] = { file: fn, raw: m[1], kind: 'js' };
        var unesc = m[1].replace(/\\'/g, "'").replace(/<br>/g, ' ');
        review.push(id + '\t(JS ' + kv[1] + ')\t解説原文: ' + unesc);
      }
    });
  });

  fs.writeFileSync(REVIEW, review.join('\n'));
  fs.writeFileSync(MAP, JSON.stringify(map, null, 0));
  return { count: review.length, map: map };
}

var PROMPT = [
  '同ディレクトリの review.txt は英語学習フレーズブックの『解説文』一覧（1行=ID〈TAB〉文脈(EN/JA)〈TAB〉解説原文）。',
  'この解説の日本語に「AI感」があると不満が出ている。配布前の最終チェックとして全件精査し、',
  '次の4観点のいずれかに該当する解説だけを、自然で人間が書いたような日本語にリライトせよ。',
  '1)文がブチ切れ/接続が不自然 2)論理飛躍(説明不足で唐突) 3)文字化け・誤字・誤変換(正しい常用漢字だが語として誤り＝例 話題→話顔 も拾う) 4)不自然・冗長・翻訳調',
  'ルール: 意味と専門用語と固有名詞は変えない。英文(EN)は変更しない。元と同程度の長さ。',
  'マークダウン記号は使わない。1項目1〜2文。既に自然なものは出力しない。IDに「-SD」を含む項目(レイアウト用)は対象外。',
  '出力: カレントに fixes.jsonl を作り、要修正項目だけ1行1JSON {"id":"...","reason":"ブチ切れ/飛躍/化け/不自然","new":"本文"}。newに改行や<br>を入れない。完了後 "WROTE: 件数" とだけ表示。'
].join('\n');

function runCodex() {
  console.log('[codex-review] Codex にレビューを依頼中…（数分かかります）');
  cp.execSync('codex exec --skip-git-repo-check --sandbox workspace-write ' + JSON.stringify(PROMPT),
    { cwd: DIR, stdio: 'inherit' });
}

function showDiff() {
  if (!fs.existsSync(FIXES)) { console.log('[codex-review] fixes.jsonl がありません。'); return; }
  var map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
  var fixes = fs.readFileSync(FIXES, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  console.log('\n[codex-review] 修正提案 ' + fixes.length + ' 件（適用は要・人手の吟味）:\n');
  fixes.forEach(function (f) {
    var m = map[f.id]; if (!m) return;
    var old = m.raw.replace(/\\'/g, "'").replace(/<br>/g, ' ');
    console.log('[' + f.id + '] (' + f.reason + ')\n  旧: ' + old + '\n  新: ' + f.new + '\n');
  });
  console.log('→ 内容を吟味し、不要な行は fixes.jsonl から削除してから:  node codex-review.js --apply');
}

function apply() {
  var map = JSON.parse(fs.readFileSync(MAP, 'utf8'));
  var fixes = fs.readFileSync(FIXES, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
  var byFile = {};
  fixes.forEach(function (f) { var m = map[f.id]; if (m) (byFile[m.file] = byFile[m.file] || []).push([m.raw, f.new, m.kind, f.id]); });
  Object.keys(byFile).forEach(function (rel) {
    var p = path.join(__dirname, rel), full = fs.readFileSync(p, 'utf8');
    byFile[rel].forEach(function (it) {
      var raw = it[0], repl = it[2] === 'js' ? it[1].replace(/\\/g, '\\\\').replace(/'/g, "\\'") : it[1];
      var c = full.split(raw).length - 1;
      if (c !== 1) { throw new Error('[' + it[3] + '] 出現' + c + '件: ' + raw.slice(0, 40)); }
      full = full.replace(raw, repl);
    });
    fs.writeFileSync(p, full);
    console.log('[codex-review] 適用 ' + byFile[rel].length + '件 → ' + rel);
  });
  console.log('→ npm run build で再生成し、機械ゲートも通してから配布してください。');
}

if (process.argv.indexOf('--apply') >= 0) {
  apply();
} else {
  var r = extract();
  console.log('[codex-review] 解説 ' + r.count + ' 件を抽出 → .codex-review/review.txt');
  runCodex();
  showDiff();
}
