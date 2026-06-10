// 記録用

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
  function waitForAllCss() {
      const links = Array.from(
        document.querySelectorAll('link[rel="stylesheet"][data-critical]')
      );
      if (links.length === 0) return Promise.resolve();
      return Promise.all(
        links.map(link => new Promise(resolve => {
          if (link.sheet) return resolve();
          link.addEventListener('load', resolve, { once: true });
          link.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 1000);
        }))
      );
    }

    function waitForjQuery() {
      return new Promise(resolve => {
        if (window.jQuery) return resolve(window.jQuery);
        if (window.$p) return resolve(window.$p);
        const timer = setInterval(() => {
          if (window.jQuery || window.$p) {
            clearInterval(timer);
            resolve(window.jQuery || window.$p);
          }
        }, 20);
      });
    }

    function waitForDomStable() {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    }

    let __loaderLoaded = false;

    async function runAll() {

      // CSS と jQuery を並列で待つ
      await Promise.all([
        waitForAllCss().then(() => {
          document.documentElement.classList.add('theme-ready');
        }),
        waitForjQuery()
      ]);

      // loader_folders.js は初回だけ読み込む
      if (!__loaderLoaded) {
        await window.jQuery.getScript(
          "https://tomofuji-natsumi.github.io/pleasanter-resources/js/loader_folders.js"
        );
        __loaderLoaded = true;
      }

      // テナント JS を実行
      if (typeof window.runTenantScripts === 'function') {
        await window.runTenantScripts();
      }

      await waitForDomStable();

      if (typeof window.startIconObserverForIcons === 'function') {
        window.startIconObserverForIcons();
      }
    }

    // 初回ロード
    runAll();

    // PJAX 後は UI 再適用のみ
    $(document).on("pjax:end", runAll);

})();
