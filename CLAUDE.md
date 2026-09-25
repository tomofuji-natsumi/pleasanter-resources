# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## リポジトリの性格

Pleasanter（ノーコード業務アプリ基盤）のカスタマイズ資産置き場。ビルド・テスト・パッケージマネージャは一切無い。
ここにあるのは **CDN から直接配信される素材** であり、`git push` した瞬間が「デプロイ」になる。

- リモート: `https://github.com/tomofuji-natsumi/pleasanter-resources`
- 配信元1: `https://cdn.jsdelivr.net/gh/tomofuji-natsumi/pleasanter-resources@main/...`（サイトパッケージ側）
- 配信元2: `https://tomofuji-natsumi.github.io/pleasanter-resources/...`（`js/loader_folders.js`、`readonly_tenant/loader_tenant.js`）

`loader_folders.js` 自体は配信元2から取得されるが、**その中で読むマニフェストとスクリプトは配信元1（jsdelivr）**。
フォルダ側テンプレートのローダーと同一URLになるよう意図的に揃えてあり、両経路が効く画面でキャッシュが共有される。

**⚠️ CDN URL にブランチ名 `@main` がハードコードされている。** `window.__pleasanterCdnBase` に集約済み（D-1）だが、
Htmls/Scripts の評価順序が保証されないため、各所にフォールバック値として同じ文字列が残っている。
ブランチを変える／`main` にマージする際は、以下を同時に書き換えないと本番が壊れる:

- 両テンプレートの Htmls インライン `<script>` 内 `window.__pleasanterCdnBase` の定義（本体）
- `js/loader_site.js`・`js/loader_folders.js`・`js/sites/holiday_setting.js` のフォールバック値
- 両テンプレートの Scripts スタブ内のフォールバック値
- `readonly_tenant/tenant.css` の `@import` 絶対URL（CSSは `window.__pleasanterCdnBase` を参照できないため、ここだけ手動で書き換える必要がある。詳細は readonly_tenant/ セクション参照）

jsdelivr はブランチ指定でもキャッシュするため、反映確認時はキャッシュ遅延を考慮する。

検証手段は「Pleasanter 実機で動かす」しか無い。ローカルで確認できるのは構文だけ。
**`node` は未導入の環境を前提とする**ため、`node --check` ではなく `tools/check_js_syntax.py`
（Python だけで動く簡易構文チェッカー。文字列・コメント・正規表現リテラルを読み飛ばした上で
`{ } ( ) [ ]` の対応だけを見る。本物のパーサではないため取りこぼしはあるが、
このリポジトリで実際に起きる「括弧の閉じ忘れ」系のミスは検出できる）を使う:

```bash
python tools/check_js_syntax.py
```

```bash
python -c "import json,glob;[json.load(open(f,encoding='utf-8')) for f in glob.glob('js/*.json')];print('ok')"
```

`manifest_*.json` のカテゴリ名（`Js`/`Css` のキー）は画面種別の固定enum（`All`/`Edit`/`Calendar`/`Index`/
`TimeSeries`/`ImageLib`）だが、タイポしてもJSON構文としては正しく通ってしまい、該当画面でスクリプトが
永久に読み込まれないまま気づかれにくい（実例: 過去の `Js.New` — A-12）。`tools/check_manifest.py` が
キーのタイポ・参照ファイルの実在・重複記載を検出する:

```bash
python tools/check_manifest.py
```

## 読み込みアーキテクチャ（最重要）

Pleasanter のサイト設定に JS/CSS を直接貼るのではなく、**マニフェスト方式**で間接化している。
機能の追加・削除は原則 `js/manifest_*.json` の編集だけで完結し、Pleasanter 側の設定変更は不要。

```
Pleasanter サイト設定（SitePackage JSON の Scripts / Htmls セクション）
   └─ ローダー読み込みスタブ（インライン、数行。<script src>要素を挿入するだけ）
        └─ js/loader_site.js（記録テーブル）/ js/loader_folders.js（フォルダ）… git 管理下
             ├─ URL から画面種別を判定  /items/{SiteId}/{action}（記録テーブルのみ）
             │     edit・new → "Edit", calendar → "Calendar",
             │     timeseries → "TimeSeries", imagelib → "ImageLib", それ以外 → "Index"
             ├─ manifest_site.json / manifest_folder.json を fetch
             └─ Js: "All" + 画面種別 の配列を <script> 要素の自前挿入（`src`重複チェックあり）で読み込み
                Css: "All" + 画面種別 の配列を <link> 動的挿入（Htmls側インラインscriptが引き続き担当）
```

- `js/manifest_site.json` … 記録テーブル（ReferenceType: Results）向け。画面種別ごとにカテゴリ分け。
- `js/manifest_folder.json` … フォルダ（ReferenceType: Sites）向け。`All` のみ。
- `css/definition.css`（デザイントークン）と `css/custom_common.css` は**マニフェストを経由せず** `<link>` で直接読む。
  初期描画のちらつきを避けるための意図的な例外（commit 2523eba）なので、マニフェストへ戻さないこと。
- `js/loader_site.js` / `js/loader_folders.js` はどのマニフェストからも参照されない（ローダー自身のため）。
  テンプレート側の Scripts は `<script src="…/js/loader_site.js">` 相当を挿入するだけの薄いスタブになっている
  （旧: ローダー本体がテンプレート内に直書きされ diff も構文チェックも効かなかった。D-7 で解消）。

### 新しいスクリプトを足すとき

1. `js/common/`（全画面共通）か `js/sites/`（画面依存）にファイルを置く
2. 該当マニフェストの適切なカテゴリに**パスを文字列で追記**するだけ
3. スクリプトは「読み込まれた瞬間に自分で動く」前提。画面依存の処理は**自身でガードする**
   （例: `holiday_setting.js` は URL とダッシュボードウィジェット `.dashboard-calendar-container` の両方を判定）

### マニフェスト未登録のファイル

`js/common/empty_grid_message.js`, `lock_save_during_upload.js`, `prevent_double_submit.js`, `scroll_to_top.js`,
`js/sites/comment_color.js`, `get_record_data.js`, `message_output.js`, `css/custom_cherry.css` は
どのマニフェストからも参照されていない。個別サイトに手貼りする／テーマ差し替え用の予備であり、消さないこと。

## サイトパッケージテンプレート（git 管理外）

`記録テーブル_テンプレート.json` / `フォルダ_テンプレート.json` は Pleasanter のサイトパッケージエクスポート。
`.gitignore` 済みで**リポジトリには含まれない**（ローカル作業ファイル。実測で全行 CRLF、BOM 無し）。

- `Sites[0].SiteSettings.Scripts[].Body`（JS）は `js/loader_site.js`（記録テーブル）/
  `js/loader_folders.js`（フォルダ）を `<script>` 要素で読み込むだけの薄いスタブ。
  ローダー本体はgit管理下の上記ファイルにある（D-7）。
  `.Htmls[].Body`（`<link>`＋インライン `<script>`、CSS ローダー・環境設定を含む）は引き続きテンプレート内に直書き。
  **改行が `\n` エスケープされた 1 行の巨大文字列**なので、編集後は必ず JSON パースを通して確認する。
- `Styles[]` は「各サイト個別変更箇所」用の枠。`記録テーブル_テンプレート.json` の `Styles[0].Body` には
  実際にアナウンス・一覧画面列幅・コメント欄背景色・更新履歴非表示・読取専用画面の各コードが入っている
  （多くはコメントアウトされたサンプルだが、コメント欄背景色・更新履歴非表示・読取専用文言非表示の3件は有効）。
  コメント欄の `#E7F1FF` / `#AFCBFF` は「各サイト個別変更箇所」という位置づけのため、
  `css/definition.css` のトークンを経由しない色指定ルールの例外として許容している。
- テンプレート側に置く環境設定:
  - `window.__pleasanterEnv = "dev" | "prod"` … 環境切替（コメントアウトで切り替える運用）
  - `window.__pleasanterCustomIconMap` … サイト固有アイコン。`js/common/icon.js` の `ICON_DEFS` にマージされる
- エクスポートし直すと SiteId が変わる。**SiteId をスクリプトに直書きしない** — `js/site_ids.json` に環境別で持たせ、
  スクリプトからは `siteIds[window.__pleasanterEnv]` で引く（`holiday_setting.js` が参照実装）。

## CSS 構成

- `css/definition.css` … `:root` のデザイントークン（oklch / color-mix ベース）。色はここだけで定義し、各 CSS は変数参照のみ。
- `css/definition_cherry.css` … `--primary` 違いの別テーマ。`custom_cherry.css` が自分で `@import` する
  （`custom_common.css` は definition を import せず、テンプレートの `<link>` に任せている点が非対称）。
- `css/custom_common.css` … `common/*.css`（base / conditions / grid / editor / port_setting）の `@import` 束ね。
- `css/sites/*.css` … 画面種別ごと。マニフェストの `Css` カテゴリから読む。
- `css/status振り分け.md` … ステータス値（100〜900番台）と `--status-*` 変数の対応表。
  ステータス色を触るときは必ずこの表に従う。

セレクタは Pleasanter 標準 DOM に当たるため影響範囲が広い。グローバルセレクタは必ずスコープを絞る（commit d945a68 の再発防止）。

### 色の指定ルール

**原色（`#fff` / `#ffffff` / `#000` / `#000000`）は可能な限り使わない。**
純白・純黒はコントラストが強すぎて浮くため、`--text-on-primary: #F9FAFB` のように**少しずらした値**を使う。
新規に色を足すときの優先順位:

1. `css/definition.css` の既存トークン（`var(--...)`）を使う
2. 足りなければ既存トークンから `color-mix()` / `oklch(from ...)` で導出する
3. どうしても新しい実値が必要なら `definition.css` にトークンとして定義し、各 CSS からは変数参照のみにする

既存の原色は `css/common/editor.css:310` と `:339` の 2 箇所のみ。触る機会があればトークンへ寄せる。

## コーディング規約（既存コードから読み取れる実態）

- **コメントは日本語。ファイル先頭に `// ===` 囲みで「何を・なぜ・どの DOM を根拠に」を必ず書く。**
  特に Pleasanter 内部仕様への依存（DOM 構造、Ajax URL、`data-*` 属性）は根拠と実機確認の有無を明記する。
  未検証の前提は `⚠️` 付きで残す慣習。
- jQuery 前提（`$` は Pleasanter が読み込み済み）。**必ず IIFE + `"use strict"` で包む。**
  Pleasanter のサイト設定 Scripts はpjax画面遷移のたびに再実行され、`js/`配下の各ファイルも
  ローダー（`js/loader_site.js` / `js/loader_folders.js`）が読み直すたびに評価され得るため、
  トップレベルスコープに `const`/`let`/関数宣言を直接置くと、2回目以降の評価で
  `SyntaxError: Identifier ... has already been declared` を起こしファイル全体が停止する
  （実例: `holiday_setting.js` / `comment_color.js`。過去に A-6 として発生・修正済み）。
  `escapeHtml` のような汎用名をグローバルに置くのも同じ理由で衝突源になる
  （共通版は `js/common/utils.js` の `window.escapeHtml` を使う）。
- **pjax 対応が必須**。Pleasanter は画面遷移を pjax で行うため、`$(document).on("pjax:complete", ...)` か
  `MutationObserver`（debounce 付き）で再適用する。多重登録は `window.once(name, fn)`
  （`js/common/utils.js` 提供。旧来の手書き `window.__xxxBound` フラグから統一済み）で防ぐ。
- MutationObserver 内で DOM を書き換える処理は、自己発火の無限ループを避けるため `disconnect()` → 描画 → `observe()` の順で回す。
- 外部データの取得失敗は握りつぶさず `console.warn("[ファイル名] ...", e)` を出す。
- ユーザー入力由来の文字列を HTML に差し込む箇所では自前の `escapeHtml` を通す。
- コミットメッセージは `feat:` / `fix:` / `perf:` / `refactor:` / `chore:` + 日本語要約。

## font/

PDF 出力用サブセットフォント。`font/NotoSansJP-Regular_Original/build_font.py` で
`font/NotoSansJP-Regular_LightVer.ttf` を再生成する（要 `pip install fonttools`）。

```bash
python font/NotoSansJP-Regular_Original/build_font.py
```

出力は **TTF 固定**。woff2 だと pdfme/fontkit 埋め込み時に Acrobat が警告を出すため（`NotoSansJP-Regular_Charset.md` 参照）。
文字種を足す場合は `build_font.py` の `EXTRA_CHARS` に追記し、ドキュメントの対応表も更新する。

## readonly_tenant/

テナント全体設定（Pleasanter の管理画面側）に貼る読取専用ユーザー向けの一式。
`loader_tenant.js` は jQuery 待ち → critical CSS 待ち → `theme-ready` クラス付与 → `js/loader_folders.js` 取得、の順で初期化し、
`pjax:complete` ごとに再実行する（多重実行は `__running` / `__pending` でガード）。

`js/loader_folders.js` は `manifest_folder.json` の `Js.All` を読み、フォルダ画面と同じスクリプト一式を
テナント画面にも適用する。**追加・削除は `manifest_folder.json` の編集だけで両画面に反映される。**
`loader_tenant.js` が呼ぶ 2 つの入口を `loader_folders.js` が export している:

- `window.runTenantScripts()` … 初回読み込み（`loader_tenant.js:74` が await）
- `window.reapplyFolderScripts()` … `pjax:complete` ごとの再適用（`loader_tenant.js:70`）。
  `script[src=...]` の重複チェックで通常は全件スキップされ、前回失敗した分だけ再試行される

スクリプト挿入に `$.getScript` を使わないこと。jQuery 内部で `cache:false` 固定のため URL に
`?_=<timestamp>` が付き、ブラウザキャッシュを毎回バイパスしてしまう。`<script>` 要素を自前で挿入し、
`s.async = false` でマニフェストの記載順を保つ。

**CSS は `loader_folders.js` からは読まない。** テナント画面のスタイルは `tenant.css` が担当。
`tenant.css` は Pleasanter のテナント設定「スタイル」欄に**インライン（`<style>`直書き）**で
貼る運用のため、外部ファイルとして `<link>` 経由で読み込まれることはない。そのため中で
`css/` 配下を `@import` する場合、相対パス（`../css/...` 等）は効かず、絶対CDN URL
（`https://cdn.jsdelivr.net/gh/.../@main/css/definition.css` 等、`window.__pleasanterCdnBase`
と同じブランチ名ハードコード箇所）で書く必要がある（実機確認済み: 2026-09-24）。
現状は `@import` で `definition.css` / `custom_common.css` を絶対URL指定して読み、
`css/` 側のトークン・ベーススタイルと共有する形にしている（旧: 全ルールを`tenant.css`に
自己完結でコピーしていたが、`base.css`とほぼ全重複だったため整理済み）。

`loader_tenant.js:80` の `window.startIconObserverForIcons` は未定義のまま
（`icon.js` は `window` に何も export せず、自前の `pjax:complete` と MutationObserver で自走する）。
`if (typeof ... === 'function')` でガードされているので実害は無いが、呼び出し側だけが残っている状態。

---

## Graphify Knowledge Graph

If `graph.json` and `GRAPH_REPORT.md` exist at the project root, consult them
before using Grep/Glob for file or dependency searches.

If they don't exist yet, or the codebase has changed significantly since they
were generated, run Graphify first to (re)generate them, then proceed.

## Context Caching

If `.claude-cache/` exists at the project root, consult `.claude-cache/summary.md`
(and the relevant `.claude-cache/<name>.json`) before reading the full conventions
in `_shared/` (coding-conventions.md / api-spec.md / naming-rules.md).

If `.claude-cache/` doesn't exist yet, or is older than the files under `_shared/`,
run Context Caching first to (re)generate it, then proceed.

## Log & Trace Analyzer — Incident History

Before investigating a new error or exception, check whether `INCIDENT_LOG.md`
exists at the project root. If it does, consult it first to check for a similar
past incident before starting a fresh investigation.

## Test Scenario Generator — Generated Tests

Generated E2E test code lives under `tests/generated/`. Before writing a new
E2E test for a feature, check `tests/generated/` for an existing test covering
the same feature and update it rather than creating a duplicate.

## Security Scanner — Vulnerability History

Before reviewing new code for security issues, check whether `VULNERABILITY_LOG.md`
exists at the project root. If it does, consult it first to check whether the same
vulnerability pattern has appeared elsewhere in the codebase before starting a
fresh review.

