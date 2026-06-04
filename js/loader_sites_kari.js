const criticalScripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js"
];

const dependentScripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari2.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/readonly_kari.js"
];

const parallelScripts = [
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/comment_color_kari.js",
  "https://tomofuji-natsumi.github.io/pleasanter-resources/js/sites/holiday_setting_kari.js"
];

function loadScriptOnce(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) return resolve();

    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadSequential(urls) {
  for (const url of urls) {
    await loadScriptOnce(url);
  }
}

window.runTenantScripts = async function () {
  try {
    await loadSequential(criticalScripts);
    await loadSequential(dependentScripts);
    await Promise.all(parallelScripts.map(loadScriptOnce));
  } catch (e) {
    console.warn("Script load interrupted:", e);
  }
};
