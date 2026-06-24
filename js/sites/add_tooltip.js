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

    var $tooltip = $('<div id="custom-tooltip"></div>').appendTo('body');
    var hideTimer;

    $(document).on('mouseenter', 'td', function () {
        var text = $(this).find('.notes').text().trim();
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
