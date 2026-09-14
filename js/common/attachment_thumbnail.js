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
