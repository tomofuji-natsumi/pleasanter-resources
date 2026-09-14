// ===============================
// 添付ファイルの長押しで並べ替え
//
// Pleasanter標準では添付ファイルの表示順は登録順で固定だが、各アイテムを
// 長押ししてから掴んで並べ替えられるようにする。単純なクリックは
// これまで通りプレビュー（attachment_preview.js）が開く。
// 並べ替え後は、隠しフィールド（control-attachments、JSON配列）の順序も
// 見た目に合わせて更新する。
//
// HTML5 Drag & Drop APIは「押した瞬間から動くと即ドラッグ扱い」になり
// 単純クリックと衝突しやすいため使わず、pointerdown起点の自前の長押し
// 判定（一定時間・一定距離以内で押し続けたら掴んだとみなす）で実装している。
// ===============================
(function () {
    'use strict';

    var ITEMS_SELECTOR = '.control-attachments-items';
    var ITEM_SELECTOR = '.control-attachments-item';
    var NON_DRAGGABLE_SELECTOR = 'a.file-name, .delete-file, .attachment-download-button';

    var LONG_PRESS_MS = 350;
    var MOVE_CANCEL_THRESHOLD = 6; // px。これ以上動いたら長押し判定を中断する

    if (window.__attachmentReorderBound) { return; }
    window.__attachmentReorderBound = true;

    function getHiddenInput($items) {
        return $items.closest('.container-normal').find('input.control-attachments');
    }

    function syncHiddenInputOrder($items) {
        var $input = getHiddenInput($items);
        if (!$input.length) { return; }

        var data;
        try {
            data = JSON.parse($input.val() || '[]');
        } catch (e) {
            return;
        }
        if (!Array.isArray(data)) { return; }

        var order = $items.find(ITEM_SELECTOR).map(function () {
            return this.id.toUpperCase();
        }).get();

        data.sort(function (a, b) {
            var guidA = String(a.Guid || '').toUpperCase();
            var guidB = String(b.Guid || '').toUpperCase();
            return order.indexOf(guidA) - order.indexOf(guidB);
        });

        $input.val(JSON.stringify(data)).trigger('change');
    }

    function getPoint(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    var pressTimer = null;
    var pressOrigin = null;
    var $pressItem = null;
    var $dragging = null;
    var suppressNextClick = false;

    function clearPress() {
        clearTimeout(pressTimer);
        pressTimer = null;
        pressOrigin = null;
        $pressItem = null;
    }

    function startDragging($item) {
        $dragging = $item;
        $item.addClass('is-dragging');
        suppressNextClick = true;
    }

    function handleDragMove(e) {
        var point = getPoint(e);
        var el = document.elementFromPoint(point.x, point.y);
        if (!el) { return; }

        var $target = $(el).closest(ITEM_SELECTOR);
        if (!$target.length || $target.is($dragging)) { return; }
        if (!$dragging.closest(ITEMS_SELECTOR).is($target.closest(ITEMS_SELECTOR))) { return; }

        var rect = $target[0].getBoundingClientRect();
        var isAfter = (point.y - rect.top) > rect.height / 2;

        if (isAfter) {
            $target.after($dragging);
        } else {
            $target.before($dragging);
        }
    }

    function finishDragging() {
        $dragging.removeClass('is-dragging');
        syncHiddenInputOrder($dragging.closest(ITEMS_SELECTOR));
        $dragging = null;
    }

    function onPressStart(e) {
        if (e.target.closest && e.target.closest(NON_DRAGGABLE_SELECTOR)) { return; }

        var $item = $(e.target).closest(ITEM_SELECTOR);
        if (!$item.length) { return; }

        clearPress();
        pressOrigin = getPoint(e);
        $pressItem = $item;

        pressTimer = setTimeout(function () {
            pressTimer = null;
            startDragging($pressItem);
        }, LONG_PRESS_MS);
    }

    function onPressMove(e) {
        if (pressTimer && pressOrigin) {
            var point = getPoint(e);
            var movedX = Math.abs(point.x - pressOrigin.x);
            var movedY = Math.abs(point.y - pressOrigin.y);
            if (movedX > MOVE_CANCEL_THRESHOLD || movedY > MOVE_CANCEL_THRESHOLD) {
                clearPress();
            }
        }

        if ($dragging) {
            e.preventDefault();
            handleDragMove(e);
        }
    }

    function onPressEnd() {
        clearPress();
        if ($dragging) {
            finishDragging();
        }
    }

    document.addEventListener('mousedown', onPressStart, true);
    document.addEventListener('touchstart', onPressStart, true);

    document.addEventListener('mousemove', onPressMove, true);
    document.addEventListener('touchmove', onPressMove, { capture: true, passive: false });

    document.addEventListener('mouseup', onPressEnd, true);
    document.addEventListener('touchend', onPressEnd, true);
    document.addEventListener('touchcancel', onPressEnd, true);

    // 長押しして並べ替えた直後に発生するclick（プレビューが開く等）を
    // 1回だけ無効化する
    document.addEventListener('click', function (e) {
        if (!suppressNextClick) { return; }
        suppressNextClick = false;

        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
    }, true);
})();
