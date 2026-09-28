// ===============================
// 一覧から戻った際のスクロール位置復元
//
// 一覧画面（#Grid）のスクロール位置をURLごとにsessionStorageへ保存し、
// 詳細画面等から一覧に戻ってきた際、離れる前の位置まで自動でスクロールする。
// ===============================
(function () {
    'use strict';

    var STORAGE_PREFIX = 'gridScrollPosition:';

    if (window.__restoreScrollPositionBound) { return; }
    window.__restoreScrollPositionBound = true;

    function storageKey() {
        return STORAGE_PREFIX + location.pathname + location.search;
    }

    function saveScrollPosition() {
        if (!$('#Grid').length) { return; }
        try {
            sessionStorage.setItem(storageKey(), String(window.scrollY));
        } catch (e) { /* プライベートモード等でsessionStorageが使えない場合は無視 */ }
    }

    function restoreScrollPosition() {
        if (!$('#Grid').length) { return; }

        // バリデーションエラー誘導（scroll_to_error.js）との競合を避けるため、
        // エラー表示中はスクロール位置の復元を行わない
        if ($('label.error:visible').length) { return; }

        var saved;
        try {
            saved = sessionStorage.getItem(storageKey());
        } catch (e) {
            return;
        }
        if (saved === null) { return; }

        var top = parseInt(saved, 10);
        if (isNaN(top)) { return; }

        // pjax完了直後はレイアウト確定前のことがあり、1回のrAFでは文書の高さが
        // まだ足りずscrollToが暗黙にクランプされ復元位置がずれることがある（断続再現型）。
        // 数フレームに渡り、目標位置までスクロール可能になるまでリトライする
        var RETRY_FRAMES = 10;
        var attempt = 0;
        function tryRestore() {
            window.scrollTo(0, top);
            attempt++;
            var reachedTarget = Math.abs(window.scrollY - top) < 1;
            var maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
            var targetIsReachable = top <= maxScrollable + 1;
            if (!reachedTarget && targetIsReachable && attempt < RETRY_FRAMES) {
                window.requestAnimationFrame(tryRestore);
            }
        }
        window.requestAnimationFrame(tryRestore);
    }

    // scrollイベントは高頻度で発火するため、rAFで間引く
    var ticking = false;
    $(window).on('scroll', function () {
        if (ticking) { return; }
        ticking = true;
        window.requestAnimationFrame(function () {
            saveScrollPosition();
            ticking = false;
        });
    });

    // pjaxで別画面へ離れる直前の位置を確実に保存する
    $(document).on('pjax:send', saveScrollPosition);
    $(window).on('beforeunload', saveScrollPosition);

    $(document).on('pjax:complete', restoreScrollPosition);
    restoreScrollPosition();
})();
