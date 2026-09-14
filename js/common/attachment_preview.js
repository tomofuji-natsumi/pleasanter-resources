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
    var LINK_SELECTOR = ITEM_SELECTOR + ' a.file-name';
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
                    '<iframe class="attachment-preview-frame" frameborder="0"></iframe>' +
                '</div>' +
            '</div>'
        ).appendTo('body');

        function close() {
            $overlay.removeClass('is-visible');
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

    $(document).on('click', LINK_SELECTOR, function (e) {
        var $item = $(this).closest(ITEM_SELECTOR);
        var links = getLinks($item);
        var text = links.$download.text() || '';
        var fileName = text.split('　')[0].trim();

        if (!PREVIEWABLE_PATTERN.test(fileName)) { return; }

        e.preventDefault();

        var $overlay = ensureOverlay();

        $overlay.data('download-url', links.$download.attr('href'));
        $overlay.find('.attachment-preview-frame').attr('src', links.$show.attr('href'));
        $overlay.addClass('is-visible');
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
