(function () {
  // デバウンスユーティリティ
  function debounce(fn, wait) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), wait);
    };
  }

  // フラグ更新ロジック（DOM と URL の両方を参照）
  function updateFlag() {
    // DOMベース判定（テンプレートタブが存在するか）
    const hasTemplateTabs = !!document.querySelector('#TemplateTabsContainer');

    // URLベース判定（site-list のパスパターンがあれば補助）
    const path = location.pathname || '';
    const isTopSiteList = /\/sites\/?$/.test(path); // 必要に応じて調整

    // 最終判定：テンプレートタブがあれば site-list ではない
    const shouldBeSiteList = !hasTemplateTabs && !isTopSiteList ? true : !hasTemplateTabs && isTopSiteList ? true : !hasTemplateTabs;

    // シンプルに hasTemplateTabs の有無で切り替え（過度な複雑化は避ける）
    if (hasTemplateTabs) {
      document.body.classList.remove('site-list');
    } else {
      document.body.classList.add('site-list');
    }
  }

  // 初回実行（ページロード時）
  updateFlag();

  // MutationObserver を使って動的に変化を監視（デバウンス）
  let observer = null;
  const debouncedUpdate = debounce(() => {
    try { updateFlag(); } catch (e) { console.error('updateFlag error', e); }
  }, 80);

  function startObserver() {
    stopObserver(); // 既存があれば止める
    // 監視対象を絞れるなら document.body ではなく特定コンテナにする
    const target = document.body;
    if (!target) return;
    observer = new MutationObserver((mutations) => {
      // 追加ノードがある場合のみ反応（軽量化）
      const significant = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
      if (significant) debouncedUpdate();
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) {
      try { observer.disconnect(); } catch (e) {}
      observer = null;
    }
  }

  // PJAX イベントで確実に再評価・Observer 再起動
  function onPjaxEnd() {
    // DOM が差し替わった直後に判定
    updateFlag();
    // Observer を再起動して以降の変化を監視
    startObserver();
  }

  // イベント登録（jQuery とネイティブの両方をカバー）
  if (document.addEventListener) document.addEventListener('pjax:end', onPjaxEnd);
  if (window.jQuery) {
    jQuery(document).on('pjax:complete pjax:success', onPjaxEnd);
    jQuery(document).ready(() => {
      // 初回ロード後に Observer を開始
      startObserver();
    });
  } else {
    // jQuery が無ければ DOMContentLoaded 後に開始
    document.addEventListener('DOMContentLoaded', startObserver);
  }

  // ページアンロード時にクリーンアップ
  if (window.addEventListener) window.addEventListener('beforeunload', stopObserver);

})();
