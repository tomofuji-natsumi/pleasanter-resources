(function () {
    function replaceBackText() {
        const title = document.querySelector("ul.nav-sites li.to-parent .title");
        if (title) {
            title.textContent = "戻る";
        }
    }

    // 初回ロードで即反映
    replaceBackText();

    // PJAX 遷移後にも反映
    $(document).on("pjax:success pjax:complete", replaceBackText);
})();
