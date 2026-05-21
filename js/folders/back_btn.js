(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title && title.textContent !== "戻る") {
            title.textContent = "戻る";
        }
    }

    // nav-sites の完成を監視
    const observer = new MutationObserver(() => {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            replaceText();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初回ロード（title が存在するなら即反映）
    replaceText();

})();
