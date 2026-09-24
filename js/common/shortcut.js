// ===============================
// キーボードショートカットの入力欄ガード
//
// holiday_setting.js（矢印キー・Tキー）/ search_shortcut.js（"/"）/
// select_all_shortcut.js（Ctrl+A）が、修飾キー判定と「入力欄でのタイピングを妨げない」
// 判定をそれぞれ個別に持っていたため、1箇所に集約する（C-6）。
// ===============================
(function () {
    "use strict";

    /**
     * 入力欄にフォーカスがある間は発火しないキーボードショートカットを登録する。
     * @param {Object} options
     * @param {string} options.key e.keyと比較する値（大文字小文字を無視。例: '/', 'a', 'ArrowLeft'）
     * @param {boolean} [options.ctrlOrMeta=false] Ctrl（Macはcmd）を必須にするか
     * @param {boolean} [options.allowShift=true] Shiftとの併用を許可するか
     * @param {Function} options.handler(e) 条件を満たした時に呼ぶ処理。
     *   preventDefault()が必要かはショートカットの性質によるため、呼び出し側で行う
     */
    window.registerShortcut = function (options) {
        var targetKey = String(options.key).toLowerCase();
        var wantsCtrlOrMeta = !!options.ctrlOrMeta;
        var allowShift = options.allowShift !== false;

        $(document).on("keydown", function (e) {
            if (e.key.toLowerCase() !== targetKey) { return; }

            if (wantsCtrlOrMeta) {
                if (!(e.ctrlKey || e.metaKey)) { return; }
            } else if (e.ctrlKey || e.altKey || e.metaKey) {
                return;
            }
            if (!allowShift && e.shiftKey) { return; }

            // 入力欄でのタイピング・カーソル移動を妨げない
            var tag = (e.target.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) {
                return;
            }

            options.handler(e);
        });
    };
})();
