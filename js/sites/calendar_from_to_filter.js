// ===============================
// カレンダー設定「項目」選択肢の絞り込み
//
// カレンダー画面の設定にある「項目（日付軸）」ドロップダウン（#CalendarFromTo）
// には、DateA〜DateZが常に全て表示される。項目名がリネームされておらず
// 初期値（「日付A」〜「日付Z」の1文字パターン）のままの選択肢は、このサイト
// では未使用の項目とみなし、選択肢から取り除く。
//
// ⚠️ 要検証:
// - 「日付◯」（1文字）という表示ラベルが、本当に「未使用（リネームされて
//   いない）」を意味するかは、サイト設定の運用ルール次第。項目名を意図的に
//   1文字のまま使っているサイトがあると誤って除外されるため、開発環境で
//   対象サイトの実態を確認すること。
// - 現在選択中（selected）の項目は、誤って選べなくする事故を避けるため
//   パターンに一致していても削除しない。
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
