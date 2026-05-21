(function () {

    function replaceText() {
        const title = document.querySelector("#SiteMenu ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
            return true;
        }
        return false;
    }

    // 初回ロード（最初の nav-sites に対して）
    replaceText();

    // nav-sites の差し替えを監視（ここが重要）
    const target = document.querySelector("#SiteMenu");

    const backObserver = new MutationObserver(() => {
        replaceText();
    });

    backObserver.observe(target, {
        childList: true,
        subtree: true
    });

})();
