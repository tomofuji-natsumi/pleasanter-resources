// ===============================
// 一覧0件時の案内表示
//
// 絞り込み結果が0件のとき、単なる空白ではなく案内文言を表示する。
//
// マニフェスト未登録の個別貼り付け用ファイル。js/common/dom_watcher.js（manifestのAllに
// 登録済みで全画面で先に読まれる）が定義するwindow.__pleasanterWatchに依存する。
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

        // グループ化表示では見出し行（.grid-row以外の<tr>）が混ざるため、tbody > tr全数ではなく
        // .grid-row（zebra_stripe.jsと同じ判定基準）で数える
        var hasRows = $grid.find('tbody > tr.grid-row').length > 0;
        // .next()（直後の兄弟）限定だと、テーブル直後に別要素が挿入された場合に
        // 既存メッセージを検出できず毎回新規挿入 → observer自己発火 → 無限増殖しうるため、
        // 直後に限らずグリッド以降の兄弟から探す
        var $existing = $grid.nextAll('.empty-grid-message').first();

        if (hasRows) {
            $existing.remove();
            return;
        }

        if (!$existing.length) {
            $('<div class="empty-grid-message"></div>').text(MESSAGE_TEXT).insertAfter($grid);
        }
    }

    window.once('emptyGridMessage', function () {
        $(document).on('pjax:complete', updateEmptyMessage);

        window.__pleasanterWatch(updateEmptyMessage, { delay: 50, guard: 'emptyGridMessage', root: '.grid' });
    });

    updateEmptyMessage();
})();
