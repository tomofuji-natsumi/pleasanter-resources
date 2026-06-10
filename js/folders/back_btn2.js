(function () {

  function replaceBackText() {
    const parent = document.querySelector("ul.nav-sites li.to-parent a");
    if (!parent) return;

    // 既に追加済みなら何もしない
    if (parent.querySelector(".back-text-fixed")) return;

    // 元の title は Pleasanter が上書きするので非表示にする
    const title = parent.querySelector(".title");
    if (title) {
      title.style.display = "none";
    }

    // Pleasanter が上書きできない独自要素を追加
    const span = document.createElement("span");
    span.className = "back-text-fixed";
    span.textContent = "戻る";

    // アイコンの後ろ、title の前に挿入
    parent.insertBefore(span, title || null);
  }

  // nav-sites の変化を監視し続ける
  const mo = new MutationObserver(() => {
    replaceBackText();
  });

  function startObserver() {
    const nav = document.querySelector("ul.nav-sites");
    if (nav) {
      mo.observe(nav, {
        childList: true,
        subtree: true,
        characterData: true
      });
      replaceBackText();
    }
  }

  document.addEventListener("DOMContentLoaded", startObserver);
  $(document).on("pjax:end pjax:success Common.Refresh", startObserver);

})();
