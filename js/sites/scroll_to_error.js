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

    // 現在実際にエラーメッセージを表示している label.error だけを取得する。
    // 非アクティブタブ内の項目も拾うため:visibleでは絞り込めないが、
    // Pleasanterは項目が有効になった後もlabel.error要素自体は空文字のままDOMに
    // 残すことがあるため、代わりにテキスト内容の有無で判定する
    // （空文字のまま残ったものまで拾うと、実際にはエラーの無いタブへ
    // 一瞬切り替わってから戻る、といった誤動作の原因になる）
    function getActiveErrors() {
        return $('label.error').filter(function () {
            return $.trim(this.textContent) !== '';
        });
    }

    function markErrorFields() {
        clearErrorMarks();

        getActiveErrors().each(function () {
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
        // 非アクティブなタブの中の項目は:visibleでは拾えないため、getActiveErrors()で
        // 全体から探し、対象タブが非アクティブならこちらでアクティブ化してから
        // スクロール・フォーカスする
        var $error = getActiveErrors().first();
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

    // markErrorFields（ハイライト付け替えのみ）はDOM変更のたびに何度実行しても副作用が無いため、
    // dom_watcher.jsの常時監視に乗せてよい。
    // 一方scrollToFirstError（スクロール・フォーカス・タブ切替）はtabs('option','active',...)自体が
    // label.errorを含むタブパネルの属性・表示状態を変える＝常時監視のroot条件に再度マッチしてしまい、
    // 「切り替えたタブがまた監視に引っかかって呼び直される」無限の呼び直しループ
    // （体感上は「一瞬別タブへ移動してから最初のタブに戻る」ような挙動になる）を起こすため、
    // 常時監視には乗せず、保存クリックのたびに一度だけ実行する一回限りの監視で待ち受ける。
    window.__pleasanterWatch(markErrorFields, {
        delay: 150,
        guard: 'markErrorFields',
        root: 'label.error'
    });

    // 保存クリック後、Pleasanter自身のバリデーションによるDOM変更（エラーラベルの生成・
    // 末尾フィールドへのfocus等）が一定時間止まるのを待ってから、最初のエラーへ
    // スクロール・フォーカス・タブ切替を1回だけ行う。setTimeout固定だと、Pleasanter側の
    // 処理がその後も続いていた場合に上書きされてしまうため、監視を使う。
    function waitForValidationThenScroll() {
        var timer = null;
        var observer = new MutationObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(finish, 150);
        });

        function finish() {
            observer.disconnect();
            scrollToFirstError();
        }

        observer.observe(document.body, { childList: true, subtree: true });
        // 保存後にDOM変更が全く起きないケースの保険
        timer = setTimeout(finish, 150);
    }

    $(document).on('click', '#CreateCommand, #UpdateCommand', waitForValidationThenScroll);

    // ページ読み込み時点で既にエラーが表示されているケース（サーバー側バリデーション等）にも対応
    markErrorFields();
    scrollToFirstError();
})();
