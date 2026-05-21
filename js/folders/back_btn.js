(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
        }
    }

    // 初回ロード
    replaceText();

    // nav-sites の生成を監視
    const observer = new MutationObserver(() => {
        replaceText();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
