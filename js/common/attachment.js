// ===============================
// 添付ファイルのインライン表示 ＋ ダウンロードボタン
//
// 添付ファイル欄のリンク（プレビュー用の /binaries/{guid}/show、
// ファイル名表示用の /binaries/{guid}/download）は、クリックすると
// 別タブへの遷移やダウンロード（対応アプリの起動）が発生する。
// ブラウザがネイティブに表示できる拡張子の場合のみ既定動作を止め、
// Pleasanter内のオーバーレイに埋め込んだiframeでファイルを表示する。
//
// ファイル名クリックがプレビューに置き換わったことで、これまで通り
// 「ダウンロードだけしたい」操作ができなくなるため、削除アイコンの
// 横に専用のダウンロードボタンを追加する。
// ===============================
(function () {
    'use strict';

    var ITEM_SELECTOR = '.control-attachments-item';
    var DOWNLOAD_BUTTON_SELECTOR = '.attachment-download-button';

    // ブラウザが追加アプリなしでそのまま表示できる拡張子
    var PREVIEWABLE_EXTENSIONS = [
        'pdf',
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg',
        'txt', 'csv', 'json', 'log',
        'mp4', 'webm', 'ogg',
        'mp3', 'wav'
    ];
    var PREVIEWABLE_PATTERN = new RegExp('\\.(' + PREVIEWABLE_EXTENSIONS.join('|') + ')$', 'i');

    if (window.__attachmentPreviewBound) { return; }
    window.__attachmentPreviewBound = true;

    // 同一アイテム内で複数回 a.file-name を探し直さずに済むよう、
    // ダウンロード用リンク・プレビュー用リンクをまとめて1回のlookupで取得する
    function getLinks($item) {
        var $links = $item.find('a.file-name');
        return {
            $download: $links.not('[target]').first(),
            $show: $links.filter('[target="_blank"]').first()
        };
    }

    function getFileName($item) {
        var text = getLinks($item).$download.text() || '';
        // 「ファイル名　(サイズ)」の全角スペース区切りからファイル名部分のみ取り出す
        return text.split('　')[0].trim();
    }

    function getShowUrl($item) {
        return getLinks($item).$show.attr('href');
    }

    function getDownloadUrl($item) {
        return getLinks($item).$download.attr('href');
    }

    function ensureDownloadButtons() {
        $(ITEM_SELECTOR).each(function () {
            var $item = $(this);
            if ($item.find(DOWNLOAD_BUTTON_SELECTOR).length) { return; }

            var $deleteIcon = $item.find('.delete-file').first();
            if (!$deleteIcon.length) { return; }

            $('<div class="ui-icon ui-icon-circle-arrow-s attachment-download-button" title="ダウンロード" draggable="false"></div>')
                .insertBefore($deleteIcon);
        });
    }

    function ensureOverlay() {
        var $overlay = $('#attachment-preview-overlay');
        if ($overlay.length) { return $overlay; }

        $overlay = $(
            '<div id="attachment-preview-overlay">' +
                '<div class="attachment-preview-panel">' +
                    '<div class="attachment-preview-controls">' +
                        '<div class="attachment-preview-download" title="ダウンロード">' +
                            '<span class="ui-icon ui-icon-circle-arrow-s"></span>' +
                        '</div>' +
                        '<div class="attachment-preview-close" title="閉じる">&times;</div>' +
                    '</div>' +
                    '<div class="attachment-preview-spinner"></div>' +
                    '<iframe class="attachment-preview-frame" frameborder="0"></iframe>' +
                '</div>' +
            '</div>'
        ).appendTo('body');

        function close() {
            $overlay.removeClass('is-visible is-loading');
            $overlay.find('.attachment-preview-frame').attr('src', 'about:blank');
            $overlay.removeData('download-url');
        }

        $overlay.on('click', '.attachment-preview-close', close);
        $overlay.on('click', function (e) {
            if (e.target === this) { close(); }
        });
        $overlay.on('click', '.attachment-preview-download', function (e) {
            e.preventDefault();
            triggerDownload($overlay.data('download-url'));
        });
        $overlay.find('.attachment-preview-frame').on('load', function () {
            $overlay.removeClass('is-loading');
        });

        return $overlay;
    }

    function triggerDownload(downloadUrl) {
        if (!downloadUrl) { return; }

        var $tempLink = $('<a></a>', {
            href: downloadUrl,
            download: '',
            rel: 'noopener noreferrer'
        }).appendTo('body');
        $tempLink[0].click();
        $tempLink.remove();
    }

    $(document).on('click', ITEM_SELECTOR, function (e) {
        // ダウンロード/削除ボタン上のクリックはそれぞれの専用処理に任せる
        if (e.target.closest('.attachment-download-button, .delete-file')) { return; }

        // ファイル名以外を含む項目全体のクリックでも、対応形式のプレビュー表示以外
        // 何も起こさない（ダウンロードや別タブでの表示は行わない）。
        // ダウンロードは一覧側／プレビュー内のダウンロードボタンからのみ行う。
        e.preventDefault();

        var $item = $(this).closest(ITEM_SELECTOR);
        var links = getLinks($item);
        var text = links.$download.text() || '';
        var fileName = text.split('　')[0].trim();

        if (!PREVIEWABLE_PATTERN.test(fileName)) { return; }

        var $overlay = ensureOverlay();

        $overlay.data('download-url', links.$download.attr('href'));
        $overlay.addClass('is-visible is-loading');
        $overlay.find('.attachment-preview-frame').attr('src', links.$show.attr('href'));
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            var $overlay = $('#attachment-preview-overlay');
            $overlay.removeClass('is-visible');
            $overlay.find('.attachment-preview-frame').attr('src', 'about:blank');
            $overlay.removeData('download-url');
        }
    });

    $(document).on('click', DOWNLOAD_BUTTON_SELECTOR, function (e) {
        e.preventDefault();

        var $item = $(this).closest(ITEM_SELECTOR);
        triggerDownload(getDownloadUrl($item));
    });

    $(document).on('pjax:complete', ensureDownloadButtons);

    // コンテナ要素だけを監視する方式も検討したが、pjax遷移でコンテナ自体が
    // 丸ごと再生成され監視対象への参照が古くなるケースがある
    // （holiday_setting.jsのcalendarObserverで踏んだのと同種の問題）ため、
    // 常に存在し続けるdocument.bodyを監視する
    var debounceTimer = null;
    var observer = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(ensureDownloadButtons, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    ensureDownloadButtons();
})();

// ===============================
// 添付ファイルの長押しで並べ替え
//
// Pleasanter標準では添付ファイルの表示順は登録順で固定だが、各アイテムを
// 長押ししてから掴んで並べ替えられるようにする。単純なクリックは
// これまで通りプレビュー（上部のインライン表示処理）が開く。
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

// ===============================
// 添付ファイルのサムネイル表示（ホバー）
//
// 添付ファイル欄（.control-attachments-item）にマウスを乗せると、
// 画像ファイルの場合のみ、マウス追従のポップアップでサムネイルを表示する。
// PDF等、ブラウザだけでは軽量なサムネイルを生成できない形式は対象外。
// ===============================
(function () {
    'use strict';

    var ITEM_SELECTOR = '.control-attachments-item';

    var IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
    var IMAGE_PATTERN = new RegExp('\\.(' + IMAGE_EXTENSIONS.join('|') + ')$', 'i');

    if (window.__attachmentThumbnailBound) { return; }
    window.__attachmentThumbnailBound = true;

    function getFileName($item) {
        var $downloadLink = $item.find('a.file-name').not('[target]').first();
        var text = $downloadLink.text() || '';
        return text.split('　')[0].trim();
    }

    function getShowUrl($item) {
        return $item.find('a.file-name[target="_blank"]').first().attr('href');
    }

    var $thumbnail = $('<div id="attachment-thumbnail"><img alt=""></div>').appendTo('body');
    var hideTimer;

    $(document).on('mouseenter', ITEM_SELECTOR, function () {
        var $item = $(this);
        var fileName = getFileName($item);
        if (!IMAGE_PATTERN.test(fileName)) { return; }

        var showUrl = getShowUrl($item);
        if (!showUrl) { return; }

        clearTimeout(hideTimer);
        $thumbnail.find('img').attr('src', showUrl);
        $thumbnail.css({ display: 'block', opacity: 0 });

        setTimeout(function () {
            $thumbnail.css('opacity', 1);
        }, 10);
    });

    $(document).on('mousemove', ITEM_SELECTOR, function (e) {
        $thumbnail.css({
            top: e.pageY + 16,
            left: e.pageX + 16
        });
    });

    $(document).on('mouseleave', ITEM_SELECTOR, function () {
        hideTimer = setTimeout(function () {
            $thumbnail.css('opacity', 0);
            setTimeout(function () {
                $thumbnail.css('display', 'none');
            }, 200);
        }, 150);
    });
})();
