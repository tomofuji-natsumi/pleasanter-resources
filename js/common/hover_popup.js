// ===============================
// マウス追従型のホバーポップアップ
//
// attachment.js（サムネイル）と tooltip.js（省略テキスト）が、バグまで含めてほぼ同一の
// 「mouseenterで表示 → mousemoveで追従 → mouseleaveで遅延非表示」実装を持っていたため、
// 1箇所に集約する（C-5）。
// ===============================
(function () {
    "use strict";

    /**
     * ホバー対象（itemSelector）にマウスを乗せると要素が追従表示され、
     * 離れると遅延して消える、マウス追従型ポップアップを生成する。
     *
     * @param {string} id ポップアップ要素のid（#無し）
     * @param {string} html 要素のHTML文字列（idを持つルート要素を含む）
     * @param {string} itemSelector ホバー対象のセレクタ（document委譲イベント）
     * @param {Object} options
     * @param {Function} options.onEnter($popup, $item) mouseenter時に呼ばれ、表示内容を$popupへ反映する。
     *   falseを返すと表示しない（対象外のアイテムだった場合等）
     * @param {number} [options.offsetX=16] マウス位置からの横オフセット(px)
     * @param {number} [options.offsetY=16] マウス位置からの縦オフセット(px)
     * @param {number} [options.showDelay=10] 表示開始からopacity:1にするまでの遅延(ms)
     * @param {number} [options.hideDelay=150] mouseleaveからopacity:0にするまでの遅延(ms)
     * @param {number} [options.hideDisplayDelay=200] opacity:0からdisplay:noneにするまでの遅延(ms)
     * @returns {jQuery} ポップアップ要素
     */
    window.createHoverPopup = function (id, html, itemSelector, options) {
        options = options || {};
        var offsetX = options.offsetX != null ? options.offsetX : 16;
        var offsetY = options.offsetY != null ? options.offsetY : 16;
        var showDelay = options.showDelay != null ? options.showDelay : 10;
        var hideDelay = options.hideDelay != null ? options.hideDelay : 150;
        var hideDisplayDelay = options.hideDisplayDelay != null ? options.hideDisplayDelay : 200;

        var $popup = window.ensureSingleton(id, html);
        var showTimer, hideTimer, hideDisplayTimer;

        $(document).on("mouseenter", itemSelector, function () {
            var $item = $(this);
            var shown = options.onEnter($popup, $item);
            if (shown === false) { return; }

            clearTimeout(showTimer);
            clearTimeout(hideTimer);
            clearTimeout(hideDisplayTimer);
            $popup.css({ display: "block", opacity: 0 });

            showTimer = setTimeout(function () {
                $popup.css("opacity", 1);
            }, showDelay);
        });

        $(document).on("mousemove", itemSelector, function (e) {
            $popup.css({
                top: e.pageY + offsetY,
                left: e.pageX + offsetX
            });
        });

        $(document).on("mouseleave", itemSelector, function () {
            hideTimer = setTimeout(function () {
                $popup.css("opacity", 0);
                hideDisplayTimer = setTimeout(function () {
                    $popup.css("display", "none");
                }, hideDisplayDelay);
            }, hideDelay);
        });

        return $popup;
    };
})();
