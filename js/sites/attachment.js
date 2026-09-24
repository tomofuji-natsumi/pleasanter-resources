// ===============================
// 
// 添付ファイルのインライン表示 ＋ ダウンロードボタン
//
// 添付ファイル欄のリンク（プレビュー用の /binaries/{guid}/show、ファイル名表示用の /binaries/{guid}/download）は、
// クリックすると別タブへの遷移やダウンロード（対応アプリの起動）が発生する。
// ブラウザがネイティブに表示できる拡張子の場合のみ既定動作を止め、Pleasanter内のオーバーレイに埋め込んだiframeでファイルを表示する。
//
// ファイル名クリックがプレビューに置き換わったことで、これまで通りダウンロードだけの操作ができなくなるため、
// 削除アイコンの横に専用のダウンロードボタンを追加する。
// 
// ===============================
(function () {
    'use strict';

    var ITEM_SELECTOR = '.control-attachments-item';
    var DOWNLOAD_BUTTON_SELECTOR = '.attachment-download-button';
    var PREVIEW_LOAD_TIMEOUT_MS = 8000;

    var previewLoadTimeoutTimer = null;

    // ブラウザが追加アプリなしでそのまま表示できる拡張子
    var PREVIEWABLE_EXTENSIONS = [
        'pdf',
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg',
        'txt', 'csv', 'json', 'log',
        'mp4', 'webm', 'ogg',
        'mp3', 'wav'
    ];
    var PREVIEWABLE_PATTERN = new RegExp('\\.(' + PREVIEWABLE_EXTENSIONS.join('|') + ')$', 'i');

    window.once("attachmentPreview", function () {

    // 同一アイテム内で複数回 a.file-name を探し直さずに済むよう、
    // ダウンロード用リンク・プレビュー用リンクをまとめて1回のlookupで取得する
    function getLinks($item) {
        var $links = $item.find('a.file-name');
        return {
            $download: $links.not('[target]').first(),
            $show: $links.filter('[target="_blank"]').first()
        };
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

    // js/common/overlay.js（manifestでこのファイルより先に読まれる）が
    // 生成・Escape・外側クリック・閉じるボタンを面倒見る。ダウンロードボタン・
    // iframeのload監視はこのファイル固有の処理のため、初回のみ個別に紐付ける
    var previewOverlay = window.createOverlay('attachment-preview-overlay',
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
        '</div>',
        {
            closeSelector: '.attachment-preview-close',
            onClose: function ($el) {
                clearTimeout(previewLoadTimeoutTimer);
                $el.removeClass('is-loading');
                $el.find('.attachment-preview-frame').attr('src', 'about:blank');
                $el.removeData('download-url');
            }
        }
    );

    previewOverlay.$el.on('click', '.attachment-preview-download', function (e) {
        e.preventDefault();
        triggerDownload(previewOverlay.$el.data('download-url'));
    });
    previewOverlay.$el.find('.attachment-preview-frame').on('load', function () {
        clearTimeout(previewLoadTimeoutTimer);
        previewOverlay.$el.removeClass('is-loading');
    });

    function ensureOverlay() {
        return previewOverlay.$el;
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

        // ファイル名以外を含む項目全体のクリックでも、対応形式のプレビュー表示以外何も起こさない（ダウンロードや別タブでの表示は行わない）。
        // ダウンロードは一覧側／プレビュー内のダウンロードボタンからのみ行う。
        e.preventDefault();

        var $item = $(this).closest(ITEM_SELECTOR);
        var links = getLinks($item);
        var text = links.$download.text() || '';
        var fileName = text.split('　')[0].trim();

        if (!PREVIEWABLE_PATTERN.test(fileName)) { return; }

        var $overlay = ensureOverlay();

        $overlay.data('download-url', links.$download.attr('href'));
        $overlay.addClass('is-loading');
        previewOverlay.show();
        $overlay.find('.attachment-preview-frame').attr('src', links.$show.attr('href'));

        // hrefが取得できない等でiframeのloadが発火しない場合、is-loadingが永久に残る
        // （スピナーが回り続ける）ため、タイムアウトで強制的に解除する
        clearTimeout(previewLoadTimeoutTimer);
        previewLoadTimeoutTimer = setTimeout(function () {
            $overlay.removeClass('is-loading');
        }, PREVIEW_LOAD_TIMEOUT_MS);
    });

    $(document).on('click', DOWNLOAD_BUTTON_SELECTOR, function (e) {
        e.preventDefault();

        var $item = $(this).closest(ITEM_SELECTOR);
        triggerDownload(getDownloadUrl($item));
    });

    $(document).on('pjax:complete', ensureDownloadButtons);

    // コンテナ要素だけを監視する方式も検討したが、pjax遷移でコンテナ自体が丸ごと再生成され監視対象への参照が古くなるケースがある
    // （holiday_setting.jsのcalendarObserverで踏んだのと同種の問題）ため、常に存在し続けるdocument.bodyを監視する
    // （js/common/dom_watcher.js に集約。manifestでこのファイルより先に読まれる）
    window.__pleasanterWatch(ensureDownloadButtons, { delay: 50, guard: 'attachmentDownloadButtons' });

    ensureDownloadButtons();

    });
})();

// ===============================
//
// 添付ファイルの長押しで並べ替え
//
// Pleasanter標準では添付ファイルの表示順は登録順で固定だが、各アイテムを長押ししてから掴んで並べ替えられるようにする。
// 単純なクリックはこれまで通りプレビュー（上部のインライン表示処理）が開く。
// 並べ替え後は、隠しフィールド（control-attachments、JSON配列）の順序も見た目に合わせて更新する。
//
// HTML5 Drag & Drop APIは「押した瞬間から動くと即ドラッグ扱い」になり単純クリックと衝突しやすいため使わず、
// pointerdown起点の自前の長押し判定（一定時間・一定距離以内で押し続けたら掴んだとみなす）で実装している。
// 
// ===============================
(function () {
    'use strict';

    var ITEMS_SELECTOR = '.control-attachments-items';
    var ITEM_SELECTOR = '.control-attachments-item';
    var NON_DRAGGABLE_SELECTOR = 'a.file-name, .delete-file, .attachment-download-button';

    var LONG_PRESS_MS = 350;
    var MOVE_CANCEL_THRESHOLD = 6; // px。これ以上動いたら長押し判定を中断する

    window.once("attachmentReorder", function () {

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

    // B-8: mousemove/touchmoveは「長押し中〜ドラッグ中」だけ必要なため、常時登録せず
    // 押している間だけ動的に付け外しする（touchmoveのpassive:falseがページ全体の
    // スクロール最適化を常時無効化してしまう問題を解消）
    var moveListenersActive = false;

    function addMoveListeners() {
        if (moveListenersActive) { return; }
        moveListenersActive = true;
        document.addEventListener('mousemove', onPressMove, true);
        document.addEventListener('touchmove', onPressMove, { capture: true, passive: false });
    }

    function removeMoveListeners() {
        if (!moveListenersActive) { return; }
        moveListenersActive = false;
        document.removeEventListener('mousemove', onPressMove, true);
        document.removeEventListener('touchmove', onPressMove, true);
    }

    function releaseMoveListenersIfIdle() {
        if (!pressTimer && !$dragging) {
            removeMoveListeners();
        }
    }

    function clearPress() {
        clearTimeout(pressTimer);
        pressTimer = null;
        pressOrigin = null;
        $pressItem = null;
        releaseMoveListenersIfIdle();
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

    // B-8: document.elementFromPoint()はレイアウトを強制読み取りするため、mousemoveのたびに
    // 呼ぶと高頻度になる。1フレームにつき1回に間引く
    var dragMoveFrame = null;
    var pendingDragEvent = null;

    function scheduleDragMove(e) {
        pendingDragEvent = e;
        if (dragMoveFrame !== null) { return; }
        dragMoveFrame = requestAnimationFrame(function () {
            dragMoveFrame = null;
            if ($dragging && pendingDragEvent) {
                handleDragMove(pendingDragEvent);
            }
            pendingDragEvent = null;
        });
    }

    function cancelScheduledDragMove() {
        if (dragMoveFrame !== null) {
            cancelAnimationFrame(dragMoveFrame);
            dragMoveFrame = null;
        }
        pendingDragEvent = null;
    }

    function finishDragging() {
        cancelScheduledDragMove();
        $dragging.removeClass('is-dragging');
        syncHiddenInputOrder($dragging.closest(ITEMS_SELECTOR));
        $dragging = null;
        releaseMoveListenersIfIdle();
    }

    function onPressStart(e) {
        if (e.target.closest && e.target.closest(NON_DRAGGABLE_SELECTOR)) { return; }

        var $item = $(e.target).closest(ITEM_SELECTOR);
        if (!$item.length) { return; }

        clearPress();
        pressOrigin = getPoint(e);
        $pressItem = $item;
        addMoveListeners();

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
            scheduleDragMove(e);
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

    document.addEventListener('mouseup', onPressEnd, true);
    document.addEventListener('touchend', onPressEnd, true);
    document.addEventListener('touchcancel', onPressEnd, true);

    // 長押しして並べ替えた直後に発生するclick（プレビューが開く等）を1回だけ無効化する
    document.addEventListener('click', function (e) {
        if (!suppressNextClick) { return; }
        suppressNextClick = false;

        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) { e.stopImmediatePropagation(); }
    }, true);

    });
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

    window.once("attachmentThumbnail", function () {

    function getFileName($item) {
        var $downloadLink = $item.find('a.file-name').not('[target]').first();
        var text = $downloadLink.text() || '';
        return text.split('　')[0].trim();
    }

    function getShowUrl($item) {
        return $item.find('a.file-name[target="_blank"]').first().attr('href');
    }

    // B-7: ホバーのたびに原寸画像をダウンロードしていた（image_lightbox.jsが認識する
    // ?thumbnail=1を付けていなかったため）。サムネイル表示なので縮小版のURLに変える
    function getThumbnailUrl($item) {
        var showUrl = getShowUrl($item);
        if (!showUrl) { return null; }

        var url = new URL(showUrl, window.location.href);
        url.searchParams.set('thumbnail', '1');
        return url.toString();
    }

    // js/common/hover_popup.js（manifestでこのファイルより先に読まれる）が
    // 表示・追従・遅延非表示を面倒見る
    window.createHoverPopup('attachment-thumbnail', '<div id="attachment-thumbnail"><img alt=""></div>', ITEM_SELECTOR, {
        onEnter: function ($popup, $item) {
            var fileName = getFileName($item);
            if (!IMAGE_PATTERN.test(fileName)) { return false; }

            var showUrl = getThumbnailUrl($item);
            if (!showUrl) { return false; }

            $popup.find('img').attr('src', showUrl);
        }
    });

    });
})();
