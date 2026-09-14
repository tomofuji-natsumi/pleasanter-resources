// ===============================
// CSVエクスポート中の進捗フィードバック
//
// #DoExport クリック時、ファイル生成中であることを示すオーバーレイを表示する。
//
// ⚠️ CSVエクスポートはブラウザの通常のダウンロード機構（フォーム送信等）に
// 委ねられており、「生成完了」を示すJS側のイベントが存在しない（未検証）。
// そのため、#ExportSelectorDialog が閉じたタイミング、または
// SAFETY_TIMEOUT_MS経過のどちらか早い方でオーバーレイを消す方式にしている。
// ===============================
(function () {
    'use strict';

    var SAFETY_TIMEOUT_MS = 10000;

    if (window.__exportProgressBound) { return; }
    window.__exportProgressBound = true;

    function ensureOverlay() {
        var $overlay = $('#export-progress-overlay');
        if ($overlay.length) { return $overlay; }

        return $(
            '<div id="export-progress-overlay">' +
                '<div class="export-progress-box">' +
                    '<span class="export-progress-spinner"></span>' +
                    '<span>エクスポート中です。しばらくお待ちください。</span>' +
                '</div>' +
            '</div>'
        ).appendTo('body');
    }

    function hideOverlay() {
        $('#export-progress-overlay').removeClass('is-visible');
    }

    $(document).on('click', '#DoExport', function () {
        var $overlay = ensureOverlay();
        $overlay.addClass('is-visible');

        var hideTimer = setTimeout(hideOverlay, SAFETY_TIMEOUT_MS);

        // ダイアログが閉じた時点でエクスポート操作自体は終わっているとみなす。
        // jQuery UIのダイアログは中身自体ではなく親のラッパー（.ui-dialog）側の
        // 表示状態を変更して閉じる実装が多いため、#ExportSelectorDialog自身の
        // 属性だけでなく document.body 全体のDOM変化を監視し、is(':visible') で
        // 実際の表示状態（祖先要素の非表示も含む）を判定する。
        var $dialog = $('#ExportSelectorDialog');
        if ($dialog.length) {
            var dialogObserver = new MutationObserver(function () {
                if (!$dialog.is(':visible')) {
                    clearTimeout(hideTimer);
                    hideOverlay();
                    dialogObserver.disconnect();
                }
            });
            dialogObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    });
})();
