// 複数JSをまとめて読み込む
const scripts = [
  // "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/folders/back_btn2.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js",
];

function loadScriptSequential(urls) {
  return urls.reduce((p, url) => {
    return p.then(() => new Promise((resolve) => {

      // 既に読み込み済みならスキップ
      if (document.querySelector(`script[src="${url}"]`)) return resolve();

      const s = document.createElement('script');
      s.src = url;
      s.async = false;

      s.onload = resolve;

      // 読み込み失敗しても止めない
      s.onerror = (e) => {
        console.warn("Script load failed:", url, e);
        resolve();
      };

      document.head.appendChild(s);
    }));
  }, Promise.resolve());
}

function waitDomStable(timeout = 200) {
  return new Promise(resolve => {
    let done = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!done) {
          done = true;
          resolve();
        }
      });
    });

    setTimeout(() => {
      if (!done) {
        done = true;
        resolve();
      }
    }, timeout);
  });
}

let __scriptsLoaded = false;

window.runTenantScripts = async function () {

  // ① 初回だけスクリプトを読み込む
  if (!__scriptsLoaded) {
    await loadScriptSequential(scripts);
    __scriptsLoaded = true;
  }
  
  // ③ UI の再適用（存在するものだけ実行）
  if (window.replaceBackText) window.replaceBackText();
  if (window.runIconApply) window.runIconApply();
};

// PJAX 遷移後は “再適用だけ”
$(document).on("pjax:end", () => {
  if (window.replaceBackText) window.replaceBackText();
  if (window.runIconApply) window.runIconApply();
});
