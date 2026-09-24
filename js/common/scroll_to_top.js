// ===============================
// 一覧トップへ戻るボタン
//
// 行数が多い一覧画面で下までスクロールした際、画面右下に
// 「トップへ戻る」ボタンを表示する。
//
// マニフェスト未登録の個別貼り付け用ファイル。js/common/utils.js（manifestのAllに
// 登録済みで全画面で先に読まれる）が定義するwindow.ensureSingleton/window.onceに依存する。
// ===============================
(function () {
    'use strict';

    var SCROLL_SHOW_THRESHOLD = 400;

    function ensureButton() {
        var existed = $('#scroll-to-top').length > 0;
        var $btn = window.ensureSingleton('scroll-to-top',
            '<button type="button" id="scroll-to-top" aria-label="トップへ戻る"><span class="material-symbols-outlined">arrow_upward</span></button>'
        );
        if (existed) { return $btn; }

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

    updateVisibility();

    window.once('scrollToTop', function () {
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
    });
})();
