// ===============================
//
// カレンダー設定「項目」選択肢の絞り込み
//
// カレンダー画面の設定にある「項目（日付軸）」ドロップダウン（#CalendarFromTo）には、DateA〜DateZが常に全て表示される。
// 項目名がリネームされていない初期値（「日付A」〜「日付Z」の1文字パターン）のままの選択肢はこのサイトでは未使用の項目とみなし、選択肢から取り除く。
//
// ===============================
(function () {
    'use strict';

    if (window.__calendarFromToFilterBound) { return; }
    window.__calendarFromToFilterBound = true;

    var UNUSED_LABEL_PATTERN = /^日付[A-Z]$/;

    function applyFilter() {
        var $select = $('#CalendarFromTo');
        if (!$select.length) { return; }

        $select.find('option').each(function () {
            if (this.selected) { return; }
            if (UNUSED_LABEL_PATTERN.test((this.textContent || '').trim())) {
                this.remove();
            }
        });
    }

    $(document).on('pjax:complete', applyFilter);
    applyFilter();
})();
