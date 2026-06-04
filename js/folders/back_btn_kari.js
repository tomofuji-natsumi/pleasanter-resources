(function () {

    function replaceBackText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
        }
    }

    // 初回ロード
    replaceBackText();

    // PJAX 後（画面描画が終わった直後）
    $(document).on("pjax:end", function () {
        setTimeout(replaceBackText, 30);
    });

    // nav-sites が描画された瞬間だけ反応
    const mo = new MutationObserver(() => {
        const nav = document.querySelector("ul.nav-sites");
        if (nav) {
            replaceBackText();
        }
    });

    // nav-sites が入る MainContainer のみ監視
    mo.observe(document.querySelector("#MainContainer") || document.body, {
        childList: true,
        subtree: true
    });

})();
