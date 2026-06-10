// ===============================
// 読み込む外部スクリプト一覧
// ===============================
const scripts = [
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/port_setting.js",
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js",
];

// ===============================
// 順番に読み込む
// ===============================
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

// ===============================
// Pleasanter の runAll から呼ばれる
// ===============================
window.runTenantScripts = async function () {

    if (!__scriptsLoaded) {
        await loadScriptSequential(__tenantScripts);
        __scriptsLoaded = true;
    }
};

// ===============================
// UI 再適用（アイコンのみ）
// ===============================
function applyUIFixes() {
    if (window.runIconApply) window.runIconApply();
}

// ===============================
// PJAX 後に UI 再適用
// ===============================
$(document).on("pjax:complete pjax:end", () => {
    applyUIFixes();
});
