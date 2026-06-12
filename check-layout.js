#!/usr/bin/env node
/*
 * check-layout.js  ─ 配布前レイアウトゲート（文字あふれ検出）
 *
 * 目的:
 *   フレーズセルやロールプレイの解説枠は高さ固定＋overflow:hidden のため、
 *   解説文を長くすると下が見切れる（クリップされる）。目視では気づきにくい。
 *   実ブラウザ(Chrome)で各ページを描画し、固定枠から中身があふれている箇所を検出して止める。
 *
 * 検査する固定枠: .phrase-cell / .scene-box / .culture-note
 *   （いずれも overflow:hidden。scrollHeight > clientHeight なら見切れ）
 *
 * 使い方: node check-layout.js  または  npm run check-layout
 *   あふれがあれば該当を一覧して exit 1。Chromeが見つからない環境では警告して exit 0（スキップ）。
 *
 * 依存: system Chrome（generate-pdf.js と同じ channel:'chrome'）。
 */
var fs = require('fs');
var path = require('path');
var puppeteer = require('puppeteer');

var SELECTORS = ['.phrase-cell', '.scene-box', '.culture-note'];

function pages() {
  var out = [];
  fs.readdirSync(__dirname).forEach(function (name) {
    if (/^output/.test(name) && fs.existsSync(path.join(__dirname, name)) &&
        fs.statSync(path.join(__dirname, name)).isDirectory()) {
      fs.readdirSync(path.join(__dirname, name)).forEach(function (f) {
        if (/^(phrase|roleplay)-\d+\.html$/.test(f)) out.push(name + '/' + f);
      });
    }
  });
  return out.sort();
}

(async function () {
  var targets = pages();
  if (!targets.length) { console.log('[check-layout] 対象ページなし'); process.exit(0); }

  var browser;
  try {
    browser = await puppeteer.launch({ headless: true, channel: 'chrome' });
  } catch (e) {
    console.warn('[check-layout] ⚠ Chromeを起動できないためスキップしました（' + e.message.split('\n')[0] + '）。');
    console.warn('  配布前に Chrome のある環境で `npm run check-layout` を必ず実行してください。');
    process.exit(0);
  }

  var page = await browser.newPage();
  await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 1 });
  var hits = [];
  for (var i = 0; i < targets.length; i++) {
    await page.goto('file://' + path.resolve(__dirname, targets[i]), { waitUntil: 'networkidle0' });
    var over = await page.evaluate(function (sels) {
      var r = [];
      sels.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          if (el.scrollHeight > el.clientHeight + 1) {
            var num = (el.querySelector('.phrase-num') || {}).textContent || '';
            r.push({ sel: sel, num: num, over: el.scrollHeight - el.clientHeight });
          }
        });
      });
      return r;
    }, SELECTORS);
    over.forEach(function (o) {
      hits.push(targets[i] + '  ' + o.sel + (o.num ? ' #' + o.num : '') + '  (+' + o.over + 'px はみ出し)');
    });
  }
  await browser.close();

  if (!hits.length) {
    console.log('[check-layout] OK ✅  文字あふれは検出されませんでした（' + targets.length + 'ページ検査）。');
    process.exit(0);
  }
  console.error('[check-layout] NG ❌  固定枠からの文字あふれを ' + hits.length + ' 件検出しました。\n');
  hits.forEach(function (h) { console.error('  ' + h); });
  console.error('\n  → 該当の解説文（scene / street_note / keyPoints / cultureText）を短くして再ビルドしてください。');
  process.exit(1);
})();
