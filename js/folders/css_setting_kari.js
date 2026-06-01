// フォルダ画面のスタイル切り替え
(function () {

    function updateFlag() {
        const exists = document.querySelector('#TemplateTabsContainer') !== null;

        if (exists) {
            document.body.classList.remove('site-list');
        } else {
            document.body.classList.add('site-list');
        }
    }

    // 初回チェック
    updateFlag();

    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('#TemplateTabsContainer')) {
            updateFlag();
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
