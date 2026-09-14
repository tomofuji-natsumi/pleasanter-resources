// ===============================
// 添付ファイルのインライン表示
//
// 添付ファイル欄のリンク（プレビュー用の /binaries/{guid}/show、
// ファイル名表示用の /binaries/{guid}/download）は、クリックすると
// 別タブへの遷移やダウンロード（対応アプリの起動）が発生する。
// ブラウザがネイティブに表示できる拡張子の場合のみ既定動作を止め、
// Pleasanter内のオーバーレイに埋め込んだiframeでファイルを表示する。
// ===============================
(function () {
    'use strict';

    var LINK_SELECTOR = '.control-attachments-item a.file-name';

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

    function ensureOverlay() {
        var $overlay = $('#attachment-preview-overlay');
        if ($overlay.length) { return $overlay; }

        $overlay = $(
            '<div id="attachment-preview-overlay">' +
                '<div class="attachment-preview-close" title="閉じる">&times;</div>' +
                '<iframe class="attachment-preview-frame" frameborder="0"></iframe>' +
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

    $(document).on('click', LINK_SELECTOR, function (e) {
        var $item = $(this).closest('.control-attachments-item');
        var fileName = getFileName($item);

        if (!PREVIEWABLE_PATTERN.test(fileName)) { return; }

        e.preventDefault();

        var showUrl = getShowUrl($item);
        var $overlay = ensureOverlay();

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
})();
