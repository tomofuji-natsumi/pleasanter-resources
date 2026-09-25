// ===============================
// 記録テーブル用サイトローダー（サイト設定 Scripts から読み込まれる）
//
// 従来はこのファイルの内容が記録テーブル_テンプレート.json（git管理外）の
// Scripts[].Body に1行エスケープ文字列として直書きされており、diffも構文チェックも
// 効かなかった（D-7）。テンプレート側は本ファイルを <script> 要素で読み込むだけにし、
// アーキテクチャの心臓部（画面種別判定・manifest fetch・スクリプト挿入）をgit管理下に置く。
//
// PleasanterのURL規約（/items/{SiteId}/{action}）から画面種別を判定し、
// manifest_site.json の Js.All + 画面種別カテゴリに列挙されたファイルだけを取得する。
// 機能の追加・削除はmanifest_site.jsonの編集のみで完結し、このファイル自体の変更は不要。
//
// ⚠️ サイト設定 Scripts はpjax画面遷移のたびに再実行されるが、このファイル自体は
// <script src> の重複チェックにより初回のみ読み込まれ、以降は再取得・再評価されない
// （js/loader_folders.js と同じ形）。$.getScriptはcache:false固定でURLに?_=<timestamp>が
// 付き、画面遷移のたびに全スクリプトを再ダウンロードしてしまうため、この方式にしている（B-1）。
//
// 画面種別は遷移のたびに変わりうるため、screenTypeの再判定＋未読み込みファイルの
// 追加読み込み自体は pjax:complete のたびに実行する（D-5）。各スクリプトファイル側の
// 画面判定（例: holiday_setting.jsのカレンダー画面判定）は各ファイル自身の責務。
// ===============================
(function () {
    "use strict";

    if (window.__loaderSiteBound) { return; }
    window.__loaderSiteBound = true;

    // D-1: CDN配信元＋ブランチ名はテンプレート側のwindow.__pleasanterCdnBaseに集約している。
    // 未定義の場合（テンプレート未反映等）に備え、フォールバック値も持たせる。
    var CDN_BASE = window.__pleasanterCdnBase || "https://cdn.jsdelivr.net/gh/tomofuji-natsumi/pleasanter-resources@main";

    // アイコン表示に必要な最小限のファイル（utils.js → dom_watcher.js → icon.jsの順で依存）を
    // manifest_site.jsonのfetch完了を待たずに先読みする。従来は
    // 「loader_site.js取得 → manifest fetch → 該当スクリプト取得」の3段直列だったが、
    // 事前に分かっているこの3本だけはmanifest fetchと並行でダウンロードを始められる。
    // 実際の<script>挿入はこれまで通りmanifest経由（__pleasanterLoadScript）で行うため、
    // ここではプリロードヒントを出すだけ（manifest側の記載内容が正のまま変わらない）。
    // 初回のみでよいため、pjax再実行時（__pleasanterRunSiteScripts呼び出し）では行わない。
    [
        "common/utils.js",
        "common/dom_watcher.js",
        "common/icon.js"
    ].forEach(function (name) {
        var link = document.createElement("link");
        link.rel = "preload";
        link.as = "script";
        link.href = CDN_BASE + "/js/" + name;
        document.head.appendChild(link);
    });

    window.__pleasanterScreenType = window.__pleasanterScreenType || function () {
        var action = (location.pathname.match(/\/items\/\d+\/([a-zA-Z]+)/) || [])[1] || "";
        switch (action.toLowerCase()) {
            case "edit":
            case "new":
                return "Edit";
            case "calendar":
                return "Calendar";
            case "timeseries":
                return "TimeSeries";
            case "imagelib":
                return "ImageLib";
            default:
                return "Index";
        }
    };

    // Htmls側インラインscript（CSSローダー）も同じmanifest_site.jsonをfetchするため、
    // window.__pleasanterManifestPromiseに共有してリロード毎の二重fetchを避ける。
    // HtmlsとScriptsの評価順序は保証されないため、どちらが先に呼んでもよい形にしてある。
    window.__pleasanterGetManifest = window.__pleasanterGetManifest || function () {
        if (!window.__pleasanterManifestPromise) {
            window.__pleasanterManifestPromise = fetch(CDN_BASE + "/js/manifest_site.json")
                .then(function (res) { return res.json(); });
        }
        return window.__pleasanterManifestPromise;
    };

    window.__pleasanterLoadScript = window.__pleasanterLoadScript || function (name) {
        var src = CDN_BASE + "/js/" + name;
        if (document.querySelector("script[src='" + src + "']")) { return; }

        var s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onerror = function () {
            console.warn("[" + name + "] の読み込みに失敗", src);
        };
        document.head.appendChild(s);
    };

    window.__pleasanterRunSiteScripts = window.__pleasanterRunSiteScripts || function () {
        window.__pleasanterGetManifest()
            .then(function (manifest) {
                var screenType = window.__pleasanterScreenType();
                var names = (manifest.Js && manifest.Js.All || [])
                    .concat((manifest.Js && manifest.Js[screenType]) || []);
                names.forEach(window.__pleasanterLoadScript);
            })
            .catch(function (e) {
                console.warn("[manifest_site.json] の読み込みに失敗", e);
            });
    };

    $(document).on("pjax:complete", window.__pleasanterRunSiteScripts);
    window.__pleasanterRunSiteScripts();
})();
