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

let __scriptsLoaded = false;

/**
 * 初回ロード時にだけ外部スクリプトを読み込む。
 * ※ UI 再適用は絶対にここで行わない
 */
window.runTenantScripts = async function () {

    if (!__scriptsLoaded) {
        await loadScriptSequential(scripts);
        __scriptsLoaded = true;
    }
};

/**
 * UI 完成後に実行する処理（安定フレーム）
 */
function applyUIFixes() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (window.replaceBackText) window.replaceBackText();
            if (window.runIconApply) window.runIconApply();
        });
    });
}

$(document).on("pjax:success", () => {
    applyUIFixes();
});

/**
 * pjax:end → success が来ない画面のフォールバック
 */
$(document).on("pjax:end", () => {
    applyUIFixes();
});

/**
 * 初回ロード
 */
document.addEventListener("DOMContentLoaded", () => {
    applyUIFixes();
});
