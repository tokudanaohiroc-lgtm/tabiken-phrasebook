#!/usr/bin/env node
/*
 * check-japanese.js  ─ 配布前 日本語チェックゲート（汎用版）
 *
 * 目的:
 *   AI生成テキストに紛れ込む「中国語簡体字」「稀なJIS漢字への化け」を、
 *   公開前に機械的に検出して止める。 例) 議題→議题(簡体字) / 妥協→妛協 / 続ける→撑ける
 *
 * 仕組み:
 *   日本語として正規の漢字＝常用漢字＋人名用漢字（lint/jp-kanji-whitelist.txt）
 *   ＋本コンテンツ固有の正規漢字（lint/allowed-extra.txt）。
 *   このホワイトリストに無いCJK漢字が1字でもあれば「化けの可能性」として報告し、
 *   exit code 1 で終了する（＝ビルド/デプロイを止める）。
 *
 * 検査対象（自動探索）:
 *   - output / output-NNN ディレクトリ配下の *.html（公開される実体）
 *   - content/*.json（ソースデータ）
 *   - update-pages*.js（ロールプレイ等の直書きテキスト）
 *
 * 使い方:
 *   node check-japanese.js      または   npm run check
 *   npm run build … 生成 → 本チェックが自動実行（落ちたら公開不可）
 */

var fs = require('fs');
var path = require('path');

function loadChars(file) {
  var p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return new Set();
  var set = new Set();
  fs.readFileSync(p, 'utf8').split('\n').forEach(function (line) {
    if (line.indexOf('#') === 0) return; // # で始まる行はコメント
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch >= '一' && ch <= '鿿') set.add(ch);
    }
  });
  return set;
}

var whitelist = loadChars('lint/jp-kanji-whitelist.txt');
loadChars('lint/allowed-extra.txt').forEach(function (c) { whitelist.add(c); });

if (whitelist.size < 2000) {
  console.error('[check-japanese] ホワイトリストが読めていません（' + whitelist.size + '字）。lint/jp-kanji-whitelist.txt を確認してください。');
  process.exit(2);
}

// ── 検査対象を自動探索 ───────────────────────────────────────────────────
function ls(dir) {
  var d = path.join(__dirname, dir);
  return fs.existsSync(d) ? fs.readdirSync(d) : [];
}

var targets = [];
// output, output-002, output-2 … のような出力ディレクトリ配下の html
ls('.').forEach(function (name) {
  if (/^output/.test(name) && fs.statSync(path.join(__dirname, name)).isDirectory()) {
    ls(name).forEach(function (f) { if (f.endsWith('.html')) targets.push(name + '/' + f); });
  }
});
// content/*.json
ls('content').forEach(function (f) { if (f.endsWith('.json')) targets.push('content/' + f); });
// update-pages*.js
ls('.').forEach(function (f) { if (/^update-pages.*\.js$/.test(f)) targets.push(f); });

// ── スキャン ─────────────────────────────────────────────────────────────
function isCJK(ch) { return ch >= '一' && ch <= '鿿'; }
function snippet(line, idx) {
  return (line.slice(Math.max(0, idx - 20), idx) + '⟪' + line[idx] + '⟫' + line.slice(idx + 1, idx + 12)).trim();
}

var hits = [];
targets.forEach(function (rel) {
  fs.readFileSync(path.join(__dirname, rel), 'utf8').split('\n').forEach(function (line, li) {
    for (var i = 0; i < line.length; i++) {
      if (isCJK(line[i]) && !whitelist.has(line[i])) {
        hits.push({ file: rel, line: li + 1, ch: line[i], ctx: snippet(line, i) });
      }
    }
  });
});

// ── 結果 ─────────────────────────────────────────────────────────────────
if (hits.length === 0) {
  console.log('[check-japanese] OK ✅  化け・簡体字は検出されませんでした（' + targets.length + 'ファイル検査）。');
  process.exit(0);
}

console.error('[check-japanese] NG ❌  ホワイトリスト外の漢字を ' + hits.length + ' 件検出しました。\n');
var byChar = {};
hits.forEach(function (h) { (byChar[h.ch] = byChar[h.ch] || []).push(h); });
Object.keys(byChar).forEach(function (ch) {
  console.error('  「' + ch + '」 (U+' + ch.charCodeAt(0).toString(16).toUpperCase() + ') × ' + byChar[ch].length);
  byChar[ch].slice(0, 5).forEach(function (h) {
    console.error('      ' + h.file + ':' + h.line + '   …' + h.ctx + '…');
  });
});
console.error('\n  → 化け/簡体字なら元語に修正してください（例: 议→議 / 妛→妥 / 撑→続）。');
console.error('  → 正規の日本語漢字なら lint/allowed-extra.txt に1字追記して再実行してください。');
process.exit(1);
