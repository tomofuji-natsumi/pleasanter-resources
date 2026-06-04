const scripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/readonly.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/comment_color.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/holiday_setting.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js",
];

function loadScriptOnce(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + url + '"]')) {
      return resolve();
    }
    const s = document.createElement('script');
    s.src = url;
    s.async = false;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function loadScriptsSequential(urls) {
  return urls.reduce((p, url) => {
    return p.then(() => loadScriptOnce(url));
  }, Promise.resolve());
}

window.runTenantScripts = function () {
  return loadScriptsSequential(scripts);
};
