(function () {

  function applyBackButton() {
    const li = document.querySelector("ul.nav-sites li.to-parent");
    if (!li) return;

    // すでに追加済みなら何もしない
    if (li.querySelector(".back-text-fixed")) return;

    // Pleasanter が上書きしない「li の直下」に追加する
    const span = document.createElement("span");
    span.className = "back-text-fixed";
    span.textContent = "戻る";

    // a の外に置く（Pleasanter はここを上書きしない）
    li.appendChild(span);
  }

  // nav-sites の変化を監視
  const mo = new MutationObserver(() => {
    applyBackButton();
  });

  function startObserver() {
    const nav = document.querySelector("ul.nav-sites");
    if (nav) {
      mo.observe(nav, { childList: true, subtree: true });
      applyBackButton();
    }
  }

  document.addEventListener("DOMContentLoaded", startObserver);
  $(document).on("pjax:end pjax:success Common.Refresh", startObserver);

})();
