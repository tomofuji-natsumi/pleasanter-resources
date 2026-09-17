// ===============================
// 一覧0件時の案内表示
//
// 絞り込み結果が0件のとき、単なる空白ではなく案内文言を表示する。
// ===============================
(function () {
    'use strict';

    var MESSAGE_TEXT = '条件に一致するデータがありません';

    function updateEmptyMessage() {
        var $grid = $('.grid').first();

        if (!$grid.length) {
            $('.empty-grid-message').remove();
            return;
        }

        var hasRows = $grid.find('tbody tr').length > 0;
        var $existing = $grid.next('.empty-grid-message');

        if (hasRows) {
            $existing.remove();
            return;
        }

        if (!$existing.length) {
            $('<div class="empty-grid-message"></div>').text(MESSAGE_TEXT).insertAfter($grid);
        }
    }

    if (!window.__emptyGridMessageBound) {
        window.__emptyGridMessageBound = true;

        $(document).on('pjax:complete', updateEmptyMessage);

        var debounceTimer = null;
        var observer = new MutationObserver(function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateEmptyMessage, 50);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    updateEmptyMessage();
})();
