(function () {

  function applyBackButton() {
    const nav = document.querySelector("ul.nav-sites");
    if (!nav) return;

    if (document.querySelector(".back-text-fixed")) return;

    const span = document.createElement("span");
    span.className = "back-text-fixed";
    span.textContent = "戻る";

    nav.parentNode.insertBefore(span, nav);
  }

  window.applyBackButton = applyBackButton;

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
