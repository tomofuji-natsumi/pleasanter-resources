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

    function getFileName($item) {
        var $downloadLink = $item.find('a.file-name').not('[target]').first();
        var text = $downloadLink.text() || '';
        // 「ファイル名　(サイズ)」の全角スペース区切りからファイル名部分のみ取り出す
        return text.split('　')[0].trim();
    }

    function getShowUrl($item) {
        return $item.find('a.file-name[target="_blank"]').first().attr('href');
    }

    function getDownloadUrl($item) {
        return $item.find('a.file-name').not('[target]').first().attr('href');
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
                    '<div class="attachment-preview-header">' +
                        '<span class="attachment-preview-title"></span>' +
                        '<div class="attachment-preview-close" title="閉じる">&times;</div>' +
                    '</div>' +
                    '<iframe class="attachment-preview-frame" frameborder="0"></iframe>' +
                '</div>' +
            '</div>'
        ).appendTo('body');

        function close() {
            $overlay.removeClass('is-visible');
            $overlay.find('.attachment-preview-frame').attr('src', 'about:blank');
        }

        $overlay.on('click', '.attachment-preview-close', close);
        $overlay.on('click', function (e) {
            if (e.target === this) { close(); }
        });

        return $overlay;
    }

    // タッチ領域をファイル名リンクだけでなく、項目全体（ダウンロード/削除
    // ボタンを除く）に広げる。これらのボタンは独自のクリック処理を持つため、
    // ここでは素通しする
    $(document).on('click', ITEM_SELECTOR, function (e) {
        if (e.target.closest('.attachment-download-button, .delete-file')) {
            return;
        }

        var $item = $(this);
        var fileName = getFileName($item);

        if (!PREVIEWABLE_PATTERN.test(fileName)) { return; }

        e.preventDefault();

        var showUrl = getShowUrl($item);
        var $overlay = ensureOverlay();

        $overlay.find('.attachment-preview-title').text(fileName);
        $overlay.find('.attachment-preview-frame').attr('src', showUrl);
        $overlay.addClass('is-visible');
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            var $overlay = $('#attachment-preview-overlay');
            $overlay.removeClass('is-visible');
            $overlay.find('.attachment-preview-frame').attr('src', 'about:blank');
        }
    });

    $(document).on('click', DOWNLOAD_BUTTON_SELECTOR, function (e) {
        e.preventDefault();

        var $item = $(this).closest(ITEM_SELECTOR);
        var downloadUrl = getDownloadUrl($item);
        if (!downloadUrl) { return; }

        var $tempLink = $('<a></a>', {
            href: downloadUrl,
            download: '',
            rel: 'noopener noreferrer'
        }).appendTo('body');
        $tempLink[0].click();
        $tempLink.remove();
    });

    $(document).on('pjax:complete', ensureDownloadButtons);

    var debounceTimer = null;
    var observer = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(ensureDownloadButtons, 50);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    ensureDownloadButtons();
})();
