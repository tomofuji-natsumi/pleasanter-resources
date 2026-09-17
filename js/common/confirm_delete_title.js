// ===============================
// 削除確認ダイアログの具体化（編集画面）
//
// #DeleteCommand クリック時、Pleasanter標準の確認ダイアログ（data-confirm属性
// による汎用メッセージ）の代わりに、対象レコードのタイトルを含めた
// 独自の確認ダイアログを表示する。
//
// ⚠️ 重要・要検証:
// - Pleasanter標準の確認処理がどのタイミング・方式（window.confirm/独自モーダル等）
//   で動くのか、このリポジトリ内では未確認。本スクリプトは「#DeleteCommandの
//   クリックをcaptureフェーズで横取りし、標準の確認処理より先に独自ダイアログを
//   出す」という前提で実装している。
// - 独自ダイアログで「OK」を選んだ場合のみ、__customConfirmedフラグを立てて
//   再度クリックを発火させ、標準の削除処理（$p.send等）に処理を委ねる。
//   このフラグが立っていない限り、絶対に削除処理へは進ませない設計にしている。
// - 開発環境で「キャンセルした場合に本当に削除されないか」「OKの場合に確実に
//   削除されるか」の両方を必ず確認してから使用すること。
// ===============================
(function () {
    'use strict';

    if (window.__confirmDeleteTitleBound) { return; }
    window.__confirmDeleteTitleBound = true;

    document.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('#DeleteCommand') : null;
        if (!btn) { return; }

        // 独自ダイアログでOKを選んだ後の再クリックはそのまま素通しする
        if (btn.__customConfirmed) {
            btn.__customConfirmed = false;
            return;
        }

        // 標準の確認処理より先に横取りする
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }

        var titleEl = document.getElementById('Title');
        var titleValue = titleEl && 'value' in titleEl ? String(titleEl.value || '').trim() : '';
        var message = titleValue
            ? '「' + titleValue + '」を削除します。よろしいですか？'
            : 'このレコードを削除します。よろしいですか？';

        if (window.confirm(message)) {
            btn.__customConfirmed = true;
            btn.click();
        }
    }, true);
})();
