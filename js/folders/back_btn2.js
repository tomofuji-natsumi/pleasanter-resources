(function () {

  function replaceBackText() {
    const title = document.querySelector("ul.nav-sites li.to-parent .title");
    if (title) {
      title.textContent = "戻る";
      return true;
    }
    return false;
  }

  // UI 完成後のフレームで実行（ちらつき防止）
  function applyBackTextStable() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        replaceBackText();
      });
    });
  }

  let applied = false;

  // pjax:complete → 最優先（UI が完全に描画された後）
  $(document).on("pjax:complete", () => {
    applied = true;
    applyBackTextStable();
  });

  // pjax:end → complete が来なかった画面のフォールバック
  $(document).on("pjax:end", () => {
    if (!applied) {
      applyBackTextStable();
    }
    applied = false;
  });

  // 初回ロードも pjax と同じ扱いにする
  document.addEventListener("DOMContentLoaded", () => {
    applyBackTextStable();
  });

})();
