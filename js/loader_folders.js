// 複数JSをまとめて読み込む
const scripts = [
    "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/port_setting.js",
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

window.runTenantScripts = async function () {
    if (!__scriptsLoaded && Array.isArray(window.scripts)) {
        await loadScriptSequential(window.scripts);
        __scriptsLoaded = true;
    }
};
