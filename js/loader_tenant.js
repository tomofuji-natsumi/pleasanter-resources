// 記録用

(function () {

  function waitForAllCss() {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][data-critical]'));
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

  function waitForPleasanterDom() {
    return new Promise(resolve => {
      const obs = new MutationObserver(() => {
        if (document.querySelector('.main-container')) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  let __loaderLoaded = false;

  async function runAll() {

    await Promise.all([
      waitForAllCss().then(() => {
        document.documentElement.classList.add('theme-ready');
      }),
      waitForjQuery()
    ]);

    if (!__loaderLoaded) {
      await $.getScript("https://tomofuji-natsumi.github.io/pleasanter-resources/js/loader_folders.js");
      __loaderLoaded = true;
    } else {
      if (window.reapplyFolderScripts) {
        window.reapplyFolderScripts();
      }
    }

    if (typeof window.runTenantScripts === 'function') {
      await window.runTenantScripts();
    }

    await waitForPleasanterDom();

    if (typeof window.startIconObserverForIcons === 'function') {
      window.startIconObserverForIcons();
    }
  }

  runAll();

  $(document).on("pjax:complete", runAll);

})();
