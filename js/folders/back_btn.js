(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (!title) return false;

        // すでに戻るなら何もしない
        if (title.textContent === "戻る") return false;

        // Pleasanter の初期値「上へ」だけを書き換える
        title.textContent = "戻る";
        return true;
    }

    const observer = new MutationObserver(() => {
        // 「上へ」が出現した瞬間だけ書き換える
        if (replaceText()) {
            // 書き換えに成功したら監視終了（ちらつき防止）
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初回ロードで既に存在していれば即反映
    replaceText();

})();
