// ===============================
// 添付ファイルアップロード中の保存ボタン制御
//
// 添付欄のアップロード中は `<div id="{列名}.status">`（進捗バー+キャンセルリンク）
// が表示される（例: #AttachmentsA.status）。列名は列ごとに異なるため、
// 属性セレクタ [id$=".status"] で列名に依存せず汎用的に検知する。
//
// アップロード中の進捗バー（内側divのstyle="width:...px"）は継続的に更新される
// ため、MutationObserverが高頻度で再評価され、他のスクリプト
// （prevent_double_submit.js の再有効化タイマー等）が保存ボタンを
// 先に有効化してしまっても、直後の再評価で確実に無効化し直される。
// ===============================
(function () {
    'use strict';

    var LOCK_MESSAGE = 'ファイルのアップロード完了までお待ちください';

    function isUploading() {
        return $('[id$=".status"]').filter(function () {
            return $(this).is(':visible');
        }).length > 0;
    }

    function updateButtons() {
        var uploading = isUploading();
        var $buttons = $('#CreateCommand, #UpdateCommand');

        $buttons.prop('disabled', uploading);
        $buttons.toggleClass('is-upload-locked', uploading);
        $buttons.attr('title', uploading ? LOCK_MESSAGE : '');
    }

    if (!window.__lockSaveDuringUploadBound) {
        window.__lockSaveDuringUploadBound = true;

        var debounceTimer = null;
        var observer = new MutationObserver(function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateButtons, 50);
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    updateButtons();
})();
