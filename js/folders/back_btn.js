(function () {

    function fixGoBack() {
        const link = document.querySelector("ul.nav-sites li.to-parent a");
        if (!link) return;

        const title = link.querySelector(".title");
        if (title && title.textContent !== "戻る") {
            title.textContent = "戻る";
        }
    }

    // nav-sites の完成を監視
    const observer = new MutationObserver(() => {
        fixGoBack();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初回ロード
    fixGoBack();

})();
