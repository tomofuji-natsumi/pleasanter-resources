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

    // nav-sites が後から描画される場合に備えて監視
    const mo = new MutationObserver(() => {
        replaceBackText();
    });

    mo.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
