// ===============================
// テナント全体設定用スクリプトローダー
//
// readonly_tenant/loader_tenant.js から $.getScript で読み込まれ、
// フォルダ画面と同じスクリプト一式（manifest_folder.json の Js.All）をテナント画面にも適用する。
//
// 以前はファイル名を直接ハードコードしていたため、manifest_folder.json に機能を追加しても
// テナント側だけ追随しなかった。フォルダ_テンプレート.json 側のローダーと同じく
// manifest_folder.json を読む方式に揃えることで、機能の追加・削除が manifest の編集のみで完結する。
//
// CSS は読み込まない。テナント画面のスタイルは readonly_tenant/tenant.css が
// トークン定義を含む自己完結版として担当しており、manifest_folder.json の Css.All
// （custom_folders.css）を重ねるとトークンが二重定義になるため。
//
// ⚠️ 読み込み元は フォルダ_テンプレート.json 側のローダーと同じ jsdelivr @js_fix に統一している。
// 同一URLになることで、両経路が効く画面でもブラウザキャッシュが共有される。
// CLAUDE.md の警告どおり、ブランチを変える際は BASE_URL も同時に書き換えること。
//
// ⚠️ このファイルは評価時には何も実行しない。loader_tenant.js が
// window.runTenantScripts() / window.reapplyFolderScripts() を呼ぶ契約になっているため、
// 実行の起点はあちら側にある（loader_tenant.js:70,74）。
// ===============================
(function () {
    "use strict";

    if (window.__loaderFoldersBound) { return; }
    window.__loaderFoldersBound = true;

    var BASE_URL = "https://cdn.jsdelivr.net/gh/tomofuji-natsumi/pleasanter-resources@js_fix";
    var MANIFEST_URL = BASE_URL + "/js/manifest_folder.json";

    // 取得済みのマニフェストを保持する。pjax遷移のたびに取り直さないことで、
    // 再適用（reapplyFolderScripts）を通信なしで済ませる。
    var scriptUrls = null;

    // ===============================
    // マニフェスト取得
    // ===============================
    function fetchManifest() {
        if (scriptUrls) { return Promise.resolve(scriptUrls); }

        return Promise.resolve($.getJSON(MANIFEST_URL))
            .then(function (manifest) {
                var names = (manifest && manifest.Js && manifest.Js.All) || [];
                scriptUrls = names.map(function (name) {
                    return BASE_URL + "/js/" + name;
                });
                return scriptUrls;
            })
            .catch(function (e) {
                console.warn("[loader_folders.js] manifest_folder.json の読み込みに失敗", e);
                return [];
            });
    }

    // ===============================
    // 順番に読み込む
    //
    // $.getScript ではなく <script> 要素を自前で挿入する。
    // $.getScript は jQuery 内部で cache:false 固定のため URL に ?_=<timestamp> が付き、
    // ブラウザキャッシュを毎回バイパスしてしまうため。
    // s.async = false により、動的挿入でもマニフェストの記載順で実行される。
    // ===============================
    function loadScriptSequential(urls) {
        return urls.reduce(function (p, url) {
            return p.then(function () {
                return new Promise(function (resolve) {
                    // 既に読み込み済みなら何もしない（再適用時に二重評価しないため）
                    if (document.querySelector('script[src="' + url + '"]')) { return resolve(); }

                    var s = document.createElement("script");
                    s.async = false;

                    // ハンドラは src より先に設定する（取り付け前にイベントが走る余地を作らないため）
                    s.onload = function () { resolve(); };
                    s.onerror = function (e) {
                        console.warn("[loader_folders.js] スクリプトの読み込みに失敗", url, e);
                        // 失敗した要素を残すと上の重複チェックに引っかかり、次回以降も再試行できなくなる
                        s.remove();
                        resolve();
                    };

                    s.src = url;
                    document.head.appendChild(s);
                });
            });
        }, Promise.resolve());
    }

    function loadAll() {
        return fetchManifest().then(loadScriptSequential);
    }

    // ===============================
    // loader_tenant.js から呼ばれる入口
    //
    // runTenantScripts   … 初回読み込み（loader_tenant.js:74 が await する）
    // reapplyFolderScripts … pjax遷移ごとの再適用（loader_tenant.js:70）。
    //                        通常は上の重複チェックで全件スキップされる no-op だが、
    //                        前回失敗した分だけここで再試行される。
    // ===============================
    window.runTenantScripts = loadAll;
    window.reapplyFolderScripts = loadAll;
})();
