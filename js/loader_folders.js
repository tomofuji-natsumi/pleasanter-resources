// 複数JSをまとめて読み込む
const scripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
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

function waitDomStable() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

// 外部から呼び出されるエントリポイント
window.runTenantScripts = async function () {

  // ① スクリプトを順番に読み込む
  await loadScriptSequential(scripts);

  // ② DOM が安定するのを待つ
  await waitDomStable();

  // ③ back_btn2.js や icon.js の再適用（存在するものだけ実行）
  if (window.replaceBackText) window.replaceBackText();
  if (window.runIconApply) window.runIconApply();
};

// ★ 追加：PJAX 遷移後にも必ず再実行
$(document).on("pjax:end", () => {
  window.runTenantScripts();
});
