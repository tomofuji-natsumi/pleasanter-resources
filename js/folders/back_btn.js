(function () {

    function fixGoBack() {
        const link = document.querySelector("ul.nav-sites li.to-parent a");
        if (!link) return false;

        // 既存の中身を全部消して、戻るボタンとして再構築
        link.innerHTML = `
            <span class="ui-icon ui-icon-circle-arrow-n"></span>
            <span class="title">戻る</span>
        `;
        return true;
    }

    // 初回ロード
    fixGoBack();

    // nav-sites の完成を監視
    const backObserver = new MutationObserver(() => {
        if (fixGoBack()) {
            observer.disconnect();
        }
    });

    backObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
