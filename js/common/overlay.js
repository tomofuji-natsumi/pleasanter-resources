// ===============================
// オーバーレイ生成 + Escape + 外側クリック
//
// attachment.js（プレビュー）/ image_lightbox.js / port_setting.js（エクスポート進捗）が
// 「#idが無ければ生成 → is-visibleクラスで表示切替 → Escape/外側クリックで閉じる」
// という同型のコードを個別に持っていたため、1箇所に集約する（C-4）。
// ===============================
(function () {
    "use strict";

    /**
     * オーバーレイ要素を作成し、show/close の共通挙動を持たせる。
     * 既に存在する場合（pjax再訪問等）は要素の生成・イベント登録をスキップし、
     * 既存の要素をそのまま使う（window.ensureSingletonと同じ考え方）。
     *
     * @param {string} id 要素のid（#無し）。html側のルート要素と一致させる
     * @param {string} html 生成時に使うHTML文字列
     * @param {Object} [options]
     * @param {string} [options.closeSelector] クリックで閉じる要素のセレクタ（オーバーレイ内、例: '.xxx-close'）
     * @param {boolean} [options.closeOnBackdrop=true] オーバーレイ自身（背景）のクリックで閉じるか
     * @param {boolean} [options.closeOnEscape=true] Escapeキーで閉じるか（表示中のみ）
     * @param {Function} [options.onClose] close()時に呼ばれる追加処理（タイマー解除・iframeリセット等）。$elを受け取る
     * @returns {{ $el: jQuery, show: Function, close: Function }}
     */
    window.createOverlay = function (id, html, options) {
        options = options || {};
        var closeOnBackdrop = options.closeOnBackdrop !== false;
        var closeOnEscape = options.closeOnEscape !== false;

        var existed = $("#" + id).length > 0;
        var $el = window.ensureSingleton(id, html);

        function close() {
            $el.removeClass("is-visible");
            if (typeof options.onClose === "function") {
                options.onClose($el);
            }
        }

        function show() {
            $el.addClass("is-visible");
        }

        if (!existed) {
            if (options.closeSelector) {
                $el.on("click", options.closeSelector, function (e) {
                    e.preventDefault();
                    close();
                });
            }
            if (closeOnBackdrop) {
                $el.on("click", function (e) {
                    if (e.target === $el[0]) { close(); }
                });
            }
            if (closeOnEscape) {
                $(document).on("keydown", function (e) {
                    if (e.key === "Escape" && $el.hasClass("is-visible")) {
                        close();
                    }
                });
            }
        }

        return { $el: $el, show: show, close: close };
    };
})();
