// ===============================
// 一覧トップへ戻るボタン
//
// 行数が多い一覧画面で下までスクロールした際、画面右下に
// 「トップへ戻る」ボタンを表示する。
// ===============================
(function () {
    'use strict';

    var SCROLL_SHOW_THRESHOLD = 400;

    if (window.__scrollToTopBound) { return; }
    window.__scrollToTopBound = true;

    function ensureButton() {
        var $btn = $('#scroll-to-top');
        if ($btn.length) { return $btn; }

        $btn = $('<button type="button" id="scroll-to-top" aria-label="トップへ戻る"><span class="material-symbols-outlined">arrow_upward</span></button>')
            .appendTo('body');

        $btn.on('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        return $btn;
    }

    function updateVisibility() {
        var $grid = $('#Grid');
        if (!$grid.length) {
            $('#scroll-to-top').removeClass('is-visible');
            return;
        }

        var $btn = ensureButton();
        var isVisible = window.scrollY > SCROLL_SHOW_THRESHOLD;
        $btn.toggleClass('is-visible', isVisible);
        $grid.toggleClass('has-scroll-to-top-space', isVisible);
    }

    // scrollイベントは高頻度で発火するため、rAFで間引く
    var ticking = false;
    $(window).on('scroll', function () {
        if (ticking) { return; }
        ticking = true;
        window.requestAnimationFrame(function () {
            updateVisibility();
            ticking = false;
        });
    });

    $(document).on('pjax:complete', updateVisibility);
    updateVisibility();
})();
