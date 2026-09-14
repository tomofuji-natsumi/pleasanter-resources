// ===============================
// 検索欄へのショートカットキー（一覧画面）
//
// "/" キー押下で検索/絞り込み欄にフォーカスする。
//
// 検索欄は #ViewFilters_Search（絞り込みパネル内のキーワード検索欄、実機DOM確認済み）。
// ただしこの要素は #ViewFilters が開いている（閉じていない）ときしかフォーカスしても
// 実際には見えない可能性があるため、フォーカス前に #ViewFilters を開く。
// ===============================
(function () {
    'use strict';

    var SEARCH_INPUT_SELECTOR = '#ViewFilters_Search';

    if (window.__searchShortcutBound) { return; }
    window.__searchShortcutBound = true;

    $(document).on('keydown', function (e) {
        if (e.key !== '/') { return; }

        // 入力欄でのタイピング中（URLや日付等に"/"を含む場合）は妨げない
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) { return; }

        var $search = $(SEARCH_INPUT_SELECTOR);
        if (!$search.length) {
            console.warn('[検索ショートカット] 検索欄が見つかりませんでした。SEARCH_INPUT_SELECTORの見直しが必要です。');
            return;
        }

        // "/" 自体が入力されないようにする（Firefoxのクイック検索起動の抑制も兼ねる）
        e.preventDefault();

        if ($search.is(':visible')) {
            $search.trigger('focus').select();
            return;
        }

        // 絞り込みパネルが閉じている場合は開いてからフォーカスする
        var $expand = $('#ExpandViewFilters');
        if ($expand.length && $expand.is(':visible')) {
            $expand.trigger('click');
            setTimeout(function () {
                $search.trigger('focus').select();
            }, 200);
        } else {
            console.warn('[検索ショートカット] 絞り込みパネルを開けませんでした（#ExpandViewFiltersが見つからない）。');
        }
    });
})();
