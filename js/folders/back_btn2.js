(function () {
  // --- 動的CSS注入（冪等） ---
  function injectStyle(id, css) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  const dynamicCss = `
    /* 動的DOM向けルール */
    #SiteMenu nav:first-of-type .ui-icon-circle-arrow-n { display: none !important; }
    #SiteMenu nav:first-of-type .nav-sites { margin-bottom: 1.5rem !important; }
    #SiteMenu nav:first-of-type .nav-sites li.to-parent { justify-content: center !important; margin: 0 !important; }
    #SiteMenu nav:first-of-type .nav-sites li.to-parent .title { color: var(--on-primary) !important; }
    #SiteMenu nav:first-of-type .primary-material-icons { font-size: 1rem !important; }
    #SiteMenu nav:nth-of-type(2) .nav-sites.sortable .nav-site,
    #SiteMenu nav:nth-of-type(2) .nav-sites.sortable .nav-site * { min-width: 0 !important; }
  `;
  injectStyle('tenant-dynamic-style', dynamicCss);

  // --- ちらつき対策 ---
  const HIDE = 'hide-sitemenu-hard';
  injectStyle('tenant-hide-style', `html.${HIDE} #SiteMenu { display: none !important; }`);
  document.addEventListener('pjax:start', () => document.documentElement.classList.add(HIDE));

  // --- 外部スクリプト読み込み（順序保証） ---
  function loadScriptsSequential(urls) {
    return urls.reduce((p, url) => p.then(() => $.getScript(url)), Promise.resolve());
  }
  function loadExternal() {
    // 可能なら combined.js にまとめる（推奨）
    const urls = [
      "https://tomofuji-natsumi.github.io/pleasanter-resources/js/loader_folders.js",
      "https://tomofuji-natsumi.github.io/pleasanter-resources/js/port_setting_kari.js",
      "https://tomofuji-natsumi.github.io/pleasanter-resources/js/common/icon.js"
    ];
    return loadScriptsSequential(urls).catch(e => console.error('外部スクリプト読み込み失敗', e));
  }

  // --- pjax:end で再注入・再読み込み ---
  document.addEventListener('pjax:end', () => {
    // 再注入（既存を remove してから）
    injectStyle('tenant-dynamic-style', dynamicCss);

    // ちらつき解除（二重 rAF）
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove(HIDE);
    }));

    // 外部スクリプトを順次読み込み（トップでも PJAX でも実行）
    loadExternal();
  });

  // 初回ロードでも読み込む
  loadExternal();

})();
