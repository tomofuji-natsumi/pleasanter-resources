// ===============================
// カレンダー予定のドラッグ操作無効化
//
// 対象サイトの<script>ブロックで下記のように設定してから、このJSを
// 読み込むことで、条件に応じてドラッグ操作（日付変更）を無効化する。
//
//   <script>
//     window.__calendarDragRestriction = {
//       // true にすると、このサイトの予定は全てドラッグ不可にする
//       // （カレンダー設定の「項目」がUpdatedTime/CreatedTimeの場合を想定）
//       disableAll: false,
//       // 予定のタイトルが以下のいずれかに一致する場合のみドラッグ不可にする
//       // （重複不可項目を持つ等、画面上には見えない条件をこちらで判別できる
//       //   キーワード・正規表現として指定する）
//       titlePatterns: [/種別A/, '特定キーワード']
//     };
//   </script>
//
// ⚠️ 重要・要検証:
// - FullCalendarのインスタンスがJSから直接操作できない（外部に公開されて
//   いない）ため、判定材料は予定のタイトル文字列（title属性/.fc-event-title
//   のテキスト）に限られる。titlePatternsで判別したい条件がある場合、その
//   情報がタイトルに含まれるようカレンダー側の表示設定を調整しておくこと。
// - 「予定をクリックして詳細を開く」動作を壊さないよう、mousedown自体は
//   素通しし、そこから一定以上ポインタが動いた場合のみ移動（ドラッグ）を
//   止める方式にしている。クリック（movementなし）はFullCalendar側に
//   そのまま渡る。それでも内部実装次第で挙動が変わりうるため、開発環境で
//   「ドラッグできないこと」「クリックで詳細が開けること」の両方を必ず
//   確認すること。
// - 対象サイトにのみ読み込むこと（全サイト共通のcommon.js等には含めない）。
// ===============================
(function () {
    'use strict';

    if (window.__calendarDisableDragBound) { return; }
    window.__calendarDisableDragBound = true;

    var EVENT_SELECTOR = '.fc-event-draggable';
    var BLOCKED_CLASS = 'calendar-drag-disabled';
    var MOVE_THRESHOLD = 3; // px。誤差程度の揺れをドラッグ判定させないための遊び

    function getConfig() {
        return window.__calendarDragRestriction || {};
    }

    function matchesPattern(text, pattern) {
        if (pattern instanceof RegExp) { return pattern.test(text); }
        return text.indexOf(String(pattern)) !== -1;
    }

    function isRestricted(el) {
        var config = getConfig();
        if (config.disableAll) { return true; }

        var patterns = config.titlePatterns;
        if (!patterns || !patterns.length) { return false; }

        var text = (el.getAttribute('title') || '') + ' ' + (el.textContent || '');
        return patterns.some(function (pattern) {
            return matchesPattern(text, pattern);
        });
    }

    function markRestrictedEvents() {
        document.querySelectorAll(EVENT_SELECTOR).forEach(function (el) {
            el.classList.toggle(BLOCKED_CLASS, isRestricted(el));
        });
    }

    // クリック（詳細を開く）動作を壊さないよう、mousedown自体は止めない。
    // 対象イベント上でmousedownがあったことだけを記録しておき、一定以上
    // 動いた時点（＝ドラッグ操作とみなせる時点）で初めて止める。
    var pressOrigin = null;

    function getPoint(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function onPressStart(e) {
        var target = e.target.closest ? e.target.closest('.' + BLOCKED_CLASS) : null;
        pressOrigin = target ? getPoint(e) : null;
    }

    function onPressMove(e) {
        if (!pressOrigin) { return; }

        var point = getPoint(e);
        var movedX = Math.abs(point.x - pressOrigin.x);
        var movedY = Math.abs(point.y - pressOrigin.y);
        if (movedX < MOVE_THRESHOLD && movedY < MOVE_THRESHOLD) { return; }

        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
    }

    function onPressEnd() {
        pressOrigin = null;
    }

    document.addEventListener('mousedown', onPressStart, true);
    document.addEventListener('pointerdown', onPressStart, true);
    document.addEventListener('touchstart', onPressStart, true);

    document.addEventListener('mousemove', onPressMove, true);
    document.addEventListener('pointermove', onPressMove, true);
    document.addEventListener('touchmove', onPressMove, true);

    document.addEventListener('mouseup', onPressEnd, true);
    document.addEventListener('pointerup', onPressEnd, true);
    document.addEventListener('touchend', onPressEnd, true);

    $(document).on('pjax:complete', markRestrictedEvents);

    var debounceTimer = null;
    var observer = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(markRestrictedEvents, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    markRestrictedEvents();
})();
