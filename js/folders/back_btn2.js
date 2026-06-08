(function () {

  function replaceBackText() {
    const title = document.querySelector("ul.nav-sites li.to-parent .title");
    if (title) {
      title.textContent = "戻る";
      return true;
    }
    return false;
  }

  // 初回ロード
  replaceBackText();

  // PJAX 後（画面描画が終わった直後）
  $(document).on("pjax:end", function () {
    setTimeout(replaceBackText, 10);
  });

  // nav-sites のみを監視
  const mo = new MutationObserver(() => {
    if (replaceBackText()) {
      // 一度反映できたら監視を止める（保守的に）
      mo.disconnect();
    }
  });

  const target = document.querySelector("#MainContainer") || document.body;
  if (target) {
    mo.observe(target, {
      childList: true,
      subtree: true
    });
  }

})();
