// ===============================
// 一覧画面：行の交互色分け（ゼブラストライプ）判定
//
// CSSの :nth-child(even) は「親要素の全ての子要素」の中での位置を数えるため、
// グループ化表示等で .grid-row 以外の <tr>（見出し行等）が混ざっていると
// 縞模様がズレる可能性がある。そのため、.grid-row のみを対象に数え直し、
// is-even-row クラスを付与する（css/common/zebra_stripe.css 側で参照）。
// ===============================
(function () {
    'use strict';

    function applyStripes() {
        $('.grid').each(function () {
            $(this).find('> tbody > tr.grid-row, tbody > tr.grid-row').each(function (index) {
                $(this).toggleClass('is-even-row', index % 2 === 1);
            });
        });
    }

    applyStripes();

    if (!window.__zebraStripeBound) {
        window.__zebraStripeBound = true;

        $(document).on('pjax:complete', applyStripes);

        var debounceTimer = null;
        var observer = new MutationObserver(function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyStripes, 50);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
