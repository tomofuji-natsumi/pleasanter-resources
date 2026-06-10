(function () {

  function applyBackButton() {
    const nav = document.querySelector("ul.nav-sites");
    if (!nav) return;

    // すでに追加済みなら何もしない
    if (document.querySelector(".back-text-fixed")) return;

    // nav-sites の外側に追加（Pleasanter はここを上書きしない）
    const span = document.createElement("span");
    span.className = "back-text-fixed";
    span.textContent = "戻る";

    // nav-sites の直前に挿入
    nav.parentNode.insertBefore(span, nav);
  }

  // nav-sites の変化を監視
  const mo = new MutationObserver(() => {
    applyBackButton();
  });

  function startObserver() {
    const nav = document.querySelector("ul.nav-sites");
    if (nav) {
      mo.observe(nav.parentNode, { childList: true, subtree: true });
      applyBackButton();
    }
  }

  document.addEventListener("DOMContentLoaded", startObserver);
  $(document).on("pjax:end pjax:success Common.Refresh", startObserver);

})();
