// ===============================
// 保存ボタンの多重クリック防止（新規作成・編集画面）
//
// #CreateCommand / #UpdateCommand クリック直後に一時的に disabled にする。
// disabled な要素はブラウザがclickイベント自体を発火しないため、
// 連打による二重送信をシンプルかつ確実に防げる。
//
// ⚠️ 保存に失敗してもページ遷移しないケース（バリデーションエラー等）で
// ボタンが押せないまま固まらないよう、SAFETY_TIMEOUT_MS後に強制的に
// 解除するセーフティネットを設けている。正常時は保存後にページが
// 遷移/再読み込みされるため、このタイムアウトが働く前提が実質無くなる。
// ===============================
(function () {
    'use strict';

    var SAFETY_TIMEOUT_MS = 8000;

    if (window.__preventDoubleSubmitBound) { return; }
    window.__preventDoubleSubmitBound = true;

    $(document).on('click', '#CreateCommand, #UpdateCommand', function () {
        var $btn = $(this);
        if ($btn.prop('disabled')) { return; }

        // disabled化前の0ms間に連打されると安全解除タイマーが複数生成されてしまうため、
        // 既存のタイマーがあれば解除してから積み直す
        var existingTimer = $btn.data('preventDoubleSubmitTimer');
        if (existingTimer) { clearTimeout(existingTimer); }

        $btn.addClass('is-submitting');

        setTimeout(function () {
            $btn.prop('disabled', true);
        }, 0);

        var safetyTimer = setTimeout(function () {
            $btn.removeClass('is-submitting').removeData('preventDoubleSubmitTimer');
            // lock_save_during_upload.js によるアップロード中ロックがあれば解除しない
            // （そちらのMutationObserverがアップロード終了時に改めて解除する）
            if (!$btn.hasClass('is-upload-locked')) {
                $btn.prop('disabled', false);
            }
        }, SAFETY_TIMEOUT_MS);
        $btn.data('preventDoubleSubmitTimer', safetyTimer);
    });
})();
