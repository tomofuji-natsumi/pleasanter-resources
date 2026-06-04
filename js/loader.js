// GitHub Pages に置いた複数 JS をまとめて読み込む
const scripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/icon_kari.js",
];

function loadScriptSequential(urls) {
  return urls.reduce((p, url) => {
    return p.then(() => new Promise((resolve, reject) => {
      // 既に読み込まれているならスキップ
      if (document.querySelector(`script[src="${url}"]`)) return resolve();

      const s = document.createElement('script');
      s.src = url;
      s.async = false; // 順序保証
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
