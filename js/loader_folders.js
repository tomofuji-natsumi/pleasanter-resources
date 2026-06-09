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

            if (document.querySelector(`script[src="${url}"]`)) return resolve();

            const s = document.createElement('script');
            s.src = url;
            s.async = false;

            s.onload = resolve;
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
 * ※ UI 再適用はここでは絶対に行わない（ちらつきの原因）
 */
window.runTenantScripts = async function () {

    if (!__scriptsLoaded) {
        await loadScriptSequential(scripts);
        __scriptsLoaded = true;
    }
};

/**
 * UI 完成後に実行する処理（2フレーム遅延でちらつきを防ぐ）
 */
function applyUIFixesStable() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (window.replaceBackText) window.replaceBackText();
            if (window.runIconApply) window.runIconApply();
        });
    });
}

let __iconApplied = false;

/**
 * pjax:complete → 最優先（UI が完全に描画された後）
 */
$(document).on("pjax:complete", () => {
    __iconApplied = true;
    applyUIFixesStable();
});

/**
 * pjax:end → complete が来なかった画面のフォールバック
 */
$(document).on("pjax:end", () => {
    if (!__iconApplied) {
        applyUIFixesStable();
    }
    __iconApplied = false;
});
