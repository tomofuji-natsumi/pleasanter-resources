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

    window.once('imageLightbox', function () {
        // js/common/overlay.js（manifestでこのファイルより先に読まれる）が
        // 生成・Escape・外側クリックでの非表示を面倒見る
        var overlay = window.createOverlay('image-lightbox-overlay',
            '<div id="image-lightbox-overlay"><img class="image-lightbox-img" alt=""></div>'
        );

        $(document).on('click', IMAGE_SELECTOR, function (e) {
            e.preventDefault();

            var url = new URL(this.src, window.location.href);
            url.searchParams.delete('thumbnail');

            // 元画像のalt（意味のある説明文があればそれ）を拡大表示側にも引き継ぐ（スクリーンリーダー対応）
            overlay.$el.find('.image-lightbox-img')
                .attr('src', url.toString())
                .attr('alt', this.alt || '');
            overlay.show();
        });
    });
})();
