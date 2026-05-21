(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
        }
    }

    // 初回ロード
    replaceText();

    // 画面遷移開始（描画前）
    document.addEventListener("pjax:send", function () {
        replaceText();
    });

    // 画面遷移完了（描画後）
    document.addEventListener("pjax:end", function () {
        replaceText();
    });

})();
