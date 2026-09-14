// ===============================
// 添付ファイルのドラッグ&ドロップ並べ替え
//
// Pleasanter標準では添付ファイルの表示順は登録順で固定だが、
// 各アイテムをドラッグして並べ替えられるようにし、隠しフィールド
// （control-attachments、JSON配列）の順序も並べ替え後の見た目に合わせて更新する。
// ===============================
(function () {
    'use strict';

    var ITEMS_SELECTOR = '.control-attachments-items';
    var ITEM_SELECTOR = '.control-attachments-item';

    if (window.__attachmentReorderBound) { return; }
    window.__attachmentReorderBound = true;

    var $dragging = null;

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

    function markDraggable() {
        $(ITEM_SELECTOR).each(function () {
            if (this.getAttribute('draggable') !== 'true') {
                this.setAttribute('draggable', 'true');
            }
            // ファイル名リンク（プレビュー/ダウンロード）や削除アイコン、
            // ダウンロードボタン上からドラッグが始まると、クリック操作
            // （attachment_preview.js等）と干渉するため、これらの子要素は
            // 明示的にドラッグ対象から外す
            $(this).find('a.file-name, .delete-file, .attachment-download-button').each(function () {
                if (this.getAttribute('draggable') !== 'false') {
                    this.setAttribute('draggable', 'false');
                }
            });
        });
    }

    $(document).on('dragstart', ITEM_SELECTOR, function (e) {
        $dragging = $(this);
        this.classList.add('is-dragging');
        if (e.originalEvent && e.originalEvent.dataTransfer) {
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('text/plain', this.id);
        }
    });

    $(document).on('dragend', ITEM_SELECTOR, function () {
        if ($dragging) {
            $dragging[0].classList.remove('is-dragging');
            syncHiddenInputOrder($dragging.closest(ITEMS_SELECTOR));
        }
        $dragging = null;
    });

    // dragoverは移動中ずっと高頻度で発火するため、ここではドロップを
    // 許可するpreventDefaultのみ行う。実際の並べ替えはdragenter（対象要素に
    // 入った瞬間の1回のみ発火）で行い、細かい前後入れ替わり（ジッター）を防ぐ
    $(document).on('dragover', ITEM_SELECTOR, function (e) {
        e.preventDefault();
    });

    $(document).on('dragenter', ITEM_SELECTOR, function (e) {
        if (!$dragging || $dragging[0] === this) { return; }
        // 同じ添付欄（items）内での並べ替えのみ許可する
        if (!$dragging.closest(ITEMS_SELECTOR).is($(this).closest(ITEMS_SELECTOR))) { return; }

        e.preventDefault();

        var rect = this.getBoundingClientRect();
        var isAfter = (e.originalEvent.clientY - rect.top) > rect.height / 2;
        var $target = $(this);

        if (isAfter) {
            $target.after($dragging);
        } else {
            $target.before($dragging);
        }
    });

    $(document).on('pjax:complete', markDraggable);

    var debounceTimer = null;
    var observer = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(markDraggable, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    markDraggable();
})();
