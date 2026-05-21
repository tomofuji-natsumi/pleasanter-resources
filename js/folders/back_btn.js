(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
            return true;
        }
        return false;
    }

    let fixed = false;

    const observer = new MutationObserver(() => {
        if (fixed) return;

        // nav-sites が完成した瞬間だけ実行
        if (replaceText()) {
            fixed = true;

            // 50ms 後にもう一度実行（Pleasanter の上書き対策）
            setTimeout(() => {
                replaceText();
            }, 50);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初回ロードで既に存在していれば即反映
    replaceText();

})();
