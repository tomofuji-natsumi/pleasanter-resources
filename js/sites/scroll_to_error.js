// ===============================
//
// 必須未入力項目へのスクロール誘導＋視認性強化（新規作成・編集画面）
//
// Pleasanterはバリデーションエラー時、対象フィールドの近くに<label class="error" for="対象のid">を生成する
// （css/common/base.css の label.error 定義済みスタイルより確認）。
// この仕組みを利用し、保存操作の直後に
//   1. 最初のエラー項目まで自動スクロール＋フォーカス
//   2. どの項目がエラーかひと目で分かるよう、入力欄自体に赤枠を付与（css/common/editor_layout.css の .field-has-error）
//   3. タブ分割された画面でエラーがタブの裏に隠れている場合、該当タブに赤丸バッジを表示（css/common/tabs.css の .ui-tab-has-error）
// を行う。
//
// ===============================
(function () {
    'use strict';

    // 前回マーキング分をクリアしてから再マーキングする（クリアせずに追記すると、
    // 修正済みで解消されたエラーのハイライトが残り続けてしまう）
    function clearErrorMarks() {
        $('.field-has-error').removeClass('field-has-error');
        $('.ui-tab-has-error').removeClass('ui-tab-has-error');
    }

    function markErrorFields() {
        clearErrorMarks();

        $('label.error').each(function () {
            var $error = $(this);
            var forId = $error.attr('for');
            var target = forId ? document.getElementById(forId) : null;

            // 入力欄自体をハイライト。.field（ラベル＋入力欄のグリッド構造）単位で
            // 印を付け、CSS側で内部のinput/select/textarea等の枠線をまとめて変える
            var $field = $error.closest('.field');
            if (!$field.length && target) {
                $field = $(target).closest('.field');
            }
            if ($field.length) {
                $field.addClass('field-has-error');
            }

            // タブ分割画面では、非アクティブタブ内のエラーが見えないため、
            // 該当タブに赤丸バッジを付ける（jQuery UI Tabsの標準構造: li[aria-controls]がパネルidを持つ）
            var $panel = $error.closest('.ui-tabs-panel');
            if ($panel.length && $panel.attr('id')) {
                $panel.closest('.ui-tabs')
                    .find('> .ui-tabs-nav > li[aria-controls="' + $panel.attr('id') + '"]')
                    .addClass('ui-tab-has-error');
            }
        });
    }

    function scrollToFirstError() {
        markErrorFields();

        // label.errorはPleasanterがバリデーション時に全項目分生成するため、非アクティブな
        // タブの中の項目も:hidden化されずDOM上に残る場合がある。そのため最初の1件は
        // :visibleに絞らず全体から探し、対象タブが非アクティブならこちらでアクティブ化してから
        // スクロール・フォーカスする（visibleのみで探すと、先頭のタブに隠れたエラーを
        // 見逃して後続タブの:visibleなエラーに飛んでしまう）
        var $error = $('label.error').first();
        if (!$error.length) { return; }

        var $panel = $error.closest('.ui-tabs-panel');
        if ($panel.length && !$panel.is(':visible')) {
            var $tabs = $panel.closest('.ui-tabs');
            var tabIndex = $tabs.find('> .ui-tabs-nav > li[aria-controls="' + $panel.attr('id') + '"]').index();
            if (tabIndex > -1 && $tabs.tabs) {
                $tabs.tabs('option', 'active', tabIndex);
            }
        }

        var forId = $error.attr('for');
        var target = forId ? document.getElementById(forId) : null;
        var scrollTarget = target || $error[0];

        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (target && $(target).is(':visible')) {
            $(target).trigger('focus');
        }
    }

    // 保存操作の直後、Pleasanter自身のバリデーション処理は各フィールドを順番に検証し、
    // 最後に検証した（＝末尾の）エラー項目にfocusを当てて完了する。固定のsetTimeoutで
    // 先に自分がfocusを当てても、その後にPleasanter側の処理が末尾フィールドへ再focusして
    // 上書きしてしまうため、「label.errorに関するDOM変更が一定時間止まったら実行する」
    // dom_watcher.jsのデバウンス機構を使い、Pleasanter側の処理完了を待ってから実行する。
    window.__pleasanterWatch(scrollToFirstError, {
        delay: 150,
        guard: 'scrollToError',
        root: 'label.error'
    });

    // ページ読み込み時点で既にエラーが表示されているケース（サーバー側バリデーション等）にも対応
    scrollToFirstError();
})();
