(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
            return true;
        }
        return false;
    }

    // nav-sites の完成を監視
    const observer = new MutationObserver(() => {
        if (replaceText()) {
            observer.disconnect(); // ← 一度成功したら監視終了
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
