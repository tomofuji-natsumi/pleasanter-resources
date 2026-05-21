(function () {

    function replaceText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
        }
    }

    // 初回ロード
    replaceText();

    // PJAX で画面が切り替わった後に実行
    document.addEventListener("pjax:end", function () {
        setTimeout(replaceText, 50);
    });

})();
