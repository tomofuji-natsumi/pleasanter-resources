// サイト一覧ページにのみ適用
$(function () {
    const updateFlag = () => {
        const exists = document.querySelector('#TemplateTabsContainer') !== null;

        if (exists) {
            document.body.classList.remove('site-list');
        } else {
            document.body.classList.add('site-list');
        }
    };

    // 初回チェック
    updateFlag();

    const observer = new MutationObserver(updateFlag);
    observer.observe(document.body, { childList: true, subtree: true });
});
