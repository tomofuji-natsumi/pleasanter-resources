// 複数JSをまとめて読み込む
const scripts = [
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/folders/back_btn2.js",
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js",
];

/**
 * 指定した複数のスクリプトを「順番に」読み込む。
 * すでに読み込み済みの URL はスキップする。
 */
function loadScriptSequential(urls) {
    return urls.reduce((p, url) => {
        return p.then(() => new Promise((resolve) => {

            // すでに読み込み済みなら次へ
            if (document.querySelector(`script[src="${url}"]`)) return resolve();

            const s = document.createElement('script');
            s.src = url;
            s.async = false; // 順序を保証するため async を無効化

            s.onload = resolve;

            // 読み込み失敗しても処理を止めない
            s.onerror = (e) => {
                console.warn("Script load failed:", url, e);
                resolve();
            };

            document.head.appendChild(s);
        }));
    }, Promise.resolve());
}

/**
 * DOM が安定するのを待つ（※現在は未使用）
 * 必要になったら呼び出す形で残しておく。
 */
function waitDomStable(timeout = 200) {
    return new Promise(resolve => {
        let done = false;

        // 2フレーム待つことで DOM の再描画完了を待つ
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!done) {
                    done = true;
                    resolve();
                }
            });
        });

        // 念のためのタイムアウト
        setTimeout(() => {
            if (!done) {
                done = true;
                resolve();
            }
        }, timeout);
    });
}

let __scriptsLoaded = false;

/**
 * 初回ロード時にだけ外部スクリプトを読み込み、
 * その後 UI の再適用処理（戻るボタン・アイコン）を実行する。
 */
window.runTenantScripts = async function () {

    if (!__scriptsLoaded) {
        if (Array.isArray(window.scripts)) {
            await loadScriptSequential(window.scripts);
        } else {
            console.warn("scripts が存在しないため、外部スクリプト読み込みをスキップ");
        }
        __scriptsLoaded = true;
    }
};


/**
 * UI 完成後に実行する処理
 */
function applyUIFixes() {
    if (window.replaceBackText) window.replaceBackText();
    if (window.runIconApply) window.runIconApply();
}

$(document).on("pjax:complete pjax:end Common.Refresh", () => {
    applyUIFixes();
});
