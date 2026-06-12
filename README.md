# タビケン留学 フレーズガイドブック

タビケン留学のSNS無料特典「英語フレーズ集」生成プロジェクト（カフェ接客・ワーホリ向けほか）。

## ビルド手順（重要）

ページを修正したら、必ず次のコマンドで生成すること。

```bash
npm run build
```

内部で `npm run generate`（update-pages.js でHTML生成）→ `npm run check`（日本語チェックゲート）を実行する。
ゲートが ❌ で止まったら公開してはいけない。報告された文字を直してから再ビルドする。

## 配布前チェックは2段構え（重要）

解説文の品質事故（中国語混入・文字化け・不自然な日本語）を二度と出さないため、性質の違う2つのゲートを必ず通す。

| 段 | コマンド | 種類 | 捕まえるもの | 実行 |
|---|---|---|---|---|
| 1段目 | `npm run check` | 機械・文字単位 | 中国語簡体字／常用外漢字への「化け」（議题・妛協 等） | build時に自動・必須 |
| 1.5段目 | `npm run check-layout` | 実ブラウザ・描画 | 解説が長すぎて固定セルから下が見切れる「文字あふれ」 | build時に自動（Chrome必須・無ければ自動スキップ） |
| 2段目 | `npm run codex-review` | Codex・文章単位 | 機械では拾えない『不自然な日本語・文のブチ切れ・論理飛躍・正しい漢字を使った誤字(話題→話顔 等)』 | 配布前に手動 |

> 注: フレーズセル/解説枠は高さ固定＋overflow:hidden。解説を長くすると下が切れるため、`check-layout.js` がChromeで実描画して `scrollHeight > clientHeight` を検出し止める。

### これらは git フックで自動強制される（実行忘れ防止）

チェックの「実行忘れ」で事故が起きないよう、git フック（`hooks/`、`core.hooksPath`で有効化）で自動的に走る。

- **pre-commit**: `npm run check`（化けゲート）。化けがあれば**コミットを中止**。
- **pre-push**: `npm run check` ＋ `npm run check-layout`（レイアウトゲート）。あれば**プッシュを中止**。

`npm install` の `postinstall` で `core.hooksPath` が自動設定される（クローン直後から有効）。手動で有効化する場合は `git config core.hooksPath hooks`。

1段目（check-japanese.js）は文字単位なので「正しい漢字を使った誤字」や「文章の不自然さ」は捕まえられない。そこを2段目のCodex（codex-review.js）が意味レベルで補う。**新しい巻を出すときは必ず両方を通すこと。**

### 2段目：Codex解説レビュー（`npm run codex-review`）

```bash
npm run codex-review          # 解説を全抽出 → Codexがレビュー → 修正案(diff)を表示
# .codex-review/fixes.jsonl の内容を必ず人が吟味し、不要な提案行は削除する
node codex-review.js --apply  # 吟味後に適用
npm run build                 # 再生成＋1段目ゲート
```

Codexの指摘は鵜呑みにせず、必ず「妥当／部分妥当／不同意」を判断してから適用する（CLAUDE.mdのCodex精度ゲート方針）。

## 日本語チェックゲート（1段目・機械）

AI生成テキストには、まれに次のような「化け」が混入する。見た目が正規漢字とほぼ同じで人間が見落としやすい。

- 中国語簡体字グリフ: 議**題**→議**题** / **駆**→**驱**
- 稀なJIS漢字への化け: **妥**協→**妛**協 / 終**盤**→終**籂**

`check-japanese.js` は、日本語として正規の漢字（常用漢字＋人名用漢字＝`lint/jp-kanji-whitelist.txt`、＋固有の正規漢字＝`lint/allowed-extra.txt`）に**入っていないCJK漢字**を全ページから検出し、ビルドを止める。

正規の日本語漢字なのに検出された場合は、化けでないことを目視確認のうえ `lint/allowed-extra.txt` に1字追記して再実行する。

## ディレクトリ

- `content/*.json` — フレーズ本体のソースデータ（カテゴリ id で生成される）
- `update-pages.js` — ページ生成スクリプト（ロールプレイのシーン説明・解説文はここに直書き）
- `output/` — 生成HTML（GitHub Pages で公開される実体）
- `lint/` — 日本語チェックゲートのホワイトリスト
