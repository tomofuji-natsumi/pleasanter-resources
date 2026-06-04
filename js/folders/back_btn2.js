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
        setTimeout(replaceBackText, 10);
    });

    // nav-sites のみを監視（←ここが重要）
    const mo = new MutationObserver(() => {
        const nav = document.querySelector("ul.nav-sites");
        if (nav) {
            replaceBackText();
        }
    });

    // nav-sites が入るコンテナだけ監視
    mo.observe(document.querySelector("#MainContainer") || document.body, {
        childList: true,
        subtree: true
    });

})();
