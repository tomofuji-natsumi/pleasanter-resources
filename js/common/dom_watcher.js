// ===============================
// document.body を監視するMutationObserverの集約
//
// 1画面につきdocument.body/subtree:trueのMutationObserverが5〜8個同時稼働していたため、
// 監視対象・購読者リストを1つに集約する（修正項目.md B-2）。
//
// 各購読者のコールバック実行時は、holiday_setting.js:103-114（自身の描画によるDOM変更を
// 検知して無限に再発火する問題への対処）の disconnect() → 実行 → observe() を
// 共通実装としてここに1回だけ持たせる。購読者側は自分のガードを気にせず
// 通常どおりDOMを書き換えてよい。
// ===============================
(function () {
    "use strict";

    if (window.__pleasanterWatch) { return; }

    var subscribers = [];
    var observer = null;
    var guards = {};

    function computeOptions() {
        var opts = { childList: true, subtree: true };
        var needsAttributes = subscribers.some(function (s) { return s.attributes; });
        if (!needsAttributes) { return opts; }

        opts.attributes = true;

        var hasUnfiltered = subscribers.some(function (s) { return s.attributes && !s.attributeFilter; });
        if (hasUnfiltered) { return opts; }

        var filterSet = {};
        subscribers.forEach(function (s) {
            if (s.attributes && s.attributeFilter) {
                s.attributeFilter.forEach(function (name) { filterSet[name] = true; });
            }
        });
        opts.attributeFilter = Object.keys(filterSet);
        return opts;
    }

    function reobserve() {
        if (!observer || !subscribers.length) { return; }
        observer.disconnect();
        observer.observe(document.body, computeOptions());
    }

    // 購読者を1件だけ実行する。実行中は監視を止め、その購読者自身によるDOM変更を
    // 観測対象から外すことで、自己発火の無限ループを防ぐ（holiday_setting.jsと同じ考え方）。
    function runSubscriber(s) {
        if (observer) { observer.disconnect(); }
        try {
            s.fn();
        } catch (e) {
            console.warn("[dom_watcher] 購読者の実行に失敗しました", s.guard || s.fn, e);
        } finally {
            reobserve();
        }
    }

    function onMutation() {
        subscribers.forEach(function (s) {
            clearTimeout(s.timer);
            s.timer = setTimeout(function () { runSubscriber(s); }, s.delay);
        });
    }

    /**
     * document.body配下のDOM変更を監視し、変更があったら（デバウンス後に）fnを呼ぶ。
     * @param {Function} fn 実行する処理
     * @param {Object} [options]
     * @param {number} [options.delay=50] デバウンス時間(ms)
     * @param {string} [options.guard] 二重登録防止用の一意な名前
     * @param {boolean} [options.attributes=false] 属性変更も監視するか
     * @param {string[]} [options.attributeFilter] 監視する属性名（省略時は全属性）
     */
    window.__pleasanterWatch = function (fn, options) {
        if (typeof fn !== "function") { return; }
        options = options || {};

        if (options.guard) {
            if (guards[options.guard]) { return; }
            guards[options.guard] = true;
        }

        subscribers.push({
            fn: fn,
            delay: options.delay || 50,
            attributes: !!options.attributes,
            attributeFilter: options.attributeFilter || null,
            guard: options.guard || null,
            timer: null
        });

        if (!observer) {
            observer = new MutationObserver(onMutation);
        }
        reobserve();
    };
})();
