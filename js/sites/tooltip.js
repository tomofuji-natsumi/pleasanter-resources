// ===============================
// テキスト省略時のツールチップ表示
//
// 一覧画面のセル内容（タイトル・メモ）や、カレンダー画面の祝日名がCSSのtext-overflow等で省略表示されている場合、
// is-clampedクラスを付与してitle属性等でツールチップ表示できるようにする。
// ===============================
(function () {
"use strict";
$(function () {
    // 省略されているかを判定
    //
    // scrollHeight/scrollWidth（読み取り）とaddClass/removeClass（書き込み）を
    // 同一ループ内で交互に行うと、要素ごとに強制同期レイアウトが発生する（B-3）。
    // 全要素をまず測り切ってから、まとめてクラスを適用する2パス構成にする。
    function updateClamped() {
        var toClamp = [];
        var toUnclamp = [];

        // 1パス目：読み取りのみ（縦方向：一覧画面のセル内容）
        $('td .grid-title-body, td .notes').each(function () {
            if (this.scrollHeight > this.clientHeight) {
                toClamp.push(this);
            } else {
                toUnclamp.push(this);
            }
        });

        // 1パス目：読み取りのみ（横方向：カレンダー画面の祝日名）
        $('td .holiday-name').each(function () {
            if (this.scrollWidth > this.clientWidth) {
                toClamp.push(this);
            } else {
                toUnclamp.push(this);
            }
        });

        // 2パス目：書き込みのみ
        $(toClamp).addClass('is-clamped');
        $(toUnclamp).removeClass('is-clamped');
    }

    updateClamped();

    // 以降の一回限りのセットアップ（要素生成・イベント登録・監視開始）は
    // このスクリプト自体がpjax遷移のたびに再実行される可能性があるため、既に初期化済みなら二重に行わない
    window.once('tooltip', function () {

    // pjax遷移・グリッドの並び替え/ページング等でDOMが更新されるたびに再判定する
    $(document).on('pjax:complete', updateClamped);

    window.__pleasanterWatch(updateClamped, { delay: 50, guard: 'tooltip' });

    function tooltipText($td) {
        var $source = $td.find('.grid-title-body.is-clamped, .notes.is-clamped, .holiday-name.is-clamped').first();
        if (!$source.length) return '';
        return $source.text().trim();
    }

    // js/common/hover_popup.js（manifestでこのファイルより先に読まれる）が
    // 表示・追従・遅延非表示を面倒見る
    window.createHoverPopup('list-tooltip', '<div id="list-tooltip"></div>', 'td', {
        offsetX: 12,
        offsetY: 12,
        hideDelay: 300,
        onEnter: function ($popup, $td) {
            var text = tooltipText($td);
            if (!text) { return false; }
            $popup.text(text);
        }
    });
    });
});
})();
