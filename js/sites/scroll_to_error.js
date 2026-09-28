// ===============================
//
// 必須未入力項目へのスクロール誘導＋視認性強化（新規作成・編集画面）
//
// Pleasanterはバリデーションエラー時、対象フィールドの近くに<label class="error" for="対象のid">を生成する
// （css/common/base.css の label.error 定義済みスタイルより確認）。
// この仕組みを利用し、保存操作の直後に
//   1. 最初のエラー項目まで自動スクロール＋フォーカス
//   2. どの項目がエラーかひと目で分かるよう、入力欄自体に赤背景を付与（css/common/editor_layout.css の .field-has-error）
//      クリックで一時的に非表示（.field-error-dismissed）、入力で完全に解除する
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

    // 保存クリック後、Pleasanter自身のバリデーション処理（エラーラベルの生成・タブ切替・末尾
    // フィールドへのfocus等）が終わったら、最初のエラーへスクロール・フォーカス・タブ切替を1回だけ行う。
    //
    // ⚠️ 以前はsetTimeoutで固定時間（200ms）待ってから実行していたが、これだと
    //   1. Pleasanter自身がエラーの中の最後の項目のタブへ切り替える（実機で確認: 例えばタブ1を
    //      見ている状態で保存すると、一瞬タブ2に切り替わる）
    //   2. ブラウザがその状態を描画する
    //   3. 200ms後にこちらの処理が動き、正しいタブ（最初にエラーがあるタブ）へ戻す
    //   4. ブラウザがもう一度描画する
    // という2回描画になり、「一瞬別タブが見えてから戻る」チラつきの原因になっていた（実機確認済み）。
    //
    // MutationObserverのコールバックはマイクロタスクとして、現在の同期処理が終わった直後・
    // ブラウザが再描画する前に呼ばれる仕様のため、setTimeoutを使わずここで直接エラー内容を
    // 確定させて操作すれば、Pleasander自身の変更とこちらの訂正が同じ描画に収まり、
    // 中間状態（誤ったタブ）が画面に出ないまま最終状態だけが表示される。
    // そのため、最初に検知したDOM変更（＝Pleasanter側の一連の処理が生んだひとかたまりの変更）
    // だけを見て即座に確定させ、確認後はただちにdisconnectして以降のDOM変更（ユーザーの
    // 手動タブ操作等）には反応しないようにする（タブ移動が固まる不具合の再発防止）。
    $(document).on('click', '#CreateCommand, #UpdateCommand', function () {
        var settled = false;
        var fallbackTimer;

        function finish() {
            if (settled) { return; }
            settled = true;
            clearTimeout(fallbackTimer);
            observer.disconnect();
            markErrorFields();
            scrollToFirstError();
        }

        var observer = new MutationObserver(finish);
        observer.observe(document.body, { childList: true, subtree: true });

        // 何らかの事情でDOM変更が観測できなかった場合の保険（保存成功等で画面遷移した場合など）
        fallbackTimer = setTimeout(finish, 3000);
    });

    // ページ読み込み時点で既にエラーが表示されているケース（サーバー側バリデーション等）にも対応
    markErrorFields();
    scrollToFirstError();

    // ハイライトの解除操作は、入力欄そのもの（ラベル文字列やフィールドの余白は対象外）への
    // 操作に限定する。.field全体をクリック対象にすると、エラーメッセージや項目名ラベルを
    // クリックしただけでも解除されてしまい、「クリック＝入力欄を操作した」という意図から外れるため
    var ERROR_CONTROL_SELECTOR =
        '.field-has-error .field-control input, ' +
        '.field-has-error .field-control select, ' +
        '.field-has-error .field-control textarea, ' +
        '.field-has-error .control-dropdown, ' +
        '.field-has-error .ui-widget.ui-state-default.ui-multiselect, ' +
        '.field-has-error .check-option .check-icon';

    // クリック: ハイライトを一時的に非表示にする（エラー追跡自体は.field-has-errorとして
    // 保持したままなので、何も修正せず離れた場合は次回の保存クリック時に見た目が復活する）
    $(document).on('click', ERROR_CONTROL_SELECTOR, function () {
        $(this).closest('.field-has-error').addClass('field-error-dismissed');
    });

    // 入力: Pleasanter側の再検証（blur等）を待たず、その場で完全に解除する。
    // ただし実際にはまだ不正な値のままのケースもあるため、ここでの解除はあくまで即時の
    // 見た目のフィードバックであり、最終的な正誤判定は保存クリック時のmarkErrorFieldsが行う
    $(document).on('input change', ERROR_CONTROL_SELECTOR, function () {
        $(this).closest('.field-has-error').removeClass('field-has-error field-error-dismissed');
    });
})();
