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
    // 今回のデバウンス期間中に追加された要素（Element）の一覧をfnの引数として渡す。
    // fn側が対応していれば、document全体ではなくこれらの要素配下だけを走査してコストを下げられる
    // （未対応のfnは引数を無視するだけで従来どおり全体を走査すれば良く、後方互換）。
    function runSubscriber(s) {
        if (observer) { observer.disconnect(); }
        var changedRoots = s.pendingAdded;
        s.pendingAdded = [];
        try {
            s.fn(changedRoots);
        } catch (e) {
            console.warn("[dom_watcher] 購読者の実行に失敗しました", s.guard || s.fn, e);
        } finally {
            reobserve();
        }
    }

    // mutationがsのroot配下（またはroot自身）に関係するかどうか。
    // target・追加/削除されたノードのいずれかがrootにマッチ／root内にあれば関係ありとみなす。
    function isRelevant(mutation, rootSelector) {
        function matches(node) {
            if (!node || node.nodeType !== 1) { return false; }
            if (node.matches && node.matches(rootSelector)) { return true; }
            if (node.closest && node.closest(rootSelector)) { return true; }
            if (node.querySelector && node.querySelector(rootSelector)) { return true; }
            return false;
        }
        if (matches(mutation.target)) { return true; }
        for (var i = 0; i < mutation.addedNodes.length; i++) {
            if (matches(mutation.addedNodes[i])) { return true; }
        }
        for (var j = 0; j < mutation.removedNodes.length; j++) {
            if (matches(mutation.removedNodes[j])) { return true; }
        }
        return false;
    }

    function onMutation(mutations) {
        subscribers.forEach(function (s) {
            if (s.root) {
                var relevant = mutations.some(function (m) { return isRelevant(m, s.root); });
                if (!relevant) { return; }
            }
            mutations.forEach(function (m) {
                for (var i = 0; i < m.addedNodes.length; i++) {
                    var node = m.addedNodes[i];
                    if (node.nodeType === 1) { s.pendingAdded.push(node); }
                }
            });
            clearTimeout(s.timer);
            s.timer = setTimeout(function () { runSubscriber(s); }, s.delay);
        });
    }

    /**
     * document.body配下のDOM変更を監視し、変更があったら（デバウンス後に）fnを呼ぶ。
     * fnは第1引数として、直近のデバウンス期間中に追加されたElementの配列を受け取れる
     * （対応する場合、document全体ではなくこの配列配下だけを走査してコストを下げられる。
     * 使わないfnは引数を無視すればよく後方互換）。
     * @param {Function} fn 実行する処理
     * @param {Object} [options]
     * @param {number} [options.delay=50] デバウンス時間(ms)
     * @param {string} [options.guard] 二重登録防止用の一意な名前
     * @param {boolean} [options.attributes=false] 属性変更も監視するか
     * @param {string[]} [options.attributeFilter] 監視する属性名（省略時は全属性）
     * @param {string} [options.root] このセレクタに一致/該当する要素が絡む変更のときだけfnを呼ぶ（省略時は従来どおり全変更で呼ぶ）
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
            root: options.root || null,
            timer: null,
            pendingAdded: []
        });

        if (!observer) {
            observer = new MutationObserver(onMutation);
        }
        reobserve();
    };
})();
