// 複数JSをまとめて読み込む
const scripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/folders/back_btn_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/folders/css_setting_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/icon_kari.js",
];

function loadScriptSequential(urls) {
  return urls.reduce((p, url) => {
    return p.then(() => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) return resolve();

      const s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    }));
  }, Promise.resolve());
}

// 外部から呼び出されるエントリポイント
window.runTenantScripts = function() {
  return loadScriptSequential(scripts);
};
