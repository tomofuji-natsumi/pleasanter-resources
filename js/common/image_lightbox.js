// ===============================
// 添付画像のプレビュー拡大表示
//
// マークダウン欄（コメント・Body等）に埋め込まれた画像は
// /binaries/{Guid}/show?thumbnail=1 というサムネイルURLで表示されている。
// これをクリックすると、?thumbnail=1を外した原寸画像をオーバーレイで表示する。
// ===============================
(function () {
    'use strict';

    var IMAGE_SELECTOR = '.md-viewer .notes img[src*="/binaries/"]';

    if (window.__imageLightboxBound) { return; }
    window.__imageLightboxBound = true;

    function ensureOverlay() {
        var $overlay = $('#image-lightbox-overlay');
        if ($overlay.length) { return $overlay; }

        $overlay = $(
            '<div id="image-lightbox-overlay">' +
                '<img class="image-lightbox-img" alt="">' +
            '</div>'
        ).appendTo('body');

        $overlay.on('click', function () {
            $overlay.removeClass('is-visible');
        });

        return $overlay;
    }

    $(document).on('click', IMAGE_SELECTOR, function (e) {
        e.preventDefault();

        var url = new URL(this.src, window.location.href);
        url.searchParams.delete('thumbnail');
        var fullSizeUrl = url.toString();
        var $overlay = ensureOverlay();

        $overlay.find('.image-lightbox-img').attr('src', fullSizeUrl);
        $overlay.addClass('is-visible');
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('#image-lightbox-overlay').removeClass('is-visible');
        }
    });
})();
