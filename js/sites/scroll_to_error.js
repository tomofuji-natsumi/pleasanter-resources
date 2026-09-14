// ===============================
// 必須未入力項目へのスクロール誘導（新規作成・編集画面）
//
// Pleasanterはバリデーションエラー時、対象フィールドの近くに
// <label class="error" for="対象のid">を生成する（css/common/base.css の
// label.error 定義済みスタイルより確認）。この仕組みを利用し、
// 保存操作の直後にエラー箇所まで自動スクロール＋フォーカスする。
// ===============================
(function () {
    'use strict';

    function scrollToFirstError() {
        var $error = $('label.error:visible').first();
        if (!$error.length) { return; }

        var forId = $error.attr('for');
        var target = forId ? document.getElementById(forId) : null;
        var scrollTarget = target || $error[0];

        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (target && $(target).is(':visible')) {
            $(target).trigger('focus');
        }
    }

    if (window.__scrollToErrorBound) { return; }
    window.__scrollToErrorBound = true;

    // 保存操作の直後、バリデーションが走った後にエラー有無を確認する
    $(document).on('click', '#CreateCommand, #UpdateCommand', function () {
        setTimeout(scrollToFirstError, 100);
    });

    // ページ読み込み時点で既にエラーが表示されているケース（サーバー側バリデーション等）にも対応
    scrollToFirstError();
})();
