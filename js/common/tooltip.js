$(function () {
    // 省略されているかを判定
    function updateClamped() {
        $('td .grid-title-body, td .notes').each(function () {
            if (this.scrollHeight > this.clientHeight) {
                $(this).addClass('is-clamped');
            } else {
                $(this).removeClass('is-clamped');
            }
        });
    }

    updateClamped();

    // 以降の一回限りのセットアップ（要素生成・イベント登録・監視開始）は、
    // このスクリプト自体がpjax遷移のたびに再実行される可能性があるため、
    // 既に初期化済みなら二重に行わない
    if ($('#list-tooltip').length) { return; }

    // pjax遷移・グリッドの並び替え/ページング等でDOMが更新されるたびに再判定する
    $(document).on('pjax:complete', updateClamped);

    var debounceTimer = null;
    var gridObserver = new MutationObserver(function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateClamped, 50);
    });
    gridObserver.observe(document.body, { childList: true, subtree: true });

    var $tooltip = $('<div id="list-tooltip"></div>').appendTo('body');
    var hideTimer;

    function tooltipText($td) {
        var $source = $td.find('.grid-title-body, .notes').first();
        return $source.text().trim();
    }

    $(document).on('mouseenter', 'td', function () {
        var text = tooltipText($(this));
        if (!text) return;

        clearTimeout(hideTimer);
        $tooltip.text(text).css({ display: 'block', opacity: 0 });

        setTimeout(function () {
            $tooltip.css('opacity', 1);
        }, 10);
    });

    $(document).on('mousemove', 'td', function (e) {
        $tooltip.css({
            top: e.pageY + 12,
            left: e.pageX + 12
        });
    });

    $(document).on('mouseleave', 'td', function () {
        hideTimer = setTimeout(function () {
            $tooltip.css('opacity', 0);
            setTimeout(function () {
                $tooltip.css('display', 'none');
            }, 200);
        }, 300);
    });
});
