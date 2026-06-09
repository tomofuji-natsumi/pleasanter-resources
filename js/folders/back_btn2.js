(function () {

  function replaceBackText() {
    const title = document.querySelector("ul.nav-sites li.to-parent .title");
    if (!title) return false;

    // Pleasanter が描画し終えた後の最終値が「上へ」
    if (title.textContent.trim() !== "戻る") {
      title.textContent = "戻る";
    }
    return true;
  }

  // nav-sites の変化を監視し続ける（最強）
  const mo = new MutationObserver(() => {
    replaceBackText();
  });

  function startObserver() {
    const nav = document.querySelector("ul.nav-sites");
    if (nav) {
      mo.observe(nav, { childList: true, subtree: true, characterData: true });
      replaceBackText();
    }
  }

  // 初回ロード
  document.addEventListener("DOMContentLoaded", startObserver);

  // pjax 後
  $(document).on("pjax:end pjax:success Common.Refresh", startObserver);

})();
